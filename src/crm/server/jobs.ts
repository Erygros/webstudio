import { serviceDb } from "./db";

export { syncMailbox } from "./imap";
export async function runWorkflows() {
  const svc = serviceDb();
  const { data: claimed } = await svc.rpc("crm_lease", {
    job_key: "workflows",
    seconds: 120,
  });
  if (!claimed) return { message: "Verarbeitung läuft bereits." };
  let runs = 0;
  let completed = false;
  try {
    const { data: workflows, error: workflowsError } = await svc
      .from("crm_workflows")
      .select("*")
      .eq("enabled", true);
    if (workflowsError) throw new Error(workflowsError.message);
    const { error: scheduleError } = await svc.rpc("crm_schedule_workflows");
    if (scheduleError) throw new Error(scheduleError.message);
    for (const workflow of workflows || []) {
      const { data: ids, error: pendingError } = await svc.rpc(
        "crm_pending_events",
        { workflow_in: workflow.id },
      );
      if (pendingError) throw new Error(pendingError.message);
      for (const eventId of ids || []) {
        const { data: executed, error } = await svc.rpc("crm_run_event", {
          workflow_in: workflow.id,
          event_in: eventId,
        });
        if (error) throw new Error(error.message);
        if (executed) runs++;
      }
    }
    const { data: schedules, error: recurringError } = await svc
      .from("crm_recurring_invoices")
      .select("id")
      .eq("enabled", true)
      .lte(
        "next_on",
        new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
          new Date(),
        ),
      );
    if (recurringError) throw new Error(recurringError.message);
    for (const schedule of schedules || []) {
      const { error } = await svc.rpc("crm_recurring_draft", {
        schedule_in: schedule.id,
      });
      if (error) throw new Error(error.message);
    }
    const now = new Date().toISOString();
    await svc
      .from("crm_webhook_events")
      .delete()
      .eq("provider", "form")
      .lt(
        "created_at",
        new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      );
    await svc.from("crm_rate_limits").delete().lt("expires", now);
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Berlin",
    }).format(new Date());
    for (const [table, due, status, href] of [
      ["crm_tasks", "due_at", "Erledigt", "aufgaben"],
      ["crm_follow_ups", "due_at", "Abgeschlossen", "followups"],
      ["crm_invoices", "due_on", "Bezahlt", "rechnungen"],
    ] as const) {
      let query = svc
        .from(table)
        .select("*")
        .lt(due, table === "crm_invoices" ? today : now);
      query =
        table === "crm_invoices"
          ? query
              .neq("payment_status", status)
              .eq("document_status", "Ausgestellt")
              .gt("total", 0)
          : query.neq("status", status);
      const { data, error } = await query.limit(100);
      if (error) throw new Error(error.message);
      for (const row of data || [])
        await svc.from("crm_notifications").upsert(
          {
            title:
              table === "crm_invoices"
                ? "Überfällige Rechnung: " + row.number
                : "Fällig: " + row.title,
            href: `/crm/${href}/${row.id}`,
            event_key: `due:${table}:${row.id}:${row[due]}`,
          },
          { onConflict: "event_key", ignoreDuplicates: true },
        );
    }
    await svc
      .from("crm_follow_ups")
      .update({ status: "Fällig" })
      .eq("status", "Geplant")
      .lte("due_at", now);
    await svc
      .from("crm_quotes")
      .update({ status: "Abgelaufen" })
      .eq("status", "Versendet")
      .lt("valid_until", today);
    completed = true;
    return { runs };
  } finally {
    await svc
      .from("crm_job_runs")
      .update({
        lease_until: new Date().toISOString(),
        ...(completed ? { last_success: new Date().toISOString() } : {}),
      })
      .eq("key", "workflows");
  }
}
