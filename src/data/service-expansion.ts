// Service rows share the existing catalogue format: name, introduction,
// deliverables, application and benefit. Existing URLs remain canonical.
export type ServiceRow = [string, string, string, string, string];
export type ServiceDefinition = {
  slug: string;
  name: string;
  short: string;
  description: string;
  approach: string[];
  rows: ServiceRow[];
};
export const expansionDate = "2026-10-19";
export const websitePlatformRows: ServiceRow[] = [
  [
    "WordPress-Websites",
    "WordPress-Websites mit passenden Inhaltsvorlagen, klarer Navigation und einer Verwaltung für dein Team.",
    "WordPress-Einrichtung|Theme und Seitenvorlagen|Redaktionsrollen|Einweisung und Übergabe",
    "Unternehmen mit regelmäßig gepflegten Seiten, Projekten oder Beiträgen.",
    "Deine Redaktion kann Inhalte innerhalb eines abgestimmten Gestaltungssystems bearbeiten.",
  ],
  [
    "Wix-Websites",
    "Eine Wix-Website einrichten oder überarbeiten – mit abgestimmten Seiten, Inhalten und Anfragewegen.",
    "Wix-Konfiguration|Designanpassung|Formulare und Domain|Einweisung",
    "Kleine Unternehmen, die ihre Website auf einer betreuten Baukastenplattform verwalten möchten.",
    "Du erhältst eine nutzbare Seitenstruktur und eine verständliche Übergabe statt eines ungeordneten Vorlagenstarts.",
  ],
  [
    "Squarespace-Websites",
    "Squarespace für deinen Unternehmensauftritt konfigurieren und vorhandene Gestaltungsmöglichkeiten gezielt einsetzen.",
    "Vorlagenauswahl|Seiten- und Bildgestaltung|Domainanbindung|Redaktionelle Übergabe",
    "Dienstleister und kreative Unternehmen mit einem klar begrenzten Inhaltsumfang.",
    "Inhalte und Bildsprache werden auf einer gemeinsam pflegbaren Plattform zusammengeführt.",
  ],
  [
    "Webflow-Websites",
    "Webflow-Websites mit eigener Gestaltung, wiederverwendbaren Komponenten und geplanten CMS-Inhalten umsetzen.",
    "Responsives Layout|Webflow-Komponenten|CMS-Struktur|Redaktionseinweisung",
    "Unternehmen mit individuellen Gestaltungswünschen und strukturierten redaktionellen Inhalten.",
    "Gestaltung und Inhaltsverwaltung werden zusammen geplant, damit spätere Änderungen nachvollziehbar bleiben.",
  ],
  [
    "Jimdo-Websites",
    "Einen Jimdo-Auftritt für dein Angebot aufbauen, Inhalte ordnen und die verfügbaren Funktionen passend konfigurieren.",
    "Systemeinrichtung|Inhaltsstruktur|Darstellungsanpassung|Kontakt- und Domainanbindung",
    "Selbstständige und kleine Betriebe mit einem kompakten Informationsangebot.",
    "Die Website konzentriert sich auf das benötigte Angebot und einen gut auffindbaren Kontakt.",
  ],
  [
    "Weitere Website-Baukästen",
    "Eine vorhandene Baukastenlösung prüfen, einrichten oder weiterentwickeln – anhand ihrer tatsächlichen Möglichkeiten.",
    "Systemprüfung|Vorlagenanpassung|Inhaltseinrichtung|Übergabe und Grenzen",
    "Unternehmen mit einem anderen Baukastensystem oder einer noch offenen Plattformwahl.",
    "Vor einer Umsetzung wird klar, welche Anforderungen das vorhandene System abdecken kann.",
  ],
  [
    "CMS-Einrichtung und Konfiguration",
    "Ein bestehendes Redaktionssystem mit geeigneten Inhaltsmodellen, Benutzerrollen und Veröffentlichungsregeln einrichten.",
    "Installations- und Konfigurationsumfang|Inhaltsmodelle|Benutzerrechte|Veröffentlichungsablauf",
    "Teams, deren gewähltes CMS noch nicht auf die tägliche Redaktion abgestimmt ist.",
    "Verantwortliche erhalten einen definierten Weg vom Entwurf bis zur Veröffentlichung.",
  ],
  [
    "Themes und Designanpassungen",
    "Vorhandene Themes an deine Marke anpassen oder eigene Vorlagen innerhalb der Möglichkeiten des gewählten Systems entwickeln.",
    "Theme-Bestandsaufnahme|Individuelle Vorlagen|Responsive Anpassungen|Änderungsdokumentation",
    "Websites und Shops mit unpassenden Vorlagen oder wiederkehrenden Darstellungsproblemen.",
    "Das Erscheinungsbild wird konsistent, ohne Änderungen und Systemabhängigkeiten aus dem Blick zu verlieren.",
  ],
  [
    "Plugins und Erweiterungen",
    "CMS- und Shop-Erweiterungen auswählen, konfigurieren und bei Bedarf um abgestimmte eigene Funktionen ergänzen.",
    "Anforderungsabgleich|Plugin-Auswahl|Konfiguration und Anbindung|Kompatibilität und Übergabe",
    "Betreiber, die konkrete Funktionen ergänzen oder eine gewachsene Plugin-Sammlung ordnen möchten.",
    "Erweiterungen werden nach Bedarf, Abhängigkeiten und laufenden Kosten statt allein nach Funktionslisten ausgewählt.",
  ],
  [
    "CMS- und Shop-Schulungen",
    "Dein Team anhand der eigenen Website oder des eigenen Shops in die vereinbarte Verwaltung einarbeiten.",
    "Schulungsplan|Inhalte und Produkte pflegen|Benutzerrollen erklären|Kurzdokumentation",
    "Redaktionen und Händler, die tägliche Änderungen künftig selbst übernehmen möchten.",
    "Die Einweisung orientiert sich an tatsächlichen Aufgaben und klaren Zuständigkeiten.",
  ],
];
export const ecommercePlatformRows: ServiceRow[] = [
  [
    "Shopware-Shops",
    "Shopware-Shops anhand von Sortiment, Verkaufskanälen und bestehenden Betriebsabläufen einrichten oder weiterentwickeln.",
    "Shopware-Konfiguration|Theme-Anpassung|Produktstruktur|Anbindungen und Übergabe",
    "Händler mit strukturierten Katalogen und Anforderungen an ihre Shopprozesse.",
    "Katalog, Gestaltung und Verwaltung folgen einem abgestimmten Handelskonzept.",
  ],
  [
    "Produkt- und Inhaltsmigration",
    "Produkte, Kategorien, Texte und Medien kontrolliert in ein anderes CMS oder Shopsystem übertragen.",
    "Dateninventur und Zuordnung|Importaufbereitung|Medien und Varianten|Abgleich und URL-Plan",
    "Unternehmen beim Wechsel ihrer Website- oder Shopplattform.",
    "Die Übernahme berücksichtigt Datenqualität, Zusammenhänge und bestehende Adressen statt nur einzelne Dateien zu kopieren.",
  ],
];
export const additionalServiceDefinitions: ServiceDefinition[] = [
  {
    slug: "marketing",
    name: "Werbekampagnen und Marketing",
    short: "Marketing",
    description:
      "Digitale, lokale und klassische Werbekampagnen planen, gestalten, einrichten und betreuen. Mit klaren Zielen und getrennt ausgewiesenem Werbebudget.",
    approach: [
      "Zielgruppe, Angebot und Werbeziel klären",
      "Kanal, Werbemittel und Budget abstimmen",
      "Kampagne nach Freigabe einrichten und schalten",
      "Ergebnisse auswerten und Maßnahmen optimieren",
    ],
    rows: [
      [
        "Google Ads",
        "Google-Ads-Kampagnen für dein Angebot planen, einrichten und anhand vereinbarter Ziele laufend betreuen.",
        "Suchkampagnen und Kontostruktur|Anzeigentexte und Zielseiten|Budget- und Gebotsplanung|Auswertung und Optimierung",
        "Unternehmen, die konkrete Nachfrage nach ihren Leistungen oder Produkten über bezahlte Suche erreichen möchten.",
        "Suchbegriffe, Anzeigen und Zielseiten werden aufeinander abgestimmt; Budgeteinsatz und Änderungen bleiben nachvollziehbar.",
      ],
      [
        "Microsoft und Bing Ads",
        "Suchwerbung über Microsoft Advertising mit eigenen Kampagnen, passenden Anzeigen und abgestimmten Zielseiten betreuen.",
        "Kontoeinrichtung|Suchbegriffe und Ausschlüsse|Anzeigen und Zielseiten|Budgetkontrolle und Bericht",
        "Unternehmen, die bezahlte Suchwerbung über Google hinaus einsetzen möchten.",
        "Ein weiterer Suchkanal wird mit eigenen Ergebnissen und einer nachvollziehbaren Budgetzuordnung geführt.",
      ],
      [
        "Meta Ads für Facebook und Instagram",
        "Facebook- und Instagram-Kampagnen gemeinsam unter Meta Ads planen, gestalten und verwalten.",
        "Zielgruppen- und Kampagnenkonzept|Facebook- und Instagram-Motive|Konto- und Anzeigenstruktur|Auswertung und Optimierung",
        "Marken und Dienstleister mit Angeboten, die über Bilder, Videos und wiederholte Ansprache erklärt werden können.",
        "Beide Plattformen folgen einer abgestimmten Botschaft; Motive, Platzierungen und Ergebnisse werden gemeinsam betrachtet.",
      ],
      [
        "TikTok Ads",
        "TikTok-Werbung mit einem auf kurze Videos ausgerichteten Konzept, klarer Botschaft und passender Zielseite umsetzen.",
        "Zielgruppen- und Formatplanung|Kurzvideo-Konzept|Kampagneneinrichtung|Kreativ- und Ergebnisbewertung",
        "Unternehmen mit einem Angebot, das sich in kurzen Videoinhalten verständlich vermitteln lässt.",
        "Inhalt, Einstieg und Handlungsaufforderung werden für den gewählten Videokanal geplant.",
      ],
      [
        "YouTube Ads",
        "YouTube-Kampagnen mit abgestimmten Videoanzeigen, Zielgruppen und einem definierten Weg zur Anfrage oder zum Kauf betreuen.",
        "Videokampagnen-Konzept|Spot und Anzeigenvarianten|Zielgruppen und Platzierungen|Auswertung der Zielhandlungen",
        "Unternehmen, die erklärungsbedürftige Angebote oder Markenbotschaften mit Video bewerben möchten.",
        "Die Kampagne verbindet Videoinhalt und nächsten Schritt statt nur Aufrufe als Ziel zu betrachten.",
      ],
      [
        "LinkedIn Ads",
        "LinkedIn-Werbekampagnen für geschäftliche Zielgruppen, konkrete Angebote und nachvollziehbare Anfragewege aufsetzen.",
        "B2B-Zielgruppenplanung|Anzeigen und Angebotskonzept|Kampagnenverwaltung|Auswertung der Anfragequalität",
        "B2B-Dienstleister und Unternehmen mit klar beschreibbaren beruflichen Zielgruppen.",
        "Angebot und Auswertung orientieren sich an passenden Geschäftskontakten statt ausschließlich an Klickzahlen.",
      ],
      [
        "Pinterest Ads",
        "Pinterest-Kampagnen mit visuellen Motiven, geeigneten Zielseiten und einer abgestimmten Angebotsstruktur gestalten.",
        "Motiv- und Themenplanung|Anzeigenvarianten|Zielseitenabgleich|Kampagnenauswertung",
        "Unternehmen mit visuell erklärbaren Produkten und Angeboten, die in Planungs- und Inspirationsphasen relevant sind.",
        "Bilder, Themen und Zielseiten vermitteln eine zusammenhängende Kauf- oder Anfrageidee.",
      ],
      [
        "Display-Kampagnen",
        "Display-Werbung mit passenden Bannern, vereinbarten Umfeldern und kontrollierter Budgetverteilung einrichten.",
        "Bannerkonzept und Formate|Umfeld- und Zielgruppenplanung|Kampagneneinrichtung|Platzierungs- und Ergebnisprüfung",
        "Unternehmen, die ein Angebot über Anzeigenflächen außerhalb ihrer eigenen Website bekannt machen möchten.",
        "Werbemittel und Auslieferungsumfeld werden bewusst ausgewählt und regelmäßig bewertet.",
      ],
      [
        "Video-Werbekampagnen",
        "Videoanzeigen für unterschiedliche digitale Werbeumfelder konzipieren, produzieren und zu einer Kampagne verbinden.",
        "Botschaft und Storyboard|Aufnahme- oder Animationsumfang|Formatvarianten|Ausspielung und Auswertung",
        "Marken mit einer Botschaft, die über Bewegtbild nachvollziehbar erklärt werden soll.",
        "Ein abgestimmtes Videokonzept lässt sich in die vereinbarten Kanäle und Formate übertragen.",
      ],
      [
        "Remarketing-Kampagnen",
        "Eine erneute Werbeansprache mit geeigneten Zielgruppenregeln, Begrenzungen und einem abgestimmten Einwilligungskonzept planen.",
        "Zielgruppen- und Ausschlussregeln|Consent- und Messkonzept|Wiederansprache-Motive|Frequenz- und Ergebnisprüfung",
        "Unternehmen mit bestehenden Websitekontakten und einer geeigneten Grundlage für die geplante Wiederansprache.",
        "Die erneute Ansprache folgt einem definierten Anlass und berücksichtigt erforderliche Freigaben und technische Grenzen.",
      ],
      [
        "Weitere digitale Werbeplattformen",
        "Zusätzliche Werbeplattformen anhand deiner Zielgruppe, des Angebots und der verfügbaren Werbeformate einordnen und betreuen.",
        "Plattform- und Anforderungsprüfung|Werbemittelplanung|Einrichtung nach Freigabe|Kosten- und Ergebnisübersicht",
        "Unternehmen mit einem spezialisierten Kanal oder einer bislang nicht aufgeführten Werbeplattform.",
        "Der Einsatz eines weiteren Kanals wird vorab anhand von Ziel, Aufwand und Budget begründet.",
      ],
      [
        "Fernsehwerbung",
        "Fernsehwerbung vom Kampagnenkonzept über den Spot bis zur abgestimmten Schaltungsplanung organisieren.",
        "Botschaft und Zielgebiet|Spotkonzept und Produktion|Sender- und Schaltungsabstimmung|Auswertung der Kampagne",
        "Unternehmen mit einem passenden Angebot und einem separat freigegebenen Budget für TV-Produktion und Schaltung.",
        "Kreation und Mediaplanung werden zusammen betrachtet; Produktions- und Senderkosten bleiben erkennbar.",
      ],
      [
        "Streaming-TV-Werbung",
        "Werbung in geeigneten Streaming-TV-Umfeldern mit abgestimmten Videomotiven und einem eigenen Mediaplan vorbereiten.",
        "Umfeld- und Zielgruppenplanung|Spot- und Formatabstimmung|Anbieterkoordination|Reichweiten- und Ergebnisbericht",
        "Unternehmen, die Bewegtbildwerbung in ausgewählten Streaming-Umfeldern einsetzen möchten.",
        "Ausspielungsangebot, Produktionsumfang und Schaltungsbudget werden vor einer Buchung transparent abgestimmt.",
      ],
      [
        "Radiowerbung",
        "Radiokampagnen mit passender Botschaft, Spotproduktion und einem abgestimmten Sendeplan entwickeln.",
        "Sprecher- und Textkonzept|Audio-Produktion|Sender- und Sendezeitplanung|Kampagnenauswertung",
        "Regionale oder überregionale Angebote, die über ein verständliches Audiomotiv vermittelt werden können.",
        "Spot, Wiederholung und Kontaktmöglichkeit werden als zusammenhängende Kampagne geplant.",
      ],
      [
        "Zeitungs- und Zeitschriftenanzeigen",
        "Printanzeigen für passende Publikationen gestalten und ihre Schaltung mit Format, Gebiet und Erscheinungstermin abstimmen.",
        "Medien- und Formatplanung|Anzeigengestaltung|Druckdaten und Freigabe|Schaltungskoordination",
        "Unternehmen mit regionalen Angeboten oder klar zuordenbaren Leserschaften.",
        "Anzeige und Medium passen zum Angebot; Gestaltung und externe Veröffentlichungskosten sind getrennt nachvollziehbar.",
      ],
      [
        "Plakatwerbung und digitale Werbeflächen",
        "Kampagnen für klassische Plakate und digitale Außenwerbung mit lesbaren Motiven und abgestimmten Standorten entwickeln.",
        "Standort- und Formatplanung|Plakat- und Bildschirmmotive|Produktionsdaten|Schaltungsabstimmung",
        "Unternehmen mit lokal relevanten Angeboten, Veranstaltungen oder regionalem Bekanntheitsziel.",
        "Motiv, Betrachtungsdauer und Standort werden gemeinsam berücksichtigt.",
      ],
      [
        "Flyer-, Broschüren- und Printkampagnen",
        "Gedruckte Werbemittel als Kampagne planen – von Botschaft und Gestaltung bis zu Produktion und abgestimmter Verteilung.",
        "Angebot und Zielgebiet|Layout und Varianten|Druckabstimmung|Verteil- und Auswertungskonzept",
        "Unternehmen mit Aktionen, regionalen Angeboten oder erklärungsbedürftigen Leistungen in gedruckter Form.",
        "Die Drucksache erhält einen klaren Zweck und einen passenden Kontaktweg; Druck und Verteilung werden separat kalkuliert.",
      ],
      [
        "Regionale Werbekampagnen",
        "Digitale und klassische Werbemaßnahmen für ein tatsächlich bedientes Einzugsgebiet aufeinander abstimmen.",
        "Gebiets- und Zielgruppenanalyse|Lokaler Medienmix|Gemeinsame Werbebotschaft|Regionale Auswertung",
        "Betriebe mit lokalem Einsatzgebiet, mehreren Standorten oder regionalen Aktionen.",
        "Kanäle und Motive vermitteln dasselbe Angebot und berücksichtigen die regionale Erreichbarkeit.",
      ],
      [
        "Zielgruppenanalyse und Werbestrategie",
        "Kundenbedürfnisse, Angebot und Werbeziele in eine begründete Kampagnenplanung übersetzen.",
        "Angebots- und Zielgruppenanalyse|Kanalpriorisierung|Budget- und Messplan|Kampagnenfahrplan",
        "Unternehmen, die vor dem Werbestart Zielgruppe, Botschaft und Budgetverteilung klären möchten.",
        "Die spätere Schaltung erhält eine nachvollziehbare Grundlage und konkrete Entscheidungskriterien.",
      ],
      [
        "Kampagnendesign und Werbemittelproduktion",
        "Anzeigen, Banner, Druckmotive, Audio- und Videomaterial für eine gemeinsame Kampagnenidee gestalten und produzieren.",
        "Kreativkonzept|Motive und Varianten|Format- und Produktionsabstimmung|Freigaben und Nutzungsumfang",
        "Unternehmen mit einer geplanten Kampagne und Bedarf an zusammenpassenden Werbemitteln.",
        "Die Botschaft bleibt über die vereinbarten Werbeformate hinweg wiedererkennbar.",
      ],
      [
        "Kampagnenverwaltung und Auswertung",
        "Laufende Kampagnen geordnet verwalten, Budgetentwicklung dokumentieren und Optimierungen aus den vereinbarten Zielen ableiten.",
        "Kontoprüfung und Zuständigkeiten|Laufende Budgetkontrolle|Ergebnisberichte|Optimierungsmaßnahmen",
        "Werbetreibende mit bestehenden Kampagnen und Bedarf an nachvollziehbarer laufender Betreuung.",
        "Du siehst, welche Maßnahmen umgesetzt wurden und worauf weitere Entscheidungen beruhen.",
      ],
    ],
  },
  {
    slug: "branding",
    name: "Branding und Brand Assets",
    short: "Branding",
    description:
      "Markenstrategie, Logo und Gestaltungssystem für einen konsistenten Auftritt. Mit digitalen und druckfertigen Assets im vereinbarten Nutzungsumfang.",
    approach: [
      "Marke, Zielgruppe und Anwendungen verstehen",
      "Gestaltungsrichtung und Konzept abstimmen",
      "Assets ausarbeiten und gemeinsam freigeben",
      "Formate, Richtlinien und Nutzungsumfang übergeben",
    ],
    rows: [
      [
        "Logo-Design",
        "Ein neues Logo als Wortmarke, Bildmarke oder kombiniertes Zeichen entwickeln und für die geplanten Anwendungen ausarbeiten.",
        "Markenbriefing|Entwurf und Abstimmung|Wortmarke, Bildmarke oder Signet|Logo-Varianten und Export",
        "Neue Unternehmen, Angebote und Marken ohne bestehendes visuelles Erkennungszeichen.",
        "Dein Zeichen wird aus dem Markenauftritt heraus entwickelt und für reale Einsatzgrößen vorbereitet.",
      ],
      [
        "Logo-Redesign",
        "Ein bestehendes Logo gezielt überarbeiten und den gewünschten Wiedererkennungswert in die Weiterentwicklung einbeziehen.",
        "Bestands- und Anwendungsanalyse|Überarbeitung des Zeichens|Varianten und Größen|Umstellungsunterlagen",
        "Unternehmen mit einem vorhandenen Logo, das in digitalen oder gedruckten Anwendungen nicht mehr passt.",
        "Die Modernisierung folgt nachvollziehbaren Gründen und einem abgestimmten Umgang mit dem bisherigen Auftritt.",
      ],
      [
        "Corporate Identity und Corporate Design",
        "Markenauftreten und visuelle Gestaltung in einem konsistenten System aus Zeichen, Farben, Schrift und Anwendungen zusammenführen.",
        "Marken- und Kommunikationsgrundlagen|Visuelles Gestaltungssystem|Anwendungsbeispiele|Dokumentierte Gestaltungsregeln",
        "Unternehmen mit mehreren Kontaktpunkten und bislang uneinheitlichem Auftreten.",
        "Website, Dokumente und Werbemittel können auf gemeinsame Gestaltungsentscheidungen zurückgreifen.",
      ],
      [
        "Markenstrategie und Positionierung",
        "Zielgruppe, Markenversprechen und Abgrenzung klären, bevor Logo und Gestaltung ausgearbeitet werden.",
        "Markenworkshop|Zielgruppen und Wettbewerbsumfeld|Positionierung und Botschaften|Gestalterisches Briefing",
        "Gründungen und Unternehmen, deren Angebot oder Markenbild sich verändert.",
        "Gestaltungsentscheidungen bekommen eine gemeinsame inhaltliche Grundlage.",
      ],
      [
        "Farbpaletten und Typografie",
        "Markenfarben, Schriftwahl und Anwendungshierarchien für digitale und gedruckte Materialien definieren.",
        "Farbsystem|Schrift- und Lizenzabstimmung|Typografische Hierarchie|Anwendungsbeispiele",
        "Marken mit uneinheitlichen Farben oder wechselnder Schriftgestaltung.",
        "Dein Team erhält nachvollziehbare Regeln für eine wiedererkennbare Darstellung.",
      ],
      [
        "Icon-Sets und individuelle Symbole",
        "Ein zusammenhängendes Set von Icons und Symbolen für Website, Anwendung oder Markenkommunikation gestalten.",
        "Symbol- und Bedeutungsinventar|Gemeinsamer Zeichenstil|Größen und Zustände|Vektor- und Bildexport",
        "Produkte mit wiederkehrenden Funktionen, Kategorien oder visuellen Orientierungshilfen.",
        "Symbole vermitteln ihre Aufgabe in einem konsistenten Stil und können in den vereinbarten Anwendungen genutzt werden.",
      ],
      [
        "Social-Media-Grafiken und Vorlagen",
        "Wiederverwendbare Social-Media-Vorlagen für Beiträge, Stories und weitere vereinbarte Formate aufbauen.",
        "Format- und Themenplan|Beitrags- und Story-Vorlagen|Markenelemente|Bearbeitbare Übergabe",
        "Teams, die regelmäßig eigene Inhalte mit einem einheitlichen Erscheinungsbild veröffentlichen.",
        "Neue Beiträge lassen sich innerhalb eines abgestimmten Vorlagensystems gestalten.",
      ],
      [
        "Werbebanner und Anzeigenmotive",
        "Digitale Werbemotive für vorhandene Kampagnen oder geplante Anzeigenflächen gestalten und formatgerecht exportieren.",
        "Botschaft und Motiv|Formatvarianten|Bild- und Textabstimmung|Plattformgerechte Exportdateien",
        "Unternehmen mit einer feststehenden Werbemaßnahme und Bedarf an konkreten Gestaltungsmitteln.",
        "Ein zentrales Motiv wird für die vereinbarten Flächen aufbereitet; Schaltung ist gesondert vereinbarbar.",
      ],
      [
        "Visitenkarten und Geschäftsausstattung",
        "Visitenkarten, Briefpapier und weitere vereinbarte Geschäftsdokumente im Markenauftritt gestalten.",
        "Anwendungs- und Datenabgleich|Visitenkarten und Briefpapier|Digitale Vorlagen|Druckdatenübergabe",
        "Gründungen und Unternehmen mit uneinheitlichen oder veralteten Geschäftsunterlagen.",
        "Geschäftliche Kontakte erhalten ein stimmiges Erscheinungsbild über digitale und gedruckte Unterlagen hinweg.",
      ],
      [
        "Flyer, Plakate und Broschüren gestalten",
        "Informationen und Angebote in gut lesbare Drucklayouts mit abgestimmter Bildsprache und klarer Hierarchie übersetzen.",
        "Inhalts- und Formatplanung|Layout und Satz|Bildaufbereitung|Druckfertige Dateien",
        "Unternehmen mit vorhandenen Inhalten für gedruckte Produkt- oder Leistungsinformationen.",
        "Die Gestaltung berücksichtigt Umfang, Betrachtungssituation und die Vorgaben der ausgewählten Druckerei.",
      ],
      [
        "Brand Guidelines und Styleguides",
        "Markenregeln in einer verständlichen Dokumentation für dein Team und beauftragte Dienstleister festhalten.",
        "Logo- und Schutzraumregeln|Farben und Typografie|Bild- und Iconstil|Beispiele für Anwendungen",
        "Marken, deren Gestaltung von mehreren Personen oder über mehrere Kanäle eingesetzt wird.",
        "Die Anwendung der Marke wird nachvollziehbar und weniger von einzelnen Entwurfsdateien abhängig.",
      ],
      [
        "Digitale Brand-Asset-Pakete",
        "Vorhandene oder neu entwickelte Markenelemente in einem geordneten Paket für die vereinbarten digitalen Anwendungen bündeln.",
        "Asset-Inventar|Logo- und Grafikvarianten|Dateibenennung und Ordnerstruktur|Nutzungs- und Formatübersicht",
        "Unternehmen, die ihre Markenmaterialien gesammelt und einsatzbereit übergeben möchten.",
        "Dein Team findet die freigegebenen Materialien mitsamt Anwendungs- und Lizenzhinweisen an einem Ort.",
      ],
      [
        "Druckfertige und digitale Exportformate",
        "Gestaltungsdateien für vereinbarte Druckverfahren, Bildschirmgrößen und digitale Anwendungen aufbereiten.",
        "Anforderungsprüfung|Vektor- und Rasterformate|Druckvorgaben und Farbräume|Export- und Übergabeübersicht",
        "Unternehmen mit Entwürfen, die für Druckereien, Websites oder weitere Anwendungen vorbereitet werden müssen.",
        "Die Übergabe orientiert sich an den technischen Anforderungen der tatsächlichen Verwendung.",
      ],
    ],
  },
  {
    slug: "digitale-beratung",
    name: "Digitale Unternehmensberatung",
    short: "Digitale Beratung",
    description:
      "Digitale Geschäftsmodelle, Prozesse und Systeme verständlich planen. Mit einer priorisierten Entscheidungsgrundlage und klar abgegrenzten Umsetzungsschritten.",
    approach: [
      "Ausgangslage und Ziele gemeinsam aufnehmen",
      "Anforderungen, Optionen und Abhängigkeiten bewerten",
      "Empfehlung und priorisierten Fahrplan erarbeiten",
      "Übergabe oder gesonderte Umsetzung abstimmen",
    ],
    rows: [
      [
        "Digitale Geschäftsmodelle",
        "Eine digitale Geschäftsidee anhand von Zielgruppe, Leistungsangebot und Betriebsanforderungen strukturieren.",
        "Kundenproblem und Nutzen|Leistungs- und Erlösmodell|Betriebsanforderungen|Priorisierter Entwicklungsplan",
        "Gründer und Unternehmen, die ein digitales Angebot vor einer Umsetzung einordnen möchten.",
        "Du erhältst eine nachvollziehbare Grundlage für Umfang, Annahmen und die nächsten Entscheidungen.",
      ],
      [
        "Digitalisierung von Unternehmensprozessen",
        "Wiederkehrende Abläufe aufnehmen und geeignete digitale Verbesserungen mit dem betroffenen Team planen.",
        "Prozessaufnahme|Medienbrüche und Engpässe|Sollablauf und Verantwortlichkeiten|Umsetzungsprioritäten",
        "Unternehmen mit mehrfacher Datenerfassung, unklaren Freigaben oder zeitaufwendiger manueller Bearbeitung.",
        "Verbesserungen beziehen sich auf einen beschriebenen Ablauf und messbare Aufgaben statt auf eine beliebige Tool-Liste.",
      ],
      [
        "Softwareauswahl und Systemberatung",
        "Geeignete Softwarelösungen anhand deiner Anforderungen, Schnittstellen und laufenden Betriebskosten vergleichen.",
        "Anforderungskatalog|System- und Anbieterabgleich|Datenexport und Schnittstellen|Entscheidungsvorlage",
        "Unternehmen vor einer Anschaffung oder dem Austausch bestehender Geschäftsanwendungen.",
        "Die Auswahl berücksichtigt Arbeitsweise und Abhängigkeiten sowie die späteren Zuständigkeiten.",
      ],
      [
        "Website- und Onlineshop-Strategie",
        "Zielgruppen, Seitenstruktur und Verkaufs- oder Anfrageprozesse vor einem Website- oder Shopprojekt planen.",
        "Angebot und Zielgruppen|Seiten- und Sortimentsstruktur|Anfrage- oder Kaufprozess|Technische Projektgrundlage",
        "Unternehmen vor einem neuen Auftritt, einem Relaunch oder einer Erweiterung ihres Shops.",
        "Die spätere Umsetzung kann auf einem abgestimmten Leistungs- und Inhaltskonzept aufbauen.",
      ],
      [
        "Online-Marketing-Strategie",
        "Website, Inhalte, Suchsichtbarkeit und bezahlte Werbung in einen priorisierten Maßnahmenplan einordnen.",
        "Ist- und Zielgruppenanalyse|Kanal- und Inhaltsplanung|Budget- und Ressourcenrahmen|Mess- und Maßnahmenplan",
        "Unternehmen, die ihre digitalen Marketingaktivitäten vor der operativen Durchführung ordnen möchten.",
        "Einzelne Maßnahmen werden nach Ziel, Aufwand und Abhängigkeiten eingeordnet; Kampagnenbetreuung ist separat vereinbarbar.",
      ],
      [
        "Entwicklung digitaler Dienstleistungen",
        "Eine bestehende Leistung als digitales Angebot mit passenden Abläufen, Funktionen und Zuständigkeiten konzipieren.",
        "Leistungs- und Zielgruppenmodell|Digitaler Serviceablauf|Funktions- und Datenbedarf|Pilot- und Ausbauplanung",
        "Dienstleister, die Beratung, Betreuung oder andere Leistungen digital unterstützen oder anbieten möchten.",
        "Die neue Leistung wird als vollständiger Ablauf beschrieben und lässt sich gezielt für eine erste Umsetzung begrenzen.",
      ],
      [
        "SaaS- und Plattformberatung",
        "Software-Abonnements und Plattformideen vor einer Entwicklung auf Rollen, Kernabläufe und Betrieb hin untersuchen.",
        "Nutzer- und Rollenmodell|Kernfunktionen und MVP|Betriebs- und Integrationsbedarf|Technischer Fahrplan",
        "Teams mit einer SaaS-Idee, einem Portal oder einem mehrseitigen Plattformmodell.",
        "Die erste Version konzentriert sich auf den entscheidenden Nutzen und benennt bekannte Erweiterungsabhängigkeiten.",
      ],
      [
        "Beratung zu KI und Automatisierung",
        "Geeignete Einsatzfälle für KI und Automatisierung anhand von Daten, Kontrollbedarf und bestehenden Prozessen prüfen.",
        "Einsatzfallanalyse|Daten- und Zugriffsbedarf|Menschliche Freigaben|Pilot- und Betriebskonzept",
        "Unternehmen, die Routineaufgaben unterstützen möchten und zunächst sinnvolle Grenzen klären wollen.",
        "Eine Umsetzung startet mit einem abgegrenzten Anwendungsfall und nachvollziehbaren Verantwortlichkeiten.",
      ],
      [
        "E-Commerce-Beratung",
        "Sortiment, Bestellablauf und Systemlandschaft gemeinsam betrachten und Verbesserungen für den laufenden Handel priorisieren.",
        "Shop- und Prozessanalyse|Sortiments- und Checkout-Konzept|Versand- und Systemanbindungen|Priorisierter Maßnahmenplan",
        "Händler mit einem bestehenden Shop oder einem geplanten zusätzlichen digitalen Vertriebskanal.",
        "Technische und organisatorische Entscheidungen werden auf den tatsächlichen Handelsablauf abgestimmt.",
      ],
      [
        "Digitale Markenentwicklung",
        "Die Anwendung einer Marke auf Website, Shop und weiteren digitalen Kontaktpunkten strategisch planen.",
        "Digitale Kontaktpunkte|Konsistenz der Markenbotschaft|Gestaltungs- und Inhaltsbedarf|Einführungs- und Pflegeplan",
        "Unternehmen mit vorhandener Marke, die ihren digitalen Auftritt vereinheitlichen oder erweitern möchten.",
        "Du erhältst einen Plan für den Einsatz der Marke; konkrete Logo- und Asset-Gestaltung lässt sich daran anschließen.",
      ],
      [
        "Technische Projektplanung",
        "Eine digitale Projektidee in Anforderungen, Datenflüsse, Zuständigkeiten und umsetzbare Arbeitsschritte übersetzen.",
        "Anforderungs- und Funktionsumfang|Daten- und Schnittstellenmodell|Abhängigkeiten und Risiken|Meilensteine und Abnahme",
        "Unternehmen, die vor einer Ausschreibung oder Entwicklung eine belastbare technische Grundlage benötigen.",
        "Angebote und Umsetzungsschritte lassen sich anhand eines gemeinsam beschriebenen Umfangs vergleichen.",
      ],
      [
        "Analyse und Optimierung vorhandener Systeme",
        "Vorhandene Anwendungen und ihre Nutzung untersuchen, Probleme einordnen und einen geordneten Verbesserungsplan erstellen.",
        "System- und Prozessinventar|Schwachstellen und Abhängigkeiten|Verbesserungsoptionen|Priorisierte Maßnahmen",
        "Unternehmen mit gewachsenen Anwendungen und unklarer Entscheidung zwischen Weiterentwicklung, Ersatz oder Anbindung.",
        "Die nächste Investition kann auf konkreten Befunden und einer transparenten Priorisierung aufbauen.",
      ],
    ],
  },
];

export type AreaContent = {
  answer: string;
  scope: string;
  preparation: string[];
  faq: { question: string; answer: string }[];
  links: { title: string; href: string }[];
};
export const serviceAreaContent: Record<string, AreaContent> = {
  marketing: {
    answer:
      "Wir begleiten Werbung von Zielgruppenanalyse und Strategie über Gestaltung, Produktion und Einrichtung bis zur Verwaltung und Optimierung. Digitale Plattformen, lokale Medien und klassische Werbeformen werden nach deinem Angebot ausgewählt. Bereits vorhandene Kampagnen können nach einer Bestandsaufnahme übernommen werden.",
    scope:
      "Das Dienstleistungshonorar wird individuell angeboten. Werbebudgets, Medienbuchungen, Druck, Verteilung und sonstige externe Produktions- oder Schaltungskosten werden separat ausgewiesen und vor Beauftragung freigegeben. Konten, Zugriffsrechte, Nutzungsrechte und Freigaben werden vor dem Start geklärt. Conversion-Tracking erfolgt nur im vereinbarten Umfang und mit den erforderlichen Einwilligungs- und Datenschutzvoraussetzungen. Bestimmte Reichweiten, Anfragen oder Umsätze werden nicht zugesagt.",
    preparation: [
      "Angebot, Zielgruppe und tatsächlich bedientes Gebiet",
      "Gewünschte Zielhandlung und vorhandene Zielseite",
      "Honorarrahmen und separates Werbebudget",
      "Vorhandene Konten, Motive und zuständige Freigabeperson",
    ],
    faq: [
      {
        question: "Ist das Werbebudget im Honorar enthalten?",
        answer:
          "Nein. Planung und Betreuung werden getrennt von Plattformgebühren, Medienbuchungen, Druck und anderen externen Kosten ausgewiesen. Vor einer Schaltung stimmen wir Budget und Freigabe ab.",
      },
      {
        question: "Übernehmt ihr auch bestehende Kampagnen?",
        answer:
          "Ja. Zuerst prüfen wir Kontozugänge, bisherige Ziele, Motive und Messung. Der Umfang der Übernahme und der laufenden Optimierung wird anschließend vereinbart.",
      },
      {
        question: "Können Online-Werbung und lokale Medien kombiniert werden?",
        answer:
          "Ja. Wir planen die gemeinsame Botschaft, passende Formate und Kontaktwege. Die Kosten der jeweiligen Medien werden gesondert abgestimmt.",
      },
    ],
    links: [
      {
        title: "Conversion-Tracking",
        href: "/leistungen/optimierung/conversion-tracking",
      },
      { title: "Landingpages", href: "/leistungen/websites/landingpages" },
      { title: "Branding und Assets", href: "/leistungen/branding" },
      {
        title: "Online-Marketing-Strategie",
        href: "/leistungen/digitale-beratung/online-marketing-strategie",
      },
    ],
  },
  branding: {
    answer:
      "Wir entwickeln Markenpositionierung, Logo und ein anwendbares Gestaltungssystem. Farben, Typografie und wiederverwendbare Assets verbinden Website, Social Media, Anzeigen und Geschäftsausstattung. Einzelne Gestaltungsmittel können ebenso beauftragt werden wie ein zusammenhängendes Markenpaket.",
    scope:
      "Alle Gestaltungsleistungen werden individuell angeboten. Entwurfsumfang, Korrekturrunden, editierbare Quelldateien, Exportformate und Nutzungsrechte halten wir im Angebot fest. Fremdmaterial, Schriftlizenzen, Druck und weitere externe Kosten werden getrennt vereinbart. Eine Markenanmeldung oder rechtliche Markenprüfung ist nicht Bestandteil der Gestaltung.",
    preparation: [
      "Markenname, Angebot, Zielgruppe und gewünschte Wirkung",
      "Vorhandene Logos, Vorlagen und belegbare Nutzungsrechte",
      "Geplante Anwendungen in Druck und digitalen Kanälen",
      "Benötigte Formate, Freigaben und gewünschte Quelldateien",
    ],
    faq: [
      {
        question: "Kann ich nur ein Logo oder einzelne Assets beauftragen?",
        answer:
          "Ja. Wir grenzen die benötigten Anwendungen und Dateien vorab ab. Ein Logo, Vorlagenset oder Styleguide kann unabhängig von einer Website beauftragt werden.",
      },
      {
        question: "Welche Dateien erhalte ich?",
        answer:
          "Du erhältst die vereinbarten digitalen oder druckfertigen Formate. Bearbeitbare Quelldateien, konkrete Exportgrößen und Nutzungsrechte werden im Angebot ausdrücklich benannt.",
      },
      {
        question: "Sind Druckkosten und Schriftlizenzen enthalten?",
        answer:
          "Externe Druck-, Bild- und Lizenzkosten werden gesondert ausgewiesen. Vor ihrer Beauftragung stimmen wir Anbieter, Umfang und Kosten mit dir ab.",
      },
    ],
    links: [
      {
        title: "Individuelles Webdesign",
        href: "/leistungen/websites/individuelles-webdesign",
      },
      { title: "Werbekampagnen", href: "/leistungen/marketing" },
      {
        title: "Digitale Markenentwicklung planen",
        href: "/leistungen/digitale-beratung/digitale-markenentwicklung",
      },
    ],
  },
  "cms-baukaesten": {
    answer:
      "Individuelle Entwicklung und bestehende Plattformen sind unterschiedliche Wege zum gleichen Projektziel. Wir richten WordPress, Webflow, Wix, Squarespace, Jimdo und weitere Systeme ein. Für Shops begleiten wir WooCommerce, Shopify und Shopware. Die Leistungsseiten bleiben in den vorhandenen Website- und E-Commerce-Kategorien eingeordnet.",
    scope:
      "Die Plattformleistungen werden individuell nach Umfang angeboten. Einrichtung, Konfiguration, Themes, Erweiterungen, Migration und Schulung können kombiniert werden. Plattformabos, Hosting, Themes, Plugins und Transaktionskosten sind mögliche zusätzliche Anbietergebühren und werden vor der Auswahl besprochen. Der verfügbare Funktionsumfang richtet sich auch nach System und gebuchtem Tarif. Wartung und Betreuung werden separat vereinbart.",
    preparation: [
      "Vorhandene Website, Shop oder gewünschte Plattform",
      "Inhalte, Produktdaten, Varianten und zu übernehmende Dateien",
      "Benötigte Funktionen, Erweiterungen und Schnittstellen",
      "Redaktionsaufgaben, Zugänge und Schulungsbedarf",
    ],
    faq: [
      {
        question: "Muss ich vor der Anfrage ein System auswählen?",
        answer:
          "Nein. Beschreibe Inhalte, Funktionen und Pflegebedarf. Wir können die Systemwahl im Rahmen einer Beratung vorbereiten; die Umsetzung wird anschließend abgegrenzt.",
      },
      {
        question:
          "Könnt ihr eine bestehende Website oder einen Shop übernehmen?",
        answer:
          "Ja, nach Prüfung von Zugängen, Systemstand, Erweiterungen und Daten. Fehlerbehebung, Migration, Performancearbeiten und laufende Pflege können gesondert vereinbart werden.",
      },
      {
        question: "Kann mein Team Inhalte und Produkte selbst verwalten?",
        answer:
          "Ja, soweit das gewählte System und die vereinbarten Rollen es erlauben. Wir bieten eine auf eure täglichen Aufgaben abgestimmte Schulung und Dokumentation an.",
      },
    ],
    links: [
      {
        title: "WordPress-Wartung",
        href: "/leistungen/betreuung/wordpress-wartung",
      },
      { title: "Shop-Wartung", href: "/leistungen/betreuung/shop-wartung" },
      { title: "Fehlerbehebung", href: "/leistungen/betreuung/fehlerbehebung" },
      {
        title: "Performanceoptimierung",
        href: "/leistungen/optimierung/website-performance",
      },
      {
        title: "CMS oder individuelle Website?",
        href: "/wissen/cms-oder-individuelle-website",
      },
    ],
  },
  "digitale-beratung": {
    answer:
      "Digitale Unternehmensberatung beginnt bei deinem Geschäft und den tatsächlichen Arbeitsabläufen. Wir analysieren Anforderungen, vergleichen technische Optionen und erarbeiten eine verständliche Entscheidungsgrundlage. Das Ergebnis kann ein Konzept, ein Maßnahmenplan oder eine technische Projektplanung sein; eine spätere Umsetzung wird separat vereinbart.",
    scope:
      "Beratungsumfang und Honorar werden individuell vereinbart. Wir benennen die zu beantwortenden Fragen, benötigten Unterlagen und vereinbarten Ergebnisse. Anbietergebühren und spätere Umsetzungskosten werden getrennt betrachtet. Entscheidungen bleiben bei deinem Unternehmen. Rechts-, Steuer- und Anlageberatung sind nicht Teil des Angebots.",
    preparation: [
      "Geschäftsziel und konkret zu klärende Fragen",
      "Bestehende Prozesse, Systeme und relevante Schnittstellen",
      "Beteiligte Rollen, bekannte Probleme und bisherige Entscheidungen",
      "Budgetrahmen, Zeitplanung und gewünschtes Ergebnis",
    ],
    faq: [
      {
        question: "Kann ich Beratung ohne anschließende Entwicklung buchen?",
        answer:
          "Ja. Beratung und Umsetzung sind getrennte Leistungen. Die vereinbarte Dokumentation kann auch als Grundlage für die interne Bearbeitung oder weitere Angebote dienen.",
      },
      {
        question: "Was erhalte ich als Ergebnis?",
        answer:
          "Das hängt von der Fragestellung ab. Vor Beginn legen wir fest, ob beispielsweise eine Analyse, ein Anforderungskatalog, eine Entscheidungsvorlage oder ein priorisierter Umsetzungsplan erstellt wird.",
      },
      {
        question: "Beratet ihr auch zu vorhandenen Systemen?",
        answer:
          "Ja. Wir betrachten Prozesse und Abhängigkeiten, bevor wir Weiterentwicklung, Anbindung oder Austausch empfehlen. Zugänge und erforderliche Daten werden auf den vereinbarten Analyseumfang begrenzt.",
      },
    ],
    links: [
      { title: "Individuelle Software", href: "/leistungen/software" },
      {
        title: "KI und Automatisierung umsetzen",
        href: "/leistungen/ki-automatisierung",
      },
      {
        title: "CMS- und Shop-Plattformen",
        href: "/leistungen/cms-baukaesten",
      },
      { title: "Marketing umsetzen", href: "/leistungen/marketing" },
    ],
  },
};
