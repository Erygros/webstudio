import { timingSafeEqual } from "node:crypto";
import { runLeadShopWorker } from "@/crm/server/lead-shop";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET,
    received = request.headers.get("authorization") || "",
    expected = `Bearer ${secret || ""}`;
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  try {
    await runLeadShopWorker();
    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("lead_shop_worker_failed");
    return Response.json(
      { error: "Verarbeitung nicht abgeschlossen. CRM prüfen." },
      { status: 503 },
    );
  }
}
