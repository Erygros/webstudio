import { apiSession, apiError } from "@/crm/server/db";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const number = new URL(request.url).searchParams.get("number") || "";
    if (number.length > 50) throw new Error("Ungültige Nummer.");
    const { data, error } = await db.rpc("crm_lookup_phone", {
      number_in: number,
    });
    if (error) throw new Error("Zuordnung fehlgeschlagen.");
    return Response.json(
      { company: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
