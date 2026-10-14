import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { serviceDb } from "./db";
import { imapConfig } from "./integrations";
export async function syncMailbox() {
  const svc = serviceDb();
  const c = await imapConfig();
  if (!c.host || !c.user || !c.password)
    throw new Error("IMAP ist nicht eingerichtet.");
  const { data: lease, error: leaseError } = await svc.rpc("crm_lease", {
    job_key: "imap",
    seconds: 120,
  });
  if (leaseError) throw new Error("IMAP-Job-Migration fehlt.");
  if (!lease) return { message: "Synchronisation läuft bereits." };
  const { data: account, error } = await svc
    .from("crm_email_accounts")
    .upsert(
      { name: "Geschäftspostfach", address: c.user },
      { onConflict: "address" },
    )
    .select("*")
    .single();
  if (error) throw new Error("Postfach konnte nicht zugeordnet werden.");
  const client = new ImapFlow({
    host: c.host,
    port: c.port,
    secure: true,
    auth: { user: c.user, pass: c.password },
    logger: false,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  let imported = 0;
  let processed = 0;
  let success = false;
  const deadline = Date.now() + 35000;
  try {
    await client.connect();
    const listed = await client.list();
    const folders = [
      { path: "INBOX", folder: "inbox" },
      ...listed
        .filter((f) =>
          ["\\Sent", "\\Archive", "\\Drafts"].includes(f.specialUse || ""),
        )
        .map((f) => ({
          path: f.path,
          folder:
            f.specialUse === "\\Sent"
              ? "sent"
              : f.specialUse === "\\Drafts"
                ? "draft"
                : "archive",
        })),
    ];
    for (const box of folders) {
      if (Date.now() > deadline || processed >= 30) break;
      const lock = await client.getMailboxLock(box.path);
      try {
        const mailbox = client.mailbox;
        if (!mailbox) continue;
        const validity = String(mailbox.uidValidity);
        const { data: cursor } = await svc
          .from("crm_mailbox_cursors")
          .select("*")
          .eq("account_id", account.id)
          .eq("mailbox", box.path)
          .maybeSingle();
        let last =
          cursor?.uid_validity === validity ? Number(cursor.last_uid) : 0;
        const uids = await client.search(
          { uid: `${last + 1}:*` },
          { uid: true },
        );
        const selected = (uids || [])
          .filter((uid) => uid > last)
          .sort((a, b) => a - b)
          .slice(0, 30 - processed);
        for (const uid of selected) {
          if (Date.now() > deadline) break;
          const size = await client.fetchOne(
            uid,
            { size: true },
            { uid: true },
          );
          if (!size) {
            last = uid;
            continue;
          }
          if ((size.size || 0) > 10_000_000) {
            last = uid;
            processed++;
            continue;
          }
          const message = await client.fetchOne(
            uid,
            { source: true },
            { uid: true },
          );
          if (!message || !message.source) continue;
          const parsed = await simpleParser(message.source, {
            skipHtmlToText: false,
            skipTextToHtml: true,
          });
          const from = parsed.from?.value[0]?.address || "";
          const to =
            (Array.isArray(parsed.to)
              ? parsed.to[0]?.value[0]?.address
              : parsed.to?.value[0]?.address) || "";
          const counterparty =
            box.folder === "sent" || box.folder === "draft" ? to : from;
          let { data: company } = await svc
            .from("crm_companies")
            .select("id")
            .ilike("email", counterparty || "__none__")
            .limit(1)
            .maybeSingle();
          if (!company) {
            const { data: contact } = await svc
              .from("crm_contacts")
              .select("company_id")
              .ilike("email", counterparty || "__none__")
              .limit(1)
              .maybeSingle();
            if (contact) company = { id: contact.company_id };
          }
          const key = `${account.id}:${box.path}:${validity}:${uid}`;
          const { data: mail, error: insertError } = await svc
            .from("crm_emails")
            .upsert(
              {
                company_id: company?.id || null,
                account_id: account.id,
                folder: box.folder,
                from_address: from,
                to_address: to,
                subject: parsed.subject || "(Ohne Betreff)",
                body: parsed.text || "Kein darstellbarer Textinhalt.",
                message_id: parsed.messageId || null,
                sync_key: key,
                sent_at: parsed.date?.toISOString() || null,
              },
              { onConflict: "sync_key", ignoreDuplicates: true },
            )
            .select("id")
            .maybeSingle();
          if (insertError && insertError.code !== "23505")
            throw new Error("Nachricht konnte nicht gespeichert werden.");
          if (mail) {
            for (const attachment of parsed.attachments.slice(0, 10)) {
              if (
                attachment.size > 2_000_000 ||
                ![
                  "application/pdf",
                  "image/png",
                  "image/jpeg",
                  "text/plain",
                  "application/xml",
                  "text/xml",
                ].includes(attachment.contentType)
              )
                continue;
              const name = (attachment.filename || "anhang")
                .replace(/[^a-zA-Z0-9._-]/g, "_")
                .slice(-100);
              const path = `mail/${mail.id}/${crypto.randomUUID()}-${name}`;
              const { error: uploadError } = await svc.storage
                .from("crm-private")
                .upload(path, attachment.content, {
                  contentType: attachment.contentType,
                });
              if (!uploadError)
                await svc.from("crm_documents").insert({
                  company_id: company?.id || null,
                  email_id: mail.id,
                  name,
                  path,
                  mime: attachment.contentType,
                  size: attachment.size,
                  category: "E-Mail-Anhang (untrusted)",
                });
            }
            if (box.folder === "inbox") {
              await svc.from("crm_notifications").upsert(
                {
                  title: "Neue E-Mail: " + (parsed.subject || "(Ohne Betreff)"),
                  href: "/crm/emails/" + mail.id,
                  event_key: "mail:" + key,
                },
                { onConflict: "event_key", ignoreDuplicates: true },
              );
              if (company)
                await svc
                  .from("crm_follow_ups")
                  .update({ status: "Antwort erhalten" })
                  .eq("company_id", company.id)
                  .eq("status", "E-Mail gesendet");
            }
            imported++;
          }
          last = uid;
          processed++;
        }
        const { error: cursorError } = await svc
          .from("crm_mailbox_cursors")
          .upsert(
            {
              account_id: account.id,
              mailbox: box.path,
              last_uid: last,
              uid_validity: validity,
            },
            { onConflict: "account_id,mailbox" },
          );
        if (cursorError)
          throw new Error(
            "Synchronisationsstand konnte nicht gespeichert werden.",
          );
      } finally {
        lock.release();
      }
    }
    success = true;
    return {
      imported,
      processed,
      message:
        processed >= 30
          ? "Weitere Nachrichten werden im nächsten begrenzten Lauf übernommen."
          : undefined,
    };
  } finally {
    await client.logout().catch(() => client.close());
    await svc
      .from("crm_job_runs")
      .update({
        lease_until: new Date().toISOString(),
        ...(success ? { last_success: new Date().toISOString() } : {}),
      })
      .eq("key", "imap");
  }
}
