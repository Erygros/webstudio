import type { ContentPage } from "./pages";
import { business, site } from "@/config/site";
import { formReady } from "@/server/form-security";

const address = `${business.owner}\n${site.name}\n${business.street}\n${business.postcode} ${business.city}\n${business.country}`;
const mailProvider = process.env.MAIL_PROVIDER_NAME || "";

export const legalPages: Record<string, ContentPage> = {
  impressum: {
    title: "Impressum.",
    label: "Anbieterkennzeichnung",
    legal: true,
    description:
      "Angaben zum Anbieter von Webstudio Expert gemäß § 5 Digitale-Dienste-Gesetz (DDG).",
    sections: [
      {
        title: "Anbieter",
        text: `${address}\n\nEinzelunternehmen. Inhaber: ${business.owner}.`,
      },
      {
        title: "Kontakt",
        text: `E-Mail: ${site.email}\nTelefon und SMS: ${site.phone}`,
        links: [
          { title: "E-Mail senden", href: `mailto:${site.email}` },
          {
            title: "Anrufen",
            href: `tel:${site.phone.replace(/[^+\d]/g, "")}`,
          },
        ],
      },
      {
        title: "Umsatzsteuer",
        text:
          "Es wird die Kleinunternehmerregelung gemäß § 19 UStG angewendet. Für die hier entsprechend angebotenen Leistungen wird keine Umsatzsteuer berechnet oder gesondert ausgewiesen." +
          (business.vatId
            ? `\nUmsatzsteuer-Identifikationsnummer: ${business.vatId}`
            : "") +
          (business.economicId
            ? `\nWirtschafts-Identifikationsnummer: ${business.economicId}`
            : ""),
      },
      ...(business.register
        ? [{ title: "Register", text: business.register }]
        : []),
      {
        title: "Inhalte und Rechte",
        text: "Die Inhalte dieser Website informieren über unsere Leistungen. Projektanfragen und Terminwünsche sind unverbindlich; Verträge kommen erst durch eine gesonderte Vereinbarung zustande. Die Portfolioeinträge sind als Demonstrationsprojekte gekennzeichnet. Texte, Gestaltung und Bilder dürfen nur mit entsprechender Berechtigung verwendet werden. Gesetzliche Nutzungsrechte bleiben unberührt.",
      },
    ],
  },
  datenschutz: {
    title: "Datenschutzerklärung.",
    label: "Datenschutz",
    legal: true,
    description:
      "Informationen über personenbezogene Daten beim Besuch dieser Website, bei Kontaktaufnahme und bei Termin- oder Projektanfragen. Stand: 14. Oktober 2026.",
    sections: [
      {
        title: "1. Verantwortlicher",
        text: `${address}\n\nE-Mail: ${site.email}\nTelefon: ${site.phone}\nFür Fragen zur Datenverarbeitung und zur Ausübung deiner Rechte kannst du dich direkt an Enrico Gross wenden.`,
      },
      {
        title: "2. Besuch der Website und Hosting",
        text: "Die Website ist für den Betrieb bei Vercel Inc., USA, eingerichtet. Bei der Auslieferung werden technisch notwendige Verbindungsdaten verarbeitet, insbesondere IP-Adresse, Zeitpunkt, angeforderte Adresse, Browser-/Geräteinformationen und gegebenenfalls technische Fehlermeldungen. Dies dient der Bereitstellung, Stabilität und Sicherheit der Website. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse ist ein sicherer und funktionsfähiger Internetauftritt. Auf Anwendungsebene werden keine dauerhaften Besucherprofile oder Besuchsprotokolle gespeichert. Die technische Protokollierung des Hostinganbieters richtet sich nach dessen eingesetzten Betriebs- und Sicherheitsfunktionen. Informationen werden nicht allein zur Erstellung personenbezogener Werbeprofile erhoben.",
        links: [
          {
            title: "Vercel Datenschutzinformationen",
            href: "https://vercel.com/legal/privacy-notice",
          },
          {
            title: "Vercel Auftragsverarbeitungsbedingungen",
            href: "https://vercel.com/legal/dpa",
          },
        ],
      },
      {
        title: "3. Empfänger und internationale Verarbeitung",
        text: "Technische Hostingdaten werden durch Vercel und dessen für den Betrieb eingesetzte Unterauftragsverarbeiter verarbeitet. Je nach Infrastruktur kann dies außerhalb der EU beziehungsweise des EWR, insbesondere in den USA, erfolgen. Für Auftragsverarbeitung gelten die Anforderungen aus Art. 28 DSGVO. Übermittlungen in Drittländer benötigen die Voraussetzungen der Art. 44 ff. DSGVO, etwa einen anwendbaren Angemessenheitsbeschluss oder geeignete Garantien wie EU-Standardvertragsklauseln. Die Vercel-Vertragsunterlagen beschreiben die angebotenen Schutzmechanismen. Eine unabhängige Zertifizierung dieser Website oder die ausschließlich deutsche Speicherung wird nicht behauptet. Anfragende Personen erhalten keine Informationen über andere Anfragen.",
      },
      {
        title: "4. E-Mail, Telefon und SMS",
        text: "Wenn du uns per E-Mail, Anruf oder SMS kontaktierst, verarbeiten wir die von dir angegebenen Kontaktdaten und den Inhalt der Anfrage zur Bearbeitung und Rückmeldung. Angaben zu einem konkreten Projekt oder einer Terminvereinbarung werden zur Durchführung vorvertraglicher Maßnahmen nach Art. 6 Abs. 1 Buchst. b DSGVO verarbeitet. Sonstige Anfragen bearbeiten wir auf Grundlage unseres berechtigten Interesses an ihrer Beantwortung nach Art. 6 Abs. 1 Buchst. f DSGVO. Angaben wie Telefonnummer oder Unternehmen sind außerhalb einer Rückrufanfrage freiwillig. Telefonate werden von dieser Website nicht aufgezeichnet. WhatsApp ist nicht eingebunden. Bitte übermittle keine Passwörter, Gesundheitsdaten oder andere besonders sensible Informationen, wenn diese für deine Anfrage nicht erforderlich sind.",
      },
      {
        title: "5. Projekt-, Kontakt- und Terminformulare",
        text: formReady()
          ? `Die Formulare übertragen Namen, E-Mail-Adresse, freiwillige Telefon- und Unternehmensangaben, Projektinformationen beziehungsweise den gewünschten Termin an die interne Empfängeradresse. Der Versand erfolgt über ${mailProvider || "den konfigurierten E-Mail-Server"}${process.env.MAIL_PROVIDER_ADDRESS ? ` (${process.env.MAIL_PROVIDER_ADDRESS})` : ""}. Eine gesonderte Bestätigung geht an die angegebene E-Mail-Adresse. Terminwünsche werden persönlich geprüft; die Auswahl bedeutet noch keine verbindliche Reservierung. Rechtsgrundlagen sind Art. 6 Abs. 1 Buchst. b DSGVO für vorvertragliche Anfragen und Art. 6 Abs. 1 Buchst. f DSGVO für sonstige Kommunikation. Die Kenntnisnahme des Datenschutzhinweises ist keine Einwilligung in Werbung.`
          : "Der automatische Formularversand ist derzeit deaktiviert, weil der E-Mail-Server noch nicht eingerichtet ist. Es werden keine ausgefüllten Formularinhalte als vermeintlich erfolgreiche Anfrage gespeichert oder versendet. Du kannst uns über die angegebenen direkten Kontaktwege erreichen. Nach Aktivierung werden Kontaktdaten, Projektangaben und Terminwünsche verschlüsselt an den konfigurierten Mailserver übertragen. Der tatsächliche E-Mail-Dienstleister wird vor Aktivierung in dieser Erklärung benannt. Eine Auswahl im Terminkalender ist kein bestätigter Termin.",
      },
      {
        title: "6. Freiwillige Dateianhänge",
        text: "Bei aktivierter Projektanfrage können bis zu drei Dateien angehängt werden: je maximal 2 MB und insgesamt maximal 3 MB. Zulässig sind PDF, PNG, JPEG und UTF-8-Text. Dateityp, Größe und bekannte problematische Inhalte werden technisch geprüft. Anhänge werden im Arbeitsspeicher verarbeitet und als Anlagen an die interne E-Mail versendet. Es gibt keine öffentliche Uploadablage. Die Dateien dienen ausschließlich der Bearbeitung deiner Anfrage. Nach Versand können sie im geschäftlichen E-Mail-Postfach gespeichert sein. Bitte beschränke die Unterlagen auf die erforderlichen Informationen.",
      },
      {
        title: "7. Schutz vor missbräuchlichen Eingaben",
        text: "Formulare verwenden eine Herkunftsprüfung, serverseitige Eingabeprüfung, einen kurzlebigen signierten Formularnachweis, ein für Menschen nicht auszufüllendes Prüffeld und lokale Anfragebegrenzungen. Dafür können kurzlebige, mit HMAC pseudonymisierte Schlüssel auf Basis von IP-Adresse oder E-Mail-Adresse im Arbeitsspeicher der laufenden Serverinstanz gehalten werden. Sie laufen nach spätestens zwei Stunden ab oder gehen beim Ende der Instanz verloren. Pseudonymisierung ist keine Anonymisierung. Es werden keine Anfragen an externe CAPTCHA- oder Anti-Spam-Anbieter gesendet. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse ist die Verhinderung von Spam und missbräuchlichem Versand.",
      },
      {
        title: "8. Lokale Darstellung und Cookies",
        text: "Diese Website verwendet keine Analyse- oder Werbe-Cookies und lädt keine Trackingdienste, externen Schriftarten oder eingebetteten Drittanbieter-Kalender. Wenn du selbst eine helle oder dunkle Darstellung auswählst, wird diese Wahl unter dem Schlüssel theme im lokalen Speicher deines Browsers abgelegt. Sie bleibt bis zur Änderung oder Löschung der Browserdaten bestehen und wird nicht an uns übertragen. Die Speicherung dient der von dir ausdrücklich gewünschten Darstellung; § 25 Abs. 2 Nr. 2 TDDDG berücksichtigt technisch unbedingt erforderliche Speicherungen für einen ausdrücklich gewünschten Dienst. Personenbezogene technische Verarbeitung erfolgt, soweit einschlägig, auf Grundlage von Art. 6 Abs. 1 Buchst. f DSGVO. Der schließbare Exit-Hinweis merkt sich seine Anzeige nur im Arbeitsspeicher der aktuell geöffneten Website, ohne zusätzlichen Eintrag im Browser-Speicher. Einstellungen kannst du über die entsprechende Seite ändern.",
        links: [
          {
            title: "Darstellung und Cookie-Einstellungen",
            href: "/cookie-einstellungen",
          },
        ],
      },
      {
        title: "9. Speicherdauer",
        text: "Anfragen ohne anschließenden Auftrag werden nach Abschluss der Bearbeitung grundsätzlich innerhalb von sechs Monaten aus unseren aktiv verwalteten Anfragebeständen gelöscht, sofern keine weiteren Rückfragen, Rechtsansprüche oder Aufbewahrungspflichten entgegenstehen. Terminwünsche werden entsprechend behandelt. Entsteht ein Vertragsverhältnis, werden relevante Unterlagen für Vertragsdurchführung und gesetzliche Aufbewahrung aufbewahrt. Die Frist richtet sich nach der jeweiligen Unterlagenart und der geltenden handels- oder steuerrechtlichen Pflicht. Nicht benötigte Anlagen werden früher gelöscht. Die Website besitzt keinen dauerhaften Anfrage- oder Termindatenspeicher; die Löschung im geschäftlichen Postfach wird organisatorisch umgesetzt. Technische Hostprotokolle unterliegen den Betriebsregeln des Hostinganbieters.",
      },
      {
        title: "10. Deine Rechte",
        text: "Unter den gesetzlichen Voraussetzungen hast du das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Datenübertragbarkeit (Art. 20). Soweit eine Verarbeitung auf Einwilligung beruht, kannst du diese jederzeit für die Zukunft widerrufen; die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt. Die Bereitstellung von Kontaktdaten ist nicht gesetzlich vorgeschrieben. Ohne die zur Bearbeitung benötigten Angaben können wir eine Anfrage nicht beantworten. Es erfolgt keine ausschließlich automatisierte Entscheidung mit rechtlicher oder vergleichbar erheblicher Wirkung nach Art. 22 DSGVO.",
      },
      {
        title: "11. Widerspruch",
        text: "Du kannst aus Gründen deiner besonderen Situation einer auf Art. 6 Abs. 1 Buchst. e oder f DSGVO gestützten Verarbeitung nach Art. 21 DSGVO widersprechen. Wir verarbeiten die Daten dann nicht weiter, sofern keine gesetzlich vorgesehenen vorrangigen Gründe oder die Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen entgegenstehen. Einer Verarbeitung für Direktwerbung kannst du jederzeit widersprechen. Diese Website betreibt derzeit keine personalisierte Direktwerbung.",
      },
      {
        title: "12. Beschwerderecht",
        text: "Du kannst dich bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere am Ort deines gewöhnlichen Aufenthalts, Arbeitsplatzes oder des vermuteten Verstoßes. Für den Unternehmenssitz in Nordrhein-Westfalen ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen eine Anlaufstelle: Postfach 20 04 44, 40102 Düsseldorf; E-Mail: poststelle@ldi.nrw.de.",
        links: [
          {
            title: "LDI Nordrhein-Westfalen",
            href: "https://www.ldi.nrw.de/kontakt",
          },
        ],
      },
      {
        title: "13. Sicherheit und Änderungen",
        text: "Die öffentliche Website ist für verschlüsselte HTTPS-Verbindungen eingerichtet. Formularinhalte werden nicht als HTML ausgeführt; SMTP-Versand setzt eine verschlüsselte Verbindung voraus. Absolute Sicherheit kann dennoch nicht zugesichert werden. Ändern sich Funktionen, Dienstleister oder Verarbeitungszwecke, wird diese Erklärung entsprechend angepasst. Stand dieser Fassung: 14. Oktober 2026.",
      },
    ],
  },
  barrierefreiheit: {
    title: "Zugänglichkeit dieser Website.",
    label: "Barrierefreiheit",
    legal: true,
    description:
      "Informationen zur Zugänglichkeit von Webstudio Expert. Eine unabhängige Konformitätsprüfung oder Zertifizierung liegt nicht vor.",
    sections: [
      {
        title: "Umgesetzte Maßnahmen",
        text: "Die Website berücksichtigt semantische Inhalte, alternative Bildbeschreibungen, Tastaturbedienung, sichtbare Fokuszustände, eine Sprungmarke zum Hauptinhalt, beschriftete Formulare und die Systemeinstellung für reduzierte Bewegung. Menüs und Hinweise lassen sich schließen. Die Gestaltung ist für unterschiedliche Bildschirmgrößen vorgesehen.",
      },
      {
        title: "Bekannte Grenzen und Stand",
        text: "Es liegt keine vollständige unabhängige Prüfung anhand der WCAG oder EN 301 549 vor. Eine vollständige Konformität wird daher nicht behauptet. Automatisierte Tests und Playtests wurden auf Wunsch des Auftraggebers nicht durchgeführt. Diese Information ist keine gesetzlich geprüfte Konformitätserklärung. Stand: 14. Oktober 2026.",
      },
      {
        title: "Eine Hürde melden",
        text: `Bitte beschreibe die betroffene Seite und den Bedienablauf. Du erreichst Enrico Gross unter ${site.email} oder ${site.phone}. Wir prüfen die Rückmeldung und stimmen einen zugänglichen Kontaktweg ab.`,
        links: [{ title: "Kontakt aufnehmen", href: "/kontakt" }],
      },
    ],
  },
};
