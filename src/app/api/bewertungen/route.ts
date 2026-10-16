import { verifyTurnstile } from "@/server/turnstile";
import { reviewInquirySchema } from "@/lib/reviews";
import { serviceDb } from "@/crm/server/db";
import { reviewAutomationStatus, reviewRequestKey } from "@/crm/server/reviews";
import { verifyToken, allowed } from "@/server/form-security";
import { readForm } from "@/server/uploads";
import { protectReviewRequest, reviewResponse } from "@/server/review-request";
import { notifyReviewInquiry } from "@/crm/server/website-mail";
import type { ReviewRequest } from "@/lib/reviews";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET() {
  try {
    const state = await reviewAutomationStatus();
    return reviewResponse({ available: state.ready });
  } catch {
    return reviewResponse({ available: false });
  }
}
export async function POST(request: Request) {
  try {
    await protectReviewRequest(request);
    if (
      !request.headers.get("content-type")?.startsWith("multipart/form-data;")
    )
      return reviewResponse({ message: "Ungültiges Formularformat." }, 415);
    // Much smaller than the project form: this endpoint deliberately accepts no files.
    if (Number(request.headers.get("content-length") || 0) > 20000)
      return reviewResponse({ message: "Die Anfrage ist zu groß." }, 413);
    const form = await readForm(request, 20000);
    const parsed = reviewInquirySchema.safeParse(Object.fromEntries(form));
    if (!parsed.success)
      return reviewResponse(
        { message: parsed.error.issues.map((i) => i.message).join(" ") },
        400,
      );
    const d = parsed.data;
    if (d.website || !verifyToken(d.token))
      return reviewResponse(
        { message: "Bitte das Formular neu laden und erneut absenden." },
        403,
      );
    if (!(await allowed(`reviews:email:${d.email.toLowerCase()}`, 3, 3600)))
      return reviewResponse(
        {
          message:
            "Zu viele Anfragen für diese E-Mail-Adresse. Bitte später erneut versuchen.",
        },
        429,
      );
    if (!(await reviewAutomationStatus()).ready)
      return reviewResponse(
        {
          message:
            "Die Anfrage kann gerade nicht zuverlässig bestätigt werden. Bitte kontaktiere uns direkt per E-Mail.",
        },
        503,
      );
    const challenge = await verifyTurnstile(
      form.get("turnstileToken"),
      "review_inquiry",
    );
    if (challenge) return challenge;
    const { token, website, privacy, ...payload } = d;
    void website;
    void privacy;
    const { data, error } = await serviceDb().rpc("crm_ingest_review", {
      key_in: reviewRequestKey(token),
      payload: {
        ...payload,
        platform:
          d.platform === "Andere Plattform" ? d.platformOther : d.platform,
      },
    });
    if (error || !data?.reference) {
      console.error("review_inquiry_store_failed", {
        code: error?.code || "NO_REFERENCE",
      });
      return reviewResponse(
        {
          message:
            "Der Eingang konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du erneut absendest.",
        },
        503,
      );
    }
    let confirmation = false;
    try {
      const { data: row } = await serviceDb()
        .from("crm_review_requests")
        .select("*")
        .eq("id", data.id)
        .single();
      if (row)
        confirmation = (await notifyReviewInquiry(row as ReviewRequest))
          .confirmation;
    } catch {
      console.error("review_intake_notice_failed");
    }
    return reviewResponse({
      success: true,
      confirmation,
      reference: data.reference,
      message: `Vielen Dank, ${d.name}. Wir haben deine kostenlose Anfrage unter ${data.reference} gespeichert und werden sie prüfen. Du erhältst voraussichtlich in 5–10 Minuten eine E-Mail mit den nächsten Schritten. Noch besteht kein kostenpflichtiger Auftrag.`,
    });
  } catch (e) {
    return reviewResponse(
      {
        message:
          e instanceof Error ? e.message : "Anfrage derzeit nicht möglich.",
      },
      400,
    );
  }
}
