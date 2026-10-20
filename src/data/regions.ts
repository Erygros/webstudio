import { packages, priceLabel } from "@/config/pricing";
import { business, site } from "@/config/site";

// Nur der tatsächliche Unternehmensstandort. Keine austauschbaren Stadtseiten.
export const regionalPages = [
  {
    slug: "dortmund",
    modified: "2026-10-20",
    seoTitle: "Website erstellen lassen in der Nähe – Dortmund",
    description:
      "Website erstellen lassen in der Nähe: Webstudio Expert in Dortmund. Individuelle Firmenwebsites, persönliche Abstimmung und kostenlose Erstberatung.",
    title: "Website erstellen lassen in Dortmund",
    content:
      "Webstudio Expert ist das Einzelunternehmen von Enrico Gross in Dortmund. Für Selbstständige, Handwerksbetriebe, Vereine und Unternehmen entstehen Websites mit klaren Leistungen, gut bedienbarer Navigation und einem direkten Weg zur Anfrage.",
    sections: [
      {
        title:
          "Website erstellen lassen in der Nähe: ein Ansprechpartner in Dortmund",
        text: `Du suchst jemanden in deiner Nähe, der deine Website plant und umsetzt? ${business.owner} führt ${site.name} mit Sitz in ${business.street}, ${business.postcode} ${business.city}. Du erhältst einen direkten Ansprechpartner für Leistungen, Inhalte und technische Fragen. Die Abstimmung erfolgt nach Terminabsprache per Telefon und E-Mail. Für Interessenten aus Dortmund und Umgebung ist damit klar, wer hinter dem Angebot steht; ein unangekündigter Besuch oder ein öffentliches Ladenlokal wird nicht vorausgesetzt.`,
        links: [
          { title: "Kostenlose Erstberatung anfragen", href: "/terminbuchung" },
          {
            title: "Unternehmen und Ansprechpartner kennenlernen",
            href: "/ueber-uns",
          },
        ],
      },
      {
        title: "Welche Website braucht dein Betrieb?",
        text: "Für ein klar umrissenes Angebot kann eine Landingpage ausreichen. Wenn du verschiedene Leistungen, Zielgruppen oder Projekte erklären möchtest, bekommt jedes wichtige Thema eine eigene Seite. Für einen Handwerksbetrieb sind beispielsweise Leistungsumfang, tatsächliches Einsatzgebiet und Anfrageweg oft entscheidender als aufwendige Animationen. Welche Inhalte benötigt werden, klären wir vor der Gestaltung.",
        links: [
          {
            title: "Unternehmenswebsite planen",
            href: "/leistungen/websites/unternehmenswebsites",
          },
          {
            title: "Kompakte Landingpage",
            href: "/leistungen/websites/landingpages",
          },
        ],
      },
      {
        title: "Lokale Informationen, die Kunden weiterhelfen",
        text: "Interessenten sollten erkennen, welche Leistung du tatsächlich anbietest, wo sie verfügbar ist und wie ein Auftrag beginnt. Wir planen dafür verständliche Leistungsbeschreibungen, erreichbare Kontaktwege und echte Standortangaben. Ein mobiles Anfrageformular sollte auch unterwegs mit wenigen nötigen Angaben nutzbar sein. Ein vorhandener Internetauftritt wird vor einer Änderung seiner Seitenadressen berücksichtigt.",
        items: [
          "Tatsächliche Leistungen und Zielgruppen benennen",
          "Standort und Einzugsgebiet nachvollziehbar beschreiben",
          "Eigene Bilder und freigegebene Referenzen verwenden, falls vorhanden",
          "Telefon, E-Mail und gewünschte Anfragewege gut erreichbar platzieren",
        ],
      },
      {
        title: "So läuft die Zusammenarbeit mit Enrico Gross ab",
        text: "Du beschreibst dein Angebot, deine Zielgruppe und das Ziel der Website. Danach werden Seiten, Funktionen, Inhalte und Budget abgestimmt. Das Angebot hält fest, welche Leistungen enthalten sind und welche Mitarbeit benötigt wird. Die Gestaltung wird besprochen, bevor die technische Umsetzung abgeschlossen wird. Abnahme, Zahlung und Übergabe richten sich nach der Vereinbarung. Die Abstimmung erfolgt nach Terminabsprache per Telefon und E-Mail; eine Anreise wird für ein Webprojekt nicht vorausgesetzt.",
        links: [
          {
            title: "Ablauf von Anfrage bis Übergabe",
            href: "/entwicklungsprozess",
          },
          {
            title: "Checkliste für dein Briefing",
            href: "/wissen/website-briefing",
          },
        ],
      },
      {
        title: "Kosten und Betrieb vorab klären",
        text: `Eine einfache Landingpage beginnt ${priceLabel(packages[0].price)}, die mehrseitige Unternehmenswebsite im Business-Paket ${priceLabel(packages[1].price)}. Der tatsächliche Projektpreis hängt von Inhalten, Gestaltung und Funktionen ab. Domain, Hosting und gegebenenfalls Lizenzen werden separat berücksichtigt. Betreuung ist optional. Wenn du Inhalte selbst ändern möchtest, planen wir ein CMS und die passende Einweisung im Angebot ein.`,
        links: [
          { title: "Website-Pakete und Konditionen", href: "/preise" },
          { title: "CMS-Websites", href: "/leistungen/websites/cms-websites" },
        ],
      },
    ],
    faq: [
      {
        question: "Wo kann ich eine Website in meiner Nähe erstellen lassen?",
        answer: `${site.name} ist das Webstudio von ${business.owner} in ${business.postcode} ${business.city}. Wir planen und entwickeln Websites für Selbstständige, Vereine und Unternehmen. Über Telefon und E-Mail klären wir nach Terminabsprache Anforderungen und Umfang; die Umsetzung ist auch für Unternehmen außerhalb Dortmunds möglich.`,
      },
      {
        question: "Muss der Webdesigner direkt in meiner Nachbarschaft sitzen?",
        answer:
          "Entscheidend sind ein erreichbarer Ansprechpartner, ein verständliches Angebot und eine abgestimmte Zusammenarbeit. Ein regionaler Sitz kann die Zuordnung erleichtern; für die Website-Entwicklung sind persönliche Vor-Ort-Termine nicht zwingend nötig. Kontaktwege und Freigaben werden vorher vereinbart.",
      },
      {
        question: "Wer ist mein Ansprechpartner für Webdesign in Dortmund?",
        answer: `${business.owner} führt ${site.name} als Einzelunternehmen. Der Unternehmenssitz ist ${business.street}, ${business.postcode} ${business.city}. Du erreichst ihn direkt per Telefon, SMS oder E-Mail; Gesprächstermine werden vorher abgestimmt.`,
      },
      {
        question: "Kann meine bestehende Website übernommen werden?",
        answer:
          "Das wird anhand der vorhandenen Technik, Inhalte und Zugänge geprüft. Je nach Zustand sind Erweiterung, Redesign oder Relaunch sinnvoll. Bereits genutzte URLs und ein vorhandenes Redaktionssystem werden in der Planung berücksichtigt.",
      },
      {
        question:
          "Sind erste Suchmaschinenplätze Bestandteil des Website-Angebots?",
        answer:
          "Technisches SEO und eine verständliche Inhaltsstruktur können Bestandteil des vereinbarten Umfangs sein. Eine bestimmte Position, Indexierung oder Erwähnung in KI-Antworten kann nicht garantiert werden. Suchmaschinen entscheiden selbst über ihre Ergebnisse.",
      },
    ],
  },
];
