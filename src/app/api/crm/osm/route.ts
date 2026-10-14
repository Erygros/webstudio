import { z } from "zod";
import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import {
  readBoundedJson,
  searchOsm,
  searchSchema,
  verifyPreview,
} from "@/crm/server/osm";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { user } = await apiSession(request, ["administrator", "vertrieb"]);
    const raw = await readBoundedJson(request);
    if (raw.action === "search") {
      const body = z
        .object({ action: z.literal("search"), criteria: searchSchema })
        .strict()
        .parse(raw);
      return Response.json(await searchOsm(body.criteria, user.id), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const body = z
      .object({
        action: z.literal("import"),
        token: z.string().max(400000),
        selected: z.array(z.number().int().min(0).max(199)).min(1).max(200),
        reviewed: z
          .array(z.number().int().min(0).max(199))
          .max(200)
          .default([]),
      })
      .strict()
      .parse(raw);
    const preview = verifyPreview(body.token, user.id);
    if (
      body.selected.some((i) => i >= preview.rows.length) ||
      body.reviewed.some((i) => !body.selected.includes(i))
    )
      throw new Error("Ungültige Auswahl.");
    const { data, error } = await serviceDb().rpc("crm_osm_import", {
      rows_in: preview.rows,
      postcode_in: preview.postalCode,
      selected_in: [...new Set(body.selected)],
      reviewed_in: [...new Set(body.reviewed)],
      actor_in: user.id,
      batch_in: preview.batch,
    });
    if (error)
      throw new Error(
        "503:Import konnte nicht abgeschlossen werden. Migration 015 und Datenbank-Verbindung prüfen.",
      );
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
