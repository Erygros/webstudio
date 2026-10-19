// Single source for package scope, prices, availability and SEO. Amounts are EUR cents.
export type BookingPackage = {
  slug: string;
  name: string;
  category: string;
  description: string;
  scope: string[];
  cents: number;
  interval: "once" | "monthly";
  extras: string[];
  booking: boolean;
  consultation: boolean;
  seoTitle: string;
};
const define = (
  slug: string,
  name: string,
  category: string,
  cents: number,
  description: string,
  scope: string[],
  extras: string[],
  interval: "once" | "monthly" = "once",
): BookingPackage => ({
  slug,
  name,
  category,
  cents,
  description,
  scope,
  extras,
  interval,
  booking: true,
  consultation: true,
  seoTitle: `${name} – ${interval === "monthly" ? "monatliches" : "festes"} Einstiegspaket`,
});
export const bookingPackages: BookingPackage[] = [
  define(
    "social-media-management",
    "Social-Media-Management",
    "marketing",
    14900,
    "Eine Social-Media-Plattform betreuen lassen: vier Beiträge monatlich aus deinen bereitgestellten Inhalten, mit Redaktionsplanung und Auswertung.",
    [
      "Eine Social-Media-Plattform",
      "Vier Beiträge pro Monat aus bereitgestellten Inhalten",
      "Redaktionsplanung",
      "Veröffentlichung der abgestimmten Beiträge",
      "Monatliche Auswertung",
    ],
    ["Weitere Plattformen", "Content-Produktion"],
    "monthly",
  ),
  define(
    "e-mail-marketing",
    "E-Mail-Marketing",
    "marketing",
    9900,
    "Ein Newsletter-Verteiler, eine Kampagne pro Monat und eine wiederverwendbare Vorlage. Rechtmäßige Empfängerlisten stellst du bereit.",
    [
      "Ein Newsletter-Verteiler",
      "Eine Newsletter-Kampagne pro Monat",
      "Eine wiederverwendbare E-Mail-Vorlage",
      "Einfache Auswertung",
      "Empfängerlisten mit rechtmäßiger Versandgrundlage durch den Kunden",
    ],
    ["Externe Versandkosten", "Weitere Kampagnen"],
    "monthly",
  ),
  define(
    "google-unternehmensprofil",
    "Google-Unternehmensprofil",
    "optimierung",
    9900,
    "Dein Google-Unternehmensprofil einrichten oder optimieren: mit Unternehmensdaten, Leistungsbeschreibung, Website-Link und Hilfe bei der Verifizierung.",
    [
      "Ein Profil einrichten oder optimieren",
      "Unternehmensinformationen",
      "Leistungen und Beschreibung",
      "Website-Verlinkung",
      "Grundlegende lokale Suchoptimierung",
      "Unterstützung bei der Verifizierung; Freigabe durch Google",
    ],
    ["Laufende Profilpflege", "Weitere Standorte"],
  ),
  define(
    "recruiting-karrierewebsites",
    "Recruiting & Karrierewebsites",
    "websites",
    39900,
    "Eine einfache Karriere-Landingpage mit bis zu drei Stellenangeboten und Bewerbungsformular für dein Unternehmen.",
    [
      "Eine einfache Karriere-Landingpage",
      "Bis zu drei bereitgestellte Stellenangebote",
      "Ein Bewerbungsformular",
      "Responsive Umsetzung",
      "E-Mail-Benachrichtigungen",
    ],
    ["Hosting", "Weitere Stellen und Funktionen"],
  ),
  define(
    "mobile-apps",
    "Mobile Apps",
    "software",
    19900,
    "Das App-Konzept vor der Entwicklung: Anforderungen, Funktionsübersicht und technische Empfehlung. Individuelle iOS- und Android-Entwicklung wird separat kalkuliert.",
    [
      "Erstberatung",
      "Anforderungsaufnahme",
      "App-Konzept",
      "Funktionsübersicht",
      "Technische Umsetzungsempfehlung; keine App-Entwicklung enthalten",
    ],
    [
      "iOS- und Android-Entwicklung",
      "Progressive Web Apps",
      "Unternehmens-Apps",
      "App-Backends und API-Integrationen",
    ],
  ),
  define(
    "website-cybersecurity",
    "Website-Cybersecurity",
    "optimierung",
    14900,
    "Nicht-invasive Sicherheitsgrundanalyse deiner eigenen oder autorisiert betreuten Website mit Bericht und konkreten Empfehlungen.",
    [
      "Eine eigene oder nachweislich autorisierte Website",
      "Grundlegende Sicherheitskonfigurationen",
      "HTTP-Sicherheitsheader",
      "TLS-Konfiguration",
      "Öffentlich erkennbare Fehlkonfigurationen",
      "Sicherheitsbericht mit Empfehlungen; keine invasiven Tests und keine Zertifizierung",
    ],
    [
      "Umsetzung der empfohlenen Maßnahmen",
      "Vertiefte Prüfungen nach gesonderter Vereinbarung",
    ],
  ),
  define(
    "whatsapp-business",
    "WhatsApp Business",
    "ki-automatisierung",
    19900,
    "WhatsApp Business für deine Kundenkommunikation einrichten: Geschäftsprofil, Begrüßung, Abwesenheit und eine Antwortvorlage.",
    [
      "Ein WhatsApp-Business-Konto einrichten oder optimieren",
      "Geschäftsprofil",
      "Begrüßungsnachricht",
      "Abwesenheitsnachricht",
      "Grundlegende Kundenkommunikation",
      "Eine einfache Antwortvorlage",
    ],
    ["WhatsApp Business API", "Chatbots", "Externe Anbietergebühren"],
  ),
  define(
    "e-learning-plattformen",
    "E-Learning-Plattformen",
    "software",
    49900,
    "Eine einfache Lernplattform auf einem vorhandenen CMS oder LMS mit einem Kursbereich und Benutzerregistrierung einrichten lassen.",
    [
      "Einrichtung auf vorhandenem CMS/LMS",
      "Ein Kursbereich als Grundkonfiguration",
      "Benutzerregistrierung",
      "Responsive Darstellung",
      "Grundlegende Administrationsfunktionen",
    ],
    ["Hosting und Lizenzen", "Kursproduktion", "Individuelle Erweiterungen"],
  ),
  define(
    "marketplace-management",
    "Marketplace-Management",
    "e-commerce",
    19900,
    "Ein Verkäuferkonto auf Amazon, eBay oder Etsy einrichten oder optimieren und bis zu zehn Produktangebote aus gelieferten Informationen anlegen.",
    [
      "Ein Verkäuferkonto auf Amazon, eBay oder Etsy",
      "Einrichtung oder Optimierung und Grundeinstellungen",
      "Bis zu zehn Angebote aus bereitgestellten Produktinformationen",
      "Einfache Angebotsoptimierung",
    ],
    ["Laufende Betreuung", "Werbekosten", "Plattformgebühren"],
  ),
  define(
    "video-contentproduktion",
    "Video- & Contentproduktion",
    "branding",
    4900,
    "Ein Kurzvideo bis 60 Sekunden aus maximal zehn Minuten bereitgestelltem Rohmaterial schneiden lassen. Ein Format und eine Korrekturschleife inklusive.",
    [
      "Ein Kurzvideo bis 60 Sekunden",
      "Bereitgestelltes Rohmaterial bis zehn Minuten",
      "Videoschnitt",
      "Ein Format für Reels, Shorts oder TikTok",
      "Eine Korrekturschleife",
      "Export in geeigneter Auflösung",
    ],
    [
      "Weitere Videos",
      "Thumbnails und Untertitel",
      "Animationen",
      "Werbespots und Content-Pakete",
    ],
  ),
  define(
    "e-mail-cloud-einrichtung",
    "E-Mail- & Cloud-Einrichtung",
    "betreuung",
    9900,
    "Ein geschäftliches Postfach inklusive benötigter Domain- und DNS-Konfiguration auf einem Gerät oder in einem E-Mail-Programm einrichten.",
    [
      "Ein geschäftliches E-Mail-Postfach",
      "Domain- und DNS-Konfiguration nach Bedarf",
      "Microsoft 365, Google Workspace oder klassisches E-Mail-Hosting",
      "Ein Endgerät oder ein E-Mail-Programm",
      "Grundlegende Funktionskonfiguration",
    ],
    [
      "Softwarelizenzen und Providergebühren",
      "Zusätzliche Postfächer",
      "Datenmigration",
    ],
  ),
  define(
    "digitale-verkaufsprozesse",
    "Digitale Verkaufsprozesse",
    "ki-automatisierung",
    24900,
    "Ein einfacher Lead-Funnel mit Landingpage oder Integration in deine bestehende Website, Anfrageformular und E-Mail-Benachrichtigung.",
    [
      "Ein einfacher Lead-Funnel",
      "Eine Landingpage oder Integration in eine bestehende Website",
      "Ein Anfrageformular",
      "Eine Bestätigungsseite",
      "E-Mail-Benachrichtigung",
      "Responsive Umsetzung",
    ],
    [
      "CRM-Anbindung",
      "Umfangreiche Automatisierungen",
      "Zusätzliche Funnel-Schritte",
    ],
  ),
];
export const bookingPackage = (slug: string) =>
  bookingPackages.find((p) => p.slug === slug);
export const bookingHref = (p: BookingPackage, consultation = false) =>
  `/buchen?leistung=${p.slug}${consultation ? "&beratung=1" : ""}`;
export const packageHref = (p: BookingPackage) =>
  `/leistungen/${p.category}/${p.slug}`;
export const euro = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export const packagePrice = (p: BookingPackage) =>
  `${euro(p.cents)} ${p.interval === "monthly" ? "/ Monat" : "einmalig"}`;
export const monthlyTerms =
  "Erster Leistungsmonat nach bestätigtem Zahlungseingang und gemeinsam abgestimmtem Start. Danach monatliche Abrechnung im Voraus, unbefristet, ohne längere Mindestlaufzeit. Kündigung jederzeit zum Ende des laufenden Leistungsmonats; vor Leistungsbeginn jederzeit. Der Preis fällt für jeden vereinbarten Leistungsmonat erneut an.";
export const bookingTermsVersion = "2026-10-19-v1";
export const bookingTerms =
  "Vertragspartner ist Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de, +49 155 67504871. Vertragssprache Deutsch; Angebot für Kunden mit Rechnungsanschrift in Deutschland. Zahlung ausschließlich per Banküberweisung, fällig innerhalb des angezeigten Zahlungsziels. Mit der zahlungspflichtigen Bestellung und unserer auf der Website angezeigten Buchungsbestätigung kommt der Vertrag über das ausgewählte Einstiegspaket zustande. Der Vertragsinhalt wird gespeichert und per E-Mail übermittelt. Eingaben können vor der Bestellung über Zurück korrigiert werden. Zusatzanforderungen sind nicht mitbestellt und werden nur nach gesondertem Angebot und ausdrücklicher Zustimmung kostenpflichtig. Externe Lizenzen, Plattform-, Hosting- und Versandgebühren sind nicht enthalten; kostenpflichtige Fremdleistungen werden nur nach vorheriger Abstimmung beauftragt. Die Umsetzung erfolgt nach Zahlung und vollständiger Bereitstellung der erforderlichen Inhalte, Zugänge und Nutzungsrechte; einmalige Pakete innerhalb von 20 Werktagen ab diesem Zeitpunkt, soweit kein anderer Termin ausdrücklich vereinbart wird. Monatspakete starten zum gemeinsam abgestimmten Datum. Gesetzliche Gewährleistungs- und Widerrufsrechte bleiben unberührt. Es werden keine bestimmten Suchmaschinenpositionen, Umsätze, Plattformfreigaben oder vollständige Sicherheit garantiert. Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.";
export const withdrawalText =
  "Widerrufsbelehrung für Verbraucher: Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses. Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de, Telefon +49 155 67504871) mittels einer eindeutigen Erklärung (z. B. Brief oder E-Mail) über Ihren Entschluss informieren. Sie können dafür das Muster-Widerrufsformular verwenden; dies ist nicht vorgeschrieben. Alternativ können Sie auf unserer Website die Funktion „Vertrag widerrufen“ nutzen; den Eingang bestätigen wir unverzüglich per E-Mail. Zur Wahrung der Frist genügt die rechtzeitige Absendung. Folgen des Widerrufs: Wir zahlen Ihnen alle erhaltenen Zahlungen unverzüglich, spätestens binnen vierzehn Tagen ab Eingang Ihres Widerrufs zurück. Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, es sei denn, ausdrücklich wurde etwas anderes vereinbart. Es fallen keine Rückzahlungsentgelte an. Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, zahlen Sie einen angemessenen Betrag für den bis zu Ihrem Widerruf bereits erbrachten Anteil im Verhältnis zum vertraglich vorgesehenen Gesamtumfang. Das Widerrufsrecht erlischt bei Dienstleistungen erst mit vollständiger Vertragserfüllung, wenn Sie zuvor ausdrücklich dem vorzeitigen Beginn zugestimmt und Ihre Kenntnis vom Verlust des Widerrufsrechts bei vollständiger Erfüllung bestätigt haben.";
export const withdrawalModel =
  "Muster-Widerrufsformular (nur ausfüllen und absenden, wenn Sie widerrufen möchten): An Enrico Gross, Webstudio Expert, Karinstraße 5, 44388 Dortmund, kontakt@webstudio-expert.de. Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ____. Bestellt am: ____. Name des/der Verbraucher(s): ____. Anschrift des/der Verbraucher(s): ____. Unterschrift (nur bei Mitteilung auf Papier): ____. Datum: ____.";
