export type ContentSection = {
  title: string;
  text: string;
  items?: string[];
  links?: { title: string; href: string }[];
};
export type ContentPage = {
  title: string;
  label: string;
  description: string;
  sections: ContentSection[];
  legal?: boolean;
  cta?: boolean;
};
export const contentPages: Record<string, ContentPage> = {
  unternehmen: {
    title: "Ein Studio für unterschiedliche Vorhaben.",
    label: "Unternehmen",
    description:
      "Webstudio Expert ist das Webstudio von Enrico Gross in Dortmund. Im Mittelpunkt stehen individuelle Weblösungen, klar definierte Projekte und eine nachvollziehbare Zusammenarbeit.",
    cta: true,
    sections: [
      {
        title: "Was wir entwickeln",
        text: "Websites, Shops und browserbasierte Software. Der Umfang reicht vom kompakten ersten Auftritt bis zur Anwendung mit eigener Datenbank und verbundenen Systemen.",
        links: [{ title: "Alle Leistungen", href: "/leistungen" }],
      },
      {
        title: "Für wen wir arbeiten möchten",
        text: "Privatpersonen, Selbstständige, Start-ups, Unternehmen, Vereine und Agenturen. Für den deutschsprachigen Raum und Projekte mit unterschiedlichen Budgets.",
      },
      {
        title: "Wie wir zusammenarbeiten",
        text: "Mit einem verständlichen Angebot, abgestimmten Schritten und einem klar geregelten Übergang in den Betrieb. Betreuung ist optional.",
        links: [
          { title: "Unsere Arbeitsweise", href: "/ueber-uns" },
          { title: "Entwicklungsprozess", href: "/entwicklungsprozess" },
          { title: "Technologien", href: "/technologien" },
        ],
      },
      {
        title: "Technische Umsetzung für Agenturen",
        text: "Agenturen können klar abgegrenzte Entwicklungsleistungen für ihre Kunden beauftragen. Umfang, Übergabe und Vertraulichkeit werden vorab vereinbart.",
        links: [{ title: "White-Label-Zusammenarbeit", href: "/white-label" }],
      },
    ],
  },
  "ueber-uns": {
    title: "Klar in der Gestaltung. Genau in der Umsetzung.",
    label: "Über uns",
    description:
      "Enrico Gross entwickelt mit Webstudio Expert individuelle Weblösungen aus Dortmund. Der Anspruch: Umfang, Kosten und Ergebnis sollen verständlich bleiben.",
    cta: true,
    sections: [
      {
        title: "Anforderungen vor Werkzeugen",
        text: "Ein kleines Webprojekt braucht andere Entscheidungen als ein Kundenportal. Wir wählen Technik und Gestaltung anhand der Aufgabe und vermeiden Funktionen, die keinen konkreten Bedarf erfüllen.",
      },
      {
        title: "Direkt und nachvollziehbar",
        text: "Vor dem Start beschreiben wir Leistungen, Mitwirkung, Zeitplan und Zahlungsbedingungen. Änderungen am Umfang werden besprochen, bevor sie umgesetzt werden.",
      },
      {
        title: "Dein Projekt bleibt übergebbar",
        text: "Zugänge, Code und Dateien werden im vereinbarten Rechteumfang dokumentiert und nach vollständiger Zahlung übergeben. Bei Drittanbieter-Lizenzen klären wir Grenzen und laufende Gebühren.",
      },
      {
        title: "Ein neuer Auftritt",
        text: "Webstudio Expert wird von Enrico Gross als Einzelunternehmen geführt. Die gezeigten Projekte sind eigene Demonstrationskonzepte. Kundenreferenzen werden erst ergänzt, wenn echte Projekte und die nötigen Freigaben vorliegen.",
      },
    ],
  },
  technologien: {
    title: "Technik folgt dem Projekt.",
    label: "Technologien",
    description:
      "Ein schlanker Auftritt braucht keine komplexe Plattform. Eine eigene Anwendung braucht mehr als ein schönes Frontend. Wir stimmen beides aufeinander ab.",
    cta: true,
    sections: [
      {
        title: "Next.js, React und TypeScript",
        text: "Für individuell entwickelte Oberflächen und serverseitige Funktionen. TypeScript hilft dabei, Datenstrukturen und Schnittstellen klar zu beschreiben. Server Components reduzieren das JavaScript, das im Browser ausgeführt werden muss.",
      },
      {
        title: "CMS und Shopsysteme",
        text: "Für selbst gepflegte Inhalte prüfen wir ein geeignetes CMS. Shopify oder WooCommerce können den Verkauf standardisieren. Individuelle Shopsysteme kommen infrage, wenn besondere Geschäftsregeln dies rechtfertigen.",
      },
      {
        title: "PostgreSQL und Supabase",
        text: "Wenn dauerhafte strukturierte Daten benötigt werden, ist PostgreSQL eine mögliche Grundlage. Supabase kann Datenbank, Authentifizierung und private Speicherung verbinden. Rollen und Zugriffsregeln werden ausdrücklich geplant.",
      },
      {
        title: "Hosting und Integrationen",
        text: "Vercel ist für diese Website vorbereitet. Andere Projekte können eine andere Umgebung benötigen. Anbieter, Datenstandorte, Verträge und laufende Kosten werden vor Nutzung abgestimmt.",
      },
      {
        title: "Pflege statt unnötiger Komplexität",
        text: "Wir dokumentieren Abhängigkeiten und Übergaben. Die Auswahl berücksichtigt Wartbarkeit und Betrieb, nicht nur die erste Veröffentlichung.",
        links: [{ title: "Technische Betreuung", href: "/betreuung" }],
      },
    ],
  },
  entwicklungsprozess: {
    title: "Vom Vorhaben zur Übergabe.",
    label: "Entwicklungsprozess",
    description:
      "Vier Phasen schaffen einen gemeinsamen Rahmen. Die konkreten Abstimmungspunkte und Termine werden für dein Projekt vereinbart.",
    cta: true,
    sections: [
      {
        title: "1. Anfrage und Beratung",
        text: "Du beschreibst Ziele, gewünschte Funktionen und vorhandene Inhalte. Gemeinsam klären wir, welche Lösung sinnvoll ist und welche Fragen vor dem Angebot beantwortet werden müssen.",
      },
      {
        title: "2. Planung und Angebot",
        text: "Der Leistungsumfang, notwendige Zugänge, Mitwirkung, Kosten und Zahlungsbedingungen werden beschrieben. Ein Zeitplan berücksichtigt den tatsächlichen Umfang und die benötigten Freigaben.",
      },
      {
        title: "3. Design und Entwicklung",
        text: "Struktur und Gestaltung werden abgestimmt. Danach entstehen die Funktionen in nachvollziehbaren Schritten. Änderungswünsche außerhalb des Angebots werden gesondert besprochen.",
      },
      {
        title: "4. Abnahme und Übergabe",
        text: "Wir gleichen das Ergebnis mit dem vereinbarten Umfang ab. Nach Abnahme und vollständiger Zahlung erfolgt die Übergabe von Code, Dateien und Zugängen entsprechend der Vereinbarung.",
      },
      {
        title: "Danach: Betrieb nach Bedarf",
        text: "Hosting, Pflege und Unterstützung sind optional. Zuständigkeiten für Updates, Backups und laufende Anbietergebühren werden bei der Übergabe festgehalten.",
        links: [{ title: "Betreuung ansehen", href: "/betreuung" }],
      },
    ],
  },
  "white-label": {
    title: "Entwicklung im Hintergrund.",
    label: "White-Label-Zusammenarbeit",
    description:
      "Technische Umsetzung für Agenturen, die ihren Kunden einen vollständigen Auftritt oder eine eigene Anwendung anbieten möchten.",
    cta: true,
    sections: [
      {
        title: "Deine Kundenschnittstelle",
        text: "Du kannst Projektführung und Kommunikation übernehmen. Wir arbeiten an den vereinbarten technischen Aufgaben. Sichtbarkeit, Dokumentation und Kontakt mit dem Endkunden werden vorab geregelt.",
      },
      {
        title: "Ein definierter Lieferumfang",
        text: "Designvorlagen, Funktionsbeschreibungen und Abnahmekriterien bilden die Grundlage. Wir stimmen Integrationen, Hostinganforderungen und Übergabeformate vor Beginn ab.",
        items: [
          "Umsetzung aus freigegebenen Designs",
          "Komponenten und individuelle Funktionen",
          "Technische Übernahme bestehender Projekte",
          "Wartung nach separater Vereinbarung",
        ],
      },
      {
        title: "Vertraulichkeit und Rechte",
        text: "Vertraulichkeit, Nutzungsrechte und die Verwendung als Referenz werden vertraglich festgelegt. Eine Veröffentlichung als eigene Referenz erfolgt nicht automatisch.",
        links: [{ title: "Kooperation besprechen", href: "/kontakt" }],
      },
    ],
  },
};
