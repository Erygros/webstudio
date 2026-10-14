import { z } from "zod";
import { apiSession } from "./db";
import { uuid } from "./validation";
export const actionSchema = z.object({
  action: z.string().max(60),
  id: uuid,
  requestKey: uuid,
  outcome: z.string().optional(),
  notes: z.string().max(20000).optional(),
  callback: z.iso.datetime({ offset: true }).optional(),
});
export async function runAction(request: Request) {
  const current = await apiSession(request);
  const body = actionSchema.parse(await request.json());
  const { db } = current;
  if (
    [
      "quote.clone",
      "quote.invoice",
      "invoice.clone",
      "invoice.cancel",
    ].includes(body.action)
  ) {
    const { data, error } = await db.rpc("crm_document_operation", {
      operation: body.action,
      source_id: body.id,
      request_key_in: body.requestKey,
    });
    if (error) throw new Error(error.message);
    return {
      id: data,
      resource: body.action === "quote.clone" ? "angebote" : "rechnungen",
    };
  }
  if (["quote.issue", "invoice.issue"].includes(body.action)) {
    const { data, error } = await db.rpc("crm_issue", {
      doc_kind: body.action.startsWith("quote") ? "quote" : "invoice",
      doc_id: body.id,
    });
    if (error) throw new Error(error.message);
    return { snapshot: data };
  }
  if (body.action === "lead.convert") {
    const { error } = await db
      .from("crm_companies")
      .update({ is_customer: true, status: "Kunde gewonnen" })
      .eq("id", body.id);
    if (error) throw error;
    return { id: body.id, resource: "kunden" };
  }
  if (body.action === "lead.archive") {
    const { error } = await db
      .from("crm_companies")
      .update({ archived: true })
      .eq("id", body.id);
    if (error) throw error;
    return { success: true };
  }
  if (body.action === "quote.accept" || body.action === "quote.reject") {
    const { error } = await db
      .from("crm_quotes")
      .update({
        status: body.action === "quote.accept" ? "Angenommen" : "Abgelehnt",
      })
      .eq("id", body.id)
      .not("issued_at", "is", null);
    if (error) throw error;
    return { success: true };
  }
  if (body.action === "call.finish") {
    const { error } = await db.rpc("crm_finish_call", {
      call_id_in: body.id,
      outcome_in: body.outcome,
      notes_in: body.notes || "",
      callback_in: body.callback || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  }
  throw new Error("Unbekannte Aktion.");
}
