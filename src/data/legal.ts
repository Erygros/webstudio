import type { ContentPage } from "./pages";
import { business, site } from "@/config/site";
import { mailReady } from "@/server/form-security";
import { crmServiceConfigured } from "@/crm/server/db";

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
        text: "Die Inhalte dieser Website informieren über unsere Leistungen. Projektanfragen und Terminwünsche sind unverbindlich; Verträge kommen bei gesonderten Angeboten durch Vereinbarung und bei direkt buchbaren Einstiegspaketen durch die zahlungspflichtige Bestellung mit Buchungsbestätigung zustande. Die Portfolioeinträge sind als Demonstrationsprojekte gekennzeichnet. Texte, Gestaltung und Bilder dürfen nur mit entsprechender Berechtigung verwendet werden. Gesetzliche Nutzungsrechte bleiben unberührt.",
      },
    ],
  },
  datenschutz: {
    title: "Datenschutzerklärung.",
    label: "Datenschutz",
    legal: true,
    description:
      "Informationen über personenbezogene Daten beim Besuch dieser Website, bei Kontaktaufnahme und bei Termin- oder Projektanfragen. Stand: 19. Oktober 2026.",
    sections: [
      {
        title: "1. Verantwortlicher",
        text: `${address}\n\nE-Mail: ${site.email}\nTelefon: ${site.phone}\nFür Fragen zur Datenverarbeitung und zur Ausübung deiner Rechte kannst du dich direkt an Enrico Gross wenden.`,
      },
      {
        title: "2. Besuch der Website und Hosting",
        text: "Die Website ist für den Betrieb bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA, eingerichtet. Bei der Auslieferung werden technisch notwendige Verbindungsdaten verarbeitet, insbesondere IP-Adresse, Zeitpunkt, angeforderte Adresse, Browser-/Geräteinformationen und gegebenenfalls technische Fehlermeldungen. Dies dient der Bereitstellung, Stabilität und Sicherheit der Website. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse ist ein sicherer und funktionsfähiger Internetauftritt. Auf Anwendungsebene werden keine dauerhaften Besucherprofile oder Besuchsprotokolle gespeichert. Die technische Protokollierung des Hostinganbieters richtet sich nach dessen eingesetzten Betriebs- und Sicherheitsfunktionen. Informationen werden nicht allein zur Erstellung personenbezogener Werbeprofile erhoben.",
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
      ...(crmServiceConfigured()
        ? [
            {
              title: "CRM, Anmeldung und private Dokumente",
              text: "Zur Organisation von Anfragen, Kontakten, Projekten und Buchhaltungsunterlagen setzen wir Supabase für PostgreSQL-Datenbank, Authentifizierung, privaten Dateispeicher und Echtzeit-Aktualisierung ein. Die Vertragsunterlagen benennen Supabase Pte. Ltd als Anbieter. Es gibt keine öffentliche CRM-Registrierung. Anmeldung ist nur für freigeschaltete Personen möglich; technisch notwendige Sitzungscookies schützen diesen Bereich. Projektregion, Unterauftragsverarbeiter und internationale Übermittlungen richten sich nach der tatsächlichen Supabase-Konfiguration und den geltenden Vertragsunterlagen; eine ausschließlich deutsche Verarbeitung wird nicht behauptet. Kontakt-/Projektbearbeitung erfolgt nach Art. 6 Abs. 1 Buchst. b DSGVO, Betriebs- und Zugriffsschutz nach Art. 6 Abs. 1 Buchst. f DSGVO und gesetzliche Buchhaltungsaufbewahrung nach Art. 6 Abs. 1 Buchst. c DSGVO. Eine vorhandene Geschäftsbeziehung wird nicht mit einer Werbeeinwilligung gleichgesetzt. Werden später VoIP oder ein KI-Anbieter aktiviert, werden deren Datenflüsse vor Einsatz zusätzlich benannt. Gesprächsaufzeichnung bleibt deaktiviert.",
              links: [
                {
                  title: "Supabase Auftragsverarbeitungsbedingungen",
                  href: "https://supabase.com/legal/dpa",
                },
                {
                  title: "Supabase Datenschutz",
                  href: "https://supabase.com/privacy",
                },
              ],
            },
          ]
        : []),
      {
        title: "4. E-Mail, Telefon und SMS",
        text: "Wenn du uns per E-Mail, Anruf oder SMS kontaktierst, verarbeiten wir die von dir angegebenen Kontaktdaten und den Inhalt der Anfrage zur Bearbeitung und Rückmeldung. Angaben zu einem konkreten Projekt oder einer Terminvereinbarung werden zur Durchführung vorvertraglicher Maßnahmen nach Art. 6 Abs. 1 Buchst. b DSGVO verarbeitet. Sonstige Anfragen bearbeiten wir auf Grundlage unseres berechtigten Interesses an ihrer Beantwortung nach Art. 6 Abs. 1 Buchst. f DSGVO. Angaben wie Telefonnummer oder Unternehmen sind außerhalb einer Rückrufanfrage freiwillig. Telefonate werden von dieser Website nicht aufgezeichnet. WhatsApp ist nicht eingebunden. Bitte übermittle keine Passwörter, Gesundheitsdaten oder andere besonders sensible Informationen, wenn diese für deine Anfrage nicht erforderlich sind.",
      },
      {
        title: "5. Projekt-, Kontakt- und Terminformulare",
        text:
          "Wenn du ein Formular absendest, werden Name, E-Mail-Adresse, freiwillige Telefon- und Unternehmensangaben sowie die Nachricht und gegebenenfalls Projektangaben oder Terminwünsche an unseren Server übertragen und im zugriffsgeschützten CRM gespeichert. Dort werden die Anfrage einem Kontakt zugeordnet sowie eine Bearbeitungsaufgabe und eine interne Benachrichtigung angelegt. Anhänge werden in einem privaten Dateispeicher gespeichert. Eine Erfolgsmeldung erscheint erst, wenn die Anfrage gespeichert wurde. Rechtsgrundlagen sind Art. 6 Abs. 1 Buchst. b DSGVO für vorvertragliche Anfragen und Art. 6 Abs. 1 Buchst. f DSGVO für sonstige Kommunikation. Die Bestätigung des Datenschutzhinweises ist keine Werbeeinwilligung. Eine automatische E-Mail ist keine Voraussetzung für die Bearbeitung. Terminwünsche bleiben bis zur persönlichen Bestätigung unverbindlich." +
          (mailReady()
            ? ` Zusätzlich können Benachrichtigungen und Empfangsbestätigungen über ${mailProvider} (${process.env.MAIL_PROVIDER_ADDRESS}) versendet werden.`
            : ""),
      },
      {
        title: "Online-Buchungen, Beratung und Vertragserklärungen",
        text: "Für direkt buchbare Dienstleistungen verarbeiten wir Name, Unternehmen, E-Mail, Telefon, Rechnungsanschrift, gewähltes Paket, Projektbeschreibung, Buchungsnummer, Vertragsbedingungen, gegebenenfalls Erklärungen zum vorzeitigen Beginn, Rechnungs- und Zahlungsstatus sowie Kündigungs- und Widerrufserklärungen. Rechtsgrundlagen sind Art. 6 Abs. 1 Buchst. b DSGVO für vorvertragliche Maßnahmen und Vertragsdurchführung sowie Buchst. c für gesetzliche Nachweis- und Aufbewahrungspflichten. Die Daten werden im zugriffsgeschützten bestehenden Supabase-CRM gespeichert. Bei übereinstimmender E-Mail-Adresse wird die Buchung einer vorhandenen Kundenakte zugeordnet; bestehende Stammdaten werden dabei nicht überschrieben. Rechnungsangaben werden für jeden Vertrag gesondert festgehalten. Vertragsbestätigungen, Rechnungen, Zahlungsmitteilungen und Eingangsbestätigungen werden über unseren eingerichteten SMTP-Anbieter versandt. Interne Benachrichtigungen gehen zusätzlich an das von uns genutzte Gmail-Postfach; hierbei verarbeitet Google die notwendigen Kontakt- und Vorgangsdaten als E-Mail-Anbieter. Es besteht keine Bank-API-Verbindung, keine automatische Abbuchung und keine Marketingeinwilligung durch die Buchung. Zahlungseingänge bestätigen wir nach tatsächlicher Prüfung. Versandprotokolle dienen dem nachvollziehbaren Versand und der Vermeidung doppelter Nachrichten. Reine erfolglose Beratungsanfragen werden grundsätzlich sechs Monate nach Abschluss auf Löschung geprüft, sofern keine weitere rechtliche Grundlage besteht. Buchungs-, Rechnungs- und Zahlungsunterlagen werden nach den jeweils einschlägigen gesetzlichen Fristen aufbewahrt; Rechnungsbelege grundsätzlich acht Jahre. Vertragserklärungen bleiben für Nachweis und Rechtsansprüche entsprechend der einschlägigen Fristen gespeichert. Der Online-Widerruf und die Online-Kündigung erfordern kein Kundenkonto.",
        links: [
          {
            title: "Buchungsbedingungen und Widerruf",
            href: "/buchungsbedingungen",
          },
          { title: "Verträge hier kündigen", href: "/vertrag-kuendigen" },
          { title: "Vertrag widerrufen", href: "/vertrag-widerrufen" },
        ],
      },
      {
        title: "Bewertungsschutz und Beauftragung",
        text: "Für die gewünschte Prüfung einer Bewertung verarbeiten wir Plattform, Bewertungslink, Name, E-Mail-Adresse und freiwillige Telefon-, Unternehmens- und Sachverhaltsangaben im zugriffsgeschützten CRM. Bei Beauftragung kommen Rechnungsanschrift, Vertragsbedingungen, Zeitpunkt der Beauftragung und gegebenenfalls ausdrückliche Erklärungen zum vorzeitigen Beginn hinzu. Die Angaben dienen vorvertraglichen Maßnahmen beziehungsweise der Durchführung des Auftrags nach Art. 6 Abs. 1 Buchst. b DSGVO. Soweit für die gewünschte anwaltliche Prüfung und Vertretung erforderlich, übermitteln wir notwendige Angaben an IT-ADVO Rechtsanwälte Simbach & Kessler, Berliner Allee 59, 40212 Düsseldorf (Rechtsanwalt Colin Simbach, IT-Recht und Reputationsschutz; Rechtsanwalt Sebastian Kessler, IT-Recht). Anwaltliche Mandatsdaten werden dort in eigener Verantwortung verarbeitet. Wir rufen den Inhalt der verlinkten Bewertung nicht automatisch ab und verlangen keine Plattform-Passwörter. Eine verzögerte Eingangs-E-Mail und eine Vertragsbestätigung werden über den eingerichteten SMTP-Anbieter versandt und mit Versandstatus im CRM dokumentiert. Der Zeitgeber verwendet die bestehende Supabase-Datenbank; es wird kein zusätzlicher Termin- oder Mailingdienst eingebunden. Der geschützte Beauftragungslink ist wie ein vertraulicher Zugang zu behandeln und nicht weiterzugeben. Überweisungen werden persönlich geprüft; es besteht keine Bank-API-Verbindung. Erfolglos abgeschlossene Anfragen ohne Vertrag sollen nach Abschluss grundsätzlich innerhalb von sechs Monaten gelöscht werden; Vertrags-, Zahlungs- und Buchhaltungsunterlagen unterliegen den jeweiligen gesetzlichen Aufbewahrungsfristen. E-Mails und Kanzleiakten haben eigene Aufbewahrungsabläufe. Dies ist keine Werbeeinwilligung und keine ausschließlich automatisierte rechtliche Einzelfallentscheidung im Sinne von Art. 22 DSGVO.",
      },
      {
        title: "Interne E-Mail-Benachrichtigungen",
        text: "Zusätzlich zur CRM-Speicherung erhält der Betreiber bei einer Website-Anfrage eine kompakte E-Mail mit Name, Kontaktdaten, Formularart, übermitteltem Anliegen beziehungsweise Bewertungslink und einem Link zum zugriffsgeschützten CRM. Diese Benachrichtigungen werden über den eingerichteten SMTP-Anbieter an ein vom Betreiber genutztes Gmail-Postfach übermittelt und dort gespeichert. Dateiinhalte werden dabei nicht mitgesendet; lediglich die Namen hochgeladener Dateien können genannt werden. Gmail wird von Google bereitgestellt. Verarbeitung und mögliche internationale Datenübermittlungen richten sich zusätzlich nach den Google-Vertrags- und Datenschutzbedingungen; eine ausschließlich deutsche Speicherung wird nicht zugesagt. Die Benachrichtigung dient der Bearbeitung der angefragten Leistung und ist keine Werbenachricht. Die Aufbewahrungs- und Löschfristen für Anfragen gelten auch für diese Postfachkopien. Kunden erhalten eine gesonderte Eingangsbestätigung; bei Bewertungsanfragen folgt die Konditionen-E-Mail zeitversetzt. SMTP-Annahme allein garantiert keinen Eingang im Empfängerpostfach.",
        links: [
          {
            title: "Google-Datenschutzerklärung",
            href: "https://policies.google.com/privacy?hl=de",
          },
        ],
      },
      {
        title: "5b. Bestellungen von Firmenkontakten",
        text: "Bei einer Bestellung unter /leads verarbeiten wir Firmenname, Ansprechpartner, Rechnungsanschrift, E-Mail-Adresse, Telefonnummer, gegebenenfalls USt-IdNr., Paket, Menge und Preis. Bestellung, Zahlungszuordnung, Vertragsbedingungen, Bestellnummer und Freigabeereignisse werden im geschützten Supabase-System gespeichert. Die Daten dienen der Vertragserfüllung und vorvertraglichen Bearbeitung (Art. 6 Abs. 1 Buchst. b DSGVO), der Erfüllung gesetzlicher Buchführungs- und Aufbewahrungspflichten (Art. 6 Abs. 1 Buchst. c DSGVO) und der Absicherung gegen Missbrauch (Art. 6 Abs. 1 Buchst. f DSGVO). Die Bestellbestätigung mit Zahlungsinformationen wird über den eingerichteten SMTP-Anbieter an die angegebene E-Mail-Adresse versendet. Der Betreiber erhält zusätzlich eine E-Mail mit Bestellnummer, Käufer- und Kontaktdaten, Paket, Menge, Betrag, Zahlungsstatus und CRM-Link an sein hinterlegtes Benachrichtigungspostfach; hierfür gelten ergänzend die Hinweise zum Betreiberpostfach. Nach bestätigtem Zahlungseingang wird die CSV-Datei außerhalb des CRM über das geschäftliche E-Mail-Programm an den Kunden versendet. Die Verkaufsdateien werden dafür nicht in das CRM hochgeladen. Zahlungs- und manuell bestätigte Versandereignisse werden mit Bestellbezug protokolliert. Bereits früher erteilte geschützte Downloadfreigaben können als historische Vertragsvorgänge bestehen bleiben. Eine Bankzahlung wird durch die Buchhaltung bestätigt; es erfolgt kein Zugriff auf Onlinebanking-Zugangsdaten des Käufers. Ausgelieferte Firmenkontakte stammen aus gesondert freigegebenen Datenquellen. Der Erwerb enthält keine Einwilligung der aufgeführten Kontakte für Werbung. Personenbezogene Informationen in den Verkaufsdaten unterliegen eigenen Informations-, Widerspruchs- und Löschpflichten; entsprechende Anliegen können an kontakt@webstudio-expert.de gerichtet werden.",
        links: [
          { title: "Firmenkontakte und Bestellbedingungen", href: "/leads" },
        ],
      },
      {
        title: "6. Freiwillige Dateianhänge",
        text: "Bei aktivierter Projektanfrage können bis zu drei Dateien angehängt werden: je maximal 2 MB und insgesamt maximal 3 MB. Zulässig sind PDF, PNG, JPEG und UTF-8-Text. Dateityp, Größe und bekannte problematische Inhalte werden technisch geprüft. Anhänge werden im Arbeitsspeicher geprüft. Bei aktiviertem CRM werden sie zusätzlich in einem privaten Supabase-Speicher zugeordnet; bei aktiviertem SMTP können sie als Anlagen an die interne E-Mail versendet werden. Es gibt keine öffentliche Uploadablage. Die Dateien dienen ausschließlich der Bearbeitung deiner Anfrage. Nach Versand können sie im geschäftlichen E-Mail-Postfach gespeichert sein. Bitte beschränke die Unterlagen auf die erforderlichen Informationen.",
      },
      {
        title: "7. Schutz vor missbräuchlichen Eingaben",
        text: "Formulare verwenden eine Herkunftsprüfung, serverseitige Eingabeprüfung, einen kurzlebigen signierten Formularnachweis, ein für Menschen nicht auszufüllendes Prüffeld und lokale Anfragebegrenzungen. Dafür können kurzlebige, mit HMAC pseudonymisierte Schlüssel auf Basis von IP-Adresse oder E-Mail-Adresse im Arbeitsspeicher der laufenden Serverinstanz gehalten werden. Ohne Datenbank laufen sie nach spätestens zwei Stunden ab oder gehen beim Ende der Instanz verloren. Bei aktiviertem CRM werden gemeinsame pseudonymisierte Zähler und Wiederverwendungssperren in Supabase gespeichert. Formularnachweise sind höchstens zwei Stunden gültig; abgelaufene Kontrollinformationen werden bei weiteren Anfragen oder durch den regelmäßig konfigurierten Hintergrundjob bereinigt. Pseudonymisierung ist keine Anonymisierung. Bei aktivierter Cloudflare-Konfiguration schützt zusätzlich Turnstile die öffentlichen Anfrage- und Bestellformulare sowie CRM-Anmeldung und Passwort-Zurücksetzung. Anbieter ist Cloudflare, Inc., USA. Die Prüfung wird im jeweiligen Formular geladen, nicht als allgemeine Besuchsanalyse. Cloudflare verarbeitet dabei technische Signale wie IP-Adresse, Browserinformationen, TLS-Merkmale und die aufgerufene Herkunft, um Menschen von Bots zu unterscheiden. Unser Server erhält einen einmalig verwendbaren Prüfnachweis und prüft diesen bei Cloudflare. Formulartexte, Anhänge, Passwörter oder Zahlungsinformationen werden durch unsere Integration nicht an die Prüf-API übermittelt; Prüfnachweise werden nicht in Anfragen oder E-Mails gespeichert. Cloudflare verarbeitet Signale auch zur Verbesserung seiner Bot-Erkennung in eigener Verantwortlichkeit. Eine Verarbeitung in den USA ist möglich; hierzu gelten Cloudflares Datenschutz- und Übermittlungsbedingungen. Turnstile dient dem Schutz der angeforderten Formularfunktion und wird unabhängig von freiwilliger Statistik- oder Marketingzustimmung eingesetzt. Eine Pre-Clearance-Funktion wird von unserer Integration nicht aktiviert. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. f DSGVO; unser berechtigtes Interesse ist die Verhinderung von Spam und missbräuchlichem Versand. Soweit ein technisch erforderlicher Zugriff auf das Endgerät erfolgt, stützt er sich auf § 25 Abs. 2 Nr. 2 TDDDG.",
        links: [
          {
            title: "Cloudflare Turnstile – Datenschutzinformationen",
            href: "https://www.cloudflare.com/turnstile-privacy-policy/",
          },
        ],
      },
      {
        title: "8. Lokale Darstellung und Cookies",
        text: "Wenn du selbst eine helle oder dunkle Darstellung auswählst, wird diese Wahl unter dem Schlüssel theme im lokalen Speicher deines Browsers abgelegt. Sie bleibt bis zur Änderung oder Löschung der Browserdaten bestehen und wird nicht an uns übertragen. Die Speicherung dient der von dir ausdrücklich gewünschten Darstellung; § 25 Abs. 2 Nr. 2 TDDDG berücksichtigt technisch unbedingt erforderliche Speicherungen für einen ausdrücklich gewünschten Dienst. Personenbezogene technische Verarbeitung erfolgt, soweit einschlägig, auf Grundlage von Art. 6 Abs. 1 Buchst. f DSGVO. Der schließbare Exit-Hinweis merkt sich seine Anzeige nur im Arbeitsspeicher der aktuell geöffneten Website. Deine Zustimmung oder Ablehnung zu Leadinfo wird getrennt unter webstudio-leadinfo-consent-v1 für 180 Tage lokal gespeichert. Diese Speicherung dient der Beachtung deiner Datenschutzwahl. Ohne gültige Zustimmung wird Leadinfo nicht geladen. Externe Schriftarten und eingebettete Drittanbieter-Kalender werden nicht geladen.",
        links: [
          {
            title: "Darstellung und Cookie-Einstellungen",
            href: "/cookie-einstellungen",
          },
        ],
      },
      {
        title: "8a. Freiwillige Besuchsanalyse mit Leadinfo",
        text: "Mit deiner vorherigen Zustimmung verwenden wir Leadinfo B.V., Niederlande, zur Erkennung von Unternehmensbesuchen und zur Auswertung unserer öffentlichen Website. Der Dienst verarbeitet insbesondere IP-Adresse, aufgerufene Seiten, Zeitpunkt und technische Browserinformationen und gleicht Besuche mit Unternehmensdaten ab. Wir können dadurch Informationen zu besuchenden Unternehmen und deren Website-Nutzung erhalten. Je nach Konfiguration verwendet Leadinfo Cookies oder lokalen Browser-Speicher zur Wiedererkennung; auch ein Betrieb ohne Cookies ist möglich. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 Buchst. a DSGVO und, soweit auf deinem Endgerät Informationen gespeichert oder ausgelesen werden, § 25 Abs. 1 TDDDG. Ablehnen hat keinen Einfluss auf die Nutzung der Website oder die Bearbeitung von Anfragen. Du kannst deine Zustimmung über Cookie-Einstellungen jederzeit für die Zukunft widerrufen. Das stoppt das weitere Laden, löscht aber keine bereits an Leadinfo übertragenen Daten; Löschanfragen kannst du an uns richten. Die Analyse dient der Unternehmensbesuchserkennung; eine gesonderte Übermittlung von Formularinhalten oder Bildschirmaufzeichnungen wird durch unsere Integration nicht eingerichtet. CRM, API und private Bewertungs-Bestellseiten sind vom Tracking ausgenommen. Für die Verarbeitung durch den Anbieter gelten zusätzlich dessen Datenschutzinformationen und die vereinbarten Aufbewahrungs- und Löschbedingungen. Es findet durch den Tracker keine automatische Übernahme in unsere CRM-Lead-Tabelle statt.",
        links: [
          {
            title: "Leadinfo-Datenschutzinformationen",
            href: "https://www.leadinfo.com/de/rechtliches/datenschutz/",
          },
          {
            title: "Einwilligung ändern oder widerrufen",
            href: "/cookie-einstellungen",
          },
        ],
      },
      {
        title: "8b. Vercel Web Analytics",
        text: "Nach deiner gesonderten Zustimmung nutzen wir Vercel Web Analytics von Vercel Inc., USA, zur statistischen Auswertung öffentlicher Seitenaufrufe. Verarbeitet werden aufgerufene Seiten, Herkunft und technische Geräteinformationen. Der Dienst verwendet keine Analyse-Cookies und bildet laut Anbieter einen zeitlich begrenzten Besucher-Hash aus der Anfrage. CRM und private Bestellseiten sind ausgeschlossen. URL-Suchparameter und Fragmente werden vor dem Ereignisversand entfernt; Formularinhalte und individuelle Ereignisse senden wir nicht. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. a DSGVO. Die Zustimmung wird separat unter webstudio-vercel-analytics-consent-v1 für 180 Tage lokal gespeichert und kann über Cookie-Einstellungen widerrufen werden. Internationale Übermittlungen richten sich nach den Vercel-Vertragsbedingungen und den dort vorgesehenen Datenschutzgarantien. Die zuvor erteilte Leadinfo-Zustimmung gilt nicht für Vercel Web Analytics.",
        links: [
          {
            title: "Vercel Web Analytics: Datenschutzinformationen",
            href: "https://vercel.com/docs/analytics/privacy-policy",
          },
          {
            title: "Vercel-Auftragsverarbeitungsbedingungen",
            href: "https://vercel.com/legal/dpa",
          },
          { title: "Einwilligung verwalten", href: "/cookie-einstellungen" },
        ],
      },
      {
        title: "9. Speicherdauer",
        text: "Anfragen ohne anschließenden Auftrag werden nach Abschluss der Bearbeitung grundsätzlich innerhalb von sechs Monaten aus unseren aktiv verwalteten Anfragebeständen gelöscht, sofern keine weiteren Rückfragen, Rechtsansprüche oder Aufbewahrungspflichten entgegenstehen. Terminwünsche werden entsprechend behandelt. Entsteht ein Vertragsverhältnis, werden relevante Unterlagen für Vertragsdurchführung und gesetzliche Aufbewahrung aufbewahrt. Die Frist richtet sich nach der jeweiligen Unterlagenart und der geltenden handels- oder steuerrechtlichen Pflicht. Nicht benötigte Anlagen werden früher gelöscht. Wenn das CRM aktiviert ist, werden Anfragen, Terminwünsche und private Dokumente dauerhaft bis zur erforderlichen Löschung gespeichert. Nicht aufbewahrungspflichtige Daten können durch den zuständigen Administrator entfernt werden; eine Archivierung ist keine Löschung. Die Löschung im geschäftlichen Postfach und die Berücksichtigung von Backups werden organisatorisch umgesetzt. Technische Hostprotokolle unterliegen den Betriebsregeln des Hostinganbieters.",
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
        text: "Die öffentliche Website ist für verschlüsselte HTTPS-Verbindungen eingerichtet. Formularinhalte werden nicht als HTML ausgeführt; SMTP-Versand setzt eine verschlüsselte Verbindung voraus. Absolute Sicherheit kann dennoch nicht zugesichert werden. Ändern sich Funktionen, Dienstleister oder Verarbeitungszwecke, wird diese Erklärung entsprechend angepasst. Stand dieser Fassung: 16. Oktober 2026.",
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
        text: "Es liegt keine vollständige unabhängige Prüfung anhand der WCAG oder EN 301 549 vor. Eine vollständige Konformität wird daher nicht behauptet. Diese Information ist keine gesetzlich geprüfte Konformitätserklärung. Stand: 14. Oktober 2026.",
      },
      {
        title: "Eine Hürde melden",
        text: `Bitte beschreibe die betroffene Seite und den Bedienablauf. Du erreichst Enrico Gross unter ${site.email} oder ${site.phone}. Wir prüfen die Rückmeldung und stimmen einen zugänglichen Kontaktweg ab.`,
        links: [{ title: "Kontakt aufnehmen", href: "/kontakt" }],
      },
    ],
  },
};
