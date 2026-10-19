export const projectCategories = [
  "Alle",
  "Websites",
  "Onlineshops",
  "Webanwendungen",
  "SaaS",
  "Automatisierungen",
];
export const portfolioReferences = [
  {
    slug: "tus-boevinghausen",
    name: "TuS Bövinghausen 25 e.V.",
    category: "Websites",
    image: "/projects/tus-bovinghausen.png",
    imageWidth: 1440,
    imageHeight: 900,
    description:
      "Vereinswebsite für den Ballspielverein TuS Bövinghausen 25 e.V. – mit Mannschaften, Vereinsnachrichten und Terminen.",
    externalUrl: "https://tus-bovinghausen-25.onrender.com/",
  },
  {
    slug: "sibylle-bergold",
    name: "Sibylle Bergold",
    category: "Websites",
    image: "/projects/sibylle-bergold.png",
    imageWidth: 1440,
    imageHeight: 900,
    description:
      "Website für systemische Aufstellung und Coaching mit Informationen zu Angebot, Arbeitsweise und Kontakt.",
    externalUrl: "https://sibylle-bergold.de/",
  },
] as const;
export const projects = [
  {
    slug: "raum-architektur",
    name: "Raum / Architektur",
    category: "Websites",
    image: "/projects/raum-hero.png",
    imageWidth: 1024,
    imageHeight: 572,
    description:
      "Ein reduzierter Architekturauftritt mit Raum für Projekte und Materialien.",
    challenge:
      "Wie lassen sich unterschiedliche Bauprojekte zeigen, ohne dass die Navigation den Bildern ihre Wirkung nimmt?",
    solution:
      "Großzügige Projektansichten, eine knappe Themenstruktur und getrennte Detailseiten für Entwurf, Material und Nutzung.",
    features: [
      "Projektübersicht mit Filtern",
      "Responsive Projektseiten",
      "Redaktionelles Inhaltsmodell",
    ],
    technologies: ["Next.js", "TypeScript", "Headless CMS"],
    type: "architecture",
  },
  {
    slug: "form-objekte",
    name: "Form / Objekte",
    category: "Onlineshops",
    image: "/projects/form-hero.png",
    imageWidth: 1024,
    imageHeight: 572,
    description:
      "Ein Shopkonzept für ausgesuchte Alltagsobjekte und klare Produktinformationen.",
    challenge:
      "Die Produkte sollen im Mittelpunkt stehen und Varianten trotzdem verständlich auswählbar bleiben.",
    solution:
      "Eine ruhige Produktdarstellung mit Materialangaben, Variantenwahl und einem kurzen Weg zum Warenkorb.",
    features: [
      "Katalog und Produktdetails",
      "Variantenwahl",
      "Checkout-Konzept",
    ],
    technologies: ["React", "Shopify", "Commerce API"],
    type: "commerce",
  },
  {
    slug: "klar-workspace",
    name: "Klar / Workspace",
    category: "SaaS",
    image: "/projects/klar.svg",
    imageWidth: 1200,
    imageHeight: 850,
    description:
      "Eine Arbeitsoberfläche, die Aufgaben, Termine und Projektstände verbindet.",
    challenge:
      "Ein Team soll den aktuellen Projektstand erkennen und die nächste Aufgabe ohne lange Suche finden.",
    solution:
      "Ein Dashboard mit fokussierter Aufgabenliste, Projektfortschritt und klarer Trennung von Team- und persönlichen Ansichten.",
    features: [
      "Team- und Projektansichten",
      "Aufgaben mit Zuständigkeiten",
      "Rollenmodell",
    ],
    technologies: ["Next.js", "PostgreSQL", "React"],
    type: "software",
  },
  {
    slug: "zeit-buchungen",
    name: "Zeit / Buchungen",
    category: "Webanwendungen",
    image: "/projects/zeit.svg",
    imageWidth: 1200,
    imageHeight: 850,
    description:
      "Ein Konzept für die gemeinsame Planung von Räumen und Terminen.",
    challenge: "Ressourcen und Zeitfenster müssen gleichzeitig geprüft werden.",
    solution:
      "Eine gemeinsame Kalenderansicht mit Konflikthinweisen und geregelten Freigaben.",
    features: [
      "Ressourcenkalender",
      "Verfügbarkeitsprüfung",
      "Reservierungsstatus",
    ],
    technologies: ["React", "PostgreSQL", "TypeScript"],
    type: "software",
  },
  {
    slug: "fluss-dokumente",
    name: "Fluss / Dokumente",
    category: "Automatisierungen",
    image: "/projects/fluss.svg",
    imageWidth: 1200,
    imageHeight: 850,
    description:
      "Ein Ablaufkonzept für die Erfassung und Prüfung eingehender Dokumente.",
    challenge:
      "Wiederkehrende Dokumente enthalten ähnliche Angaben in unterschiedlichen Layouts.",
    solution:
      "Extraktion mit einer Prüfwarteschlange für unklare Felder und einer dokumentierten Übergabe an das Zielsystem.",
    features: ["Dokumenteneingang", "Manuelle Prüfstufe", "API-Übergabe"],
    technologies: ["TypeScript", "API", "PostgreSQL"],
    type: "software",
  },
] as const;
export const portfolioItems = [...portfolioReferences, ...projects];
export type PortfolioProject = (typeof portfolioItems)[number];
