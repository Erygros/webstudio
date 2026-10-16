import { z } from "zod";

export const leadPrices = [
  14900, 26900, 38900, 49900, 59900, 69900, 78900, 87900, 93900, 99900,
] as const;
export const leadTermsVersion = "2026-10-16-v2-manual";
export const leadTerms = [
  "Angebot ausschließlich für Unternehmer (§ 14 BGB), die für ihr Unternehmen bestellen. Vertragspartner ist Enrico Gross / Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de.",
  "Vertragsgegenstand ist eine CSV-Datei mit der bestellten Anzahl vorhandener B2B-Firmenkontakte: Firmenname, Telefonnummer, E-Mail-Adresse und Website. Eine Branchen- oder Regionalauswahl ist nicht Bestandteil dieses Angebots. Es handelt sich um Kontaktdaten, nicht um konkrete Kaufanfragen oder garantierte Kunden.",
  "Die Liste wird exklusiv zusammengestellt. Bereits verkaufte Kontakte werden von Webstudio Expert nicht erneut verkauft. Dies garantiert weder eine weltweite Exklusivität öffentlich zugänglicher Daten noch, dass der Käufer diese Kontakte nicht bereits kennt. Eine Weiterveräußerung der Liste ist nicht gestattet.",
  "Die Bestellung wird mit dem Button „Kostenpflichtig bestellen“ verbindlich abgegeben und mit der gespeicherten Bestellbestätigung angenommen. Alle Beträge sind in Euro. Steuerbefreiung für Kleinunternehmer gemäß § 19 UStG; keine zusätzliche Umsatzsteuer. Zahlung per Banküberweisung unter Angabe der Bestellnummer.",
  "Nach bestätigtem vollständigem Zahlungseingang wird die bestellte CSV-Datei per E-Mail an die in der Bestellung angegebene Adresse versendet. Die Zusammenstellung und der Versand erfolgen durch Webstudio Expert. Eine Kundenmeldung über eine Zahlung genügt nicht zur Auslieferung.",
  "Die Angaben stammen aus der jeweils dokumentierten Datenquelle. Trotz Bestandsbereinigung können sich Kontaktdaten und Unternehmensstatus ändern. Es wird keine aktuelle telefonische Erreichbarkeit oder E-Mail-Zustellbarkeit garantiert. Bei unvollständigen oder fehlerhaften gelieferten Datensätzen bitte mit Bestellnummer melden; gesetzliche Mängelrechte bleiben unberührt.",
  "Der Kauf enthält keine Werbeeinwilligung der aufgeführten Unternehmen oder Personen. Der Käufer muss vor jeder Nutzung selbst die datenschutz- und wettbewerbsrechtlichen Voraussetzungen, insbesondere § 7 UWG sowie einschlägige Informations- und Widerspruchspflichten, beachten. Einwilligungspflichtige E-Mails dürfen nicht allein aufgrund des Listenkaufs versendet werden.",
] as const;

export const leadOrderSchema = z
  .object({
    requestId: z.uuid(),
    package: z.enum(["Standard", "Enterprise"]),
    quantity: z
      .number()
      .int()
      .min(500)
      .max(5000)
      .refine((n) => n % 500 === 0),
    quotedCents: z.number().int(),
    company: z.string().trim().min(2).max(180),
    contact: z.string().trim().min(2).max(150),
    street: z.string().trim().min(2).max(180),
    houseNumber: z.string().trim().min(1).max(20),
    postcode: z.string().trim().min(2).max(20),
    city: z.string().trim().min(2).max(120),
    country: z.string().trim().min(2).max(80),
    email: z.email().max(254),
    phone: z.string().trim().min(7).max(50),
    vatId: z.string().trim().max(40).default(""),
    businessOnly: z.literal(true),
    termsAccepted: z.literal(true),
    termsVersion: z.literal(leadTermsVersion),
    website: z.string().max(0),
  })
  .strict()
  .refine((d) => d.package !== "Standard" || d.quantity === 500);

export function leadPrice(quantity: number) {
  if (quantity < 500 || quantity > 5000 || quantity % 500)
    throw new Error("Ungültige Lead-Anzahl.");
  return leadPrices[quantity / 500 - 1];
}
export const shopMoney = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export const leadUnitPrice = (cents: number, quantity: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(cents / 100 / quantity);
export const bankSchema = z.object({
  enabled: z.boolean(),
  manual_delivery: z.boolean(),
  notification_email: z.email().max(254),
  recipient: z.string().trim().min(2).max(150),
  iban: z
    .string()
    .transform((v) => v.replace(/\s/g, "").toUpperCase())
    .refine(validIban, "Bitte eine gültige IBAN eintragen."),
});
function validIban(value: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(value)) return false;
  const rearranged = value.slice(4) + value.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged)
    for (const digit of /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch)
      remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
