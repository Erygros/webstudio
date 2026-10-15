import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { serviceDb } from "./db";
import { smtpConfig } from "./integrations";
import { business, site } from "@/config/site";
import {
  reviewBank,
  reviewConditions,
  reviewWithdrawal,
  type ReviewRequest,
} from "@/lib/reviews";

function offerKey() {
  const key =
    process.env.FORM_SECRET && process.env.FORM_SECRET.length >= 32
      ? process.env.FORM_SECRET
      : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Anfragesignierung nicht verfügbar.");
  return key;
}
export function reviewOfferToken(id: string) {
  return createHmac("sha256", offerKey())
    .update(`review-offer:v1:${id}`)
    .digest("hex");
}
export function verifyReviewOffer(id: string, token: string) {
  return (
    /^[a-f0-9]{64}$/.test(token) &&
    timingSafeEqual(Buffer.from(token), Buffer.from(reviewOfferToken(id)))
  );
}
export const reviewRequestKey = (token: string) =>
  createHash("sha256").update(`review:${token}`).digest("hex");
export function reviewOfferUrl(id: string) {
  return `${site.url}/bewertungen/auftrag/${id}?token=${reviewOfferToken(id)}`;
}
export async function reviewAutomationStatus() {
  const db = serviceDb();
  const [{ data, error }, smtp] = await Promise.all([
    db
      .from("crm_review_automation_state")
      .select("enabled,last_tick,worker_last_seen")
      .eq("id", true)
      .maybeSingle(),
    smtpConfig(),
  ]);
  const smtpConfigured = Boolean(
    smtp.host &&
    smtp.user &&
    smtp.password &&
    smtp.from &&
    [465, 587].includes(smtp.port),
  );
  const heartbeatFresh = Boolean(
    data?.last_tick && Date.now() - Date.parse(data.last_tick) < 180000,
  );
  const workerFresh = Boolean(
    data?.worker_last_seen &&
    Date.now() - Date.parse(data.worker_last_seen) < 600000,
  );
  return {
    databaseReady: !error && Boolean(data),
    schedulerEnabled: Boolean(data?.enabled),
    lastTick: data?.last_tick || null,
    workerLastSeen: data?.worker_last_seen || null,
    smtpConfigured,
    heartbeatFresh,
    workerFresh,
    ready:
      !error &&
      Boolean(data?.enabled) &&
      heartbeatFresh &&
      workerFresh &&
      smtpConfigured &&
      Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32),
  };
}
export async function reviewByOffer(id: string, token: string) {
  if (!verifyReviewOffer(id, token))
    throw new Error("Dieser Beauftragungslink ist ungültig.");
  const { data, error } = await serviceDb()
    .from("crm_review_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || data.status === "Storniert")
    throw new Error("Dieser Vorgang ist nicht verfügbar.");
  if (data.status !== "Offen" && !data.commissioned_at)
    throw new Error("Dieser Vorgang wurde bereits geschlossen.");
  if (
    !data.commissioned_at &&
    Date.now() - Date.parse(data.created_at) > 30 * 86400000
  )
    throw new Error(
      "Dieses Angebot ist abgelaufen. Bitte eine neue kostenlose Anfrage stellen.",
    );
  return data as ReviewRequest;
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
type MailJob = {
  id: string;
  request_id: string;
  kind: "acknowledgment" | "order_confirmation";
  claim_id: string;
};
function emailFor(row: ReviewRequest, job: MailJob) {
  const ordered = job.kind === "order_confirmation";
  const subject = ordered
    ? `Deine Beauftragung · ${row.reference} · ${row.platform}`
    : `${row.name}, deine ${row.platform}-Bewertung · ${row.reference}`;
  const opening = ordered
    ? `danke für dein Vertrauen. Deine Beauftragung zur Bewertung auf ${row.platform} ist bei uns eingegangen. Wir koordinieren die anwaltliche Prüfung und den rechtlich zulässigen Versuch, diese Bewertung entfernen zu lassen.`
    : `danke für deine Anfrage zur Bewertung auf ${row.platform}. Wir nehmen uns deines Anliegens an und kümmern uns um die Organisation der anwaltlichen Prüfung. Ob die Bewertung rechtlich angreifbar ist, muss im Einzelfall geprüft werden; eine Entfernung können wir nicht vorab zusagen.`;
  const next =
    ordered && row.status !== "Offen"
      ? `Dein Vorgang hat inzwischen den Status „${row.status}“. Bitte überweise keine zusätzliche Vorauszahlung. Bei Fragen zur Abrechnung oder Rückerstattung antworte auf diese E-Mail.`
      : ordered
        ? `Bitte überweise die Vorauszahlung von 59,00 € mit dem Vorgangszeichen ${row.reference}. Die Bearbeitung beginnt nach Zahlungseingang, erforderlicher Mandatsklärung und gegebenenfalls Ablauf der Widerrufsfrist. Es handelt sich um eine Zahlungsinformation, nicht um einen Beleg für eine bereits erfolgte Löschung.`
        : `Die Erstberatung ist kostenlos. Wenn du uns beauftragen möchtest, kannst du unter dem folgenden geschützten Link die vollständigen Konditionen prüfen und den Auftrag verbindlich bestätigen. Bitte erst danach die Vorauszahlung von 59,00 € überweisen. Deine ursprüngliche Anfrage allein verpflichtet dich zu keiner Zahlung.`;
  const payment = `Empfänger: ${reviewBank.holder}\nIBAN: ${reviewBank.iban}\nBetrag: 59,00 € Vorauszahlung\nVerwendungszweck: ${row.reference}`;
  const success =
    "59,00 € vollständiger Endpreis je erfolgreich entfernter Bewertung, einschließlich der vorgesehenen außergerichtlichen anwaltlichen Tätigkeit. Keine gesonderte Umsatzsteuer gemäß § 19 UStG. Bei erfolgloser Entfernung beziehungsweise fehlender rechtlicher Möglichkeit erstatten wir die Vorauszahlung vollständig zurück. Keine weiteren Kosten ohne gesonderte Vereinbarung.";
  const orderEvidence = ordered
    ? `\n\nBeauftragt am: ${new Date(row.commissioned_at!).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} (Europe/Berlin)\nRechnungsempfänger: ${String(row.order_data?.billingName || "")}\nAnschrift: ${[row.order_data?.street, row.order_data?.postcode, row.order_data?.city, row.order_data?.country].filter(Boolean).join(", ")}\nKundentyp: ${row.order_data?.customerType === "consumer" ? "Verbraucher" : "Unternehmen"}\nVorzeitiger Beginn ausdrücklich verlangt: ${row.order_data?.earlyStart ? "Ja" : "Nein"}\nKenntnis vom Erlöschen bei vollständiger Erfüllung bestätigt: ${row.order_data?.earlyKnowledge ? "Ja" : "Nein"}\nInterne Mindestwartezeit bis (Zahlung, Mandat und gegebenenfalls längere gesetzliche Frist zusätzlich beachten): ${new Date(row.starts_after!).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} (Europe/Berlin)\nKonditionsstand: ${row.conditions_version}`
    : "";
  const conditions =
    ordered && Array.isArray(row.order_data?.conditions)
      ? (row.order_data.conditions as string[])
      : reviewConditions;
  const withdrawal =
    ordered && Array.isArray(row.order_data?.withdrawal)
      ? (row.order_data.withdrawal as string[])
      : reviewWithdrawal;
  const signature = `Enrico Gross\nWebstudio Expert\n${business.street}, ${business.postcode} ${business.city}\n${site.email}\n${site.phone}\n${site.url}`;
  const core = [
    `Hallo ${row.name},`,
    opening,
    `Bewertungsplattform: ${row.platform}\nBewertung: ${row.review_url}\nDein Vorgangszeichen: ${row.reference}`,
    next,
    ...(!ordered
      ? [`Konditionen prüfen und beauftragen: ${reviewOfferUrl(row.id)}`]
      : []),
    payment,
    success,
    "Du hast Fragen oder möchtest etwas ergänzen? Antworte einfach auf diese E-Mail und nenne dein Vorgangszeichen. Bitte übermittle keine Plattform-Passwörter.",
    `Viele Grüße\n${signature}${orderEvidence}`,
  ];
  const text = [
    ...core,
    "Leistungs- und Vertragsbedingungen",
    ...conditions,
    "Widerrufsbelehrung und Muster-Widerrufsformular für Verbraucher",
    ...withdrawal,
  ].join("\n\n");
  const paragraph = (s: string) =>
    `<p style="margin:0 0 18px;line-height:1.7">${escape(s).replaceAll("\n", "<br>")}</p>`;
  const html = `<!doctype html><html lang="de"><body style="margin:0;background:#f2f4f7;color:#182237;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:white" cellpadding="0" cellspacing="0"><tr><td style="padding:30px 32px;border-top:4px solid #182237"><img src="cid:webstudio-logo" width="180" alt="Webstudio Expert" style="display:block;max-width:100%;height:auto"><p style="font-size:11px;color:#697386;letter-spacing:1px">BEWERTUNGSSCHUTZ · ${escape(row.reference)}</p><h1 style="font-size:25px;font-weight:600;margin:24px 0">${ordered ? "Danke für deine Beauftragung." : "Wir kümmern uns um dein Anliegen."}</h1>${core.slice(0, 4).map(paragraph).join("")}${!ordered ? `<p style="margin:25px 0"><a href="${escape(reviewOfferUrl(row.id))}" style="display:inline-block;background:#182237;color:white;text-decoration:none;padding:14px 20px">Konditionen prüfen und beauftragen</a></p>` : ""}<div style="padding:20px;background:#f2f4f7;margin:20px 0">${paragraph(payment)}</div>${core
    .slice(ordered ? 5 : 6)
    .map(paragraph)
    .join(
      "",
    )}<hr style="border:0;border-top:1px solid #e0e5eb;margin:32px 0"><h2 style="font-size:16px">Leistungs- und Vertragsbedingungen</h2><div style="font-size:12px;color:#536074">${conditions.map(paragraph).join("")}<h2 style="font-size:16px">Widerruf für Verbraucher</h2>${withdrawal.map(paragraph).join("")}</div></td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
export async function deliverReviewMail() {
  const db = serviceDb();
  const config = await smtpConfig();
  if (
    !config.host ||
    !config.user ||
    !config.password ||
    ![465, 587].includes(config.port)
  )
    throw new Error("SMTP ist nicht eingerichtet.");
  // Load the inline logo before claiming a job. No remote image tracking or URL downloads.
  const logo = await readFile(
    path.join(process.cwd(), "public", "brand", "wordmark-black.png"),
  );
  const { data, error } = await db.rpc("crm_claim_review_mail");
  if (error) throw new Error("Versandwarteschlange nicht verfügbar.");
  const job = data?.[0] as MailJob | undefined;
  if (!job) return { processed: 0 };
  const { data: request, error: loadError } = await db
    .from("crm_review_requests")
    .select("*")
    .eq("id", job.request_id)
    .single();
  if (loadError || !request)
    throw new Error(
      "Vorgang konnte nicht geladen werden. Versand wird zur Prüfung zurückgehalten.",
    );
  const row = request as ReviewRequest;
  // Cancellation committed before this final check suppresses sending. A message
  // already accepted by SMTP cannot be recalled; the inbox shows the delivery state.
  if (row.status !== "Offen" && job.kind === "acknowledgment") {
    await db
      .from("crm_review_mail_jobs")
      .update({ status: "cancelled" })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id);
    return { processed: 0 };
  }
  const content = emailFor(row, job);
  const messageId = `<review-${job.id}@webstudio-expert.de>`;
  const { error: saveError } = await db
    .from("crm_review_mail_jobs")
    .update({
      subject: content.subject,
      body: content.text,
      html: content.html,
      message_id: messageId,
    })
    .eq("id", job.id)
    .eq("claim_id", job.claim_id);
  if (saveError)
    throw new Error(
      "E-Mail konnte nicht archiviert werden. Es wurde nichts gesendet.",
    );
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
      to: row.email,
      replyTo: site.email,
      messageId,
      ...content,
      attachments: [
        {
          filename: "webstudio-expert.png",
          content: logo,
          cid: "webstudio-logo",
          contentType: "image/png",
        },
      ],
    });
    if (!info.accepted?.length) throw new Error("SMTP_NOT_ACCEPTED");
    const sentAt = new Date().toISOString();
    const { error: doneError } = await db
      .from("crm_review_mail_jobs")
      .update({ status: "sent", sent_at: sentAt, error: "" })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id);
    if (doneError) throw new Error("STATUS_NOT_SAVED");
    // A second archive in the existing mail inbox is optional. The queue above
    // is authoritative; an archive failure must never trigger another delivery.
    try {
      await db.from("crm_emails").upsert(
        {
          folder: "sent",
          to_address: row.email,
          from_address: config.from,
          subject: content.subject,
          body: content.text,
          message_id: messageId,
          sent_at: sentAt,
          purpose: "operational",
        },
        { onConflict: "message_id", ignoreDuplicates: true },
      );
    } catch {
      /* Delivery remains confirmed in crm_review_mail_jobs. */
    }
    return { processed: 1 };
  } catch {
    await db
      .from("crm_review_mail_jobs")
      .update({
        status: "unknown",
        error:
          "Versandstatus unklar. Gesendetes Postfach und SMTP-Protokoll prüfen; kein automatischer Neuversand.",
      })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id);
    return { processed: 0, needsReview: true };
  } finally {
    transport.close();
  }
}
