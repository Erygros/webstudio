import { z } from "zod";
import Decimal from "decimal.js";
import { apiSession, apiError } from "@/crm/server/db";
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator", "buchhaltung"]);
    const { id, kind } = z
      .object({ id: z.uuid(), kind: z.enum(["reminder", "dunning"]) })
      .parse(await request.json());
    const { data: invoice } = await db
      .from("crm_invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (
      !invoice?.issued_at ||
      invoice.document_status === "Storniert" ||
      invoice.kind === "Storno"
    )
      throw new Error("Kein gültiger offener Rechnungsbeleg.");
    const [{ data: payments }, { data: company }] = await Promise.all([
      db.from("crm_payments").select("amount").eq("invoice_id", id),
      db
        .from("crm_companies")
        .select("*")
        .eq("id", invoice.company_id)
        .single(),
    ]);
    const paid = (payments || []).reduce(
      (sum, p) => sum.plus(p.amount),
      new Decimal(0),
    );
    const remaining = new Decimal(invoice.total).minus(paid);
    if (!remaining.gt(0)) throw new Error("Kein offener Betrag.");
    if (!company?.email) throw new Error("Kunden-E-Mail fehlt.");
    const title = kind === "dunning" ? "Mahnung" : "Zahlungserinnerung";
    const { data: mail, error } = await db
      .from("crm_emails")
      .insert({
        company_id: company.id,
        to_address: company.email,
        subject: `${title} zu ${invoice.number}`,
        body: `Guten Tag ${company.contact_name || company.name},\n\nzu unserer Rechnung ${invoice.number}${invoice.due_on ? " mit Zahlungsziel " + invoice.due_on : ""} ist noch ein Betrag von ${remaining.toFixed(2).replace(".", ",")} EUR offen.\n\nBitte prüfe den Zahlungseingang beziehungsweise überweise den offenen Betrag. Falls sich diese Nachricht mit deiner Zahlung überschneidet, melde dich kurz.\n\nVielen Dank.`,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return Response.json({ id: mail.id });
  } catch (e) {
    return apiError(e);
  }
}
