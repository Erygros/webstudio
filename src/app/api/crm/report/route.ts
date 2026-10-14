import { PDFDocument, StandardFonts } from "pdf-lib";
import { apiSession, apiError } from "@/crm/server/db";
import { metrics } from "@/crm/server/metrics";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request);
    const url = new URL(request.url);
    const data = await metrics(
      db,
      url.searchParams.get("from") || undefined,
      url.searchParams.get("to") || undefined,
    );
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText("Webstudio Expert - CRM-Bericht", {
      x: 50,
      y: 780,
      size: 22,
      font,
    });
    page.drawText(
      "Stand: " +
        new Date().toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" }),
      { x: 50, y: 750, size: 11, font },
    );
    data.counts.forEach((c, i) =>
      page.drawText(`${c.label}: ${c.value ?? "Kein Zugriff"}`, {
        x: 50,
        y: 710 - i * 27,
        size: 12,
        font,
      }),
    );
    return new Response(Buffer.from(await pdf.save()), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="CRM-Bericht.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
