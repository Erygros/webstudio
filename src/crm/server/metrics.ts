import type { SupabaseClient } from "@supabase/supabase-js";
import { berlinInstant } from "@/crm/time";
export async function metrics(db: SupabaseClient, from?: string, to?: string) {
  const now = new Date();
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
  }).format(now);
  const tomorrow = new Date(day + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const endOfDay = new Date(
    Date.parse(berlinInstant(tomorrow.toISOString().slice(0, 10) + "T00:00")) -
      1,
  ).toISOString();
  const queries = [
    ["Leads insgesamt", "crm_companies", null, null],
    ["Neue Leads", "crm_companies", "status", "Neu"],
    ["Kontaktierte Leads", "crm_companies", "status", "Kontaktiert"],
    ["Nicht erreicht", "crm_companies", "status", "Nicht erreicht"],
    ["Gewonnene Kunden", "crm_companies", "is_customer", true],
    ["Anrufe insgesamt", "crm_calls", null, null],
  ] as const;
  const counts = await Promise.all(
    queries.map(async ([label, table, key, value]) => {
      let q = db.from(table).select("id", { head: true, count: "exact" });
      if (key) q = q.eq(key, value);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", to);
      const { count, error } = await q;
      return { label, value: error ? null : count || 0 };
    }),
  );
  const due = await Promise.all([
    db
      .from("crm_tasks")
      .select("*")
      .neq("status", "Erledigt")
      .lte("due_at", endOfDay)
      .order("due_at")
      .limit(20),
    db
      .from("crm_follow_ups")
      .select("*", { count: "exact" })
      .neq("status", "Abgeschlossen")
      .lte("due_at", now.toISOString())
      .limit(20),
    db
      .from("crm_calendar_events")
      .select("*")
      .gte("starts_at", now.toISOString())
      .neq("status", "Abgesagt")
      .order("starts_at")
      .limit(10),
    db
      .from("crm_quotes")
      .select("*", { count: "exact" })
      .eq("status", "Versendet")
      .limit(20),
    db
      .from("crm_invoices")
      .select("*")
      .eq("document_status", "Ausgestellt")
      .gt("total", 0)
      .neq("payment_status", "Bezahlt"),
    db
      .from("crm_companies")
      .select("id", { head: true, count: "exact" })
      .lte("next_contact", endOfDay),
    db
      .from("crm_audit_logs")
      .select("id,entity,action,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    db
      .from("crm_website_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  return {
    counts: [
      ...counts,
      { label: "Heute kontaktieren", value: due[5].count || 0 },
      { label: "Fällige Follow-ups", value: due[1].count || 0 },
      { label: "Offene Angebote", value: due[3].count || 0 },
      {
        label: "Offene Rechnungen",
        value: due[4].error ? null : due[4].data?.length || 0,
      },
      {
        label: "Überfällige Rechnungen",
        value: due[4].error
          ? null
          : due[4].data?.filter((i) => i.due_on < day).length || 0,
      },
    ],
    tasks: due[0].data || [],
    followups: due[1].data || [],
    events: due[2].data || [],
    quotes: due[3].data || [],
    invoices: due[4].data || [],
    activity: due[6].data || [],
    inquiries: due[7].data || [],
  };
}
