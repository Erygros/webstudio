import { additionalPrices, packages, priceLabel } from "@/config/pricing";

export type Article = {
  slug: string;
  title: string;
  intro: string;
  answer: string;
  updated: string;
  sections: { title: string; text: string; items?: string[] }[];
  comparison?: { caption: string; columns: string[]; rows: string[][] };
  faq: { question: string; answer: string }[];
  related: { title: string; href: string }[];
  sources?: { title: string; href: string }[];
};

export const articles: Article[] = [
  {
    slug: "website-oder-webanwendung",
    title: "Website oder Webanwendung?",
    answer:
      "Eine Website informiert über Angebote und führt zu einem Kontakt. Eine Webanwendung verarbeitet Daten und unterstützt Arbeitsabläufe, oft mit Benutzerkonten und Berechtigungen. Entscheidend ist, was Nutzer erledigen sollen. Ein Kontaktformular oder eine Termin-Anfrage allein erfordert noch keine umfangreiche eigene Software.",
    updated: "2026-10-14",
    intro:
      "Welche Lösung zu deinem Vorhaben passt, entscheidet sich an den Aufgaben deiner Nutzer.",
    sections: [
      {
        title: "Information oder Arbeitsablauf",
        text: "Eine Website stellt vor allem Informationen bereit: Angebote, Projekte und Kontaktwege. Eine Webanwendung unterstützt wiederkehrende Aufgaben. Nutzer erfassen Daten, bearbeiten Vorgänge oder arbeiten gemeinsam in einem System.",
      },
      {
        title: "An den Funktionen entscheiden",
        text: "Ein Kontaktformular allein macht aus einer Website noch keine komplexe Anwendung. Wenn aber Rollen, Freigaben, dauerhaft gespeicherte Vorgänge und unterschiedliche Arbeitsansichten hinzukommen, braucht das Projekt ein eigenes Daten- und Berechtigungskonzept.",
      },
      {
        title: "Klein beginnen, bewusst planen",
        text: "Beschreibe zuerst den wichtigsten Ablauf. Was soll eine Person konkret tun können? Welche Daten braucht sie? Daraus lässt sich eine erste nutzbare Version ableiten. Weitere Funktionen werden anhand tatsächlicher Anforderungen ergänzt.",
      },
      {
        title: "Ein Ablauf als Ausgangspunkt",
        text: "Beschreibe den Weg eines Vorgangs vom Eingang bis zum Abschluss. Ein rein beispielhafter Ablauf könnte lauten: Eine Anfrage wird erfasst, einem Verantwortlichen zugeteilt, bearbeitet und dokumentiert. Wenn mehrere Personen mit unterschiedlichen Rechten darauf zugreifen, müssen diese Regeln ausdrücklich geplant werden. Eine Liste möglichst vieler Funktionen ist dafür weniger hilfreich als ein vollständig beschriebener Kernablauf.",
        items: [
          "Wer beginnt den Vorgang und mit welchen Angaben?",
          "Welche Person darf welche Daten sehen oder ändern?",
          "Was muss passieren, bevor der nächste Schritt möglich ist?",
          "Wie werden Fehler, Korrekturen und abgeschlossene Vorgänge behandelt?",
        ],
      },
      {
        title: "Vor einer Eigenentwicklung Standardlösungen einordnen",
        text: "Eine vorhandene Software kann ausreichen, wenn sie die entscheidenden Aufgaben unterstützt. Prüfe Funktionen, laufende Gebühren, Datenexport und Anbindung an andere Systeme. Eine Eigenentwicklung ist eine bewusste Entscheidung für besondere Regeln oder Abläufe und bringt eigene Verantwortung für Betrieb und Pflege mit sich. Das Projektangebot sollte Entwicklung und diese laufenden Aufgaben getrennt benennen.",
      },
    ],
    comparison: {
      caption: "Website und Webanwendung nach Aufgaben vergleichen",
      columns: ["Frage", "Website", "Webanwendung"],
      rows: [
        [
          "Was steht im Mittelpunkt?",
          "Leistungen, Informationen und Kontakt",
          "Daten, Vorgänge und wiederkehrende Aufgaben",
        ],
        [
          "Wer pflegt Inhalte?",
          "Redaktion oder technische Betreuung",
          "Nutzer und Verantwortliche innerhalb definierter Rollen",
        ],
        [
          "Was muss geplant werden?",
          "Seiten, Inhalte, Gestaltung und Anfragewege",
          "Zusätzlich Datenmodell, Rechte und Prozessregeln",
        ],
        [
          "Wie wird der Betrieb geregelt?",
          "Hosting, Inhalte und technische Pflege",
          "Zusätzlich Benutzerverwaltung, Sicherung und Integrationen",
        ],
      ],
    },
    faq: [
      {
        question: "Ist ein Online-Terminformular bereits eine Webanwendung?",
        answer:
          "Ein Formular kann Bestandteil einer normalen Website sein. Erst der benötigte Funktionsumfang entscheidet über die Architektur. Verfügbarkeitsregeln, Benutzerkonten, mehrere Ressourcen oder wiederkehrende Verwaltungsabläufe können eine eigene Anwendung rechtfertigen.",
      },
      {
        question: "Kann eine Website später um eine Anwendung ergänzt werden?",
        answer:
          "Ja, wenn Schnittstellen, Zugänge und Betrieb dazu geplant werden. Bereits zu Beginn bekannte Erweiterungen sollten im Briefing genannt werden; eine spätere Erweiterung wird gesondert bewertet und angeboten.",
      },
    ],
    related: [
      { title: "Websites und Webdesign", href: "/leistungen/websites" },
      {
        title: "Individuelle Webanwendungen",
        href: "/leistungen/software/individuelle-webanwendungen",
      },
    ],
  },
  {
    slug: "was-eine-website-kostet",
    title: "Was bestimmt den Preis einer Website?",
    answer: `Bei Webstudio Expert beginnt eine einfache Landingpage ${priceLabel(packages[0].price)}, eine mehrseitige Unternehmenswebsite im Business-Paket ${priceLabel(packages[1].price)} und ein Onlineshop ${priceLabel(additionalPrices[0][1])}. Die Preise gelten für den beschriebenen Einstieg. Zusätzliche Inhalte, ein CMS, besondere Funktionen und laufende Anbietergebühren werden im individuellen Angebot berücksichtigt.`,
    updated: "2026-10-14",
    intro:
      "Nicht nur die Anzahl der Seiten zählt. Inhalte, Funktionen und Pflegebedarf bestimmen den tatsächlichen Aufwand.",
    sections: [
      {
        title: "Inhalte und Gestaltung",
        text: "Eine Seite mit vorhandenem Text und klarer Struktur verursacht einen anderen Aufwand als ein Auftritt mit neuer Bildsprache und vielen Inhaltstypen. Auch die Aufbereitung von Material gehört in die Planung.",
      },
      {
        title: "Funktionen und Verbindungen",
        text: "Eine einfache Kontaktmöglichkeit unterscheidet sich deutlich von Buchung, Kundenlogin oder einer Anbindung an das CRM. Schnittstellen brauchen Datenmapping, Fehlerbehandlung und klare Verantwortlichkeiten.",
      },
      {
        title: "Laufende Kosten getrennt betrachten",
        text: "Hosting, Domains, Softwarelizenzen und Betreuung sind mögliche Betriebskosten. Ein transparentes Angebot trennt die einmalige Umsetzung von diesen laufenden Ausgaben. Die Pakete dieser Website dienen als Ausgangspunkt; der tatsächliche Umfang wird individuell angeboten.",
      },
      {
        title: "Mit einem klaren Briefing starten",
        text: "Nenne Zielgruppe, Seiten, wichtigste Funktionen und verfügbares Material. Wenn der Umfang noch offen ist, kann eine vorgelagerte Planung sinnvoll sein. So wird das Angebot vergleichbarer und die Umsetzung nachvollziehbarer.",
      },
      {
        title: "Angebote anhand desselben Umfangs vergleichen",
        text: "Zwei gleiche Einstiegspreise können unterschiedliche Leistungen beschreiben. Frage nach Seitenumfang, Vorlagen, Inhaltspflege, Korrekturschritten und Übergabe. Besonders bei Formularen und Buchungsfunktionen ist wichtig, was nach dem Absenden passiert und welche Anbieter nötig sind. Ein günstiger Einstieg sagt nichts darüber aus, ob eine umfangreiche spätere Anforderung bereits enthalten ist.",
        items: [
          "Welche Seiten und Funktionen werden tatsächlich umgesetzt?",
          "Wer erstellt und liefert Texte, Bilder und Rechtstexte?",
          "Ist ein CMS mit Einweisung vereinbart?",
          "Welche Zugänge und Nutzungsrechte werden übergeben?",
          "Welche Anbietergebühren entstehen nach Veröffentlichung?",
        ],
      },
      {
        title: "Änderungen und Prioritäten vorab besprechen",
        text: "Wenn Budget und Wunschumfang nicht zusammenpassen, kann eine erste Version auf das Wichtigste begrenzt werden. Die nächsten Ausbauschritte sollten trotzdem bekannt sein. Neue Funktionen während der Umsetzung ändern den Aufwand; sie werden vor ihrer Umsetzung besprochen. Ein Zeitplan wird anhand Umfang, verfügbarem Material und Freigaben festgelegt, nicht aus einem pauschalen Paketpreis abgeleitet.",
      },
    ],
    comparison: {
      caption: "Einstiegspakete von Webstudio Expert",
      columns: ["Lösung", "Einstieg", "Ausgangspunkt"],
      rows: [
        [
          "Landingpage / Starter",
          priceLabel(packages[0].price),
          "Eine einfache Seite mit Kontaktmöglichkeit und Basis-SEO",
        ],
        [
          "Unternehmenswebsite / Business",
          priceLabel(packages[1].price),
          "Mehrere Seiten und individuelle Gestaltung",
        ],
        [
          "Professional",
          priceLabel(packages[2].price),
          "Mehr Inhalte; CMS und zusätzliche Funktionen nach Vereinbarung",
        ],
        [
          "Onlineshop",
          priceLabel(additionalPrices[0][1]),
          "Sortiment, Shopfunktionen und Betrieb gesondert abstimmen",
        ],
      ],
    },
    faq: [
      {
        question:
          "Ist eine Website zum Einstiegspreis für jedes Unternehmen geeignet?",
        answer:
          "Nein. Eine einfache Landingpage kann ein klar umrissenes Angebot erklären. Wenn mehrere Leistungsseiten, ein CMS oder besondere Funktionen benötigt werden, wird ein größerer Umfang vereinbart.",
      },
      {
        question: "Sind Hosting und Betreuung Pflicht?",
        answer:
          "Bei Webstudio Expert sind Hosting und Betreuung optional. Domain, Hosting und etwaige Lizenzen sind mögliche laufende Anbietergebühren, die von der einmaligen Entwicklung getrennt betrachtet werden.",
      },
    ],
    related: [
      { title: "Pakete, Preise und Konditionen", href: "/preise" },
      {
        title: "Website-Briefing vorbereiten",
        href: "/wissen/website-briefing",
      },
    ],
  },
  {
    slug: "website-uebergabe",
    title: "Was gehört zu einer guten Übergabe?",
    answer:
      "Eine Website-Übergabe klärt Zugänge, vereinbarte Dateien und Nutzungsrechte sowie die Verantwortung für den laufenden Betrieb. Dazu gehören eine verständliche Dokumentation, die nötige Einweisung und ein Überblick über Domain, Hosting, Lizenzen und Pflege. Der konkrete Umfang steht im Projektangebot.",
    updated: "2026-10-14",
    intro:
      "Nach Veröffentlichung sollte klar sein, wer Zugriff hat, wer pflegt und welche Rechte vereinbart wurden.",
    sections: [
      {
        title: "Zugänge und Eigentum",
        text: "Domain, Hosting, CMS und externe Dienste sollten nachvollziehbare Konten und Zuständigkeiten haben. Persönliche Passwörter gehören nicht unverschlüsselt in eine Projektdokumentation. Zugänge werden über einen geeigneten sicheren Weg übergeben.",
      },
      {
        title: "Code, Inhalte und Lizenzen",
        text: "Die Vereinbarung legt fest, welche Dateien und Nutzungsrechte übergehen. Drittanbieter-Lizenzen können eigene Bedingungen besitzen. Der Zeitpunkt der Code- und Dateiübergabe richtet sich nach Abnahme, Zahlung und Vertragsumfang.",
      },
      {
        title: "Betrieb organisieren",
        text: "Updates, Backups und Fehlerbearbeitung brauchen Verantwortliche. Betreuung kann intern, durch einen anderen Partner oder über ein eigenes Wartungspaket erfolgen. Definierte Kontingente helfen dabei, laufende Aufgaben realistisch zu planen.",
      },
      {
        title: "Eine praktische Übergabeliste",
        text: "Die Liste sollte zum tatsächlich eingesetzten System passen. Eine reine Website benötigt andere Unterlagen als eine Anwendung mit Datenbank und Nutzerrollen. Halte fest, welche Zugangsmöglichkeiten bestehen und wer ihre Sicherheit künftig verwaltet. Eine Sicherung ist nur dann im Alltag hilfreich, wenn bekannt ist, wie und durch wen sie wiederhergestellt wird.",
        items: [
          "Domain- und Hostingkonten mit ihren Verantwortlichen",
          "Vereinbarte Quellcode- und Inhaltsdateien",
          "CMS-Zugänge und Einweisung, falls ein CMS enthalten ist",
          "Liste der eingesetzten Anbieter und laufenden Gebühren",
          "Hinweise zu Sicherung, Wiederherstellung und Updates",
          "Ansprechpartner und vereinbarter Supportumfang",
        ],
      },
      {
        title: "Spätere Änderungen nachvollziehbar halten",
        text: "Nach der Übergabe können neue Inhalte und Funktionen entstehen. Kläre, wer Änderungen freigibt und ob eine technische Anpassung notwendig ist. Änderungen an Domain, Hosting oder externen Diensten sollten in der Dokumentation nachgeführt werden. Eine vollständige Übergabe hilft auch dann, wenn du die spätere Pflege selbst übernimmst oder einen anderen Dienstleister beauftragst.",
      },
    ],
    faq: [
      {
        question:
          "Erhalte ich automatisch alle Rechte an jeder eingesetzten Software?",
        answer:
          "Maßgeblich ist der vereinbarte Nutzungs- und Rechteumfang. Drittanbieter-Lizenzen können eigene Bedingungen haben. Zugänge und Rechte werden im Angebot und in der Übergabe ausdrücklich beschrieben.",
      },
      {
        question: "Wann übergibt Webstudio Expert Code und Dateien?",
        answer:
          "Nach vollständiger Zahlung im vereinbarten Umfang. Abnahme, Zahlungsbedingungen, Lizenzen und mögliche nicht übertragbare Bestandteile werden vor Beginn festgehalten.",
      },
    ],
    related: [
      { title: "Technische Betreuung", href: "/betreuung" },
      {
        title: "Entwicklungsprozess und Abnahme",
        href: "/entwicklungsprozess",
      },
    ],
  },
  {
    slug: "website-briefing",
    title: "Website-Briefing: Checkliste für deine Anfrage",
    intro:
      "Mit Ziel, Zielgruppe, Seiten und Funktionen wird aus einer Idee ein planbares Webprojekt. Eine einfache Beschreibung reicht für den ersten Kontakt.",
    answer:
      "Ein Website-Briefing beschreibt den Zweck der Website, ihre Besucher und die gewünschte Handlung. Ergänze Leistungen, Seiten, wichtige Funktionen, vorhandenes Material, Budgetrahmen und Verantwortliche. Du brauchst vor einer ersten Anfrage kein technisches Lastenheft; offene Fragen können gemeinsam geklärt werden.",
    updated: "2026-10-14",
    sections: [
      {
        title: "Ziel und Zielgruppe zuerst",
        text: "Formuliere, welche Aufgabe die Website erfüllen soll. Ein Betrieb kann beispielsweise eine bestimmte Leistung erklären und passende Anfragen erhalten wollen. Ein Verein benötigt vielleicht verständliche Informationen zur Mitgliedschaft. Diese Beispiele sind Orientierung, keine Kundenreferenzen. Beschreibe auch, welche Fragen die Besucher vor einem Kontakt beantworten möchten.",
        items: [
          "Was bietest du konkret an?",
          "Für welche Personen oder Unternehmen ist das Angebot gedacht?",
          "Was soll ein Besucher als nächsten Schritt tun?",
          "Welche bestehenden Probleme soll die neue Website lösen?",
        ],
      },
      {
        title: "Seiten und Funktionen unterscheiden",
        text: "Eine Leistungsseite ist ein Inhalt, eine Terminverwaltung eine Funktion. Schreibe beide Anforderungen getrennt auf. Für Funktionen ist entscheidend, was nach einer Eingabe passieren soll: Wer bekommt eine Anfrage, welche Daten werden gespeichert und wer bearbeitet sie? Benenne vorhandene Systeme und externe Anbieter, an die angebunden werden muss.",
      },
      {
        title: "Material und Pflege organisieren",
        text: "Notiere, welche Texte, Bilder und Markenunterlagen bereits nutzbar sind und wer ihre Rechte klärt. Lege fest, wer Inhalte liefert und freigibt. Wenn du später selbst bearbeiten möchtest, beschreibe die gewünschten Änderungen möglichst konkret. Ein CMS wird anhand dieser redaktionellen Aufgaben ausgewählt, nicht allein anhand seines Namens.",
        items: [
          "Logo und freigegebene Markenunterlagen",
          "Texte und Bilder mit geklärten Nutzungsrechten",
          "Vorhandene Domain, Website und wichtige alte URLs",
          "Verantwortliche für Pflege und Freigabe",
          "Rechtstexte passend zum tatsächlichen Angebot",
        ],
      },
      {
        title: "Budget, Zeitrahmen und Mindestumfang",
        text: "Ein ehrlicher Budgetrahmen hilft, eine sinnvolle erste Version vorzuschlagen. Benenne einen gewünschten Starttermin und feste äußere Termine. Der tatsächliche Plan hängt auch von bereitgestellten Inhalten und Freigaben ab. Trenne Funktionen, die zum Start erforderlich sind, von späteren Wünschen. So können Angebot und Erweiterungen nachvollziehbar beschrieben werden.",
      },
      {
        title: "Vorlage für die erste Nachricht",
        text: "Wir bieten … für … an. Die neue Website soll … ermöglichen. Zum Start benötigen wir die Seiten … und die Funktionen …. Vorhanden sind …. Inhalte pflegen soll künftig …. Unser Budgetrahmen ist …, der gewünschte Zeitraum …. Noch offen ist …. Diese Beschreibung kannst du für die Projektanfrage verwenden und unklare Punkte ausdrücklich offenlassen.",
      },
    ],
    faq: [
      {
        question: "Brauche ich vor der Anfrage fertige Texte?",
        answer:
          "Nein. Vorhandene Texte erleichtern die Planung, aber fehlende Inhalte können im Briefing benannt werden. Texterstellung und Aufbereitung werden bei Bedarf ausdrücklich vereinbart.",
      },
      {
        question: "Was ist bei einer bestehenden Website zusätzlich wichtig?",
        answer:
          "Nenne die bisherige Adresse, eingesetzte Systeme und Funktionen sowie Inhalte und URLs, die erhalten bleiben müssen. Domain-, Hosting- und CMS-Verantwortliche sollten bekannt sein, bevor eine Migration geplant wird.",
      },
    ],
    related: [
      { title: "Projekt in sechs Schritten anfragen", href: "/projektanfrage" },
      {
        title: "Website-Kosten einordnen",
        href: "/wissen/was-eine-website-kostet",
      },
    ],
  },
  {
    slug: "cms-oder-individuelle-website",
    title: "CMS oder individuelle Website: was passt?",
    intro:
      "Inhalte selbst ändern oder Änderungen technisch betreuen lassen? Die richtige Entscheidung hängt von Pflege, Funktionen und Zuständigkeiten ab.",
    answer:
      "Ein CMS ermöglicht die redaktionelle Pflege von Inhalten. Eine individuell entwickelte Website kann mit oder ohne CMS umgesetzt werden; das sind keine Gegensätze. Entscheidend sind die Inhalte, die du ändern möchtest, die benötigten Rollen und die technische Verantwortung. WordPress ist eine mögliche CMS-Lösung, aber keine Pflicht für jede Website.",
    updated: "2026-10-14",
    sections: [
      {
        title: "Welche Änderungen kommen tatsächlich vor?",
        text: "Wenn wenige feste Seiten selten geändert werden, kann eine technisch betreute Website genügen. Für regelmäßig neue Projekte, Nachrichten oder Angebote lohnt es sich, eine Redaktion einzuplanen. Dabei sollten bearbeitbare Inhalte und Gestaltungsgrenzen klar sein. Ein eigenes Inhaltsmodell hilft, neue Beiträge vollständig und einheitlich zu erfassen.",
      },
      {
        title: "Systemauswahl anhand der Aufgaben",
        text: "Ein CMS wird anhand benötigter Vorlagen, Rollen, Erweiterungen und Betriebsmöglichkeiten ausgewählt. Eine Gestaltung nach deinem Unternehmen ist auch mit einem CMS möglich. Besondere Funktionen wie interne Freigaben oder Datenverarbeitung können zusätzlich eine Anwendung erfordern. Ein großes Plugin-Angebot beantwortet noch nicht, welche Kombination für dein Vorhaben wartbar ist.",
      },
      {
        title: "Redaktion und Betrieb getrennt benennen",
        text: "Eine Person kann Inhalte bearbeiten, ohne für Server und Updates verantwortlich zu sein. Vor der Übergabe sollten diese Aufgaben zugeordnet sein. CMS-Zugänge benötigen passende Rechte; technische Konten sollten nur die nötigen Verantwortlichen verwalten. Einweisung, mögliche Anbietergebühren und Pflege werden im Angebot festgehalten.",
        items: [
          "Wer erstellt, prüft und veröffentlicht Inhalte?",
          "Welche Bearbeitungen sollen ohne Code möglich sein?",
          "Wer betreut Updates, Sicherungen und technische Fehler?",
          "Welche Lizenzen und Anbietergebühren entstehen?",
          "Wie können Inhalte und Dateien später übernommen werden?",
        ],
      },
      {
        title: "Eine kleine erste Version bewusst wählen",
        text: "Wenn der spätere Pflegebedarf noch offen ist, beschreibe zunächst die erwarteten Inhalte. Ein CMS sollte einen konkreten Nutzen haben, statt nur auf einer Funktionsliste zu stehen. Bereits bekannte Erweiterungen gehören trotzdem ins Briefing. Ein Wechsel des Systems kann später neue Vorlagen, Datenübernahmen und eine erneute Einweisung erfordern und wird gesondert geplant.",
      },
    ],
    comparison: {
      caption: "Pflegevarianten für eine Website",
      columns: ["Kriterium", "Ohne Redaktionssystem", "Mit CMS"],
      rows: [
        [
          "Inhalte ändern",
          "Änderung über Code oder technische Betreuung",
          "Bearbeitung über vereinbarte Inhaltsvorlagen",
        ],
        [
          "Geeignet bei",
          "Wenigen stabilen Seiten und seltenen Änderungen",
          "Regelmäßigen Beiträgen, Projekten oder mehreren Redakteuren",
        ],
        [
          "Verantwortung",
          "Dateien, Deployment und technischer Betrieb",
          "Zusätzlich Redaktion, Rechte und CMS-Pflege",
        ],
        [
          "Gestaltung",
          "Individuell planbar",
          "Ebenfalls individuell planbar; Vorlagen begrenzen Bearbeitung bewusst",
        ],
      ],
    },
    faq: [
      {
        question: "Ist eine individuelle Website immer ohne WordPress?",
        answer:
          "Nein. Individuelle Gestaltung und CMS-Auswahl sind unterschiedliche Entscheidungen. Eine Website kann individuell gestaltet und mit WordPress oder einem anderen CMS redaktionell gepflegt werden.",
      },
      {
        question: "Ist ein CMS im günstigsten Website-Paket enthalten?",
        answer:
          "Bei Webstudio Expert beschreibt Starter eine einfache Landingpage. Ein CMS wird nach Bedarf separat vereinbart; im Professional-Paket ist ein CMS ebenfalls nach Vereinbarung vorgesehen. Der konkrete Umfang steht im Angebot.",
      },
    ],
    related: [
      {
        title: "CMS-Website entwickeln lassen",
        href: "/leistungen/websites/cms-websites",
      },
      { title: "Betreuung nach der Übergabe", href: "/betreuung" },
    ],
  },
];
