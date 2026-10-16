import { createHash, randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import { serviceDb } from "./db";
import { smtpConfig } from "./integrations";
import { business, site } from "@/config/site";
import { inquiryFields, inquiryKind } from "@/crm/inquiries";
import type { ReviewRequest } from "@/lib/reviews";

const prefix = "website-notice:v1:";
const ownerAddress = "bewerbung.enricogross30@gmail.com";
type Notice = { key: string; to: string; subject: string; body: string };
type QueuedNotice = {
  id: string;
  to_address: string;
  subject: string;
  body: string;
  message_id: string;
  folder: string;
};
export async function websiteMailReady() {
  try {
    const config = await smtpConfig();
    return Boolean(
      config.host &&
      config.user &&
      config.password &&
      config.from &&
      [465, 587].includes(config.port),
    );
  } catch {
    return false;
  }
}
function signature() {
  return `${business.owner}\n${site.name}\n${site.email}\n${site.phone}`;
}
// Reuse the existing mail outbox. A unique sync_key prevents duplicate intake
// notices, including concurrent HTTP retries. Never touch unrelated drafts.
async function queueNotices(notices: Notice[]) {
  const db = serviceDb();
  const rows = notices.map((notice) => {
    const key = createHash("sha256").update(notice.key).digest("hex");
    return {
      folder: "draft",
      purpose: "operational",
      to_address: notice.to,
      subject: notice.subject,
      body: notice.body,
      sync_key: `${prefix}${key}`,
      message_id: `<website-notice-${key}@webstudio-expert.de>`,
    };
  });
  const { error } = await db
    .from("crm_emails")
    .upsert(rows, { onConflict: "sync_key", ignoreDuplicates: true });
  if (error) throw new Error("NOTICE_QUEUE_UNAVAILABLE");
  const { data, error: readError } = await db
    .from("crm_emails")
    .select("id,to_address,subject,body,message_id,folder")
    .in(
      "sync_key",
      rows.map((row) => row.sync_key),
    );
  if (readError || data?.length !== notices.length)
    throw new Error("NOTICE_QUEUE_UNCONFIRMED");
  return data as QueuedNotice[];
}
async function deliverNotice(row: QueuedNotice) {
  if (row.folder !== "draft") return row.folder === "sent";
  const db = serviceDb();
  let config: Awaited<ReturnType<typeof smtpConfig>>;
  try {
    config = await smtpConfig();
  } catch {
    return false;
  }
  if (
    !config.host ||
    !config.user ||
    !config.password ||
    ![465, 587].includes(config.port)
  )
    return false;
  const sendKey = randomUUID();
  const { data: claimed, error: claimError } = await db
    .from("crm_emails")
    .update({ folder: "sending", send_key: sendKey, error: "" })
    .eq("id", row.id)
    .eq("folder", "draft")
    .like("sync_key", `${prefix}%`)
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) return false;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const info = await transport.sendMail({
      from: config.from,
      to: row.to_address,
      replyTo: site.email,
      subject: row.subject,
      text: row.body,
      messageId: row.message_id,
    });
    if (!info.accepted?.length) throw new Error("NOT_ACCEPTED");
    const { data: saved, error } = await db
      .from("crm_emails")
      .update({
        folder: "sent",
        from_address: config.from,
        sent_at: new Date().toISOString(),
        error: "",
      })
      .eq("id", row.id)
      .eq("send_key", sendKey)
      .eq("folder", "sending")
      .select("id")
      .maybeSingle();
    if (error || !saved) throw new Error("NOTICE_STATUS_UNCONFIRMED");
    return true;
  } catch {
    // SMTP may have accepted a message before a timeout. An uncertain outcome
    // is held for mailbox inspection; it must not trigger automatic duplicates.
    await db
      .from("crm_emails")
      .update({
        folder: "unknown",
        error:
          "Formular-E-Mail: Versandstatus unklar. Postfach/SMTP-Protokoll prüfen, nicht ungeprüft erneut senden.",
      })
      .eq("id", row.id)
      .eq("send_key", sendKey)
      .eq("folder", "sending");
    console.error("website_notice_delivery_uncertain", { id: row.id });
    return false;
  } finally {
    transport.close();
  }
}
async function notify(notices: Notice[], customerKey: string) {
  try {
    const rows = await queueNotices(notices);
    const outcomes = await Promise.allSettled(rows.map(deliverNotice));
    const customer = rows.findIndex(
      (row) =>
        row.to_address === notices.find((n) => n.key === customerKey)?.to &&
        row.subject === notices.find((n) => n.key === customerKey)?.subject,
    );
    return {
      confirmation:
        customer >= 0 &&
        outcomes[customer].status === "fulfilled" &&
        outcomes[customer].value === true,
    };
  } catch {
    // CRM intake is already committed. Never claim it failed because SMTP failed.
    console.error("website_notice_queue_failed");
    return { confirmation: false };
  }
}
export async function notifyWebsiteInquiry(input: {
  key: string;
  inquiryId?: string;
  data: Record<string, unknown>;
  attachments: string[];
  attachmentsComplete: boolean;
}) {
  const { key, data } = input;
  const kind = inquiryKind(data);
  const crmLink = input.inquiryId
    ? `${site.url}/crm/anfragen/${input.inquiryId}`
    : `${site.url}/crm/anfragen`;
  const fields = inquiryFields(data).filter((field) => field.key !== "consent");
  const details = fields
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
  const attachmentNote = input.attachments.length
    ? `\n\nDateianhänge: ${input.attachments.join(", ")}${input.attachmentsComplete ? "" : "\nNicht alle Dateien wurden übernommen; bitte beim Kunden nachfragen."}`
    : "";
  const customerKey = `inquiry:${key}:customer`;
  const appointment = data.appointment
    ? `\nWunschtermin: ${String(data.appointment).replace("T", " ")} (Europe/Berlin). Bitte warte auf die persönliche Terminbestätigung.\n`
    : "";
  const service = fields.find((field) => field.key === "service")?.value;
  return notify(
    [
      {
        key: `inquiry:${key}:owner`,
        to: ownerAddress,
        subject: `Neues Formular · ${kind}`,
        body: `Es wurde soeben ein Formular abgeschickt. Rufe es im CRM auf.\n\nFormular: ${kind}\nCRM: ${crmLink}\n\n${details}${attachmentNote}\n\nDie Anfrage ist im CRM gespeichert. Dateiinhalte bleiben im geschützten CRM.`,
      },
      {
        key: customerKey,
        to: String(data.email),
        subject: `Deine ${kind} ist bei ${site.name} angekommen`,
        body: `Hallo ${String(data.name)},\n\nvielen Dank. Deine ${kind} ist bei uns angekommen und zur Bearbeitung gespeichert. Wir melden uns über deine angegebenen Kontaktdaten.${service ? `\n\nLeistung: ${service}` : ""}${appointment}\n\nDiese Eingangsbestätigung bestätigt noch keinen Termin oder kostenpflichtigen Auftrag.${input.attachmentsComplete ? "" : " Nicht alle Anhänge konnten übernommen werden. Bitte sende fehlende Dateien direkt per E-Mail."}\n\nWenn du etwas ergänzen möchtest, antworte einfach auf diese E-Mail.\n\nViele Grüße\n${signature()}`,
      },
    ],
    customerKey,
  );
}
export async function notifyReviewInquiry(row: ReviewRequest) {
  const customerKey = `review:${row.id}:customer`;
  const details = [
    `Name: ${row.name}`,
    `E-Mail: ${row.email}`,
    row.phone ? `Telefon: ${row.phone}` : "",
    row.company ? `Unternehmen: ${row.company}` : "",
    `Plattform: ${row.platform}`,
    `Bewertung: ${row.review_url}`,
    row.description ? `Hinweise: ${row.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return notify(
    [
      {
        key: `review:${row.id}:owner`,
        to: ownerAddress,
        subject: `Neues Formular · Bewertungsanfrage · ${row.reference}`,
        body: `Es wurde soeben ein Formular abgeschickt. Rufe es im CRM auf.\n\nFormular: Kostenlose Bewertungsanfrage\nVorgang: ${row.reference}\nCRM: ${site.url}/crm/bewertungen?vorgang=${encodeURIComponent(row.id)}\n\n${details}\n\nDie Anfrage ist im CRM gespeichert; ein kostenpflichtiger Auftrag besteht noch nicht.`,
      },
      {
        key: customerKey,
        to: row.email,
        subject: `Deine Bewertungsanfrage ist angekommen · ${row.reference}`,
        body: `Hallo ${row.name},\n\ndeine kostenlose Anfrage zur Bewertung auf ${row.platform} ist bei uns angekommen und zur Bearbeitung gespeichert.\n\nDein Vorgangszeichen: ${row.reference}\nBewertung: ${row.review_url}\n\nDie E-Mail mit den nächsten Schritten und den Konditionen erhältst du voraussichtlich innerhalb von 5–10 Minuten nach deiner Anfrage. Noch besteht kein kostenpflichtiger Auftrag; bitte überweise noch nichts. Eine rechtliche Prüfung oder erfolgreiche Entfernung wird mit dieser Eingangsbestätigung nicht zugesagt.\n\nBei Rückfragen antworte einfach auf diese Nachricht.\n\nViele Grüße\n${signature()}`,
      },
    ],
    customerKey,
  );
}
// The existing Supabase clock calls the worker at least periodically. Drafts
// left behind by an interrupted request or missing SMTP setup are recovered here.
export async function flushWebsiteNotices() {
  const db = serviceDb();
  await db
    .from("crm_emails")
    .update({
      folder: "unknown",
      error:
        "Formularversand unterbrochen. Postfach vor erneutem Versand prüfen.",
    })
    .like("sync_key", `${prefix}%`)
    .eq("folder", "sending")
    .lt("updated_at", new Date(Date.now() - 600000).toISOString());
  const { data, error } = await db
    .from("crm_emails")
    .select("id,to_address,subject,body,message_id,folder")
    .like("sync_key", `${prefix}%`)
    .eq("folder", "draft")
    .order("created_at")
    .limit(4);
  if (error) throw new Error("Formular-E-Mail-Warteschlange nicht verfügbar.");
  const results = await Promise.allSettled(
    ((data as QueuedNotice[]) || []).map(deliverNotice),
  );
  return {
    processed: results.filter(
      (result) => result.status === "fulfilled" && result.value,
    ).length,
  };
}
