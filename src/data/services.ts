import { packages, additionalPrices, carePackages } from "@/config/pricing";
export type Service = {
  slug: string;
  name: string;
  intro: string;
  features: string[];
  useCase: string;
  benefit: string;
  category: string;
  price: number | null;
};
export type Category = {
  slug: string;
  name: string;
  short: string;
  description: string;
  approach: string[];
  services: Service[];
};
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
type Row = [string, string, string, string, string];
const definitions: {
  slug: string;
  name: string;
  short: string;
  description: string;
  approach: string[];
  rows: Row[];
}[] = [
  {
    slug: "websites",
    name: "Websites und Webdesign",
    short: "Websites",
    description:
      "Vom ersten Auftritt bis zur umfangreichen Unternehmenswebsite. Klar gestaltet und auf allen Geräten gut bedienbar.",
    approach: [
      "Inhalte, Zielgruppe und Seitenumfang klären",
      "Struktur und Gestaltung abstimmen",
      "Responsiv entwickeln und Inhalte einpflegen",
      "Gemeinsam abnehmen und Dateien übergeben",
    ],
    rows: [
      [
        "Landingpages",
        "Eine Seite, die ein Angebot verständlich erklärt und Besucher gezielt zur Anfrage führt.",
        "Angebotsstruktur|Kontaktformular|Mobile Darstellung|Suchmaschinen-Metadaten",
        "Ein Produktstart, eine Kampagne oder eine einzelne Dienstleistung.",
        "Besucher finden die entscheidenden Informationen ohne Umwege.",
      ],
      [
        "One-Pager",
        "Dein gesamter Auftritt auf einer zusammenhängenden Seite mit kurzen Wegen zwischen den Abschnitten.",
        "Abschnittsnavigation|Leistungsübersicht|Kontaktbereich|Klare Inhaltsreihenfolge",
        "Selbstständige und kleine Unternehmen mit einem überschaubaren Angebot.",
        "Ein kompakter Einstieg, dessen Inhalte sich einfach pflegen lassen.",
      ],
      [
        "Unternehmenswebsites",
        "Ein professioneller Unternehmensauftritt, der Leistungen, Arbeitsweise und Kontakt übersichtlich verbindet.",
        "Leistungsseiten|Unternehmensprofil|Anfragewege|Responsive Navigation",
        "Dienstleister, Handwerksbetriebe und mittelständische Unternehmen.",
        "Interessenten können sich ein verlässliches Bild deines Angebots machen.",
      ],
      [
        "Mehrseitige Websites",
        "Eine belastbare Seitenstruktur für unterschiedliche Themen, Angebote und Zielgruppen.",
        "Seitentemplates|Interne Verlinkung|Breadcrumbs|Inhaltshierarchie",
        "Organisationen mit mehreren Geschäftsbereichen oder umfangreichen Informationen.",
        "Jedes Thema bekommt den passenden Raum und eine eigene auffindbare Adresse.",
      ],
      [
        "Portfolio-Websites",
        "Arbeiten und Projekte stehen im Mittelpunkt – mit einer Bildsprache, die zu deinem Fachgebiet passt.",
        "Projektgalerie|Detailseiten|Kategoriefilter|Bildoptimierung",
        "Kreative, Fotografen, Architekturbüros und freie Fachkräfte.",
        "Deine Arbeit wird nachvollziehbar statt nur in einer Bilderliste gezeigt.",
      ],
      [
        "Blogs und Magazine",
        "Redaktionelle Inhalte mit gut lesbaren Artikeln, klarer Themenordnung und einem passenden Veröffentlichungsablauf.",
        "Artikelvorlagen|Kategorien|Autorenzuordnung|Redaktionelles CMS",
        "Fachmagazine, Unternehmensblogs und thematische Publikationen.",
        "Neue Beiträge können ohne Änderungen am Seitencode erscheinen.",
      ],
      [
        "Branchenwebsites",
        "Ein Auftritt, der die Informationsbedürfnisse deiner Branche und ihrer Besucher berücksichtigt.",
        "Branchenspezifische Inhalte|Leistungsstruktur|Standortinformationen|Anfrageführung",
        "Praxen, Gastronomie, Beratung und spezialisierte Dienstleister.",
        "Besucher erkennen schnell, ob dein Angebot zu ihrem Anliegen passt.",
      ],
      [
        "Buchungswebsites",
        "Information und Terminwahl an einem Ort, mit einem abgestimmten Buchungsdienst oder einem eigenen System.",
        "Terminübersicht|Buchungsintegration|Bestätigungen|Verfügbarkeitsanzeige",
        "Beratung, Kurse, Studios und zeitgebundene Dienstleistungen.",
        "Terminanfragen werden geordnet und manuelle Abstimmungen reduziert.",
      ],
      [
        "Vereinswebsites",
        "Aktuelles, Vereinsleben und Mitgliedschaft in einem Auftritt, den Verantwortliche selbst pflegen können.",
        "Nachrichten|Veranstaltungskalender|Mitgliedsanfrage|Redaktionsrollen",
        "Sportvereine, Kulturvereine und gemeinnützige Initiativen.",
        "Mitglieder und Interessierte finden einen gemeinsamen Informationspunkt.",
      ],
      [
        "Community-Websites",
        "Ein digitaler Ort für Austausch mit klaren Regeln, Rollen und Moderationsmöglichkeiten.",
        "Diskussionsbereiche|Nutzerprofile|Moderation|Meldesystem",
        "Interessengruppen und Fachgemeinschaften mit aktivem Austausch.",
        "Gespräche bleiben strukturiert und Verantwortlichkeiten nachvollziehbar.",
      ],
      [
        "Mitgliederportale",
        "Geschützte Inhalte und Funktionen für angemeldete Mitglieder mit abgestuften Zugriffsrechten.",
        "Anmeldung|Rollen und Rechte|Geschützte Downloads|Mitgliederbereiche",
        "Verbände, Lernangebote und geschlossene Fachnetzwerke.",
        "Öffentliche Informationen und interne Inhalte bleiben sauber getrennt.",
      ],
      [
        "Website-Relaunch",
        "Ein neu aufgebauter Auftritt mit geplanter Übernahme von Inhalten, Adressen und relevanten Funktionen.",
        "Bestandsaufnahme|Inhaltsmigration|Weiterleitungen|Veröffentlichungsplan",
        "Technisch veraltete Websites oder eine veränderte Unternehmensausrichtung.",
        "Der Wechsel erhält wichtige Inhalte und berücksichtigt bestehende Suchmaschinen-Adressen.",
      ],
      [
        "Website-Redesign",
        "Eine neue Gestaltung für eine bestehende Website, abgestimmt auf Marke, Inhalte und Nutzung.",
        "Designanalyse|Neue Komponenten|Mobile Überarbeitung|Bedienkonzept",
        "Websites mit solider Technik und einer überholten Darstellung.",
        "Die Oberfläche wird konsistenter und Informationen leichter zugänglich.",
      ],
      [
        "Individuelles Webdesign",
        "Ein eigenständiges Gestaltungssystem aus Typografie, Abständen und Komponenten für deine Inhalte.",
        "Gestaltungsentwurf|Komponentensystem|Responsive Ansichten|Design-Dokumentation",
        "Marken, die einen unverwechselbaren digitalen Auftritt benötigen.",
        "Gestaltung und Inhalt passen zusammen, statt sich einer Vorlage unterzuordnen.",
      ],
      [
        "CMS-Websites",
        "Texte, Bilder und Seiten selbst bearbeiten – mit einem Redaktionssystem, das zum Team passt.",
        "CMS-Auswahl|Inhaltsmodelle|Redaktionsrollen|Einweisung",
        "Unternehmen mit regelmäßig wechselnden Inhalten.",
        "Redaktionelle Änderungen können intern erledigt werden.",
      ],
      [
        "Mehrsprachige Websites",
        "Vollständig übersetzte Inhalte mit nachvollziehbarer Sprachwahl und getrennter Suchmaschinenstruktur.",
        "Sprachrouten|Übersetzungsmodelle|Hreflang|Lokalisierte Metadaten",
        "Unternehmen mit Zielgruppen in mehreren Sprachräumen.",
        "Jede Sprache erhält einen konsistenten Auftritt ohne unvollständige Mischseiten.",
      ],
    ],
  },
  {
    slug: "e-commerce",
    name: "E-Commerce",
    short: "Onlineshops",
    description:
      "Produkte verkaufen, Bestellungen verwalten und bestehende Abläufe verbinden. Mit dem Shopsystem, das zu deinem Geschäft passt.",
    approach: [
      "Sortiment und Verkaufsprozesse erfassen",
      "Shopsystem und Zahlungsanbieter auswählen",
      "Katalog, Checkout und Anbindungen umsetzen",
      "Bestellablauf abstimmen und Shop übergeben",
    ],
    rows: [
      [
        "Onlineshops",
        "Ein digitaler Verkaufsraum mit einer klaren Produktauswahl und einem nachvollziehbaren Bestellprozess.",
        "Produktkatalog|Warenkorb|Checkout|Bestellverwaltung",
        "Unternehmen, die physische Waren direkt verkaufen möchten.",
        "Produkte, Bestellungen und Kundenanfragen werden zentral zusammengeführt.",
      ],
      [
        "Shopify-Shops",
        "Ein Shopify-Auftritt mit abgestimmtem Theme, sauberem Produktkatalog und gezielt ausgewählten Erweiterungen.",
        "Theme-Anpassung|Produktimport|Shopify Payments nach Verfügbarkeit|App-Auswahl",
        "Händler, die eine betreute Shopplattform bevorzugen.",
        "Der technische Plattformbetrieb liegt beim Anbieter; dessen Gebühren bleiben transparent.",
      ],
      [
        "WooCommerce-Shops",
        "Ein Shop auf WordPress-Basis, der Inhalte und Verkauf unter einem administrierbaren Dach verbindet.",
        "WooCommerce-Einrichtung|Versandregeln|Zahlungsanbieter|WordPress-Anbindung",
        "Bestehende WordPress-Websites und inhaltsorientierte Verkaufsmodelle.",
        "Redaktion und Sortiment nutzen eine gemeinsame Verwaltung.",
      ],
      [
        "Individuelle Shopsysteme",
        "Ein eigens entwickelter Shop für Geschäftsregeln, die Standardplattformen nur schwer abbilden.",
        "Eigene Produktmodelle|Preislogik|Individueller Checkout|Backend-Verwaltung",
        "Spezielle Vertriebsprozesse und ungewöhnliche Sortimente.",
        "Das System richtet sich nach deinem Verkaufsablauf.",
      ],
      [
        "B2B-Onlineshops",
        "Geschäftskunden bestellen mit ihren Konditionen, Freigaben und vereinbarten Zahlungswegen.",
        "Kundenspezifische Preise|Staffelpreise|Firmenkonten|Bestellfreigaben",
        "Großhandel und Hersteller mit wiederkehrenden Geschäftskunden.",
        "Wiederholte Bestellungen lassen sich ohne einzelne Angebotsanfragen erledigen.",
      ],
      [
        "Händlerportale",
        "Ein geschützter Arbeitsbereich für Vertriebspartner mit aktuellen Sortimenten und relevanten Dokumenten.",
        "Partnerzugänge|Preislisten|Bestellfunktionen|Dokumentenbereich",
        "Hersteller und Vertriebsorganisationen mit Händlernetz.",
        "Partner greifen auf denselben gepflegten Datenbestand zu.",
      ],
      [
        "Online-Marktplätze",
        "Eine Plattform, die Angebote und Nachfrage mit einer klar geregelten Transaktionsstruktur verbindet.",
        "Angebotsverwaltung|Suche|Transaktionsabläufe|Plattformadministration",
        "Vermittlungsmodelle für Waren oder Dienstleistungen.",
        "Angebote und Nutzerinteraktionen werden in einem eigenen System organisiert.",
      ],
      [
        "Multi-Vendor-Plattformen",
        "Mehrere Anbieter verwalten ihre Angebote innerhalb eines gemeinsamen Verkaufsmodells.",
        "Verkäuferkonten|Provisionslogik|Anbieterfreigabe|Auszahlungsanbindung",
        "Marktplätze mit unabhängigen Händlern.",
        "Verkäufer arbeiten eigenständig, während die Plattform gemeinsame Regeln vorgibt.",
      ],
      [
        "Abonnementshops",
        "Wiederkehrende Bestellungen mit verständlichen Laufzeiten, Änderungen und Kündigungsabläufen.",
        "Abo-Pläne|Wiederkehrende Zahlungen|Kundenverwaltung|Kündigungsprozess",
        "Regelmäßige Warenlieferungen und Mitgliedschaftsprodukte.",
        "Wiederholte Lieferungen und Zahlungen folgen einem nachvollziehbaren Ablauf.",
      ],
      [
        "Digitale Produkte",
        "Downloads, Lizenzen und digitale Inhalte nach erfolgreicher Zahlung sicher bereitstellen.",
        "Download-Freigaben|Lizenzverwaltung|Zahlungsstatus|Zugriffsbeschränkungen",
        "E-Books, Vorlagen, Software und digitale Lernmaterialien.",
        "Die Auslieferung funktioniert ohne manuelles Versenden einzelner Dateien.",
      ],
      [
        "Checkout- und Zahlungsintegration",
        "Ein Bestellabschluss mit passenden Zahlungsmethoden und zuverlässiger Statusverarbeitung.",
        "Zahlungsanbieter|Webhook-Verarbeitung|Fehlerzustände|Zahlungsbestätigung",
        "Shops mit einem neuen oder überarbeiteten Checkout.",
        "Bestellungen und Zahlungsstatus bleiben konsistent.",
      ],
      [
        "Shop-Migration",
        "Produkte, Kunden und Bestellungen kontrolliert auf eine neue Shopplattform übertragen.",
        "Datenmapping|Produktübernahme|URL-Weiterleitungen|Umstellungsplan",
        "Händler beim Wechsel des Shopsystems.",
        "Relevante Daten und Produktadressen werden beim Plattformwechsel berücksichtigt.",
      ],
      [
        "Produktkonfiguratoren",
        "Besucher stellen Produkte aus zulässigen Varianten zusammen und sehen nachvollziehbare Preise.",
        "Variantenregeln|Preisberechnung|Konfigurationsansicht|Bestellübergabe",
        "Individualisierbare Waren und zusammengesetzte Produkte.",
        "Unzulässige Kombinationen werden vermieden und Angebote präziser.",
      ],
      [
        "Headless Commerce",
        "Shopverwaltung und Frontend getrennt entwickeln, wenn mehrere Kanäle oder besondere Oberflächen gefragt sind.",
        "Commerce-API|Eigenes Frontend|Katalogsynchronisierung|Checkout-Anbindung",
        "Marken mit individuellen Frontends oder mehreren Verkaufskanälen.",
        "Die Darstellung kann unabhängig vom Kern des Shopsystems weiterentwickelt werden.",
      ],
    ],
  },
  {
    slug: "software",
    name: "Software und Webanwendungen",
    short: "Software",
    description:
      "Browserbasierte Werkzeuge für deine Abläufe. Vom Kundenportal bis zur eigenen SaaS-Plattform.",
    approach: [
      "Arbeitsabläufe und Berechtigungen aufnehmen",
      "Datenmodell und erste nutzbare Version planen",
      "Funktionen schrittweise entwickeln",
      "Abnahme, Dokumentation und Betrieb vereinbaren",
    ],
    rows: [
      [
        "Individuelle Webanwendungen",
        "Eine browserbasierte Anwendung, die konkrete Aufgaben deines Teams abbildet.",
        "Eigene Datenmodelle|Benutzerrollen|Arbeitsoberflächen|Prozesslogik",
        "Abläufe, für die verfügbare Standardsoftware nicht passt.",
        "Werkzeuge folgen den tatsächlichen Aufgaben deiner Nutzer.",
      ],
      [
        "SaaS-Plattformen",
        "Ein Softwareprodukt für mehrere Kunden mit getrennten Daten und einer planbaren Produktarchitektur.",
        "Mandantenfähigkeit|Abonnements|Nutzerverwaltung|Produktadministration",
        "Start-ups und Unternehmen mit einem Software-Geschäftsmodell.",
        "Neue Kunden nutzen dieselbe Plattform mit kontrolliertem Zugriff auf ihre Daten.",
      ],
      [
        "Cloudsoftware",
        "Eine zentral betriebene Anwendung, die über den Browser an mehreren Standorten erreichbar ist.",
        "Cloudarchitektur|Zugriffskontrolle|Bereitstellung|Betriebsprotokolle",
        "Verteilte Teams mit gemeinsamem Datenbedarf.",
        "Installation und Updates an jedem einzelnen Arbeitsplatz entfallen.",
      ],
      [
        "CRM-Systeme",
        "Kontakte, Vorgänge und Vertriebsaktivitäten in einem auf deine Kundenprozesse abgestimmten System.",
        "Kontaktverwaltung|Vertriebsschritte|Aktivitäten|Aufgaben",
        "Vertrieb und Beratung mit individuellen Kundenbeziehungen.",
        "Der Bearbeitungsstand eines Kontakts bleibt im Team nachvollziehbar.",
      ],
      [
        "ERP-Systeme",
        "Geschäftsbereiche auf einer gemeinsamen Datenbasis verbinden, mit bewusst abgegrenztem Projektumfang.",
        "Stammdaten|Bestandsprozesse|Auftragsverwaltung|Schnittstellen",
        "Unternehmen mit mehreren miteinander verbundenen Betriebsabläufen.",
        "Doppelte Dateneingaben lassen sich an den vereinbarten Übergängen reduzieren.",
      ],
      [
        "Verwaltungssoftware",
        "Wiederkehrende Verwaltungsaufgaben digital abbilden und Zuständigkeiten klar machen.",
        "Vorgangsverwaltung|Freigaben|Formulare|Statusübersichten",
        "Organisationen mit manuellen administrativen Prozessen.",
        "Vorgänge und Verantwortliche sind an einer Stelle sichtbar.",
      ],
      [
        "Kundenportale",
        "Kunden greifen auf ihre Dokumente, Anfragen und den Stand ihrer Vorgänge zu.",
        "Kundenzugänge|Dokumentenbereich|Anfragen|Statusanzeige",
        "Dienstleister mit regelmäßigem Informationsaustausch.",
        "Kunden erhalten einen geordneten Zugriff auf ihre eigenen Informationen.",
      ],
      [
        "Mitarbeiterportale",
        "Interne Informationen und Selbstbedienungsfunktionen für Beschäftigte zusammenführen.",
        "Mitarbeiterzugänge|Interne Nachrichten|Anträge|Rollenrechte",
        "Unternehmen mit zentralen Personal- und Informationsabläufen.",
        "Wiederkehrende interne Anfragen können direkt im Portal gestellt werden.",
      ],
      [
        "Unternehmens-Dashboards",
        "Relevante Kennzahlen und Vorgänge aus vereinbarten Datenquellen auf einer klaren Oberfläche zeigen.",
        "Datenanbindung|Kennzahlendefinition|Filter|Visualisierung",
        "Teams, die operative Informationen regelmäßig vergleichen.",
        "Entscheidungen nutzen konsistent definierte Zahlen statt verstreuter Berichte.",
      ],
      [
        "Buchungssysteme",
        "Buchbare Leistungen, Kapazitäten und Kundendaten nach deinen Geschäftsregeln verwalten.",
        "Verfügbarkeit|Buchungsregeln|Bestätigungen|Kalenderanbindung",
        "Kursanbieter und Dienstleister mit buchbaren Kapazitäten.",
        "Konflikte können bereits bei der Buchung erkannt werden.",
      ],
      [
        "Reservierungssysteme",
        "Ressourcen für einen Zeitraum reservieren, mit klarer Belegung und geregelter Stornierung.",
        "Ressourcenkalender|Reservierungen|Stornierungen|Kapazitätsprüfung",
        "Räume, Tische, Geräte und Mietangebote.",
        "Mehrfachbelegungen werden durch zentrale Verfügbarkeitsprüfung vermieden.",
      ],
      [
        "Planungssysteme",
        "Personal, Aufgaben und Ressourcen zeitlich koordinieren und Änderungen sichtbar machen.",
        "Planungsansicht|Ressourcenzuordnung|Konflikthinweise|Änderungshistorie",
        "Einsatzplanung und wiederkehrende operative Aufgaben.",
        "Abhängigkeiten zwischen Aufgaben und verfügbaren Ressourcen werden erkennbar.",
      ],
      [
        "Intranetlösungen",
        "Ein geschützter Einstieg in interne Informationen, Werkzeuge und Teamwissen.",
        "Interne Suche|Wissensseiten|Zugriffsrollen|Werkzeugverknüpfung",
        "Unternehmen mit umfangreichen internen Informationsbeständen.",
        "Teamwissen wird über eine gemeinsame Struktur zugänglich.",
      ],
      [
        "Progressive Web Apps",
        "Eine installierbare Webanwendung mit gezielt geplanten Offline-Funktionen.",
        "Installationsfähigkeit|Service Worker|Offline-Konzept|Synchronisierung",
        "Mobile Arbeitsabläufe mit zeitweise schwacher Verbindung.",
        "Geeignete Funktionen stehen auch bei unterbrochener Verbindung zur Verfügung.",
      ],
      [
        "Projektmanagementsoftware",
        "Aufgaben, Zuständigkeiten und Projektstände passend zur Arbeitsweise deines Teams verwalten.",
        "Aufgabenboards|Meilensteine|Teamrollen|Projektübersichten",
        "Teams mit eigenen Projektabläufen und Berichtspflichten.",
        "Arbeitsstand und nächste Schritte werden gemeinsam sichtbar.",
      ],
      [
        "Dokumentenmanagement",
        "Dokumente geordnet ablegen, versionieren und nur berechtigten Personen zugänglich machen.",
        "Versionierung|Metadaten|Dokumentensuche|Zugriffsrechte",
        "Teams mit vielen gemeinsam bearbeiteten Dokumenten.",
        "Aktuelle Versionen und zugehörige Vorgänge sind leichter auffindbar.",
      ],
      [
        "Mitgliederverwaltung",
        "Mitgliedsdaten, Beiträge und organisatorische Abläufe in einem Verwaltungssystem zusammenführen.",
        "Mitgliederstammdaten|Beitragsübersicht|Kommunikation|Import und Export",
        "Vereine und Verbände mit wiederkehrender Mitgliederbetreuung.",
        "Verantwortliche arbeiten mit einem gemeinsamen, gepflegten Mitgliederbestand.",
      ],
      [
        "Individuelle Datenbankanwendungen",
        "Strukturierte Daten erfassen, prüfen und auswerten – mit einer passenden Bedienoberfläche.",
        "Datenmodell|Eingabeprüfung|Abfragen|Auswertungen",
        "Fachprozesse, die bisher über komplexe Tabellen organisiert werden.",
        "Zusammengehörige Daten bleiben konsistent und gezielt abrufbar.",
      ],
    ],
  },
  {
    slug: "ki-automatisierung",
    name: "KI, Automatisierung und Integrationen",
    short: "KI & Integrationen",
    description:
      "Systeme verbinden und wiederkehrende Arbeit reduzieren. KI dort einsetzen, wo sie eine konkrete Aufgabe unterstützt.",
    approach: [
      "Datenflüsse und manuelle Schritte aufnehmen",
      "Schnittstellen, Risiken und Freigaben definieren",
      "Integration mit Fehlerbehandlung umsetzen",
      "Überwachung und Verantwortlichkeiten übergeben",
    ],
    rows: [
      [
        "API-Entwicklung",
        "Eine dokumentierte Schnittstelle, über die andere Systeme kontrolliert auf Funktionen und Daten zugreifen.",
        "Endpunktdesign|Authentifizierung|Versionierung|API-Dokumentation",
        "Softwareprodukte und interne Dienste mit externen Verbrauchern.",
        "Daten und Funktionen können über klare Verträge genutzt werden.",
      ],
      [
        "API-Integrationen",
        "Vorhandene Anwendungen über ihre Schnittstellen verbinden und Daten abgestimmt übertragen.",
        "Anbieteranbindung|Datenmapping|Fehlerbehandlung|Synchronisierung",
        "Teams mit mehreren voneinander getrennten Softwarewerkzeugen.",
        "Manuelle Übertragungen zwischen Systemen werden reduziert.",
      ],
      [
        "Individuelle Schnittstellen",
        "Eine Verbindung für Datenformate oder Prozesse, die keine passende Standardintegration besitzen.",
        "Formatumwandlung|Übertragungslogik|Protokollierung|Zugriffsschutz",
        "Altsysteme und fachlich besondere Systemkombinationen.",
        "Auch spezielle Anwendungen können in bestehende Abläufe eingebunden werden.",
      ],
      [
        "KI-Chatbots",
        "Ein Assistent, der auf freigegebene Inhalte zurückgreift und bei ungeklärten Fragen an Menschen übergibt.",
        "Wissensquellen|Antwortbegrenzung|Menschliche Übergabe|Datenschutzkonzept",
        "Häufige Servicefragen zu dokumentierten Angeboten.",
        "Routinefragen erhalten einen zusätzlichen Antwortweg mit klaren Grenzen.",
      ],
      [
        "KI-gestützte Webanwendungen",
        "KI-Funktionen in eine nutzbare Oberfläche integrieren, mit kontrollierten Eingaben und überprüfbaren Ergebnissen.",
        "Modellanbindung|Nutzeroberfläche|Ergebnisprüfung|Nutzungslimits",
        "Fachliche Assistenzfunktionen in einem eigenen Produkt.",
        "Nutzer können KI innerhalb eines klar umrissenen Arbeitsablaufs einsetzen.",
      ],
      [
        "Workflow-Automatisierung",
        "Wiederkehrende Arbeitsschritte anhand definierter Auslöser und Regeln miteinander verknüpfen.",
        "Auslöser|Bedingungen|Aktionsketten|Fehlerprotokolle",
        "Benachrichtigungen, Datenübertragung und interne Freigabeabläufe.",
        "Gleichartige Schritte laufen konsistent und nachvollziehbar ab.",
      ],
      [
        "Geschäftsprozessautomatisierung",
        "Einen gesamten Fachprozess mit Verantwortlichkeiten, Ausnahmefällen und Kontrollpunkten digital unterstützen.",
        "Prozessmodell|Freigabestufen|Systemanbindung|Statusüberwachung",
        "Mehrstufige Auftrags- und Verwaltungsprozesse.",
        "Übergaben zwischen Teams und Systemen werden gezielt koordiniert.",
      ],
      [
        "Datenbankentwicklung",
        "Eine passende Datenstruktur mit Beziehungen, Zugriffsregeln und belastbaren Abfragen aufbauen.",
        "Datenmodellierung|Indizes|Zugriffsrichtlinien|Migrationen",
        "Neue Anwendungen oder gewachsene Datenbestände.",
        "Ein klares Datenmodell schafft eine verlässliche Grundlage für weitere Funktionen.",
      ],
      [
        "Backend-Entwicklung",
        "Die serverseitige Logik für Datenverarbeitung, Berechtigungen und Geschäftsregeln entwickeln.",
        "Serverlogik|Authentifizierung|Validierung|Hintergrundaufgaben",
        "Webanwendungen mit Anforderungen jenseits der Oberfläche.",
        "Kritische Regeln werden zentral auf dem Server durchgesetzt.",
      ],
      [
        "Zahlungsintegrationen",
        "Zahlungen mit passenden Anbietern anbinden und Ereignisse sicher im eigenen System verarbeiten.",
        "Zahlungs-API|Signaturprüfung|Statusabgleich|Erstattungsablauf",
        "Plattformen, Mitgliedschaften und kostenpflichtige Anwendungen.",
        "Deine Anwendung kann auf bestätigte Zahlungsvorgänge zuverlässig reagieren.",
      ],
      [
        "CRM-Integrationen",
        "Kontakt- und Vorgangsdaten aus Websites oder Fachsystemen in dein CRM übertragen.",
        "Kontaktmapping|Dublettenregeln|Statussynchronisierung|Fehlerwarteschlange",
        "Vertriebsteams mit digitalen Anfragekanälen.",
        "Neue Kontakte kommen geordnet im vorgesehenen Vertriebsablauf an.",
      ],
      [
        "E-Mail-Integrationen",
        "Transaktionale Nachrichten mit Vorlagen, Zustellstatus und geeigneter Versandtechnik verbinden.",
        "SMTP oder Versand-API|Nachrichtenvorlagen|Zustellereignisse|Abmeldeabläufe bei Bedarf",
        "Bestätigungen, Systemmeldungen und abonnierte Informationen.",
        "Nachrichten werden durch konkrete Ereignisse ausgelöst und nachvollziehbar versendet.",
      ],
      [
        "Webhooks",
        "Systemereignisse zeitnah empfangen oder versenden, mit Signaturprüfung und Schutz vor doppelter Verarbeitung.",
        "Ereignisendpunkte|Signaturen|Wiederholungslogik|Idempotenz",
        "Zahlungsanbieter, Shops und ereignisbasierte Dienste.",
        "Verbundene Systeme müssen Änderungen nicht laufend selbst abfragen.",
      ],
      [
        "Datenmigration",
        "Daten kontrolliert in eine neue Struktur übertragen und die Ergebnisse nachvollziehbar abgleichen.",
        "Quellanalyse|Transformationsregeln|Probeübertragung|Abgleich",
        "Systemwechsel und Zusammenführung von Datenbeständen.",
        "Ein geplanter Transfer vermindert unbemerkte Verluste und Zuordnungsfehler.",
      ],
      [
        "Import- und Exportsysteme",
        "Dateien und Datenbestände nach vereinbarten Formaten übernehmen oder bereitstellen.",
        "CSV und JSON|Feldzuordnung|Validierung|Fehlerbericht",
        "Regelmäßiger Datenaustausch mit Partnern und Fachsystemen.",
        "Ungültige Datensätze werden vor der Übernahme erkennbar.",
      ],
      [
        "Automatische Dokumentenverarbeitung",
        "Informationen aus Dokumenten extrahieren und bei Unsicherheit zur menschlichen Prüfung vorlegen.",
        "Texterkennung|Feldextraktion|Prüfwarteschlange|Systemübergabe",
        "Rechnungen, Anträge und wiederkehrende Formulardokumente.",
        "Strukturierte Informationen entstehen mit weniger manueller Erfassung.",
      ],
      [
        "KI-Suchfunktionen",
        "Inhalte nach ihrer Bedeutung durchsuchen und Ergebnisse mit ihren Quellen verknüpfen.",
        "Semantischer Index|Berechtigungsfilter|Quellenanzeige|Suchoberfläche",
        "Wissenssammlungen mit unterschiedlichen Formulierungen für ähnliche Themen.",
        "Nutzer können auch mit eigenen Worten passende Inhalte finden.",
      ],
      [
        "Individuelle KI-Funktionen",
        "Eine klar definierte Aufgabe mit einer passenden Modellintegration und messbaren Qualitätskriterien unterstützen.",
        "Aufgabendefinition|Modellauswahl|Qualitätsbewertung|Kontrollmechanismen",
        "Spezielle Assistenz-, Klassifikations- und Aufbereitungsaufgaben.",
        "Der Nutzen wird an einer konkreten Aufgabe geprüft, bevor die Funktion erweitert wird.",
      ],
    ],
  },
  {
    slug: "optimierung",
    name: "Optimierung und Online-Marketing",
    short: "Optimierung",
    description:
      "Bestehende Auftritte verständlicher, schneller und besser auffindbar machen. Mit nachvollziehbaren Maßnahmen.",
    approach: [
      "Ist-Zustand und relevante Ziele erfassen",
      "Befunde nach Nutzen und Aufwand priorisieren",
      "Vereinbarte Maßnahmen umsetzen",
      "Ergebnisse dokumentieren und weitere Schritte ableiten",
    ],
    rows: [
      [
        "Suchmaschinenoptimierung",
        "Inhalte und technische Struktur so ordnen, dass Suchmaschinen dein Angebot besser verstehen können.",
        "Suchintention|Seitenstruktur|Metadaten|Interne Verlinkung",
        "Websites, die relevante Suchanfragen gezielter beantworten möchten.",
        "Inhalte bekommen klare Themen und nachvollziehbare Verbindungen; Rankings sind nicht garantiert.",
      ],
      [
        "Generative Engine Optimization",
        "Fachliche Inhalte präzise strukturieren, damit auch KI-gestützte Suchsysteme Aussagen einordnen können.",
        "Klare Antworten|Quellenbezüge|Entitäten|Maschinenlesbare Struktur",
        "Unternehmen mit erklärungsbedürftigen Fachleistungen.",
        "Informationen werden leichter interpretierbar; eine Erwähnung durch KI-Systeme ist nicht garantiert.",
      ],
      [
        "Technisches SEO",
        "Crawling, Indexierung und Seitenadressen prüfen und technische Hindernisse beheben.",
        "Indexierungsanalyse|Canonicals|Sitemaps|Weiterleitungen",
        "Websites mit technischen Auffindbarkeitsproblemen.",
        "Suchmaschinen können relevante Seiten konsistenter erfassen.",
      ],
      [
        "Local SEO",
        "Standortbezogene Informationen auf der Website und geeigneten Unternehmensprofilen abstimmen.",
        "Standortseiten|Profildaten|Lokale Inhalte|Kontaktkonsistenz",
        "Dienstleister mit einem tatsächlichen regionalen Einzugsgebiet.",
        "Interessenten finden nachvollziehbare Informationen zum lokalen Angebot.",
      ],
      [
        "Website-Performance",
        "Ladezeiten und Auslieferung anhand konkreter Engpässe verbessern.",
        "Bildoptimierung|Caching|Bundle-Analyse|Serverauslieferung",
        "Websites mit langsamen Seiten oder unnötigen Datenmengen.",
        "Besucher können Inhalte früher sehen und bedienen.",
      ],
      [
        "Core Web Vitals",
        "Ladeverhalten, Reaktionsfähigkeit und Layoutstabilität anhand der relevanten Messgrößen untersuchen.",
        "LCP-Analyse|INP-Analyse|CLS-Analyse|Feld- und Labordaten",
        "Websites mit messbaren Problemen bei der Nutzung.",
        "Verbesserungen richten sich nach tatsächlichen Ursachen statt pauschalen Punktwerten.",
      ],
      [
        "UI/UX-Optimierung",
        "Die Oberfläche und ihre Abläufe so überarbeiten, dass Nutzer Aufgaben leichter erledigen können.",
        "Nutzerwege|Informationsarchitektur|Bedienelemente|Prototypen",
        "Anwendungen mit unklarer Navigation oder komplizierten Abläufen.",
        "Häufige Aufgaben brauchen weniger Erklärung und unnötige Schritte.",
      ],
      [
        "Conversionoptimierung",
        "Hindernisse auf dem Weg zu Anfrage oder Kauf erkennen und gezielt verändern.",
        "Zieldefinition|Formularanalyse|Handlungsführung|Variantenplanung",
        "Websites mit Besuchern, aber unklaren Abschlusswegen.",
        "Änderungen beziehen sich auf konkrete Nutzerhandlungen; Ergebnisse hängen vom Kontext ab.",
      ],
      [
        "Barrierefreiheit",
        "Zugänglichkeit für unterschiedliche Nutzungsweisen prüfen und festgestellte Hürden bearbeiten.",
        "Tastaturbedienung|Kontrastprüfung|Semantik|Screenreader-Struktur",
        "Öffentliche Angebote und Produkte mit einem breiten Nutzerkreis.",
        "Mehr Menschen können wesentliche Inhalte und Funktionen selbstständig nutzen.",
      ],
      [
        "Technische Website-Analyse",
        "Den technischen Zustand einer Website nachvollziehbar erfassen und Handlungsbedarf priorisieren.",
        "Architekturprüfung|Fehleranalyse|Sicherheitsbefunde|Maßnahmenbericht",
        "Unternehmen vor einem Relaunch oder einer technischen Übernahme.",
        "Du erhältst eine geordnete Entscheidungsgrundlage für die nächsten Arbeiten.",
      ],
      [
        "Webanalyse",
        "Ein datensparsames Messkonzept für die tatsächlichen Fragen deines Unternehmens entwickeln.",
        "Messplan|Tool-Auswahl|Datenschutzkonzept|Auswertungen",
        "Websites, deren Nutzung nachvollziehbar ausgewertet werden soll.",
        "Berichte beantworten definierte Fragen statt möglichst viele Daten zu sammeln.",
      ],
      [
        "Conversion-Tracking",
        "Vereinbarte Zielhandlungen messen und die Einwilligungsverwaltung in den Ablauf einbeziehen.",
        "Ereignisdefinition|Consent-Anbindung|Datenprüfung|Zielberichte",
        "Kampagnen mit messbaren Anfrage- oder Kaufzielen.",
        "Abschlüsse lassen sich im vereinbarten und zulässigen Messumfang zuordnen.",
      ],
      [
        "Online-Marketing",
        "Digitale Maßnahmen um ein konkretes Angebot und eine passende Zielgruppe organisieren.",
        "Kanalplanung|Kampagnenstruktur|Landingpages|Auswertung",
        "Unternehmen mit klar definierten Angeboten und Kampagnenzielen.",
        "Budget und Inhalte folgen einem abgestimmten Plan; Werbekosten werden separat vereinbart.",
      ],
      [
        "Landingpage-Optimierung",
        "Eine bestehende Angebotsseite in Inhalt, Reihenfolge und Anfrageführung verbessern.",
        "Angebotsklarheit|Mobile Lesbarkeit|Formularprüfung|Handlungsaufforderung",
        "Kampagnenseiten mit unklarer Botschaft oder unnötigen Ablenkungen.",
        "Besucher können das Angebot und den nächsten Schritt leichter verstehen.",
      ],
      [
        "Content-Optimierung",
        "Vorhandene Inhalte fachlich präzisieren, kürzen und passend zu den Fragen der Zielgruppe ordnen.",
        "Inhaltsprüfung|Textstruktur|Themenabdeckung|Redaktionelle Überarbeitung",
        "Gewachsene Websites mit doppelten oder veralteten Texten.",
        "Wichtige Informationen werden klarer und unnötige Wiederholungen entfallen.",
      ],
      [
        "Strukturierte Daten",
        "Tatsächliche Seiteninhalte mit passenden maschinenlesbaren Auszeichnungen ergänzen.",
        "Schema-Auswahl|JSON-LD|Inhaltsabgleich|Validierung",
        "Websites mit Produkten, Artikeln und anderen klar zuordenbaren Inhalten.",
        "Suchsysteme erhalten eindeutige Angaben; erweiterte Suchdarstellungen sind nicht garantiert.",
      ],
    ],
  },
  {
    slug: "betreuung",
    name: "Hosting, Wartung und Support",
    short: "Betreuung",
    description:
      "Nach dem Start weiter gut aufgestellt. Mit vereinbartem Betrieb, regelmäßiger Pflege und klar begrenztem Support.",
    approach: [
      "Systemzustand und Zugänge aufnehmen",
      "Leistungsumfang und Zuständigkeiten vereinbaren",
      "Betrieb und Pflege einrichten",
      "Durchgeführte Arbeiten regelmäßig dokumentieren",
    ],
    rows: [
      [
        "Webhosting",
        "Deine Website auf einer passenden Hostingplattform bereitstellen und ihre grundlegende Auslieferung einrichten.",
        "Anbieterauswahl|Deployment|TLS|Betriebsübergabe",
        "Neue Websites ohne bestehende Hostingumgebung.",
        "Die Website erhält eine zu ihrem technischen Aufbau passende Betriebsgrundlage.",
      ],
      [
        "Domainverwaltung",
        "Domain, DNS-Einträge und relevante Zuständigkeiten übersichtlich einrichten und dokumentieren.",
        "DNS-Konfiguration|Domainanbindung|Verlängerungsübersicht|Zugangsverwaltung",
        "Unternehmen mit neuen oder mehreren Domains.",
        "Technische Einträge und Eigentumsverhältnisse bleiben nachvollziehbar.",
      ],
      [
        "Managed Hosting",
        "Hosting mit einem vereinbarten technischen Betreuungsumfang für Betrieb und wiederkehrende Aufgaben.",
        "Betriebsverwaltung|Updateplanung|Backup-Konzept|Supportumfang",
        "Unternehmen, die technische Betriebsaufgaben abgeben möchten.",
        "Verantwortlichkeiten werden vertraglich klar zugeordnet.",
      ],
      [
        "Cloudhosting",
        "Anwendungen in einer passenden Cloudumgebung mit getrennten Konfigurationen und kontrollierten Zugängen betreiben.",
        "Cloudressourcen|Umgebungen|Zugriffsrechte|Kostenübersicht",
        "Webanwendungen mit serverseitigen Funktionen.",
        "Ressourcen und Berechtigungen lassen sich auf den tatsächlichen Bedarf abstimmen.",
      ],
      [
        "Website-Wartung",
        "Vereinbarte Komponenten regelmäßig prüfen und notwendige technische Pflege geordnet durchführen.",
        "Komponentenprüfung|Updateplanung|Funktionskontrolle|Wartungsprotokoll",
        "Websites, die nach Veröffentlichung technisch gepflegt werden sollen.",
        "Veraltete Komponenten und erkennbare Probleme werden regelmäßig betrachtet.",
      ],
      [
        "Sicherheitsupdates",
        "Relevante Aktualisierungen bewerten und mit Rückfallmöglichkeit in das bestehende System übernehmen.",
        "Updatebewertung|Datensicherung|Installation|Nachkontrolle",
        "Systeme mit aktiv gepflegten Frameworks und Erweiterungen.",
        "Bekannte Schwachstellen können durch passende Aktualisierungen geschlossen werden.",
      ],
      [
        "Technischer Support",
        "Technische Fragen und Störungen innerhalb eines klar vereinbarten Unterstützungsumfangs bearbeiten.",
        "Anfrageannahme|Fehlereingrenzung|Lösungsvorschläge|Arbeitsdokumentation",
        "Betreiber mit gelegentlichem technischem Unterstützungsbedarf.",
        "Anliegen bekommen einen geordneten Bearbeitungsweg ohne unbegrenzte Leistungsversprechen.",
      ],
      [
        "Website-Pflege",
        "Texte, Bilder und kleinere Seitenänderungen nach deinen Vorgaben einarbeiten.",
        "Inhaltsänderungen|Bildaufbereitung|Linkpflege|Veröffentlichung",
        "Unternehmen ohne eigene redaktionelle Kapazitäten.",
        "Der Auftritt kann aktuell bleiben, ohne dass dein Team die Änderungen selbst einpflegt.",
      ],
      [
        "WordPress-Wartung",
        "WordPress, Themes und Plugins als zusammenhängendes System technisch betreuen.",
        "Pluginprüfung|WordPress-Updates|Backup-Kontrolle|Kompatibilitätsprüfung",
        "Bestehende WordPress-Websites.",
        "Aktualisierungen berücksichtigen die Abhängigkeiten des gesamten Auftritts.",
      ],
      [
        "Shop-Wartung",
        "Die technische Pflege eines Shops auf Katalog, Checkout und bestehende Anbindungen abstimmen.",
        "Shopupdates|Checkout-Kontrolle|Integrationsprüfung|Wartungsfenster",
        "Laufende Onlineshops mit mehreren technischen Komponenten.",
        "Wartung berücksichtigt die besonders wichtigen Verkaufsabläufe.",
      ],
      [
        "Website-Migration",
        "Eine Website geplant in eine neue Hostingumgebung übertragen und den Domainwechsel koordinieren.",
        "Systemübernahme|Datenübertragung|DNS-Wechsel|Nachkontrolle",
        "Websites beim Wechsel des Hostinganbieters.",
        "Die Umstellung bekommt einen klaren Ablauf mit dokumentierten Zuständigkeiten.",
      ],
      [
        "Fehlerbehebung",
        "Ein konkretes technisches Problem eingrenzen, seine Ursache bearbeiten und die Änderung dokumentieren.",
        "Reproduktion|Ursachenanalyse|Korrektur|Funktionsprüfung",
        "Defekte Formulare, Darstellungsfehler und fehlerhafte Anwendungen.",
        "Das beobachtete Problem wird mit einer nachvollziehbaren Korrektur bearbeitet.",
      ],
      [
        "Backup-Lösungen",
        "Sicherungen mit abgestimmten Intervallen, Aufbewahrung und einem Wiederherstellungsplan einrichten.",
        "Sicherungsumfang|Aufbewahrungsregeln|Verschlüsselung|Wiederherstellungskonzept",
        "Websites und Anwendungen mit veränderlichen Daten.",
        "Bei Datenverlust steht ein geplanter Weg zur Wiederherstellung bereit.",
      ],
      [
        "Sicherheitsoptimierung",
        "Die Angriffsfläche eines bestehenden Systems anhand konkreter Konfigurationen und Berechtigungen reduzieren.",
        "Zugriffsprüfung|Sicherheitsheader|Konfigurationshärtung|Abhängigkeitsprüfung",
        "Webanwendungen vor einer Übergabe oder nach technischen Befunden.",
        "Erkennbare Risiken werden geordnet behandelt; absolute Sicherheit ist nicht versprochen.",
      ],
      [
        "Monitoring",
        "Erreichbarkeit und ausgewählte Betriebszustände beobachten und relevante Ereignisse melden.",
        "Erreichbarkeitsprüfung|Alarmregeln|Betriebsmetriken|Berichte",
        "Websites und Dienste mit regelmäßigem Kontrollbedarf.",
        "Vereinbarte Störungen werden sichtbar und können gezielt bearbeitet werden.",
      ],
      [
        "Monatliche Betreuungspakete",
        "Wiederkehrende Pflege und Unterstützung in einem überschaubaren monatlichen Umfang vereinbaren.",
        "Definiertes Zeitkontingent|Pflegeplan|Supportkanal|Monatliche Dokumentation",
        "Unternehmen, die nach dem Projekt einen festen Ansprechpartner benötigen.",
        "Aufgaben, enthaltene Zeiten und zusätzliche Kosten bleiben transparent.",
      ],
    ],
  },
];
export const categories: Category[] = definitions.map(
  ({ rows, ...category }) => ({
    ...category,
    services: rows.map(([name, intro, features, useCase, benefit]) => ({
      slug: slugify(name),
      name,
      intro,
      features: features.split("|"),
      useCase,
      benefit,
      category: category.slug,
      price:
        name === "Landingpages" || name === "One-Pager"
          ? packages[0].price
          : name === "Unternehmenswebsites"
            ? packages[1].price
            : ["Onlineshops", "Shopify-Shops", "WooCommerce-Shops"].includes(
                  name,
                )
              ? additionalPrices[0][1]
              : name === "Monatliche Betreuungspakete"
                ? carePackages[0].price
                : null,
    })),
  }),
);
export const services = categories.flatMap((category) => category.services);
export const serviceHref = (service: Service) =>
  `/leistungen/${service.category}/${service.slug}`;
export const serviceFaqs = (s: Service) => [
  { question: `Für welche Projekte eignet sich ${s.name}?`, answer: s.useCase },
  {
    question: `Was gehört bei ${s.name} zum Leistungsumfang?`,
    answer: `Wir planen insbesondere ${s.features.join(", ")}. Welche Funktionen enthalten sind, halten wir im Angebot fest.`,
  },
  {
    question: `Was wird für die Planung von ${s.name} benötigt?`,
    answer: `Beschreibe deinen Anwendungsfall und vorhandene Systeme. Besonders hilfreich sind Angaben zu ${s.features[0].toLowerCase()} und ${s.features[1].toLowerCase()}.`,
  },
  {
    question: `Kann ${s.name} später erweitert werden?`,
    answer: `Erweiterungen planen wir anhand der bestehenden Architektur. Ein möglicher nächster Schritt ist ${s.features[s.features.length - 1].toLowerCase()}; Aufwand und Betriebskosten stimmen wir vorher ab.`,
  },
];
