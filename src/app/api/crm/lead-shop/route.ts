import { z } from "zod";
import { apiError, apiSession, serviceDb } from "@/crm/server/db";
import { bankSchema } from "@/lib/lead-shop";
import { shopStatus, notifyLeadOrder } from "@/crm/server/lead-shop";
import { readReviewJson } from "@/server/review-request";
const roles = ["administrator", "buchhaltung"];
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const current = await apiSession(request, roles),
      db = serviceDb(),
      url = new URL(request.url);
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(1000000)
      .parse(url.searchParams.get("offset") || 0);
    let query = db
      .from("crm_lead_orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + 24);
    const filter = url.searchParams.get("status");
    if (filter) query = query.eq("status", filter);
    const id = url.searchParams.get("id");
    if (id) query = query.eq("id", z.uuid().parse(id));
    const [orders, settings, status, clock] = await Promise.all([
      query,
      db.from("crm_lead_shop_settings").select("*").eq("id", true).single(),
      shopStatus(),
      db.from("crm_lead_shop_automation").select("*").eq("id", true).single(),
    ]);
    if (
      orders.error ||
      settings.error ||
      typeof settings.data.manual_delivery !== "boolean"
    )
      throw new Error(
        "Einrichtung für manuellen Lead-Verkauf fehlt. Neue SQL-Migration ausführen.",
      );
    const ids = (orders.data || []).map((r) => r.id);
    const mail = ids.length
      ? await db
          .from("crm_lead_shop_mail")
          .select("id,order_id,kind,status,sent_at,error")
          .in("order_id", ids)
          .neq("kind", "download")
      : { data: [], error: null };
    const events = id
      ? await db
          .from("crm_lead_shop_events")
          .select("action,detail,created_at")
          .eq("order_id", id)
          .order("created_at", { ascending: false })
          .limit(100)
      : { data: [], error: null };
    if (mail.error || events.error)
      throw new Error("Verlauf konnte nicht geladen werden.");
    return Response.json(
      {
        rows: orders.data,
        count: orders.count,
        settings: settings.data,
        status,
        clock: clock.data,
        mail: mail.data,
        events: events.data,
        administrator: current.profile.role === "administrator",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settings"), settings: bankSchema }),
  z.object({
    action: z.literal("pay"),
    id: z.uuid(),
    amountCents: z.number().int().positive(),
    reference: z.string().trim().min(4).max(180),
    bankChecked: z.literal(true),
  }),
  z.object({ action: z.literal("cancel"), id: z.uuid() }),
  z.object({
    action: z.literal("sent"),
    id: z.uuid(),
    sentConfirmed: z.literal(true),
    note: z.string().trim().max(1000),
  }),
  z.object({
    action: z.literal("retry-mail"),
    id: z.uuid(),
    mailboxChecked: z.literal(true),
  }),
  z.object({
    action: z.literal("notes"),
    id: z.uuid(),
    notes: z.string().max(5000),
  }),
]);
export async function POST(request: Request) {
  try {
    const current = await apiSession(request, roles),
      body = actions.parse(await readReviewJson(request, 16000)),
      db = serviceDb();
    if (body.action === "settings") {
      if (current.profile.role !== "administrator")
        throw new Error(
          "403:Nur Administration darf Verkaufseinstellungen ändern.",
        );
      const result = await db
        .from("crm_lead_shop_settings")
        .update({ ...body.settings, updated_at: new Date().toISOString() })
        .eq("id", true);
      if (result.error)
        throw new Error("Einstellungen nicht gespeichert. Migration prüfen.");
    } else if (body.action === "pay") {
      const r = await db.rpc("crm_pay_lead_order", {
        id_in: body.id,
        actor_in: current.user.id,
        reference_in: body.reference,
        cents_in: body.amountCents,
      });
      if (r.error)
        throw new Error(
          "409:Zahlung nicht erfasst. Betrag, eindeutige Bankreferenz und Bestellstatus prüfen.",
        );
    } else if (body.action === "cancel") {
      const r = await db.rpc("crm_cancel_lead_order", {
        id_in: body.id,
        actor_in: current.user.id,
      });
      if (r.error)
        throw new Error("Nur unbezahlte Bestellungen können storniert werden.");
    } else if (body.action === "sent") {
      const r = await db.rpc("crm_mark_lead_sent", {
        id_in: body.id,
        actor_in: current.user.id,
        note_in: body.note,
      });
      if (r.error)
        throw new Error(
          "Nur bezahlte Bestellungen können als extern versendet markiert werden.",
        );
    } else if (body.action === "retry-mail") {
      const r = await db
        .from("crm_lead_shop_mail")
        .update({ status: "pending", error: "" })
        .eq("id", body.id)
        .eq("status", "unknown")
        .neq("kind", "download")
        .select("id,order_id")
        .single();
      if (r.error)
        throw new Error("Versand kann nicht erneut eingeplant werden.");
      await db
        .from("crm_lead_shop_events")
        .insert({
          order_id: r.data.order_id,
          actor_id: current.user.id,
          action: "mail.manual_retry",
          detail: { mailbox_checked: true },
        });
    } else if (body.action === "notes") {
      const r = await db
        .from("crm_lead_orders")
        .update({ internal_notes: body.notes })
        .eq("id", body.id);
      if (r.error) throw new Error("Notiz nicht gespeichert.");
    }
    const log = await db
      .from("crm_lead_shop_events")
      .insert({
        order_id: "id" in body && body.action !== "retry-mail" ? body.id : null,
        actor_id: current.user.id,
        action: `admin.${body.action}`,
      });
    if (log.error)
      throw new Error(
        "Änderung verarbeitet, Protokollierung unklar. Status vor Wiederholung neu laden.",
      );
    if (["pay", "cancel", "sent"].includes(body.action) && "id" in body)
      await notifyLeadOrder(body.id);
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
