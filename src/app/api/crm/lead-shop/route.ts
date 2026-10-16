import { z } from "zod";
import { apiError, apiSession, serviceDb } from "@/crm/server/db";
import { bankSchema } from "@/lib/lead-shop";
import {
  shopStatus,
  leadDownloadToken,
  tokenHash,
} from "@/crm/server/lead-shop";
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
    if (orders.error || settings.error)
      throw new Error("Lead-Shop-Migration noch nicht eingerichtet.");
    const ids = (orders.data || []).map((r) => r.id);
    const mail = ids.length
      ? await db
          .from("crm_lead_shop_mail")
          .select("id,order_id,kind,status,sent_at,error")
          .in("order_id", ids)
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
  z.object({ action: z.literal("retry-file"), id: z.uuid() }),
  z.object({ action: z.literal("revoke"), id: z.uuid() }),
  z.object({ action: z.literal("renew"), id: z.uuid() }),
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
  z.object({
    action: z.literal("import"),
    batchId: z.uuid(),
    source: z.string().trim().min(5).max(2000),
    verifiedAt: z.iso.date(),
    rightsConfirmed: z.literal(true),
    rows: z.array(z.unknown()).min(1).max(1000),
  }),
]);
export async function POST(request: Request) {
  try {
    const current = await apiSession(request, roles),
      body = actions.parse(await readReviewJson(request, 1500000)),
      db = serviceDb();
    if (
      ["settings", "import"].includes(body.action) &&
      current.profile.role !== "administrator"
    )
      throw new Error(
        "403:Nur Administration darf Bankdaten oder Verkaufsbestand ändern.",
      );
    if (body.action === "settings") {
      const result = await db
        .from("crm_lead_shop_settings")
        .update({ ...body.settings, updated_at: new Date().toISOString() })
        .eq("id", true);
      if (result.error) throw new Error("Bankdaten nicht gespeichert.");
    } else if (body.action === "import") {
      if (body.verifiedAt > new Date().toISOString().slice(0, 10))
        throw new Error("Prüfdatum darf nicht in der Zukunft liegen.");
      const schema = z.object({
        name: z.string().trim().min(2).max(200),
        phone: z.string().trim().min(7).max(60),
        email: z.email().max(254),
        website: z.url().max(500),
      });
      const rows = [];
      for (const raw of body.rows) {
        const parsed = schema.safeParse(raw);
        if (!parsed.success) continue;
        const value = parsed.data,
          url = new URL(value.website);
        if (
          !["https:", "http:"].includes(url.protocol) ||
          !url.hostname.includes(".") ||
          url.username ||
          url.password
        )
          continue;
        const company_key = url.hostname.toLowerCase().replace(/^www\./, "");
        let phone_key = value.phone.replace(/\(0\)/g, "").replace(/\D/g, "");
        if (phone_key.startsWith("00")) phone_key = phone_key.slice(2);
        else if (phone_key.startsWith("0"))
          phone_key = "49" + phone_key.slice(1);
        if (phone_key.length < 7 || phone_key.length > 18) continue;
        url.search = "";
        url.hash = "";
        rows.push({
          ...value,
          email: value.email.toLowerCase(),
          website: url.href,
          company_key,
          phone_key,
        });
      }
      const inserted = await db.rpc("crm_import_sale_leads", {
        batch_in: body.batchId,
        source_in: body.source,
        date_in: body.verifiedAt,
        actor_in: current.user.id,
        rows_in: rows,
      });
      if (inserted.error)
        throw new Error(
          "Import fehlgeschlagen. Datenquelle und Felder prüfen.",
        );
      return Response.json({
        inserted: inserted.data,
        invalid: body.rows.length - rows.length,
        duplicates: rows.length - inserted.data,
      });
    } else if (body.action === "pay") {
      const r = await db.rpc("crm_pay_lead_order", {
        id_in: body.id,
        actor_in: current.user.id,
        reference_in: body.reference,
        cents_in: body.amountCents,
      });
      if (r.error)
        throw new Error(
          "409:Zahlung nicht erfasst. Betrag, eindeutige Bankreferenz und Reservierungsstatus prüfen.",
        );
    } else if (body.action === "cancel") {
      const r = await db.rpc("crm_cancel_lead_order", {
        id_in: body.id,
        actor_in: current.user.id,
      });
      if (r.error)
        throw new Error("Nur unbezahlte Bestellungen können storniert werden.");
    } else if (body.action === "retry-file") {
      const r = await db
        .from("crm_lead_orders")
        .update({ fulfillment_state: "pending", error: "" })
        .eq("id", body.id)
        .eq("status", "Bezahlt")
        .eq("fulfillment_state", "failed")
        .select("id")
        .single();
      if (r.error)
        throw new Error("Bereitstellung kann gerade nicht wiederholt werden.");
    } else if (body.action === "revoke") {
      const r = await db
        .from("crm_lead_orders")
        .update({ revoked: true })
        .eq("id", body.id)
        .not("paid_at", "is", null)
        .select("id")
        .single();
      if (r.error) throw new Error("Download nicht gesperrt.");
    } else if (body.action === "renew") {
      const existing = await db
        .from("crm_lead_orders")
        .select("id,token_version")
        .eq("id", body.id)
        .single();
      if (existing.error) throw new Error("Bestellung fehlt.");
      const version = existing.data.token_version + 1;
      const r = await db.rpc("crm_renew_lead_download", {
        id_in: body.id,
        actor_in: current.user.id,
        version_in: version,
        hash_in: tokenHash(
          leadDownloadToken({ id: body.id, token_version: version }),
        ),
      });
      if (r.error)
        throw new Error(
          "Download nicht erneuert. Status neu laden und laufenden Mailversand abwarten.",
        );
    } else if (body.action === "retry-mail") {
      const r = await db
        .from("crm_lead_shop_mail")
        .update({ status: "pending", error: "" })
        .eq("id", body.id)
        .eq("status", "unknown")
        .select("id,order_id")
        .single();
      if (r.error)
        throw new Error("Versand kann nicht erneut eingeplant werden.");
      await db.from("crm_lead_shop_events").insert({
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
    const log = await db.from("crm_lead_shop_events").insert({
      order_id: "id" in body && body.action !== "retry-mail" ? body.id : null,
      actor_id: current.user.id,
      action: `admin.${body.action}`,
    });
    if (log.error)
      throw new Error(
        "Änderung verarbeitet, Protokollierung unklar. Vor Wiederholung Status neu laden.",
      );
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
