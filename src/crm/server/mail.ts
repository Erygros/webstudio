import nodemailer from "nodemailer";
import { smtpConfig } from "./integrations";
import { serviceDb } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function sendDraft(
  db: SupabaseClient,
  id: string,
  attachmentIds: string[] = [],
) {
  const { data: email } = await db
    .from("crm_emails")
    .select("*")
    .eq("id", id)
    .single();
  if (!email || email.folder !== "draft")
    throw new Error("Nur ein unversendeter Entwurf kann gesendet werden.");
  const config = await smtpConfig();
  if (
    !config.host ||
    !config.user ||
    !config.password ||
    ![465, 587].includes(config.port)
  )
    throw new Error("E-Mail-Versand ist nicht eingerichtet.");
  const { data: business } = await db
    .from("crm_company_settings")
    .select("data")
    .eq("key", "business")
    .single();
  const { data: company } = email.company_id
    ? await db
        .from("crm_companies")
        .select("*")
        .eq("id", email.company_id)
        .single()
    : { data: null };
  if (email.purpose === "marketing") {
    if (!company || company.blocked)
      throw new Error("Werblicher Versand gesperrt.");
    const { data: contact } = await db
      .from("crm_contacts")
      .select("id")
      .eq("company_id", company.id)
      .ilike("email", email.to_address)
      .limit(1);
    if (
      String(company.email).toLowerCase() !==
        String(email.to_address).toLowerCase() &&
      !contact?.length
    )
      throw new Error(
        "Der Werbeempfänger gehört nicht zum freigegebenen Unternehmen.",
      );
    const { data: permission } = await db
      .from("crm_contact_permissions")
      .select("id")
      .eq("company_id", company.id)
      .eq("channel", "email")
      .is("withdrawn_at", null)
      .limit(1);
    if (!permission?.length)
      throw new Error("Dokumentierte E-Mail-Kontakterlaubnis fehlt.");
  }
  const replace = (text: string) =>
    text
      .replaceAll("{{name}}", company?.contact_name || "")
      .replaceAll("{{company}}", company?.name || "");
  const attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[] = [];
  let total = 0;
  for (const aid of attachmentIds.slice(0, 5)) {
    const { data: doc } = await db
      .from("crm_documents")
      .select("*")
      .eq("id", aid)
      .single();
    if (!doc) throw new Error("Anhang nicht verfügbar.");
    const { data: file } = await serviceDb()
      .storage.from("crm-private")
      .download(doc.path);
    if (!file) throw new Error("Anhang konnte nicht geladen werden.");
    total += file.size;
    if (total > 10_000_000)
      throw new Error("Anhänge dürfen insgesamt höchstens 10 MB haben.");
    attachments.push({
      filename: doc.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: doc.mime,
    });
  }
  const { data: claimed } = await db
    .from("crm_emails")
    .update({ folder: "sending", send_key: crypto.randomUUID() })
    .eq("id", id)
    .eq("folder", "draft")
    .select("id")
    .maybeSingle();
  if (!claimed) throw new Error("Versand wurde bereits gestartet.");
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  try {
    const info = await transport.sendMail({
      from: config.from,
      to: email.to_address,
      subject: replace(email.subject),
      text: replace(email.body) + "\n\n" + (business?.data?.signature || ""),
      attachments,
    });
    if (!info.accepted?.length)
      throw new Error("Mailserver hat die Nachricht nicht angenommen.");
    const { error } = await db
      .from("crm_emails")
      .update({
        folder: "sent",
        from_address: config.from,
        message_id: info.messageId,
        sent_at: new Date().toISOString(),
        subject: replace(email.subject),
        body: replace(email.body) + "\n\n" + (business?.data?.signature || ""),
        error: "",
      })
      .eq("id", id);
    if (error)
      throw new Error(
        "Versandstatus konnte nicht gespeichert werden. Nachricht nicht erneut versenden.",
      );
    for (const aid of attachmentIds) {
      const { data: doc } = await db
        .from("crm_documents")
        .select("quote_id")
        .eq("id", aid)
        .single();
      if (doc?.quote_id)
        await db
          .from("crm_quotes")
          .update({ status: "Versendet" })
          .eq("id", doc.quote_id)
          .eq("status", "Ausgestellt");
    }
    await db
      .from("crm_follow_ups")
      .update({ status: "E-Mail gesendet", email_id: id })
      .eq("company_id", email.company_id)
      .in("status", ["Geplant", "Fällig"]);
    return { success: true };
  } catch (e) {
    await db
      .from("crm_emails")
      .update({
        folder: "unknown",
        error:
          "Versandstatus unklar. Postfach prüfen, nicht automatisch erneut senden.",
      })
      .eq("id", id);
    throw e;
  } finally {
    transport.close();
  }
}
