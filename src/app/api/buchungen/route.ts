import { createHash } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { serviceDb } from "@/crm/server/db";
import { bookingReadiness, deliverBookingMail } from "@/crm/server/bookings";
import {
  bookingPackage,
  bookingTermsVersion,
  bookingTerms,
  withdrawalText,
  withdrawalModel,
  monthlyTerms,
  packagePrice,
} from "@/data/bookable-services";
import { verifyTurnstile } from "@/server/turnstile";
import { verifyToken, allowed } from "@/server/form-security";
import {
  publicReviewOrigin,
  readReviewJson,
  reviewResponse,
} from "@/server/review-request";
import { site } from "@/config/site";
export const runtime = "nodejs";
export const maxDuration = 60;
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((s) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s));
const schema = z
  .object({
    key: z.string().uuid(),
    kind: z.enum(["booking", "consultation"]),
    service: text(100),
    version: z.literal(bookingTermsVersion),
    quotedCents: z.number().int().positive(),
    quotedPaymentDays: z.number().int().min(1).max(90),
    first: text(80).min(1),
    last: text(80).min(1),
    company: text(160),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    phone: text(50).min(5),
    street: text(160),
    house: text(20),
    postcode: text(10),
    city: text(100),
    description: text(6000).min(10),
    requirements: text(2000),
    callback: text(200),
    consumer: z.boolean(),
    consent: z.literal(true),
    earlyStart: z.boolean(),
    earlyLoss: z.boolean(),
    token: z.string().max(300),
    turnstile: z.string().max(2048),
    website: z.literal(""),
  })
  .strict();
const publicRow = (b: Record<string, unknown>) => ({
  reference: b.reference,
  kind: b.kind,
  status: b.status,
  amount: b.amount_cents,
  bank: b.kind === "booking" ? b.bank : null,
  createdAt: b.created_at,
  interval: b.interval,
});
export async function GET() {
  try {
    const r = await bookingReadiness();
    return reviewResponse({
      ready: r.ready,
      consultation: r.consultation,
      smallBusiness: r.smallBusiness,
      paymentDays: r.bank?.paymentDays || 14,
    });
  } catch {
    return reviewResponse({
      ready: false,
      consultation: false,
      smallBusiness: true,
    });
  }
}
export async function POST(request: Request) {
  try {
    if (!publicReviewOrigin(request))
      return reviewResponse(
        { message: "Bitte das Formular auf unserer Website öffnen." },
        403,
      );
    const parsed = schema.safeParse(await readReviewJson(request, 48000));
    if (!parsed.success)
      return reviewResponse(
        {
          message:
            "Bitte alle Pflichtfelder, Bestätigungen und E-Mail-Adresse prüfen.",
        },
        400,
      );
    const input = parsed.data;
    if (!verifyToken(input.token))
      return reviewResponse(
        {
          message:
            "Bitte kurz warten oder die Seite neu öffnen und erneut absenden.",
        },
        400,
      );
    const ip = process.env.VERCEL
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown"
      : "local";
    if (
      !(await allowed(`booking:${ip}`, 12, 900)) ||
      !(await allowed("booking:global", 150, 3600))
    )
      return reviewResponse(
        { message: "Zu viele Anfragen. Bitte später erneut versuchen." },
        429,
      );
    const bot = await verifyTurnstile(input.turnstile, "service_booking");
    if (bot) return bot;
    const p = bookingPackage(input.service);
    if (!p || (input.kind === "booking" ? !p.booking : !p.consultation))
      return reviewResponse(
        { message: "Dieses Paket ist derzeit nicht verfügbar." },
        400,
      );
    if (input.quotedCents !== p.cents)
      return reviewResponse(
        {
          message:
            "Der Paketpreis hat sich geändert. Bitte lade die Seite neu und prüfe den aktuellen Preis vor einer Bestellung.",
        },
        409,
      );
    if (
      input.kind === "booking" &&
      (!input.street ||
        !input.house ||
        !/^\d{5}$/.test(input.postcode) ||
        !input.city)
    )
      return reviewResponse(
        {
          message:
            "Bitte die vollständige deutsche Rechnungsanschrift angeben.",
        },
        400,
      );
    // Hash only business input, never short-lived challenge tokens. Repeated clicks share one key.
    const {
      token: _token,
      turnstile: _challenge,
      website: _trap,
      ...businessInput
    } = input;
    const hash = createHash("sha256")
      .update(JSON.stringify(businessInput))
      .digest("hex");
    const db = serviceDb();
    const prior = await db
      .from("crm_service_bookings")
      .select("*")
      .eq("request_key", input.key)
      .maybeSingle();
    if (prior.error)
      return reviewResponse(
        {
          message:
            "Die Anfrage ist momentan nicht verfügbar. Bitte kontaktiere uns direkt.",
        },
        503,
      );
    if (prior.data) {
      if (prior.data.request_hash !== hash)
        return reviewResponse(
          {
            message:
              "Für diesen Vorgang wurden bereits andere Angaben gespeichert. Bitte die Seite neu öffnen.",
          },
          409,
        );
      return reviewResponse(publicRow(prior.data));
    }
    const ready = await bookingReadiness();
    if (
      input.kind === "booking" &&
      ready.bank &&
      input.quotedPaymentDays !== ready.bank.paymentDays
    )
      return reviewResponse(
        {
          message:
            "Die Zahlungsbedingungen wurden aktualisiert. Bitte lade die Buchungsseite neu und prüfe sie erneut.",
        },
        409,
      );
    if (input.kind === "booking" ? !ready.ready : !ready.consultation)
      return reviewResponse(
        {
          message:
            "Bitte frage dieses Paket derzeit direkt per E-Mail oder Telefon an.",
        },
        503,
      );
    const customer = {
      name: input.company || `${input.first} ${input.last}`,
      contact_name: `${input.first} ${input.last}`,
      email: input.email,
      phone: input.phone,
      street: input.street,
      house_number: input.house,
      postcode: input.postcode,
      city: input.city,
      country: "Deutschland",
    };
    const terms = {
      version: bookingTermsVersion,
      consumer: input.consumer,
      early_start: input.earlyStart,
      early_loss: input.earlyLoss,
      text: bookingTerms,
      monthly: p.interval === "monthly" ? monthlyTerms : "",
      withdrawal: withdrawalText,
      withdrawal_model: withdrawalModel,
      tax: ready.smallBusiness
        ? "Kein Umsatzsteuerausweis gemäß § 19 UStG. Endpreis."
        : "Endpreis einschließlich gesetzlicher Umsatzsteuer.",
    };
    const body =
      input.kind === "consultation"
        ? `Hallo ${input.first},\n\ndeine kostenlose Beratungsanfrage für ${p.name} ist angekommen und im CRM gespeichert. Es besteht keine Zahlungspflicht. Wir melden uns über deine angegebenen Kontaktdaten.\n\nProjekt: ${input.description}\nRückrufwunsch: ${input.callback || "Nicht angegeben"}\nVorgang: {{reference}}`
        : `Hallo ${input.first},\n\nvielen Dank für deine verbindliche Buchung. Dein Kaufvertrag ist bestätigt.\nBuchung: {{reference}}\nPaket: ${p.name}\nPreis: ${packagePrice(p)}\n${terms.tax}\n\nEnthalten:\n${p.scope.join("\n")}\n\nNicht enthalten / nur auf gesonderte Anfrage:\n${p.extras.join("\n")}\n\nProjekt: ${input.description}\nZusatzwünsche (nicht mitbestellt): ${input.requirements || "Keine"}\n\nBitte überweise ${packagePrice(p)}${p.interval === "monthly" ? " für den ersten Leistungsmonat" : ""} innerhalb von ${ready.bank!.paymentDays} Tagen.\nEmpfänger: ${ready.bank!.recipient}\nIBAN: ${ready.bank!.iban}\n${ready.bank!.bic ? `BIC: ${ready.bank!.bic}\n` : ""}Verwendungszweck: {{reference}}\nStatus: Wartet auf Zahlung. Die Rechnung ist beigefügt.\n\n${p.interval === "monthly" ? monthlyTerms : "Leistungsbeginn nach bestätigtem Zahlungseingang und Abstimmung."}\n\nRechnungsanschrift:\n${customer.name}\n${customer.contact_name}\n${input.street} ${input.house}\n${input.postcode} ${input.city}\nDeutschland\n\n${bookingTerms}\n\n${input.consumer ? `${withdrawalText}\n\n${withdrawalModel}\n\nVorzeitiger Beginn ausdrücklich verlangt: ${input.earlyStart ? "Ja" : "Nein"}. Kenntnis vom Verlust des Widerrufsrechts erst bei vollständiger Erfüllung bestätigt: ${input.earlyLoss ? "Ja" : "Nein"}. Ohne beide Erklärungen beginnen wir bei Verbrauchern erst nach Ablauf der Widerrufsfrist.` : "Bestellung als Unternehmer."}`;
    const { data, error } = await db.rpc("crm_booking_create", {
      key_in: input.key,
      hash_in: hash,
      payload: {
        kind: input.kind,
        package: p,
        customer,
        bank: input.kind === "booking" ? ready.bank : {},
        terms,
        description: input.description,
        requirements: input.requirements,
        callback: input.callback,
        customer_body: body,
        crm_url: `${site.url}/crm/buchungen`,
      },
    });
    if (error || !data) {
      console.error("booking_intake_failed", { code: error?.code });
      return reviewResponse(
        {
          message:
            "Der Eingang konnte nicht bestätigt werden. Bitte versuche es mit unveränderten Angaben erneut oder kontaktiere uns direkt.",
        },
        503,
      );
    }
    after(async () => {
      await Promise.allSettled([deliverBookingMail(), deliverBookingMail()]);
    });
    return reviewResponse(publicRow(data));
  } catch {
    return reviewResponse(
      {
        message:
          "Die Anfrage konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du eine neue Buchung anlegst.",
      },
      503,
    );
  }
}
