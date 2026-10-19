import { after } from "next/server";
import { z } from "zod";
import { apiSession, apiError } from "@/crm/server/db";
import { deliverBookingMail, bookingReadiness } from "@/crm/server/bookings";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const { db, profile } = await apiSession(request, [
      "administrator",
      "buchhaltung",
      "vertrieb",
    ]);
    const q = new URL(request.url).searchParams;
    const id = q.get("id");
    const page = Math.max(0, Math.min(10000, Number(q.get("page")) || 0));
    if (id) {
      z.string().uuid().parse(id);
      const [b, cycles, events, mail, declarations] = await Promise.all([
        db.from("crm_service_bookings").select("*").eq("id", id).single(),
        db
          .from("crm_booking_cycles")
          .select(
            "*, crm_invoices(id,number,total,payment_status,document_status,due_on)",
          )
          .eq("booking_id", id)
          .order("cycle", { ascending: false })
          .limit(100),
        db
          .from("crm_booking_events")
          .select("*")
          .eq("booking_id", id)
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("crm_booking_mail")
          .select("id,subject,recipient,status,error,sent_at")
          .eq("booking_id", id)
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("crm_booking_declarations")
          .select("*")
          .eq("booking_id", id)
          .order("received_at", { ascending: false })
          .limit(100),
      ]);
      if (
        b.error ||
        cycles.error ||
        events.error ||
        mail.error ||
        declarations.error
      )
        throw new Error(
          "Buchungsdaten konnten nicht vollständig geladen werden. SQL-Einrichtung prüfen.",
        );
      return Response.json(
        {
          booking: b.data,
          cycles: cycles.data,
          events: events.data,
          mail: mail.data,
          declarations: declarations.data,
          role: profile.role,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    let query = db
      .from("crm_service_bookings")
      .select(
        "id,reference,kind,customer,package,status,amount_cents,interval,created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });
    if (q.get("status")) query = query.eq("status", q.get("status"));
    const [rows, declarations, ready, clock, mailAlerts] = await Promise.all([
      query.range(page * 25, page * 25 + 24),
      db
        .from("crm_booking_declarations")
        .select("*")
        .is("reviewed_at", null)
        .order("received_at")
        .limit(100),
      bookingReadiness(),
      db
        .from("crm_booking_automation")
        .select("*")
        .eq("id", true)
        .maybeSingle(),
      db
        .from("crm_booking_mail")
        .select("id,subject,recipient,status,error,sent_at")
        .eq("status", "unknown")
        .order("created_at")
        .limit(30),
    ]);
    if (rows.error || declarations.error)
      throw new Error(
        "Buchungen noch nicht eingerichtet. Migration 202610190001_service_bookings.sql in Supabase ausführen.",
      );
    return Response.json(
      {
        rows: rows.data,
        count: rows.count,
        declarations: declarations.data,
        ready: ready.ready,
        clock: clock.data,
        mailAlerts: mailAlerts.data || [],
        consultation: ready.consultation,
        role: profile.role,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, [
      "administrator",
      "buchhaltung",
      "vertrieb",
    ]);
    const input = z
      .object({
        id: z.string().uuid().optional(),
        action: z.enum([
          "payment",
          "reminder",
          "start",
          "end",
          "status",
          "declaration_review",
          "declaration_link",
          "mail_retry",
        ]),
        data: z
          .record(z.string(), z.union([z.string().max(1000), z.boolean()]))
          .default({}),
      })
      .strict()
      .parse(await request.json());
    if (input.action === "mail_retry") {
      const { error } = await db.rpc("crm_booking_retry_mail", {
        mail_in: z.string().uuid().parse(input.data.mail_id),
        checked_in: input.data.checked === true,
      });
      if (error) throw new Error(error.message);
      after(async () => {
        await deliverBookingMail();
      });
      return Response.json({ success: true });
    }
    if (!input.id) throw new Error("Buchungs-ID fehlt.");
    const { data, error } = await db.rpc("crm_booking_manage", {
      bid: input.id,
      action_in: input.action,
      data_in: input.data,
    });
    if (error) throw new Error(error.message);
    after(async () => {
      await Promise.allSettled([deliverBookingMail(), deliverBookingMail()]);
    });
    return Response.json(
      { booking: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
