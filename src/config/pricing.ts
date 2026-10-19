export const packages = [
  {
    name: "Starter",
    price: 249,
    summary: "Ein klarer Auftritt. Ein konkretes Ziel.",
    features: [
      "Einfache Landingpage",
      "Responsive Umsetzung",
      "Kontaktmöglichkeit",
      "Basis-SEO",
      "Einmalige Übergabe",
    ],
  },
  {
    name: "Business",
    price: 799,
    summary: "Platz für dein Unternehmen.",
    features: [
      "Mehrseitige Unternehmenswebsite",
      "Individuelle Gestaltung",
      "Responsive Umsetzung",
      "Kontaktfunktionen",
      "Technisches Basis-SEO",
      "Grundlegende Performanceoptimierung",
    ],
  },
  {
    name: "Professional",
    price: 1499,
    summary: "Mehr Inhalte. Mehr Möglichkeiten.",
    features: [
      "Umfangreichere Unternehmenswebsite",
      "Erweiterte individuelle Gestaltung",
      "CMS nach Vereinbarung",
      "SEO-Grundstruktur",
      "Zusätzliche Funktionen",
      "Erweiterte Inhaltsstruktur",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    summary: "Software für eigene Anforderungen.",
    features: [
      "Individuelle Webplattformen",
      "SaaS-Anwendungen",
      "Komplexe Integrationen",
      "Datenbank- und Backend-Systeme",
      "Unternehmenssoftware",
    ],
  },
];
export const carePackages = [
  {
    name: "Basic",
    price: 29,
    features: [
      "Monatliche technische Sichtprüfung",
      "Update-Prüfung für vereinbarte Komponenten",
      "Backup-Kontrolle bei gebuchtem Hosting",
      "Support per E-Mail; Arbeiten nach Aufwand",
    ],
  },
  {
    name: "Business",
    price: 79,
    features: [
      "Leistungen aus Basic",
      "Bis zu 30 Minuten Pflege pro Monat",
      "Monatliche Erreichbarkeitsauswertung",
      "Support per E-Mail und vereinbartem Rückruf",
    ],
  },
  {
    name: "Premium",
    price: 149,
    features: [
      "Leistungen aus Business",
      "Bis zu 90 Minuten Pflege pro Monat insgesamt",
      "Vierteljährliche technische Besprechung",
      "Priorisierte Bearbeitung im vereinbarten Zeitfenster",
    ],
  },
];
export const additionalPrices = [
  ["Onlineshops", 999],
  ["Shopify / WooCommerce", null],
  ["Individuelle Shopsysteme", null],
  ["Webanwendungen & SaaS", null],
  ["Schnittstellen & Automatisierung", null],
] as const;
export const priceLabel = (price: number | null) =>
  price === null
    ? "Auf Anfrage"
    : `ab ${new Intl.NumberFormat("de-DE").format(price)} €`;
export const priceNote =
  "Alle Beträge sind Endpreise; der Nettobetrag entspricht dem Endbetrag. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet. Einstiegspreise gelten für den beschriebenen Basisumfang. Dein verbindliches Angebot richtet sich nach dem tatsächlichen Projektumfang.";
