import { z } from "zod";

export const reviewPlatforms = [
  "Google",
  "kununu",
  "Trustpilot",
  "Facebook",
  "Yelp",
  "Tripadvisor",
  "Andere Plattform",
] as const;
export const reviewStatuses = ["Offen", "Abgeschlossen", "Storniert"] as const;
export const reviewPayments = [
  "Ausstehend",
  "Eingegangen",
  "Erstattung erforderlich",
  "Erstattet",
] as const;
export const reviewResults = [
  "Ungeprüft",
  "In Prüfung",
  "Erfolgreich entfernt",
  "Nicht entfernt",
] as const;
export const reviewPrice = 59;
export const reviewTermsVersion = "2026-10-15-v1";
export const reviewBank = {
  holder: "Enrico Gross",
  iban: "DE17 1001 0178 8022 2535 33",
};
export const reviewLawyers =
  "IT-ADVO Rechtsanwälte Simbach & Kessler, Berliner Allee 59, 40212 Düsseldorf";
const clean = (min: number, max: number, multiline = false) =>
  z
    .string()
    .trim()
    .min(min, `Bitte mindestens ${min} Zeichen eingeben.`)
    .max(max, `Bitte auf ${max} Zeichen begrenzen.`)
    .refine(
      (v) =>
        !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v) &&
        (multiline || !/[\r\n\t]/.test(v)),
      "Unzulässige Zeichen.",
    );
export function validReviewUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !/\s/.test(value) &&
      !url.username &&
      !url.password &&
      !url.port &&
      !/^(localhost|.*\.local|.*\.internal|\[.*\]|[\d.]+)$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}
export const reviewInquirySchema = z
  .object({
    platform: z.enum(reviewPlatforms),
    platformOther: clean(0, 100),
    reviewUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(
        validReviewUrl,
        "Bitte den öffentlichen HTTPS-Link zur Bewertung eingeben.",
      ),
    name: clean(2, 100),
    email: z.email("Bitte eine gültige E-Mail-Adresse eingeben.").max(254),
    phone: clean(0, 50),
    company: clean(0, 150),
    description: clean(0, 2000, true),
    privacy: z.literal("yes", {
      error: "Bitte den Datenschutzhinweis bestätigen.",
    }),
    website: z.string().max(200),
    token: z.string().min(1).max(300),
  })
  .superRefine((value, ctx) => {
    if (value.platform === "Andere Plattform" && !value.platformOther)
      ctx.addIssue({
        code: "custom",
        path: ["platformOther"],
        message: "Bitte den Namen der Plattform eingeben.",
      });
    if (value.phone && !/^[+()\d\s./-]{5,50}$/.test(value.phone))
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Bitte eine gültige Telefonnummer eingeben.",
      });
    if (!validReviewUrl(value.reviewUrl)) return;
    const host = new URL(value.reviewUrl).hostname.toLowerCase();
    const hosts: Record<string, RegExp> = {
      Google: /(^|\.)(google\.[a-z.]+|goo\.gl|g\.page|maps\.app\.goo\.gl)$/,
      kununu: /(^|\.)kununu\.com$/,
      Trustpilot: /(^|\.)trustpilot\.com$/,
      Facebook: /(^|\.)(facebook\.com|fb\.com)$/,
      Yelp: /(^|\.)yelp\.[a-z.]+$/,
      Tripadvisor: /(^|\.)tripadvisor\.[a-z.]+$/,
    };
    if (hosts[value.platform] && !hosts[value.platform].test(host))
      ctx.addIssue({
        code: "custom",
        path: ["reviewUrl"],
        message: "Link und ausgewählte Plattform passen nicht zusammen.",
      });
  });
export const reviewOrderSchema = z
  .object({
    id: z.uuid(),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    billingName: clean(2, 150),
    street: clean(3, 150),
    postcode: clean(2, 20),
    city: clean(2, 100),
    country: clean(2, 100),
    customerType: z.enum(["business", "consumer"]),
    terms: z.literal(true),
    earlyStart: z.boolean(),
    earlyKnowledge: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      value.customerType === "consumer" &&
      value.earlyStart !== value.earlyKnowledge
    )
      ctx.addIssue({
        code: "custom",
        path: ["earlyStart"],
        message:
          "Für einen vorzeitigen Beginn müssen beide Erklärungen bestätigt werden. Alternativ beide leer lassen.",
      });
  });
export type ReviewRequest = {
  id: string;
  reference: string;
  platform: string;
  review_url: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  description: string;
  status: (typeof reviewStatuses)[number];
  payment_status: (typeof reviewPayments)[number];
  result: (typeof reviewResults)[number];
  internal_notes: string;
  created_at: string;
  commissioned_at: string | null;
  starts_after: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  order_data: Record<string, unknown> | null;
  conditions_version: string | null;
};
export const reviewConditions = [
  "Vertragspartner für Organisation und Abwicklung ist Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de, +49 155 67504871. Die anwaltliche rechtliche Prüfung und gegebenenfalls Vertretung übernimmt die benannte Kanzlei IT-ADVO Rechtsanwälte Simbach & Kessler. Webstudio Expert erbringt selbst keine anwaltliche Rechtsberatung. Ein erforderliches anwaltliches Mandat beziehungsweise eine Vollmacht wird gesondert eingeholt.",
  "Das kostenlose Anfrageformular begründet noch keinen kostenpflichtigen Auftrag. Gegenstand einer anschließenden Beauftragung ist die Organisation der rechtlichen Prüfung und des zulässigen Entfernungsversuchs für genau die angegebene Bewertung. Auch andere Bewertungsplattformen können angefragt werden. Eine Löschung ist nur bei entsprechenden rechtlichen Voraussetzungen möglich; eine lediglich negative, zulässige Meinung darf bestehen bleiben. Ein Erfolg oder eine bestimmte Bearbeitungsdauer wird nicht garantiert. Gerichtliche Verfahren und weitere Bewertungen sind nicht umfasst und werden nicht ohne gesonderte Vereinbarung beauftragt.",
  "Der vollständige Endpreis einschließlich der für diesen außergerichtlichen Entfernungsversuch vorgesehenen anwaltlichen Tätigkeit beträgt 59,00 € je erfolgreich entfernter Bewertung. Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen. Nach verbindlicher Beauftragung ist eine Vorauszahlung von 59,00 € per Überweisung erforderlich. Die Vorauszahlung wird bei erfolgreicher Entfernung auf den Endpreis angerechnet. Kann die benannte Bewertung nicht entfernt werden oder ist ein Vorgehen rechtlich nicht möglich, entstehen für diesen Versuch keine Kosten und die Vorauszahlung wird vollständig zurückerstattet. Nach Feststellung des erfolglosen Abschlusses erfolgt die Rücküberweisung grundsätzlich innerhalb von 14 Tagen auf das Ursprungskonto. Keine weiteren Kosten ohne ausdrückliche gesonderte Vereinbarung.",
  "Die Beauftragung erfolgt über die Schaltfläche „Zahlungspflichtig beauftragen“. Webstudio Expert bestätigt den Vertrag anschließend per E-Mail einschließlich der vereinbarten Bedingungen. Bearbeitung erst nach Zahlungseingang und erforderlicher Mandats-/Vollmachtsklärung. Für Verbraucher beginnt die Bearbeitung grundsätzlich nach Ablauf der Widerrufsfrist, sofern nicht ausdrücklich ein früherer Beginn vereinbart wurde. Überweisungen werden persönlich geprüft; die Website erhält keine Bankzugangsdaten.",
  "Die kostenlose Anfrage und das Angebot stehen unter dem Vorbehalt, dass die anfragende Person selbst betroffen oder für das betroffene Unternehmen zur Beauftragung berechtigt ist. Bitte teile nur notwendige Unterlagen und keine Zugangsdaten zu Bewertungsplattformen mit. Für Rückfragen, Korrekturen, Widerruf und Stornierung genügt eine E-Mail mit dem Vorgangszeichen. Das Angebot zur Beauftragung gilt 30 Tage ab Eingang der Anfrage. Gesetzliche Rechte bleiben unberührt.",
];
export const reviewWithdrawal = [
  "Widerrufsbelehrung für Verbraucher: Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.",
  "Um dein Widerrufsrecht auszuüben, musst du uns, Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, E-Mail kontakt@webstudio-expert.de, Telefon +49 155 67504871, mittels einer eindeutigen Erklärung (zum Beispiel per E-Mail oder Brief) über deinen Entschluss informieren. Du kannst das nachfolgende Muster verwenden; dies ist nicht vorgeschrieben. Zur Wahrung der Frist reicht die rechtzeitige Absendung der Widerrufserklärung.",
  "Folgen des Widerrufs: Wir erstatten alle von dir erhaltenen Zahlungen unverzüglich und spätestens binnen vierzehn Tagen ab Eingang deines Widerrufs. Wir verwenden dasselbe Zahlungsmittel wie bei der ursprünglichen Transaktion, soweit nicht ausdrücklich etwas anderes vereinbart wurde; dafür berechnen wir keine Entgelte. Hast du ausdrücklich verlangt, dass die Dienstleistung während der Widerrufsfrist beginnt, ist grundsätzlich ein angemessener Betrag für den bis zum Widerruf erbrachten Anteil zu zahlen. Unsere Zusage, bei erfolgloser Entfernung keine Kosten zu berechnen und die Vorauszahlung vollständig zurückzuerstatten, bleibt bestehen.",
  "Ein vorzeitiger Beginn wird nur auf ausdrücklichen Wunsch durchgeführt. Bei einem entgeltlichen Dienstleistungsvertrag erlischt das Widerrufsrecht mit vollständiger Leistungserbringung nur, wenn du vor Beginn ausdrücklich dem vorzeitigen Beginn zugestimmt und deine Kenntnis vom Erlöschen mit vollständiger Vertragserfüllung bestätigt hast.",
  "Muster-Widerrufsformular: An Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de. Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ____. Bestellt am: ____. Vorgangszeichen: ____. Name: ____. Anschrift: ____. Datum: ____. Unterschrift (nur bei Mitteilung auf Papier): ____.",
];
