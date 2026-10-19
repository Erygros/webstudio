import { timingSafeEqual } from "node:crypto";
import { runBookingJobs } from "@/crm/server/bookings";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const expected = `Bearer ${secret || ""}`,
    received = request.headers.get("authorization") || "";
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(expected) !== Buffer.byteLength(received) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  )
    return Response.json({ error: "Nicht autorisiert" }, { status: 401 });
  try {
    return Response.json(await runBookingJobs(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Buchungsabrechnung/Versand prüfen." },
      { status: 503 },
    );
  }
}
