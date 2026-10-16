import "server-only";
import { createHash, createHmac } from "node:crypto";
import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { serviceDb, crmServiceConfigured } from "./db";
import { smtpConfig } from "./integrations";
import { websiteMailReady } from "./website-mail";
import { csvCell } from "./import-export";
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
  expires_at: string;
  paid_at: string | null;
  file_path: string | null;
  file_sha256: string | null;
  token_hash: string | null;
  token_version: number;
  token_expires_at: string | null;
  revoked: boolean;
  fulfillment_state: string;
  claim_id: string;
  error: string;
  internal_notes: string;
};
export const tokenHash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function leadDownloadToken(
  order: Pick<LeadOrder, "id" | "token_version">,
) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Serverzugang fehlt.");
  return createHmac("sha256", secret)
    .update(`lead-download:v1:${order.id}:${order.token_version}`)
    .digest("hex");
}
export function leadDownloadUrl(order: LeadOrder) {
  return `${site.url}/leads/download?id=${order.id}&token=${leadDownloadToken(order)}`;
}
export async function shopStatus() {
  if (!crmServiceConfigured()) return { available: false, stock: 0 };
  try {
    const db = serviceDb();
    const [settings, stock, clock, mail] = await Promise.all([
      db
        .from("crm_lead_shop_settings")
        .select("enabled,recipient,iban")
        .eq("id", true)
        .single(),
      db
        .from("crm_lead_catalog")
        .select("id", { count: "exact", head: true })
        .eq("active", true)
        .is("reserved_order", null)
        .is("sold_order", null),
      db
        .from("crm_lead_shop_automation")
        .select("worker_seen,last_tick")
        .eq("id", true)
        .single(),
      websiteMailReady(),
    ]);
    const recent = (v: string | null) =>
      !!v && Date.now() - Date.parse(v) < 10 * 60 * 1000;
    return {
      available:
        !settings.error &&
        !stock.error &&
        !!settings.data?.enabled &&
        !!settings.data.iban &&
        !!settings.data.recipient &&
        mail &&
        recent(clock.data?.worker_seen) &&
        recent(clock.data?.last_tick),
      stock: stock.count || 0,
    };
  } catch {
    return { available: false, stock: 0 };
  }
}

export async function fulfillLeadOrder() {
  const db = serviceDb();
  const { data, error } = await db.rpc("crm_claim_lead_fulfillment");
  if (error) throw new Error("Bereitstellungswarteschlange nicht verfügbar.");
  const row = data?.[0] as LeadOrder | undefined;
  if (!row) return;
  try {
    const rows: {
      name: string;
      phone: string;
      email: string;
      website: string;
    }[] = [];
    for (let offset = 0; offset < row.quantity; offset += 1000) {
      const part = await db
        .from("crm_lead_order_items")
        .select("name,phone,email,website")
        .eq("order_id", row.id)
        .order("lead_id")
        .range(offset, Math.min(row.quantity - 1, offset + 999));
      if (part.error)
        throw new Error("Bestellte Kontakte konnten nicht gelesen werden.");
      rows.push(...part.data);
    }
    if (rows.length !== row.quantity)
      throw new Error("Kontaktanzahl stimmt nicht mit der Bestellung überein.");
    const csv =
      "\uFEFF" +
      [
        ["Firmenname", "Telefonnummer", "E-Mail-Adresse", "Website"]
          .map(csvCell)
          .join(";"),
        ...rows.map((r) =>
          [r.name, r.phone, r.email, r.website].map(csvCell).join(";"),
        ),
      ].join("\r\n");
    const content = Buffer.from(csv, "utf8"),
      sha = tokenHash(csv),
      filePath = `${row.id}/${sha}.csv`;
    const upload = await db.storage
      .from("lead-shop-private")
      .upload(filePath, content, { contentType: "text/csv", upsert: true });
    if (upload.error)
      throw new Error("CSV konnte nicht geschützt gespeichert werden.");
    const finished = await db.rpc("crm_finish_lead_fulfillment", {
      id_in: row.id,
      claim_in: row.claim_id,
      path_in: filePath,
      sha_in: sha,
      token_hash_in: tokenHash(leadDownloadToken(row)),
    });
    if (finished.error)
      throw new Error("Downloadfreigabe konnte nicht gespeichert werden.");
  } catch (error) {
    await db
      .from("crm_lead_orders")
      .update({
        fulfillment_state: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Bereitstellung fehlgeschlagen",
      })
      .eq("id", row.id)
      .eq("claim_id", row.claim_id)
      .eq("fulfillment_state", "processing");
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
export async function deliverLeadMail() {
  const cfg = await smtpConfig();
  if (!cfg.host || !cfg.user || !cfg.password || ![465, 587].includes(cfg.port))
    return;
  const db = serviceDb();
  const claim = await db.rpc("crm_claim_lead_mail");
  if (claim.error) throw new Error("E-Mail-Warteschlange nicht verfügbar.");
  const job = claim.data?.[0];
  if (!job) return;
  const { data } = await db
    .from("crm_lead_orders")
    .select("*")
    .eq("id", job.order_id)
    .single();
  if (!data) throw new Error("Bestellung fehlt.");
  const row = data as LeadOrder;
  const subject =
    job.kind === "download"
      ? `Ihre Leadliste steht bereit – ${row.reference}`
      : `Bestellbestätigung – ${row.reference}`;
  const address = [
    row.customer.company,
    row.customer.contact,
    `${row.customer.street} ${row.customer.houseNumber}`,
    `${row.customer.postcode} ${row.customer.city}`,
    row.customer.country,
    row.customer.email,
    row.customer.phone,
    row.customer.vatId,
  ]
    .filter(Boolean)
    .join("\n");
  const payment = `Empfänger: ${row.bank.recipient}\nIBAN: ${row.bank.iban}\nVerwendungszweck: ${row.reference}\nRechnungsbetrag: ${shopMoney(row.total_cents)}\nSteuerbefreiung für Kleinunternehmer gemäß § 19 UStG. Keine zusätzliche Umsatzsteuer.`;
  const introduction =
    job.kind === "download"
      ? `Der Zahlungseingang zu Ihrer Bestellung ist bestätigt. Ihre exklusive Liste mit ${row.quantity} Firmenkontakten ist verfügbar.\n\n${leadDownloadUrl(row)}\n\nDer persönliche Downloadlink ist 90 Tage ab Bereitstellung gültig. Bitte geben Sie ihn nicht weiter. Bei Problemen antworten Sie mit Ihrer Bestellnummer auf diese Nachricht.`
      : "Ihr Kauf wurde bestätigt. Sie erhalten nach bestätigtem Zahlungseingang einen Downloadlink per E-Mail, über den Sie Ihre Leadliste direkt auf unserer Website herunterladen können.";
  const text = [
    `Guten Tag ${row.customer.contact},`,
    introduction,
    `Bestellnummer: ${row.reference}\nPaket: ${row.package}\nAnzahl: ${row.quantity}\nGesamtbetrag: ${shopMoney(row.total_cents)}`,
    job.kind === "confirmation" ? payment : "Zahlung vollständig bestätigt.",
    "Rechnungs- und Kontaktdaten\n" + address,
    job.kind === "confirmation"
      ? "Bestellbedingungen\n" + row.terms
      : "Die gelieferten Kontaktdaten enthalten keine Werbeeinwilligung.",
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
    // Recheck paid/revoked state immediately before transmitting a download.
    if (job.kind === "download") {
      const check = await db
        .from("crm_lead_orders")
        .select("status,revoked")
        .eq("id", row.id)
        .single();
      if (
        check.error ||
        check.data.revoked ||
        check.data.status !== "Bereitgestellt"
      )
        throw new Error("Freigabe geändert");
    }
    const logo = await readFile(
      path.join(process.cwd(), "public/brand/wordmark-black.png"),
    );
    const info = await transport.sendMail({
      from: cfg.from,
      to: row.customer.email,
      replyTo: site.email,
      messageId,
      subject,
      text,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;color:#191919;background:white;padding:24px"><img src="cid:webstudio-lead-logo" width="180" alt="Webstudio Expert" style="max-width:100%;height:auto;margin-bottom:24px">${job.kind === "download" ? `<p><a href="${escape(leadDownloadUrl(row))}" style="display:inline-block;padding:14px 20px;background:#191919;color:white;text-decoration:none">Leadliste herunterladen</a></p>` : ""}<div style="white-space:pre-wrap;line-height:1.6">${escape(text)}</div></div>`,
      attachments: [
        {
          filename: "webstudio-expert.png",
          content: logo,
          cid: "webstudio-lead-logo",
          contentType: "image/png",
        },
      ],
    });
    if (!info.accepted?.length)
      throw new Error("SMTP hat Nachricht nicht angenommen");
    const done = await db
      .from("crm_lead_shop_mail")
      .update({ status: "sent", sent_at: new Date().toISOString(), error: "" })
      .eq("id", job.id)
      .eq("claim_id", job.claim_id);
    if (done.error) throw new Error("Versandstatus nicht gespeichert");
    await db.from("crm_lead_shop_events").insert({
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
      .eq("claim_id", job.claim_id);
  } finally {
    transport.close();
  }
}
export async function runLeadShopWorker() {
  const db = serviceDb();
  const heartbeat = await db
    .from("crm_lead_shop_automation")
    .update({ worker_seen: new Date().toISOString() })
    .eq("id", true);
  if (heartbeat.error) throw new Error("Lead-Shop-Migration fehlt.");
  await fulfillLeadOrder();
  await Promise.all([deliverLeadMail(), deliverLeadMail()]);
}
