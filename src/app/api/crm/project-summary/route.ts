import Decimal from "decimal.js";
import { apiSession, apiError } from "@/crm/server/db";
import { uuid } from "@/crm/server/validation";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const id = uuid.parse(new URL(request.url).searchParams.get("id"));
    const { data: project } = await db
      .from("crm_projects")
      .select("budget")
      .eq("id", id)
      .single();
    if (!project) throw new Error("Projekt fehlt.");
    const { data: entries, error } = await db
      .from("crm_time_entries")
      .select("minutes,hourly_rate")
      .eq("project_id", id);
    if (error) throw error;
    const minutes = (entries || []).reduce((sum, e) => sum + e.minutes, 0);
    const cost = (entries || []).reduce(
      (sum, e) => sum.plus(new Decimal(e.minutes).div(60).mul(e.hourly_rate)),
      new Decimal(0),
    );
    return Response.json(
      {
        minutes,
        cost: cost.toFixed(2),
        budget: String(project.budget || 0),
        remaining: new Decimal(project.budget || 0).minus(cost).toFixed(2),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
