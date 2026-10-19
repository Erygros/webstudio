export type ServiceGuide = {
  title: string;
  answer: string;
  decisions: { title: string; text: string }[];
  preparation: string[];
  links: { title: string; href: string }[];
};

export const serviceGuides: Record<string, ServiceGuide> = {
  "online-marketing": {
    title: "Bestehendes Online-Marketing gezielt verbessern",
    answer:
      "Wir betrachten vorhandene digitale Maßnahmen zusammen mit deinem Angebot und den dazugehörigen Zielseiten. Im Mittelpunkt stehen nachvollziehbare Ziele, bestehende Kontaktwege und ein priorisierter Verbesserungsplan. Für neue Kampagnen, Werbemittel und laufende Anzeigenverwaltung gibt es den ergänzenden Leistungsbereich Werbekampagnen und Marketing.",
    decisions: [
      {
        title: "Vorhandene Maßnahmen einordnen",
        text: "Zuerst erfassen wir eingesetzte Kanäle, Zielgruppen und vorhandene Auswertungen. Danach klären wir, ob das Problem beim Angebot, der Ansprache, der Zielseite oder dem Kontaktweg liegt. Nicht jede Beobachtung erfordert einen neuen Kanal.",
      },
      {
        title: "Planung und Durchführung abgrenzen",
        text: "Ein Optimierungsvorhaben kann eine Analyse und konkrete Änderungen an vorhandenen Maßnahmen umfassen. Eine neue Werbestrategie, Werbemittelproduktion oder fortlaufende Kampagnenbetreuung wird als eigener Umfang angeboten. Honorar und Werbebudget bleiben getrennt.",
      },
    ],
    preparation: [
      "Vorhandene Kanäle, Anzeigen und Zielseiten",
      "Vereinbarte Ziele und verfügbare Auswertungen",
      "Zuständigkeiten für Inhalte und Konten",
      "Bekannte Hürden auf dem Weg zur Anfrage oder zum Kauf",
    ],
    links: [
      {
        title: "Werbekampagnen planen und betreuen",
        href: "/leistungen/marketing",
      },
      {
        title: "Online-Marketing-Strategie erarbeiten",
        href: "/leistungen/digitale-beratung/online-marketing-strategie",
      },
      {
        title: "Anfragen auf der Website verbessern",
        href: "/wissen/website-bekommt-keine-anfragen",
      },
    ],
  },
  landingpages: {
    title: "Landingpage erstellen lassen",
    answer:
      "Eine Landingpage erklärt ein einzelnes Angebot und führt zu einer konkreten Handlung, etwa einer Anfrage. Sie passt zu einer Kampagne oder einem klaren Leistungsangebot. Für mehrere gleich wichtige Angebote ist eine mehrseitige Website oft übersichtlicher.",
    decisions: [
      {
        title: "Ein Angebot, ein nächster Schritt",
        text: "Wir klären zuerst, wer die Seite besucht und welche Frage vor einer Anfrage beantwortet sein muss. Angebot, Nutzen, Leistungsgrenzen und Kontaktmöglichkeit bilden die Struktur. Nachweise werden nur eingebunden, wenn echte und freigegebene Referenzen vorliegen.",
      },
      {
        title: "Kontaktweg passend zum Alltag",
        text: "Ein Formular, ein Anruf oder ein Termin können unterschiedliche Anforderungen erfüllen. Nur tatsächlich benötigte Angaben gehören ins Formular. Wer Anfragen bearbeitet und wann eine Bestätigung nötig ist, wird vor der Umsetzung festgelegt.",
      },
    ],
    preparation: [
      "Angebot und Zielgruppe in wenigen Sätzen",
      "Gewünschte Handlung: Anfrage, Anruf oder Termin",
      "Texte, Bildrechte und vorhandene Markenunterlagen",
      "Benötigte Formulardaten und Zuständigkeit für Anfragen",
    ],
    links: [
      { title: "Starter-Paket und Leistungsumfang", href: "/preise" },
      { title: "Briefing für deine Website", href: "/wissen/website-briefing" },
    ],
  },
  unternehmenswebsites: {
    title: "Unternehmenswebsite erstellen lassen",
    answer:
      "Eine Unternehmenswebsite erklärt dein Unternehmen und seine Angebote auf mehreren Seiten. Sie ist sinnvoll, wenn Besucher verschiedene Leistungen vergleichen oder Projekte, Ansprechpartner und Abläufe kennenlernen sollen. Webstudio Expert plant dafür eine eigene Seitenstruktur statt alle Themen auf eine lange Startseite zu setzen.",
    decisions: [
      {
        title: "Seiten nach Fragen der Kunden ordnen",
        text: "Eine Leistungsseite sollte erklären, für wen das Angebot geeignet ist, was enthalten ist und wie die Zusammenarbeit beginnt. Das Unternehmensprofil stellt echte Ansprechpartner vor. Kontakt und Anfrage sind von den wichtigen Seiten erreichbar. Ein Blog ist erst sinnvoll, wenn seine Inhalte gepflegt werden können.",
      },
      {
        title: "Pflege und Erweiterung mitplanen",
        text: "Wenn du häufig Texte oder Projekte änderst, kann ein CMS Teil des Angebots werden. Seltene Änderungen können auch über eine vereinbarte technische Pflege erfolgen. Sprache, Standorte und spätere Funktionen werden vorab eingeordnet, damit die erste Struktur dazu passt.",
      },
    ],
    preparation: [
      "Liste deiner Leistungen und wichtigsten Zielgruppen",
      "Seitenwünsche und vorhandene Website-Adresse",
      "Verantwortliche für Inhalte und Freigaben",
      "Anforderungen an CMS, Kontakt und spätere Erweiterungen",
    ],
    links: [
      {
        title: "Website-Kosten verstehen",
        href: "/wissen/was-eine-website-kostet",
      },
      { title: "Webdesign in Dortmund", href: "/region/dortmund" },
    ],
  },
  "cms-websites": {
    title: "Website mit CMS erstellen lassen",
    answer:
      "Ein CMS ist ein Redaktionssystem für Texte, Bilder und andere Inhalte. Es lohnt sich, wenn Inhalte regelmäßig ohne Änderungen am Seitencode gepflegt werden sollen. Ob WordPress, ein anderes CMS oder eine individuelle Lösung passt, hängt von den benötigten Inhaltstypen, Rollen und dem Betrieb ab.",
    decisions: [
      {
        title: "Bearbeitung statt unbegrenzter Möglichkeiten",
        text: "Vor der Auswahl klären wir, welche Inhalte du tatsächlich ändern möchtest: Texte, Projekte, Nachrichten oder ganze Seiten. Definierte Vorlagen helfen, das Erscheinungsbild bei Änderungen zu erhalten. Rollen regeln, wer bearbeiten und wer veröffentlichen darf.",
      },
      {
        title: "Ein CMS braucht laufende Zuständigkeiten",
        text: "Redaktion und technische Pflege sind verschiedene Aufgaben. Einweisung, Aktualisierung des Systems, Backups und mögliche Lizenzgebühren werden im Angebot und bei der Übergabe besprochen. Ein CMS ist kein Ersatz für ein auf dein Unternehmen abgestimmtes Inhaltskonzept.",
      },
    ],
    preparation: [
      "Regelmäßig geänderte Inhalte und gewünschte Vorlagen",
      "Anzahl der Redakteure und Freigabewege",
      "Vorhandenes CMS und Zugriffsmöglichkeiten",
      "Zuständigkeit für Updates und Sicherungen",
    ],
    links: [
      {
        title: "CMS oder individuelle Website?",
        href: "/wissen/cms-oder-individuelle-website",
      },
      { title: "Übergabe und Zugänge", href: "/wissen/website-uebergabe" },
    ],
  },
  "website-relaunch": {
    title: "Website-Relaunch mit geplanter Migration",
    answer:
      "Ein Relaunch erneuert Technik, Struktur oder Gestaltung einer bestehenden Website. Er beginnt mit einer Bestandsaufnahme: Welche Inhalte, URLs und Funktionen müssen erhalten bleiben? Änderungen an bestehenden Adressen benötigen eine bewusste Zuordnung, damit Besucher und Suchmaschinen weiter zum passenden Inhalt gelangen.",
    decisions: [
      {
        title: "Erhalten, überarbeiten oder entfernen",
        text: "Jede wichtige bisherige Seite erhält eine Entscheidung. Inhalte werden anhand des tatsächlichen Angebots überarbeitet. Eine alte Leistungsseite sollte bei einer URL-Änderung auf ihren passenden Nachfolger führen. Pauschale Weiterleitungen aller alten Seiten zur Startseite ersetzen diese Zuordnung nicht.",
      },
      {
        title: "Veröffentlichung und Verantwortung klären",
        text: "Domain, Hosting, E-Mail und Redaktionszugänge werden vor dem Wechsel erfasst. Der Veröffentlichungsplan legt Zeitpunkt, Rückfallmöglichkeit und Zuständigkeiten fest. Eine neue Website kann Sichtbarkeit verändern; unveränderte Rankings nach einem Umzug werden nicht zugesagt.",
      },
    ],
    preparation: [
      "Bisherige Website und verfügbare Seitenliste",
      "Vorhandene Inhalte, Bilder und Nutzungsrechte",
      "Domain-, Hosting- und CMS-Verantwortliche",
      "Funktionen und Seiten, die erhalten bleiben müssen",
    ],
    links: [
      { title: "Ablauf der Entwicklung", href: "/entwicklungsprozess" },
      {
        title: "Vorbereitung eines Website-Projekts",
        href: "/wissen/website-briefing",
      },
    ],
  },
  onlineshops: {
    title: "Onlineshop erstellen lassen",
    answer:
      "Ein Onlineshop braucht neben Produktseiten einen passenden Ablauf für Bestellung, Zahlung und Versand. Vor der Systemwahl klären wir Sortiment, Varianten und interne Bearbeitung. Ein Standardsystem ist sinnvoll, wenn es deine Regeln abbildet; besondere Abläufe können eine individuelle Erweiterung erfordern.",
    decisions: [
      {
        title: "Vom Produkt bis zur Bearbeitung",
        text: "Anzahl der Produkte, Varianten, Liefergebiete und Zahlungsarten bestimmen den Aufbau. Produktdaten und Bilder sollten nachvollziehbar gepflegt werden können. Wir besprechen, wie eine Bestellung im Betrieb weiterbearbeitet wird und ob vorhandene Warenwirtschaft angebunden werden soll.",
      },
      {
        title: "Betriebskosten und rechtliche Inhalte",
        text: "Systemgebühren, Zahlungsanbieter und Lizenzen sind mögliche laufende Kosten außerhalb der Entwicklung. Rechtstexte und vertriebliche Pflichtinformationen müssen zu deinem konkreten Geschäftsmodell passen und von dir bereitgestellt oder fachlich geprüft werden. Technische Umsetzung allein ersetzt diese Klärung nicht.",
      },
    ],
    preparation: [
      "Produkte, Varianten und benötigte Datenfelder",
      "Versandgebiete, Versandregeln und Zahlungswünsche",
      "Vorhandene Warenwirtschaft und Produktbilder",
      "Verantwortliche für Bestellungen, Inhalte und Betrieb",
    ],
    links: [
      { title: "Shopify-Shop", href: "/leistungen/e-commerce/shopify-shops" },
      {
        title: "WooCommerce-Shop",
        href: "/leistungen/e-commerce/woocommerce-shops",
      },
      { title: "Preise für Shops", href: "/preise" },
    ],
  },
  "individuelle-webanwendungen": {
    title: "Individuelle Webanwendung entwickeln lassen",
    answer:
      "Eine Webanwendung unterstützt konkrete Arbeitsabläufe im Browser. Sie ist sinnvoll, wenn Standardsoftware wichtige Regeln, Daten oder Zuständigkeiten nicht ausreichend abbildet. Der erste Schritt ist ein abgegrenzter Prozess mit festgelegten Nutzern und Berechtigungen, statt einer unüberschaubaren Wunschliste.",
    decisions: [
      {
        title: "Einen vollständigen Ablauf zuerst lösen",
        text: "Wir beschreiben, wer einen Vorgang anlegt, welche Angaben benötigt werden und wie der nächste Bearbeitungsschritt aussieht. Ein erster Umfang sollte diesen Ablauf zuverlässig abbilden. Weitere Funktionen werden mit Blick auf tatsächlichen Nutzen, Integrationen und Pflege geplant.",
      },
      {
        title: "Daten und Zugriffe ausdrücklich planen",
        text: "Benutzerrollen, Sichtbarkeit, Speicherung und Löschung gehören zur Architektur. Schnittstellen benötigen passende Rechte und eine Behandlung fehlgeschlagener Übertragungen. Betrieb, Backups und Dokumentation werden zusammen mit der Entwicklung vereinbart, damit die Anwendung übergeben werden kann.",
      },
    ],
    preparation: [
      "Beschreibung des wichtigsten Arbeitsablaufs",
      "Nutzergruppen und Zugriffsrechte",
      "Vorhandene Daten und benötigte Schnittstellen",
      "Anforderungen an Betrieb, Sicherung und Übergabe",
    ],
    links: [
      {
        title: "Website oder Webanwendung?",
        href: "/wissen/website-oder-webanwendung",
      },
      { title: "CRM-Systeme", href: "/leistungen/software/crm-systeme" },
    ],
  },
  suchmaschinenoptimierung: {
    title: "SEO für Unternehmenswebsites",
    answer:
      "SEO verbindet auffindbare Seiten mit hilfreichen Antworten auf konkrete Suchanfragen. Dazu gehören eine crawlbare technische Struktur, passende Seitentitel, verständliche Inhalte und interne Links. Die Auswahl der Maßnahmen richtet sich nach dem Angebot und den tatsächlichen Befunden deiner Website.",
    decisions: [
      {
        title: "Suchanfrage und Seitenaufgabe verbinden",
        text: "Eine Seite für eine konkrete Leistung beantwortet andere Fragen als ein Kostenratgeber. Für wichtige Themen planen wir jeweils einen klaren Zweck. Zusätzliche Seiten werden nur angelegt, wenn sie eigene hilfreiche Inhalte bieten. Reine Kopien für weitere Städte verbessern das Angebot für Besucher nicht.",
      },
      {
        title: "Sichtbarkeit anhand echter Daten bewerten",
        text: "Google Search Console und Bing Webmaster Tools können nach Einrichtung Daten zur Auffindbarkeit liefern. Impressionen, Suchanfragen und Anfragen werden über Zeit eingeordnet. Eine bestimmte Position, ein Suchergebnisformat oder eine feste Frist bis zur Indexierung gehören nicht zu einem belastbaren Versprechen.",
      },
    ],
    preparation: [
      "Wichtige Leistungen, Zielgruppen und tatsächliche Standorte",
      "Bisherige Website und bekannte Auffindbarkeitsprobleme",
      "Vorhandene Search-Console- oder Bing-Daten, sofern eingerichtet",
      "Fachliche Inhalte und echte freigegebene Referenzen",
    ],
    links: [
      {
        title: "Technisches SEO",
        href: "/leistungen/optimierung/technisches-seo",
      },
      {
        title: "GEO für KI-Suche",
        href: "/leistungen/optimierung/generative-engine-optimization",
      },
    ],
  },
  "generative-engine-optimization": {
    title: "GEO & AEO: Inhalte für KI-Suche und Antworten",
    answer:
      "GEO und AEO beschreiben die Aufbereitung von Informationen für KI-gestützte Suche und direkte Antworten. Die Grundlage sind zugängliche Seiten, eindeutige Anbieterangaben und fachlich nachvollziehbare Inhalte. Für Googles KI-Suche sind keine besonderen KI-Dateien oder zusätzlichen Schema-Typen erforderlich.",
    decisions: [
      {
        title: "Fragen vollständig und verständlich beantworten",
        text: "Wir formulieren kurze Antworten mit dem nötigen Kontext: Für wen gilt die Aussage, welcher Leistungsumfang ist gemeint und welche Grenzen bestehen? Vergleiche, konkrete Vorbereitungsschritte und sichtbare Quellen helfen bei der Einordnung. Strukturierte Daten beschreiben dieselben Informationen, die Besucher auf der Seite lesen.",
      },
      {
        title: "Zugang und Glaubwürdigkeit zusammen betrachten",
        text: "Such-Crawler sollen die öffentlichen Inhalte erreichen können. Private Bereiche bleiben geschützt. Aussagen über Unternehmen, Preise und Verantwortliche werden aufeinander abgestimmt. KI-Systeme entscheiden selbst, welche Quellen sie nennen; zusätzliche Dateien, künstliche Erwähnungen und erfundene Bewertungen sind keine verlässliche Grundlage.",
      },
    ],
    preparation: [
      "Wiederkehrende Fragen deiner Interessenten",
      "Echte Unternehmens- und Ansprechpartnerdaten",
      "Fachlich belastbare Aussagen und passende Primärquellen",
      "Öffentliche Seiten, die für Suchsysteme zugänglich sein sollen",
    ],
    links: [
      {
        title: "Google: SEO für KI-Suche",
        href: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
      },
      {
        title: "Suchmaschinenoptimierung",
        href: "/leistungen/optimierung/suchmaschinenoptimierung",
      },
    ],
  },
};

export const categorySeo: Record<string, string> = {
  marketing: "Werbekampagnen & Marketing planen und betreuen",
  branding: "Logo, Corporate Design & Brand Assets gestalten",
  "cms-baukaesten": "CMS, Website-Baukästen & Shop-Plattformen",
  "digitale-beratung": "Digitale Unternehmensberatung & Projektplanung",
  websites: "Websites & Webdesign erstellen lassen",
  "e-commerce": "Onlineshops & E-Commerce entwickeln lassen",
  software: "Individuelle Software & Webanwendungen",
  "ki-automatisierung": "KI-Integration, Schnittstellen & Automatisierung",
  optimierung: "SEO, GEO & Website-Optimierung",
  betreuung: "Website-Hosting, Wartung & Support",
};
