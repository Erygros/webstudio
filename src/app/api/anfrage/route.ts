import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { site } from "@/config/site";
import { inquirySchema } from "@/lib/inquiry-schema";
import {
  allowed,
  consumeToken,
  formReady,
  mailReady,
  verifyToken,
} from "@/server/form-security";
import { readForm, validateAttachments } from "@/server/uploads";
import { categories, services } from "@/data/services";
import { captureWebsiteInquiry } from "@/crm/server/website";
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
  let attachmentsComplete = true;
  try {
    const result = await captureWebsiteInquiry(d, attachments);
    attachmentsComplete = result.attachmentsComplete;
  } catch {
    return fail(
      "Der Eingang deiner Anfrage konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du die Anfrage erneut sendest.",
      503,
    );
  }
  const received =
    "Vielen Dank. Deine Anfrage ist eingegangen. Wir melden uns über die angegebenen Kontaktdaten.";
  const attachmentNotice = attachmentsComplete
    ? ""
    : " Nicht alle Dateien konnten übernommen werden. Bitte sende die fehlenden Unterlagen direkt per E-Mail.";
  if (!mailReady())
    return NextResponse.json(
      {
        success: true,
        confirmation: false,
        message: received + attachmentNotice,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  const port = Number(process.env.SMTP_PORT || "587");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const selected =
    services.find((s) => s.slug === d.service)?.name ||
    categories.find((c) => c.slug === d.service)?.name ||
    "Kontakt";
  const fields = {
    Name: d.name,
    "E-Mail": d.email,
    Unternehmen: d.company,
    Telefon: d.phone,
    Leistung: selected,
    Projektart: d.projectType,
    Funktionen: d.features.join(", "),
    Budget: d.budget,
    Start: d.start,
    Zeitrahmen: d.timeline,
    Paket: d.package,
    "Demo-Referenz": d.reference,
    "Wunschtermin (Europe/Berlin, noch unbestätigt)": d.appointment,
    Beschreibung: d.description,
  };
  const text = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n\n");
  const subject =
    d.mode === "appointment"
      ? "Terminanfrage"
      : d.mode === "callback"
        ? "Rückrufanfrage"
        : d.mode === "contact"
          ? "Kontaktanfrage"
          : "Projektanfrage";
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.INQUIRY_TO,
      replyTo: d.email,
      subject: `${subject} · ${selected}`,
      text,
      attachments,
    });
    if (!info.accepted?.length) throw new Error("NOT_ACCEPTED");
  } catch {
    transport.close();
    return NextResponse.json(
      {
        success: true,
        confirmation: false,
        message: received + attachmentNotice,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  let confirmation = true;
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: d.email,
      subject: `Deine ${subject} bei ${site.name}`,
      text: `Hallo ${d.name},\n\nwir haben deine ${subject} erhalten. Wir melden uns über die angegebenen Kontaktdaten. Ein Termin oder Auftrag ist damit noch nicht bestätigt.\n\n${d.appointment ? `Wunschtermin: ${d.appointment.replace("T", " ")} (Europe/Berlin)\nDauer: etwa 30 Minuten. Bitte warte auf unsere persönliche Terminbestätigung.\n` : `Leistung: ${selected}\n`}\nBitte antworte auf diese Nachricht, wenn du etwas ergänzen möchtest.\n\n${site.name}`,
      replyTo: site.email || process.env.SMTP_FROM,
    });
    if (!info.accepted?.length) confirmation = false;
  } catch {
    confirmation = false;
  } finally {
    transport.close();
  }
  return NextResponse.json(
    {
      success: true,
      message:
        received +
        attachmentNotice +
        (confirmation ? " Eine Bestätigungs-E-Mail wurde versendet." : ""),
      confirmation,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
