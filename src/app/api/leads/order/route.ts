import { verifyTurnstile } from "@/server/turnstile";
import { createHash } from "node:crypto";
import {
  leadOrderSchema,
  leadPrice,
  leadTerms,
  leadTermsVersion,
} from "@/lib/lead-shop";
import { serviceDb } from "@/crm/server/db";
import { shopStatus, notifyLeadOrder } from "@/crm/server/lead-shop";
import {
  publicReviewOrigin,
  readReviewJson,
  reviewResponse,
} from "@/server/review-request";
import { allowed, verifyToken } from "@/server/form-security";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    if (!publicReviewOrigin(request))
      return reviewResponse({ message: "Herkunft ungültig." }, 403);
    const raw = (await readReviewJson(request, 16000)) as Record<
      string,
      unknown
    >;
    const token = String(raw.formToken || "");
    delete raw.formToken;
    const turnstileToken = raw.turnstileToken;
    delete raw.turnstileToken;
    if (!verifyToken(token))
      return reviewResponse(
        { message: "Bitte Formular neu öffnen und kurz warten." },
        400,
      );
    const body = leadOrderSchema.parse(raw);
    const ip = process.env.VERCEL
      ? request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
      : "local";
    if (
      !(await allowed(`lead-order:${ip}`, 6, 3600)) ||
      !(await allowed("lead-order:global", 40, 3600))
    )
      return reviewResponse(
        { message: "Zu viele Bestellversuche. Bitte später erneut versuchen." },
        429,
      );
    if (body.quotedCents !== leadPrice(body.quantity))
      return reviewResponse(
        { message: "Preis hat sich geändert. Bitte Auswahl erneut prüfen." },
        409,
      );
    const status = await shopStatus();
    if (!status.available)
      return reviewResponse(
        {
          message:
            "Dieses Angebot ist derzeit nicht bestellbar. Bitte kontaktieren Sie uns.",
        },
        503,
      );
    const challenge = await verifyTurnstile(turnstileToken, "lead_order");
    if (challenge) return challenge;
    const {
      requestId,
      package: pack,
      quantity,
      quotedCents,
      website,
      termsVersion,
      businessOnly,
      termsAccepted,
      ...customer
    } = body;
    void website;
    void businessOnly;
    void termsAccepted;
    void termsVersion;
    const hash = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");
    const { data, error } = await serviceDb().rpc("crm_create_lead_order", {
      request_in: requestId,
      hash_in: hash,
      package_in: pack,
      quantity_in: quantity,
      quoted_in: quotedCents,
      customer_in: customer,
      version_in: leadTermsVersion,
      terms_in: leadTerms.join("\n\n"),
    });
    if (error)
      return reviewResponse(
        {
          message:
            "Bestellung konnte nicht bestätigt werden. Bitte prüfen Sie bei uns, ob sie eingegangen ist, bevor Sie erneut bestellen.",
        },
        409,
      );
    if (["Storniert", "Abgelaufen"].includes(data.status))
      return reviewResponse(
        {
          message: `Die Bestellung ${data.reference} ist geschlossen. Bitte nicht überweisen; kontaktieren Sie uns vor einer neuen Bestellung.`,
        },
        409,
      );
    await notifyLeadOrder(data.id);
    return reviewResponse({
      reference: data.reference,
      totalCents: data.total_cents,
      quantity: data.quantity,
      bank: data.bank,
      status: data.status,
    });
  } catch {
    return reviewResponse(
      {
        message:
          "Bitte Pflichtangaben und Bestellbedingungen prüfen. Bei unklarem Bestellstatus kontaktieren Sie uns vor einer erneuten Bestellung.",
      },
      400,
    );
  }
}
