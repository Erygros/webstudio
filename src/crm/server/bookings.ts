import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { serviceDb, crmServiceConfigured } from "./db";
import { smtpConfig } from "./integrations";
import { websiteMailReady } from "./website-mail";
import { documentPdf } from "./pdf";
import { site } from "@/config/site";

export type BookingBank = {
  recipient: string;
  iban: string;
  bic: string;
  paymentDays: number;
};
export function validIban(value: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value)) return false;
  let remainder = 0;
  for (const ch of value.slice(4) + value.slice(0, 4)) {
    const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of digits)
      remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}
export async function bookingReadiness() {
  if (!crmServiceConfigured())
    return {
      ready: false,
      consultation: false,
      bank: null,
      smallBusiness: true,
    };
  const db = serviceDb();
  const [settings, schema, smtp] = await Promise.all([
    db
      .from("crm_company_settings")
      .select("data")
      .eq("key", "business")
      .single(),
    db.from("crm_service_bookings").select("id").limit(0),
    websiteMailReady(),
  ]);
  const biz = settings.data?.data || {};
  const bank: BookingBank = {
    recipient: String(biz.bankRecipient || biz.owner || "").trim(),
    iban: String(biz.iban || "")
      .replace(/\s/g, "")
      .toUpperCase(),
    bic: String(biz.bic || "").trim(),
    paymentDays: Number(biz.paymentDays || 14),
  };
  const taxReady =
    biz.smallBusiness === true ||
    (biz.smallBusiness === false &&
      Number.isFinite(Number(biz.vatRate)) &&
      Number(biz.vatRate) >= 0 &&
      Number(biz.vatRate) <= 100);
  return {
    ready:
      !settings.error &&
      !schema.error &&
      smtp &&
      validIban(bank.iban) &&
      !!bank.recipient &&
      Number.isInteger(bank.paymentDays) &&
      bank.paymentDays >= 1 &&
      bank.paymentDays <= 90 &&
      !!(biz.taxNumber || biz.vatId) &&
      !!biz.street &&
      !!biz.postcode &&
      !!biz.city &&
      taxReady,
    consultation: !schema.error && smtp,
    bank,
    smallBusiness: biz.smallBusiness !== false,
  };
}
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function deliverBookingMail() {
  const db = serviceDb();
  const config = await smtpConfig();
  if (
    !config.host ||
    !config.user ||
    !config.password ||
    ![465, 587].includes(config.port)
  )
    throw new Error("SMTP-Konfiguration fehlt.");
  const { data: m, error } = await db.rpc("crm_booking_claim_mail");
  if (error) throw new Error("Buchungsversand noch nicht eingerichtet.");
  if (!m) return { processed: 0, needsReview: false };
  // Anything after the SMTP call may have an uncertain outcome. Hold instead of duplicating.
  let smtpAttempted = false;
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
    let reference = "";
    if (m.booking_id) {
      const { data: b, error: e } = await db
        .from("crm_service_bookings")
        .select("reference")
        .eq("id", m.booking_id)
        .single();
      if (e) throw new Error("Buchungsreferenz fehlt");
      reference = b.reference;
    }
    const body = String(m.body).replaceAll("{{reference}}", reference);
    const attachments: {
      filename: string;
      content: Buffer;
      cid?: string;
      contentType?: string;
    }[] = [];
    if (m.invoice_id) {
      const { data: bill, error: e } = await db
        .from("crm_invoices")
        .select("*")
        .eq("id", m.invoice_id)
        .single();
      if (e || !bill?.issued_at || !bill.snapshot)
        throw new Error("Ausgestellte Rechnung fehlt");
      const storagePath = `issued/invoice/${bill.id}.pdf`;
      const stored = await db.storage.from("crm-private").download(storagePath);
      let bytes: Buffer;
      if (stored.data) bytes = Buffer.from(await stored.data.arrayBuffer());
      else {
        bytes = Buffer.from(await documentPdf(bill.snapshot, "invoice", false));
        const upload = await db.storage
          .from("crm-private")
          .upload(storagePath, bytes, {
            contentType: "application/pdf",
            upsert: false,
          });
        if (upload.error && !upload.error.message.includes("exists"))
          throw new Error("PDF-Archivierung fehlgeschlagen");
        const meta = await db.from("crm_documents").upsert(
          {
            company_id: bill.company_id,
            invoice_id: bill.id,
            name: `${bill.number}.pdf`,
            path: storagePath,
            mime: "application/pdf",
            size: bytes.length,
            immutable: true,
            category: "Rechnung",
            retained_until: `${new Date(bill.issued_at).getUTCFullYear() + 8}-12-31`,
          },
          { onConflict: "path", ignoreDuplicates: true },
        );
        if (meta.error) throw new Error("Rechnungsarchiv nicht bestätigt");
      }
      attachments.push({
        filename: `${bill.number}.pdf`,
        content: bytes,
        contentType: "application/pdf",
      });
    }
    try {
      attachments.push({
        filename: "webstudio-expert.png",
        content: await readFile(
          path.join(process.cwd(), "public/brand/wordmark-black.png"),
        ),
        cid: "webstudio-logo",
        contentType: "image/png",
      });
    } catch {
      /* Text signature remains complete. */
    }
    const signature = `Enrico Gross\nWebstudio Expert\nKarinstraße 5 · 44388 Dortmund\n${site.email} · ${site.phone}\n${site.url}\nVerträge hier kündigen: ${site.url}/vertrag-kuendigen\nVertrag widerrufen: ${site.url}/vertrag-widerrufen`;
    smtpAttempted = true;
    const result = await transport.sendMail({
      from: config.from,
      to: m.recipient,
      replyTo: site.email,
      subject: m.subject,
      messageId: `<booking-${m.id}@webstudio-expert.de>`,
      text: `${body}\n\nViele Grüße\n${signature}`,
      attachments,
      html: `<div style="font:15px/1.7 Arial,sans-serif;color:#191919;background:#fff;padding:28px;max-width:680px"><div style="white-space:pre-line">${escapeHtml(body)}</div><hr style="border:0;border-top:1px solid #ddd;margin:28px 0"><p>Viele Grüße<br>Enrico Gross<br>Webstudio Expert</p>${attachments.some((a) => a.cid) ? '<img src="cid:webstudio-logo" width="170" alt="Webstudio Expert">' : ""}<p style="font-size:12px;white-space:pre-line">${escapeHtml(signature)}</p></div>`,
    });
    if (!result.accepted?.length)
      throw new Error("SMTP hat die Nachricht nicht bestätigt");
    const saved = await db
      .from("crm_booking_mail")
      .update({ status: "sent", sent_at: new Date().toISOString(), error: "" })
      .eq("id", m.id)
      .eq("claim", m.claim)
      .eq("status", "sending")
      .select("id")
      .single();
    if (saved.error) throw new Error("Versandstatus unbestätigt");
    return { processed: 1, needsReview: false };
  } catch {
    await db
      .from("crm_booking_mail")
      .update({
        status: smtpAttempted ? "unknown" : "queued",
        next_attempt_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        error: smtpAttempted
          ? "Versandstatus unklar. Postfach/SMTP-Protokoll prüfen, bevor erneut versendet wird."
          : "Vorbereitung fehlgeschlagen: PDF, Unternehmensdaten und SMTP prüfen.",
      })
      .eq("id", m.id)
      .eq("claim", m.claim);
    return { processed: 0, needsReview: true };
  } finally {
    transport.close();
  }
}
export async function runBookingJobs() {
  const db = serviceDb();
  await db
    .from("crm_booking_automation")
    .update({ worker_last_seen: new Date().toISOString() })
    .eq("id", true);
  const { error } = await db.rpc("crm_booking_tick");
  const settled = await Promise.allSettled([
    deliverBookingMail(),
    deliverBookingMail(),
  ]);
  const unknown = await db
    .from("crm_booking_mail")
    .select("id", { head: true, count: "exact" })
    .eq("status", "unknown");
  const results = settled.flatMap((r) =>
    r.status === "fulfilled" ? [r.value] : [],
  );
  const needsReview =
    !!error ||
    !!unknown.error ||
    !!unknown.count ||
    settled.some((r) => r.status === "rejected") ||
    results.some((r) => r.needsReview);
  await db
    .from("crm_booking_automation")
    .update({
      ...(needsReview ? {} : { last_success: new Date().toISOString() }),
      error: needsReview
        ? "Abrechnung oder Versand nicht vollständig; Buchungen, SMTP und Unternehmensdaten prüfen."
        : "",
    })
    .eq("id", true);
  return {
    processed: results.reduce((n, r) => n + r.processed, 0),
    needsReview,
  };
}
