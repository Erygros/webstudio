import { z } from "zod";
import { apiSession, apiError } from "@/crm/server/db";
import { GET as renderPdf } from "../pdf/route";
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, [
      "administrator",
      "vertrieb",
      "buchhaltung",
    ]);
    const body = z
      .object({ id: z.uuid(), kind: z.enum(["quote", "invoice"]) })
      .parse(await request.json());
    const { data: doc } = await db
      .from(body.kind === "quote" ? "crm_quotes" : "crm_invoices")
      .select("*")
      .eq("id", body.id)
      .single();
    if (!doc || !doc.issued_at)
      throw new Error("Dokument muss zuerst ausgestellt werden.");
    const { data: company } = await db
      .from("crm_companies")
      .select("*")
      .eq("id", doc.company_id)
      .single();
    if (!company?.email) throw new Error("Kunden-E-Mail fehlt.");
    const url = new URL(request.url);
    url.pathname = "/api/crm/pdf";
    url.search = `?kind=${body.kind}&id=${body.id}`;
    const response = await renderPdf(
      new Request(url, { headers: request.headers }),
    );
    if (!response.ok) throw new Error("PDF konnte nicht vorbereitet werden.");
    const { data: file } = await db
      .from("crm_documents")
      .select("id")
      .eq(body.kind === "quote" ? "quote_id" : "invoice_id", body.id)
      .single();
    if (!file) throw new Error("Archiviertes PDF fehlt.");
    const { data: mail, error } = await db
      .from("crm_emails")
      .insert({
        company_id: company.id,
        to_address: company.email,
        subject: `${body.kind === "quote" ? "Angebot" : "Rechnung"} ${doc.number}`,
        body: `Guten Tag ${company.contact_name || company.name},\n\nanbei erhältst du ${body.kind === "quote" ? "unser Angebot" : "die Rechnung"} ${doc.number}. Bei Fragen melde dich gerne.`,
        attachment_ids: [file.id],
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ id: mail.id });
  } catch (e) {
    return apiError(e);
  }
}
