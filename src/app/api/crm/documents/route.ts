import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import { uuid } from "@/crm/server/validation";
import { readForm, validateAttachments } from "@/server/uploads";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const id = uuid.parse(new URL(request.url).searchParams.get("id"));
    const { data, error } = await db
      .from("crm_documents")
      .select("path,name,mime")
      .eq("id", id)
      .single();
    if (error) throw new Error("403:Dokument nicht verfügbar.");
    const { data: signed, error: signError } = await serviceDb()
      .storage.from("crm-private")
      .createSignedUrl(data.path, 60, {
        download:
          new URL(request.url).searchParams.get("preview") === "true" &&
          ["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
            data.mime,
          )
            ? false
            : data.name,
      });
    if (signError) throw new Error("Download konnte nicht vorbereitet werden.");
    return Response.redirect(signed.signedUrl, 303);
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, [
      "administrator",
      "vertrieb",
      "buchhaltung",
    ]);
    const form = await readForm(request);
    const file = form.get("file");
    if (!file || typeof file === "string") throw new Error("Datei fehlt.");
    let bytes: Buffer;
    let mime: string;
    if (file.name.toLowerCase().endsWith(".xml")) {
      if (file.size > 2_000_000)
        throw new Error("XML darf höchstens 2 MB groß sein.");
      bytes = Buffer.from(await file.arrayBuffer());
      const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (
        !content.trim().startsWith("<") ||
        /<!DOCTYPE|<!ENTITY/i.test(content)
      )
        throw new Error("XML mit DTD/Entities ist nicht erlaubt.");
      mime = "application/xml";
    } else {
      const [attachment] = await validateAttachments([file]);
      if (!attachment) throw new Error("Datei leer.");
      bytes = attachment.content;
      mime = attachment.contentType;
    }
    const company = form.get("company_id");
    const project = form.get("project_id");
    for (const [table, id] of [
      ["crm_companies", company],
      ["crm_projects", project],
    ] as const) {
      if (id) {
        const { data } = await db
          .from(table)
          .select("id")
          .eq("id", uuid.parse(id))
          .single();
        if (!data) throw new Error("403:Zuordnung nicht verfügbar.");
      }
    }
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = `uploads/${crypto.randomUUID()}/${name}`;
    const svc = serviceDb();
    const { error } = await svc.storage
      .from("crm-private")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) throw new Error("Upload fehlgeschlagen.");
    const { error: insertError } = await svc.from("crm_documents").insert({
      name,
      path,
      mime,
      size: bytes.length,
      company_id: company || null,
      project_id: project || null,
      category:
        mime === "application/xml"
          ? "E-Rechnungsoriginal (nicht validiert)"
          : "Allgemein",
    });
    if (insertError) {
      await svc.storage.from("crm-private").remove([path]);
      throw new Error("Zuordnung fehlgeschlagen.");
    }
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator"]);
    const { id } = await request.json();
    const { data: doc } = await db
      .from("crm_documents")
      .select("*")
      .eq("id", uuid.parse(id))
      .single();
    if (!doc) throw new Error("Dokument fehlt.");
    if (
      doc.immutable ||
      (doc.retained_until &&
        doc.retained_until >= new Date().toISOString().slice(0, 10))
    )
      throw new Error("Dokument ist geschützt oder aufbewahrungspflichtig.");
    const svc = serviceDb();
    const { error } = await svc.storage.from("crm-private").remove([doc.path]);
    if (error) throw new Error("Datei konnte nicht entfernt werden.");
    await svc.from("crm_documents").delete().eq("id", doc.id);
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
