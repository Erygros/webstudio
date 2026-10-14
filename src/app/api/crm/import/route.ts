import ExcelJS from "exceljs";
import { apiSession, apiError } from "@/crm/server/db";
import { readForm } from "@/server/uploads";
import { parseCsv } from "@/crm/server/import-export";
import { resources } from "@/crm/resources";
import { validateRow } from "@/crm/server/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator", "vertrieb"]);
    if (request.headers.get("content-type")?.startsWith("multipart/")) {
      const form = await readForm(request);
      const file = form.get("file");
      if (!file || typeof file === "string" || file.size > 2_000_000)
        throw new Error("CSV/XLSX bis 2 MB erforderlich.");
      let rows: string[][];
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(
          Buffer.from(await file.arrayBuffer()) as never,
        );
        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount > 1001)
          throw new Error("Maximal 1.000 Datenzeilen pro Import.");
        rows = [];
        sheet.eachRow((row) =>
          rows.push(
            (row.values as unknown[])
              .slice(1)
              .map((v) =>
                typeof v === "object" && v !== null ? "" : String(v ?? ""),
              ),
          ),
        );
      } else if (file.name.toLowerCase().endsWith(".csv"))
        rows = parseCsv(await file.text());
      else throw new Error("Nur CSV und XLSX.");
      if (rows.length > 1001) throw new Error("Maximal 1.000 Datenzeilen.");
      return Response.json({ columns: rows[0] || [], rows: rows.slice(1) });
    }
    const { rows, mapping } = (await request.json()) as {
      rows: string[][];
      mapping: Record<string, string>;
    };
    if (!Array.isArray(rows) || rows.length > 1000)
      throw new Error("Ungültige Importdaten.");
    const errors: { row: number; error: string }[] = [];
    let created = 0,
      duplicates = 0;
    for (let i = 0; i < rows.length; i++) {
      try {
        const raw: Record<string, unknown> = {};
        for (const [key, index] of Object.entries(mapping)) {
          if (resources.leads.fields.some((f) => f.key === key) && index !== "")
            raw[key] = String(rows[i][Number(index)] || "").trim();
        }
        const values = validateRow(resources.leads, raw);
        for (const [key, value] of Object.entries(values))
          if (value === "" || value === null) delete values[key];
        let dup = db.from("crm_companies").select("id").eq("name", values.name);
        if (values.city) dup = dup.eq("city", values.city);
        const { data: match } = await dup.limit(1);
        if (match?.length) {
          duplicates++;
          continue;
        }
        if (values.email) {
          const { data } = await db
            .from("crm_companies")
            .select("id")
            .ilike("email", String(values.email))
            .limit(1);
          if (data?.length) {
            duplicates++;
            continue;
          }
        }
        const { error } = await db
          .from("crm_companies")
          .insert({ ...values, source: "Import" });
        if (error) throw new Error(error.message);
        created++;
      } catch (e) {
        errors.push({ row: i + 2, error: (e as Error).message.slice(0, 250) });
      }
    }
    return Response.json({ created, duplicates, errors });
  } catch (e) {
    return apiError(e);
  }
}
