import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import { uuid } from "@/crm/server/validation";
import { documentPdf } from "@/crm/server/pdf";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");
    if (!["quote", "invoice"].includes(kind || ""))
      throw new Error("Ungültiger Dokumenttyp.");
    const id = uuid.parse(url.searchParams.get("id"));
    const { data: doc, error } = await db
      .from(kind === "quote" ? "crm_quotes" : "crm_invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error("403:Dokument nicht verfügbar.");
    let snapshot = doc.snapshot;
    const draft = !doc.issued_at;
    if (draft) {
      const [{ data: business }, { data: customer }, { data: items }] =
        await Promise.all([
          db
            .from("crm_company_settings")
            .select("data")
            .eq("key", "business")
            .single(),
          db
            .from("crm_companies")
            .select("*")
            .eq("id", doc.company_id)
            .single(),
          db
            .from(kind === "quote" ? "crm_quote_items" : "crm_invoice_items")
            .select("*")
            .eq(kind === "quote" ? "quote_id" : "invoice_id", id)
            .order("position"),
        ]);
      if (!business || !customer)
        throw new Error("Unternehmensdaten oder Kundendaten fehlen.");
      snapshot = {
        business: business.data,
        customer,
        items,
        document: doc,
        number: "VORSCHAU",
        date: new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Europe/Berlin",
        }).format(new Date()),
        total: doc.total,
        deducted: 0,
      };
    }
    const bytes = await documentPdf(snapshot, kind!, draft);
    if (!draft) {
      const svc = serviceDb();
      const path = `issued/${kind}/${id}.pdf`;
      const existing = await svc.storage.from("crm-private").download(path);
      if (existing.data)
        return new Response(await existing.data.arrayBuffer(), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${doc.number}.pdf"`,
            "Cache-Control": "private, no-store",
          },
        });
      const { error: uploadError } = await svc.storage
        .from("crm-private")
        .upload(path, bytes, { contentType: "application/pdf", upsert: false });
      if (uploadError && !uploadError.message.includes("exists"))
        throw new Error("PDF konnte nicht archiviert werden.");
      await svc.from("crm_documents").upsert(
        {
          company_id: doc.company_id,
          ...(kind === "quote" ? { quote_id: id } : { invoice_id: id }),
          name: `${doc.number}.pdf`,
          path,
          mime: "application/pdf",
          size: bytes.length,
          immutable: true,
          category: kind === "quote" ? "Angebot" : "Rechnung",
          retained_until:
            kind === "invoice"
              ? `${new Date(doc.issued_at).getUTCFullYear() + 8}-12-31`
              : null,
        },
        { onConflict: "path", ignoreDuplicates: true },
      );
    }
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${draft ? "Entwurf" : doc.number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
