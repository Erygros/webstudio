import { apiSession, apiError } from "@/crm/server/db";
import { metrics } from "@/crm/server/metrics";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to")
      ? url.searchParams.get("to") + "T23:59:59Z"
      : undefined;
    const summary = await metrics(db, from, to);
    let calls = db.from("crm_calls").select("started_at,status,outcome");
    let companies = db
      .from("crm_companies")
      .select("status,created_at,is_customer");
    let payments = db.from("crm_payments").select("amount,paid_on");
    if (from) {
      calls = calls.gte("started_at", from);
      companies = companies.gte("created_at", from);
      payments = payments.gte("paid_on", from);
    }
    if (to) {
      calls = calls.lte("started_at", to);
      companies = companies.lte("created_at", to);
      payments = payments.lte("paid_on", to.slice(0, 10));
    }
    const [callRows, companyRows, paymentRows, quoteRows] = await Promise.all([
      calls,
      companies,
      payments,
      db.from("crm_quotes").select("status"),
    ]);
    const byDay: Record<string, number> = {};
    for (const c of callRows.data || []) {
      const day = c.started_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }
    const statuses: Record<string, number> = {};
    for (const c of companyRows.data || [])
      statuses[c.status] = (statuses[c.status] || 0) + 1;
    return Response.json(
      {
        ...summary,
        callsByDay: byDay,
        statuses,
        payments: paymentRows.data || [],
        conversion: {
          won: companyRows.data?.filter((c) => c.is_customer).length || 0,
          total: companyRows.data?.length || 0,
        },
        quoteAcceptance: {
          accepted:
            quoteRows.data?.filter((q) => q.status === "Angenommen").length ||
            0,
          total:
            quoteRows.data?.filter((q) => q.status !== "Entwurf").length || 0,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
