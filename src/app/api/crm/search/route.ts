import { apiSession, apiError } from "@/crm/server/db";
import { resources } from "@/crm/resources";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const q =
      new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || "";
    if (q.length < 2) return Response.json({ results: [] });
    const keys = [
      "leads",
      "kontakte",
      "angebote",
      "rechnungen",
      "projekte",
      "aufgaben",
      "dokumente",
    ];
    const found = await Promise.all(
      keys.map(async (key) => {
        const r = resources[key];
        const fields =
          key === "leads" || key === "kontakte"
            ? [r.search, "phone", "email"]
            : [r.search];
        const matches = await Promise.all(
          fields.map(async (field) => {
            const { data, error } = await db
              .from(r.table)
              .select(`id,${r.search}`)
              .ilike(field, `%${q.replace(/[%_\\]/g, "\\$&")}%`)
              .limit(8);
            if (error) throw new Error(error.message);
            return (data || []) as unknown as Record<string, string>[];
          }),
        );
        const unique = new Map(matches.flat().map((row) => [row.id, row]));
        return [...unique.values()].slice(0, 8).map((row) => ({
          label: (row as unknown as Record<string, string>)[r.search],
          group: r.title,
          href: `/crm/${key}/${(row as unknown as Record<string, string>).id}`,
        }));
      }),
    );
    return Response.json(
      { results: found.flat() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
