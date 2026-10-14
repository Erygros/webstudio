import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import { resources } from "@/crm/resources";
import { csvCell } from "@/crm/server/import-export";
export async function GET(request: Request) {
  try {
    const current = await apiSession(request);
    const url = new URL(request.url);
    if (url.searchParams.get("all") === "true") {
      if (current.profile.role !== "administrator")
        throw new Error(
          "403:Nur Administratoren dürfen vollständig exportieren.",
        );
      const data: Record<string, unknown> = {};
      for (const table of new Set([
        ...Object.values(resources).map((r) => r.table),
        "crm_users",
        "crm_roles",
        "crm_company_settings",
        "crm_lead_status_history",
        "crm_email_accounts",
        "crm_call_recordings",
        "crm_number_counters",
        "crm_events",
        "crm_workflow_runs",
        "crm_work_sessions",
      ])) {
        const rows: unknown[] = [];
        let offset = 0;
        while (true) {
          const { data: page, error } = await serviceDb()
            .from(table)
            .select("*")
            .order(
              table === "crm_roles"
                ? "name"
                : table === "crm_number_counters"
                  ? "kind"
                  : "id",
            )
            .range(offset, offset + 999);
          if (error) throw new Error(error.message);
          rows.push(...page);
          if (page.length < 1000) break;
          offset += 1000;
        }
        data[table] = rows;
      }
      const audit = data.crm_audit_logs as { action: string }[] | undefined;
      if (audit?.some((entry) => entry.action === "osm.import"))
        data.$metadata = {
          osmAttribution: "© OpenStreetMap contributors",
          osmCopyright: "https://www.openstreetmap.org/copyright",
          osmLicense: "ODbL 1.0",
          osmLicenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
        };
      return Response.json(data, {
        headers: {
          "Content-Disposition": 'attachment; filename="crm-export.json"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    const key = url.searchParams.get("resource") || "leads";
    const resource = resources[key];
    if (!resource) throw new Error("Ungültiger Exportbereich.");
    let query = current.db
      .from(resource.table)
      .select("*")
      .order("created_at")
      .limit(10000);
    if (key === "kunden") query = query.eq("is_customer", true);
    const { data, error } = await query;
    if (error) throw error;
    const columns = [
      ...new Set([
        "id",
        ...resource.fields.map((f) => f.key),
        ...resource.columns,
      ]),
    ];
    let attribution = "";
    if (resource.table === "crm_companies") {
      const { data: osmImports, error: sourceError } = await serviceDb()
        .from("crm_audit_logs")
        .select("id")
        .eq("action", "osm.import")
        .limit(1);
      if (sourceError) throw sourceError;
      if (osmImports?.length)
        attribution =
          "# OpenStreetMap attribution: OSM-Anteile / © OpenStreetMap contributors / https://www.openstreetmap.org/copyright\r\n# ODbL: https://opendatacommons.org/licenses/odbl/1-0/\r\n";
    }
    const csv =
      "\ufeff" +
      attribution +
      columns.map(csvCell).join(";") +
      "\r\n" +
      data
        .map((row) => columns.map((c) => csvCell(row[c])).join(";"))
        .join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${key}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
