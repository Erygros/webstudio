import { timingSafeEqual } from "node:crypto";
import { deliverReviewMail } from "@/crm/server/reviews";
import { flushWebsiteNotices } from "@/crm/server/website-mail";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const received = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret || ""}`;
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  try {
    const results = await Promise.allSettled([
      ...Array.from({ length: 5 }, () => deliverReviewMail()),
      flushWebsiteNotices(),
    ]);
    const failed = results.some((result) => result.status === "rejected");
    if (failed) console.error("review_mail_worker_partial_failure");
    return Response.json(
      {
        processed: results.reduce(
          (sum, result) =>
            sum + (result.status === "fulfilled" ? result.value.processed : 0),
          0,
        ),
        needsReview:
          failed ||
          results.some(
            (result) =>
              result.status === "fulfilled" &&
              "needsReview" in result.value &&
              result.value.needsReview,
          ),
      },
      { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("review_mail_worker_failed");
    return Response.json(
      { error: "Versandlauf nicht abgeschlossen. CRM prüfen." },
      { status: 503 },
    );
  }
}
