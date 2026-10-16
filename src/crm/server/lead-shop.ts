import "server-only";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { serviceDb, crmServiceConfigured } from "./db";
import { smtpConfig } from "./integrations";
import { websiteMailReady } from "./website-mail";
import { business, site } from "@/config/site";
import { shopMoney } from "@/lib/lead-shop";

export type LeadOrder = {
  id: string;
  reference: string;
  package: string;
  quantity: number;
  total_cents: number;
  customer: Record<string, string>;
  bank: { recipient: string; iban: string };
  terms: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  internal_notes: string;
  fulfilled_at: string | null;
  delivery_note: string;
  delivery_mode: string;
  // Historical paid downloads remain protected and accessible; no new files are created.
  file_path: string | null;
  file_sha256: string | null;
  token_hash: string | null;
  token_expires_at: string | null;
  revoked: boolean;
};
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function shopStatus() {
  if (!crmServiceConfigured())
    return { available: false, manualDelivery: false };
  try {
    const [settings, mail] = await Promise.all([
      serviceDb()
        .from("crm_lead_shop_settings")
        .select("enabled,recipient,iban,manual_delivery,notification_email")
        .eq("id", true)
        .single(),
      websiteMailReady(),
    ]);
    const config = settings.data;
    return {
      available:
        !settings.error &&
        !!config?.enabled &&
        config.manual_delivery === true &&
        !!config.recipient &&
        !!config.iban &&
        !!config.notification_email &&
        mail,
      manualDelivery: config?.manual_delivery === true,
    };
  } catch {
    return { available: false, manualDelivery: false };
  }
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );
export async function deliverLeadMail(orderId?: string) {
  const cfg = await smtpConfig();
  if (!cfg.host || !cfg.user || !cfg.password || ![465, 587].includes(cfg.port))
    return;
  const db = serviceDb();
  const claim = await db.rpc("crm_claim_lead_manual_mail", {
    order_in: orderId || null,
  });
  if (claim.error) throw new Error("E-Mail-Warteschlange nicht verfügbar.");
  const job = claim.data?.[0];
  if (!job) return;
  const record = await db
    .from("crm_lead_orders")
    .select("*")
    .eq("id", job.order_id)
    .single();
  if (record.error || !record.data) throw new Error("Bestellung fehlt.");
  const row = record.data as LeadOrder;
  const owner = job.kind.startsWith("owner_");
  if (job.kind !== "confirmation" && !owner)
    throw new Error("Versandart nicht freigegeben.");
  const recipient = job.to_address || (owner ? "" : row.customer.email);
  if (!recipient) throw new Error("Empfänger fehlt.");
  const labels: Record<string, string> = {
    owner_order: "Neue Lead-Bestellung",
    owner_payment: "Lead-Bestellung bezahlt – manuell ausliefern",
    owner_sent: "Lead-Bestellung als versendet markiert",
    owner_cancelled: "Lead-Bestellung storniert",
  };
  const subject = `${owner ? labels[job.kind] : "Bestellbestätigung"} · ${row.reference}`;
  const address = [
    row.customer.company,
    row.customer.contact,
    `${row.customer.street} ${row.customer.houseNumber}`,
    `${row.customer.postcode} ${row.customer.city}`,
    row.customer.country,
    `E-Mail: ${row.customer.email}`,
    `Telefon: ${row.customer.phone}`,
    row.customer.vatId ? `USt-IdNr.: ${row.customer.vatId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const summary = `Bestellnummer: ${row.reference}\nPaket: ${row.package}\nAnzahl: ${row.quantity} Firmenkontakte\nGesamtbetrag: ${shopMoney(row.total_cents)}\nStatus: ${row.status}\nBezahlt: ${row.paid_at ? "Ja" : "Nein"}`;
  const payment = `Empfänger: ${row.bank.recipient}\nIBAN: ${row.bank.iban}\nVerwendungszweck: ${row.reference}\nVollständiger Zahlbetrag: ${shopMoney(row.total_cents)}\nSteuerbefreiung für Kleinunternehmer gemäß § 19 UStG. Keine zusätzliche Umsatzsteuer.`;
  const crmLink = `${site.url}/crm/lead-verkauf?vorgang=${row.id}`;
  const text = owner
    ? `${labels[job.kind]}. Rufe die Bestellung im CRM auf.\n\n${summary}\n\n${address}\n\nCRM: ${crmLink}\n\n${row.paid_at ? "Die Zahlung ist im CRM bestätigt. CSV-Dateien werden ausschließlich über dein eigenes E-Mail-Programm versendet." : "Zahlung noch nicht bestätigt. Vor dem lokalen Versand den tatsächlichen Bankeingang prüfen."}${row.delivery_note ? "\nVersandnotiz: " + row.delivery_note : ""}`
    : [
        `Guten Tag ${row.customer.contact},`,
        "Ihr Kauf wurde bestätigt. Nach bestätigtem Zahlungseingang senden wir Ihre Leadliste als CSV-Datei an die bei der Bestellung angegebene E-Mail-Adresse.",
        summary,
        payment,
        "Rechnungs- und Kontaktdaten\n" + address,
        "Bestellbedingungen\n" + row.terms,
        `Freundliche Grüße\n${business.owner}\n${site.name}\n${business.street}, ${business.postcode} ${business.city}\n${site.email}\n${site.phone}`,
      ].join("\n\n");
  const messageId = `<lead-shop-${job.id}@webstudio-expert.de>`;
  const archived = await db
    .from("crm_lead_shop_mail")
    .update({ subject, body: text, message_id: messageId })
    .eq("id", job.id)
    .eq("claim_id", job.claim_id);
  if (archived.error) throw new Error("E-Mail konnte nicht archiviert werden.");
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    requireTLS: cfg.port === 587,
    auth: { user: cfg.user, pass: cfg.password },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const logo = owner
      ? null
      : await readFile(
          path.join(process.cwd(), "public/brand/wordmark-black.png"),
        );
    const info = await transport.sendMail({
      from: cfg.from,
      to: recipient,
      replyTo: owner ? row.customer.email : site.email,
      messageId,
      subject,
      text,
      ...(!owner
        ? {
            html: `<div style="font-family:Arial,sans-serif;max-width:620px;padding:24px"><img src="cid:webstudio-lead-logo" width="180" alt="Webstudio Expert"><div style="white-space:pre-wrap;line-height:1.6">${escape(text)}</div></div>`,
            attachments: [
              {
                filename: "webstudio-expert.png",
                content: logo!,
                cid: "webstudio-lead-logo",
                contentType: "image/png",
              },
            ],
          }
        : {}),
    });
    if (!info.accepted?.length)
      throw new Error("SMTP hat Nachricht nicht angenommen");
    const done = await db
      .from("crm_lead_shop_mail")
      .update({ status: "sent", sent_at: new Date().toISOString(), error: "" })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id)
      .eq("status", "sending")
      .select("id")
      .single();
    if (done.error) throw new Error("Versandstatus nicht gespeichert");
    await db
      .from("crm_lead_shop_events")
      .insert({
        order_id: row.id,
        action: `mail.${job.kind}.accepted`,
        detail: { message_id: messageId },
      });
  } catch {
    await db
      .from("crm_lead_shop_mail")
      .update({
        status: "unknown",
        error:
          "Versandstatus unklar. Gesendetes Postfach prüfen; kein automatischer Neuversand.",
      })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id)
      .eq("status", "sending");
  } finally {
    transport.close();
  }
}
export async function notifyLeadOrder(orderId: string) {
  // Jobs were committed with the order/payment. SMTP failure cannot undo a purchase.
  const results = await Promise.allSettled([
    deliverLeadMail(orderId),
    deliverLeadMail(orderId),
  ]);
  if (results.some((r) => r.status === "rejected"))
    console.error("lead_order_notice_deferred");
}
export async function runLeadShopWorker() {
  const heartbeat = await serviceDb()
    .from("crm_lead_shop_automation")
    .update({ worker_seen: new Date().toISOString() })
    .eq("id", true);
  if (heartbeat.error) throw new Error("Lead-Shop-Migration fehlt.");
  await Promise.all([deliverLeadMail(), deliverLeadMail()]);
}
