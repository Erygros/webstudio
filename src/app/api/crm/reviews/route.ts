import { z } from "zod";
import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import { reviewAutomationStatus } from "@/crm/server/reviews";
import { reviewPayments, reviewResults, reviewStatuses } from "@/lib/reviews";
const roles = ["administrator", "vertrieb"];
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request, roles);
    const url = new URL(request.url);
    if (url.searchParams.get("automation") === "true")
      return Response.json(await reviewAutomationStatus(), {
        headers: { "Cache-Control": "no-store" },
      });
    const offset = Math.max(
      0,
      Math.min(100000, Number(url.searchParams.get("offset")) || 0),
    );
    let query = db
      .from("crm_review_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + 24);
    const status = url.searchParams.get("status"),
      q = url.searchParams.get("q")?.trim().slice(0, 100);
    if (
      status &&
      reviewStatuses.includes(status as (typeof reviewStatuses)[number])
    )
      query = query.eq("status", status);
    if (q) query = query.ilike("name", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
    const { data, error, count } = await query;
    if (error)
      throw new Error(
        "Bewertungsanfragen nicht verfügbar. Datenbankmigration prüfen.",
      );
    const ids = (data || []).map((row) => row.id);
    const { data: jobs, error: jobsError } = ids.length
      ? await db
          .from("crm_review_mail_jobs")
          .select("id,request_id,kind,status,due_at,sent_at,error,subject,body")
          .in("request_id", ids)
      : { data: [], error: null };
    if (jobsError)
      throw new Error("E-Mail-Status konnte nicht geladen werden.");
    return Response.json(
      { rows: data || [], count, jobs: jobs || [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
const patchSchema = z.object({
  id: z.uuid(),
  status: z.enum(reviewStatuses),
  payment_status: z.enum(reviewPayments),
  result: z.enum(reviewResults),
  internal_notes: z.string().max(4000),
});
export async function PATCH(request: Request) {
  try {
    const { db } = await apiSession(request, roles);
    const parsed = patchSchema.parse(await request.json());
    const { id, ...update } = parsed;
    const { data, error } = await db
      .from("crm_review_requests")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (error)
      throw new Error(
        "Änderung nicht möglich. Eine Zahlung kann erst nach verbindlicher Beauftragung erfasst werden.",
      );
    return Response.json({ row: data });
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const { user } = await apiSession(request, roles);
    const { id, mailboxChecked } = z
      .object({ id: z.uuid(), mailboxChecked: z.literal(true) })
      .parse(await request.json());
    void mailboxChecked;
    const db = serviceDb();
    const { data: job, error: jobError } = await db
      .from("crm_review_mail_jobs")
      .select("request_id,status")
      .eq("id", id)
      .single();
    if (jobError || !job || !["unknown", "failed"].includes(job.status))
      throw new Error(
        "Nur ein fehlgeschlagener oder unklarer Versand kann nach Postfachprüfung erneut geplant werden.",
      );
    const { data: row } = await db
      .from("crm_review_requests")
      .select("status")
      .eq("id", job.request_id)
      .single();
    if (row?.status !== "Offen")
      throw new Error("Der Vorgang ist geschlossen.");
    const { data, error } = await db
      .from("crm_review_mail_jobs")
      .update({
        status: "pending",
        due_at: new Date().toISOString(),
        claimed_at: null,
        claim_id: null,
        error: "",
      })
      .eq("id", id)
      .in("status", ["unknown", "failed"])
      .select("id")
      .maybeSingle();
    if (error || !data)
      throw new Error(
        "Versandstatus wurde zwischenzeitlich geändert. Bitte neu laden.",
      );
    await db
      .from("crm_audit_logs")
      .insert({
        actor_id: user.id,
        entity: "crm_review_mail_jobs",
        entity_id: id,
        action: "MANUAL_REQUEUE",
        after_data: { mailbox_checked: true },
      });
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
