import { verifyTurnstile } from "@/server/turnstile";
import { z } from "zod";
import {
  reviewOrderSchema,
  reviewConditions,
  reviewWithdrawal,
  reviewTermsVersion,
} from "@/lib/reviews";
import { reviewByOffer } from "@/crm/server/reviews";
import { serviceDb } from "@/crm/server/db";
import {
  protectReviewRequest,
  reviewResponse,
  readReviewJson,
} from "@/server/review-request";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      id = z.uuid().parse(url.searchParams.get("id"));
    const row = await reviewByOffer(id, url.searchParams.get("token") || "");
    return reviewResponse({
      id: row.id,
      reference: row.reference,
      name: row.name,
      platform: row.platform,
      reviewUrl: row.review_url,
      commissionedAt: row.commissioned_at,
      status: row.status,
    });
  } catch {
    return reviewResponse(
      {
        message: "Der Link ist ungültig, abgelaufen oder nicht mehr verfügbar.",
      },
      404,
    );
  }
}
export async function POST(request: Request) {
  try {
    await protectReviewRequest(request);
    if (Number(request.headers.get("content-length") || 0) > 12000)
      return reviewResponse({ message: "Anfrage zu groß." }, 413);
    const raw = (await readReviewJson(request)) as Record<string, unknown>;
    const turnstileToken = raw.turnstileToken;
    delete raw.turnstileToken;
    const parsed = reviewOrderSchema.safeParse(raw);
    if (!parsed.success)
      return reviewResponse(
        { message: parsed.error.issues.map((i) => i.message).join(" ") },
        400,
      );
    const d = parsed.data;
    await reviewByOffer(d.id, d.token);
    const challenge = await verifyTurnstile(turnstileToken, "review_order");
    if (challenge) return challenge;
    const { id, token, ...order } = d;
    void token;
    const early =
      order.customerType === "consumer" &&
      order.earlyStart &&
      order.earlyKnowledge;
    const { data, error } = await serviceDb().rpc("crm_commission_review", {
      id_in: id,
      order_in: {
        ...order,
        earlyStart: early,
        earlyKnowledge: early,
        conditions: reviewConditions,
        withdrawal: reviewWithdrawal,
      },
      version_in: reviewTermsVersion,
      early_in: early,
    });
    if (error)
      return reviewResponse(
        {
          message:
            "Die Beauftragung konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du erneut beauftragst.",
        },
        503,
      );
    return reviewResponse({
      success: true,
      commissionedAt: data,
      message:
        "Deine Beauftragung wurde gespeichert. Du erhältst die Vertragsbestätigung und Zahlungsinformationen per E-Mail. Die Vorauszahlung beträgt 59,00 €; bei erfolgloser Entfernung wird sie vollständig zurückerstattet.",
    });
  } catch {
    return reviewResponse(
      {
        message:
          "Die Beauftragung ist momentan nicht möglich. Bitte kontaktiere uns direkt.",
      },
      400,
    );
  }
}
