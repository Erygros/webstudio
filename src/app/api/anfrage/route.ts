import { verifyTurnstile } from "@/server/turnstile";
import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { inquirySchema } from "@/lib/inquiry-schema";
import {
  allowed,
  consumeToken,
  formReady,
  verifyToken,
} from "@/server/form-security";
import { readForm, validateAttachments } from "@/server/uploads";
import { captureWebsiteInquiry } from "@/crm/server/website";
import { notifyWebsiteInquiry } from "@/crm/server/website-mail";
export const runtime = "nodejs";
export const maxDuration = 60;
const fail = (message: string, status = 400) =>
  NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: Request) {
  if (!formReady())
    return fail(
      "Das Formular ist momentan nicht erreichbar. Bitte kontaktiere uns per E-Mail oder Telefon.",
      503,
    );
  const origin = request.headers.get("origin");
  const localOrigin =
    process.env.NODE_ENV === "development" &&
    origin === new URL(request.url).origin;
  const publicUrl = new URL(site.url);
  publicUrl.hostname = publicUrl.hostname.startsWith("www.")
    ? publicUrl.hostname.slice(4)
    : `www.${publicUrl.hostname}`;
  if (
    !localOrigin &&
    origin !== site.runtimeUrl &&
    origin !== site.url &&
    origin !== publicUrl.origin
  )
    return fail(
      "Die Herkunft der Anfrage konnte nicht bestätigt werden. Bitte die Website neu öffnen.",
      403,
    );
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    return fail("Ungültiges Anfrageformat.", 415);
  try {
    // Globaler Schutz greift auch ohne verlässlich übergebene Client-IP.
    const ip = process.env.VERCEL
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "local";
    if (
      !(await allowed("global", 100, 3600)) ||
      !(await allowed(`ip:${ip}`, 5, 900))
    )
      return fail("Zu viele Anfragen. Bitte versuche es später erneut.", 429);
  } catch {
    return fail(
      "Der Missbrauchsschutz ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      503,
    );
  }
  let form: FormData;
  try {
    form = await readForm(request);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ungültige Formulardaten.");
  }
  const raw = Object.fromEntries(form.entries());
  const parsed = inquirySchema.safeParse({
    ...raw,
    features: form.getAll("features"),
  });
  if (!parsed.success)
    return fail(parsed.error.issues.map((i) => i.message).join("\n"));
  const d = parsed.data;
  if (d.website || !verifyToken(d.token))
    return fail(
      "Die Anfrage konnte nicht bestätigt werden. Bitte lade das Formular neu und versuche es erneut.",
      403,
    );
  const challenge = await verifyTurnstile(
    form.get("turnstileToken"),
    "inquiry",
  );
  if (challenge) return challenge;
  let attachments: Awaited<ReturnType<typeof validateAttachments>>;
  try {
    attachments = await validateAttachments(form.getAll("files"));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ungültige Anhänge.");
  }
  try {
    if (!(await allowed(`email:${d.email.toLowerCase()}`, 3, 3600)))
      return fail(
        "Für diese E-Mail-Adresse wurden zu viele Anfragen gestellt. Bitte später erneut versuchen.",
        429,
      );
    if (!(await consumeToken(d.token)))
      return fail(
        "Diese Anfrage wurde bereits verarbeitet. Bitte das Formular neu laden.",
        409,
      );
  } catch {
    return fail(
      "Die Anfrage kann gerade nicht sicher verarbeitet werden. Bitte später erneut versuchen.",
      503,
    );
  }
  let captured: Awaited<ReturnType<typeof captureWebsiteInquiry>>;
  try {
    captured = await captureWebsiteInquiry(d, attachments);
  } catch {
    return fail(
      "Der Eingang deiner Anfrage konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du die Anfrage erneut sendest.",
      503,
    );
  }
  const received =
    "Vielen Dank. Deine Anfrage ist eingegangen. Wir melden uns über die angegebenen Kontaktdaten.";
  const attachmentNotice = captured.attachmentsComplete
    ? ""
    : " Nicht alle Dateien konnten übernommen werden. Bitte sende die fehlenden Unterlagen direkt per E-Mail.";
  const { confirmation } = await notifyWebsiteInquiry({
    key: captured.key,
    inquiryId: captured.inquiryId,
    data: d,
    attachments: attachments.map((attachment) => attachment.filename),
    attachmentsComplete: captured.attachmentsComplete,
  });
  return NextResponse.json(
    {
      success: true,
      confirmation,
      message:
        received +
        attachmentNotice +
        (confirmation
          ? " Eine Eingangsbestätigung wurde per E-Mail versendet."
          : ""),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
