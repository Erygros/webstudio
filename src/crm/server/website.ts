import { createHash } from "node:crypto";
import { serviceDb } from "./db";
export async function captureWebsiteInquiry(
  data: Record<string, unknown>,
  attachments: { filename: string; content: Buffer; contentType: string }[],
) {
  const { token, website, ...safe } = data;
  const key = createHash("sha256")
    // Eine eigene Formularabgabe ist eine eigene Anfrage, auch bei gleichem Text.
    // Wiederholungen derselben Abgabe behalten denselben Schlüssel.
    .update(String(token))
    .digest("hex");
  const svc = serviceDb();
  const { data: companyId, error } = await svc.rpc("crm_ingest_inquiry", {
    request_key_in: key,
    payload: safe,
  });
  if (error || typeof companyId !== "string" || !companyId)
    throw new Error(
      "Die Anfrage konnte nicht sicher im CRM gespeichert werden. Bitte später erneut versuchen.",
    );
  let attachmentsComplete = true;
  for (const attachment of attachments) {
    try {
      const hash = createHash("sha256")
        .update(attachment.content)
        .digest("hex");
      const path = `website/${key}/${hash}-${attachment.filename}`;
      const { error: uploadError } = await svc.storage
        .from("crm-private")
        .upload(path, attachment.content, {
          contentType: attachment.contentType,
          upsert: false,
        });
      if (uploadError && !/exists|Duplicate/i.test(uploadError.message)) {
        attachmentsComplete = false;
        continue;
      }
      const { error: metaError } = await svc.from("crm_documents").upsert(
        {
          company_id: companyId,
          name: attachment.filename,
          path,
          mime: attachment.contentType,
          size: attachment.content.length,
          category: "Projektanfrage",
        },
        { onConflict: "path", ignoreDuplicates: true },
      );
      if (metaError) attachmentsComplete = false;
    } catch {
      // Der Eingang ist bereits gespeichert. Ein Dateifehler darf ihn nicht
      // nachträglich als fehlgeschlagene Anfrage ausweisen.
      attachmentsComplete = false;
    }
  }
  return { companyId, attachmentsComplete };
}
