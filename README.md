# Webstudio Expert

**SEO/GEO/AEO:** Die aktuelle Umsetzung, Zielseiten und Einrichtung von Domain, Search Console, Bing und IndexNow stehen in [SEO-README.md](SEO-README.md). Die öffentliche SEO-Domain ist von der aktuell genutzten CRM-Adresse getrennt konfiguriert.

**Neu: CRM unter `/crm`.** Einrichtung, Supabase-Migrationen, Telefonie, Postfach, Sicherheit und die aktuellen Grenzen stehen in [CRM-README.md](CRM-README.md). Das neue CRM-Briefing autorisiert Supabase ausdrücklich und ergänzt die unten beschriebene bisherige reine Website-Architektur. Bei aktivierter Supabase-Integration werden Website-Anfragen dauerhaft im CRM gespeichert; Aussagen zum fehlenden Datenspeicher beziehen sich auf den früheren Website-Modus.

Agenturwebsite von **Enrico Gross**, Karinstraße 5, 44388 Dortmund. Produktionsdomain: **webstudio-expert.de**. Kontakt: **kontakt@webstudio-expert.de**, **+49 155 67504871**. Kontaktwege: E-Mail, Anruf, SMS. Kein WhatsApp.

Next.js App Router, React, TypeScript Strict, Tailwind CSS und Motion. 98 Leistungsseiten, sechs Kategorien, fünf Demo-Projekte, Unternehmensseiten, Wissensbereich, Preise, Betreuung, Kontakt, Projektanfrage, eigene Termin-Anfrage, Impressum, Datenschutz, Cookie-Einstellungen, Barrierefreiheitsinformationen und 404. Karriere und Partnerprogramm wurden vollständig entfernt. Es wurden auf Wunsch keine automatisierten Tests oder Playtests ausgeführt; der Produktionsbuild prüft die Kompilierung.

## Start und Build

```powershell
npm ci
npm run dev
```

Lokaler Server: in der Konsole ausgegebene Adresse. `.env.local` wurde mit lokalen öffentlichen Angaben und einem zufälligen Formulargeheimnis eingerichtet; sie ist von Git ausgeschlossen. Nach Änderungen an Umgebungsvariablen den Dev-Server neu starten.

```powershell
npm run build
npm start
```

## Zentrale Pflege

- `src/config/site.ts`: Marke, Inhaber, Anschrift, Kontakt und Domain.
- `src/config/pricing.ts`: Paketpreise, Betreuung und Steuerhinweis. Die Beträge bleiben unverändert. Nettobetrag = Endbetrag; keine zusätzliche Umsatzsteuer gemäß § 19 UStG.
- `src/data/services.ts`: alle 98 Leistungen und individuellen Inhalte.
- `src/data/projects.ts`: Portfolio; alle Einträge sind klar als Demonstrationsprojekte gekennzeichnet.
- `src/data/pages.ts`, `src/data/articles.ts`, `src/data/legal.ts`: weitere Inhalte und Rechtstexte.
- `src/components/brand.tsx`, `public/brand/`: unveränderte Original-Brand-Assets, automatisch hell/dunkel dargestellt. Das Signet ist als SVG-Icon eingebettet.
- `src/server/form-security.ts`: interner Missbrauchsschutz ohne Redis, Upstash, CAPTCHA- oder sonstigen Anti-Spam-Dienst.

## SMTP: nachzureichende Daten

`.env.example` enthält echte öffentliche Angaben und leere SMTP-Zugangsfelder. Kein simulierter Versand. Bis zur vollständigen Konfiguration sind automatischer Formularversand und automatische Terminbestätigungsnachrichten deaktiviert. Direkte E-Mail, SMS und Anruf funktionieren unabhängig davon.

Erforderlich: `SMTP_HOST`, `SMTP_PORT` (587 mit verpflichtendem STARTTLS oder 465 mit TLS), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `INQUIRY_TO`. Absender und interne Empfängeradresse sind bereits mit `kontakt@webstudio-expert.de` vorgesehen. `MAIL_PROVIDER_NAME` und `MAIL_PROVIDER_ADDRESS` benennen den tatsächlichen Mailanbieter für die Datenschutzerklärung und müssen vor Aktivierung ausgefüllt sein. `FORM_SECRET`: kryptographisch zufälliges Geheimnis, mindestens 32 Zeichen, nur serverseitig. Das lokale Geheimnis ist vorhanden; für Vercel muss ein eigenes Geheimnis in dessen Server-Umgebungsvariablen hinterlegt werden. Niemals Secrets ins Repository übernehmen.

Der tatsächliche SMTP-/Postfachanbieter wird noch nachgereicht. E-Mail-Versand lässt sich ohne einen erreichbaren Mailserver nicht realisieren; es gibt keinen versteckten Ersatzanbieter. SPF, DKIM und DMARC nach den Vorgaben des Mailbetreibers einrichten.

## Formulare und Anhänge

Gemeinsamer Endpoint `/api/anfrage` für Projekte, Kontakt, Rückruf und Terminwünsche. Serverseitige Validierung, Herkunftsprüfung, Honeypot, signierte kurzlebige Formularnachweise, lokale Ratenbegrenzung und lokale Wiederverwendungssperre. Fünf IP-Versuche pro 15 Minuten, drei E-Mail-Versuche pro Stunde, global 100 Versuche pro Stunde **je laufender Serverinstanz**. Zähler enthalten HMAC-pseudonymisierte Schlüssel mit höchstens zwei Stunden Laufzeit. Speicher ist auf 5.000 Einträge begrenzt. Auf Vercel sind diese Regeln nicht instanzübergreifend: Neustarts und parallele Instanzen können lokale Limits und Wiederverwendungssperren umgehen. Sie ersetzen keinen verteilten Schutz. Die Herkunftsprüfung sowie Signatur-, Zeit- und Eingabeprüfung funktionieren unabhängig davon.

Uploads: höchstens drei Dateien, je 2 MB, zusammen 3 MB; kompletter Request maximal 3,5 MB. PDF, PNG, JPEG, UTF-8-TXT. Endung, MIME und Signatur werden geprüft; bekannte PDF-Aktionsmarker abgewiesen. Keine vollständige Malware-Prüfung. Dateien bleiben untrusted; sichere Verarbeitung im Postfach organisieren. Keine öffentliche Ablage oder Ausführung von Anhängen. Anfrage und Anlagen werden intern versendet; Kundenbestätigung enthält keine Anhänge. SMTP-Annahme garantiert keine Postfachzustellung. Teilfehler und unklarer Versandstatus werden ausdrücklich angezeigt.

## Eigene Termin-Anfrage

`/terminbuchung` ist eine eigene responsive Datum-/Uhrzeitauswahl ohne Kalenderanbieter. Wunschzeiten ab morgen innerhalb von 90 Tagen, etwa 30 Minuten, Zeitzone Europe/Berlin. Diese Auswahl behauptet keine geprüfte Verfügbarkeit. Der Versand läuft über denselben abgesicherten SMTP-Prozess. Bis zur SMTP-Einrichtung öffnet ein ausdrücklich beschrifteter Link die vorbereitete Nachricht in der eigenen E-Mail-App. Es wird kein erfolgreicher Serverversand vorgetäuscht.

Ein Termin wird erst nach persönlicher Bestätigung verbindlich. Es gibt bewusst keine falsche automatische Reservierung. **Vercel besitzt hier keinen dauerhaften gemeinsamen Terminspeicher.** Verbindliche Slotreservierung, Konfliktprüfung, Absagen und späteres CRM benötigen einen dauerhaften Datenspeicher. Eine eigene SQLite-Datei auf dem lokalen Dateisystem einer Vercel-Funktion ist kein zuverlässiger produktiver Datenspeicher. Der Speichermodus wird mit den folgenden CRM-Anforderungen geklärt; es wurde kein zusätzlicher Datenbankdienst eingerichtet und kein Kundendatensatz in GitHub gespeichert.

## Vercel und GitHub

Repository: [Erygros/webstudio](https://github.com/Erygros/webstudio). `vercel.json` bereitet Next.js, `npm ci`, `npm run build` und Funktionsregion Frankfurt (`fra1`) vor. Die Region verhindert nicht automatisch internationale Verarbeitung durch CDN, Support oder Unterauftragsverarbeiter.

In Vercel das GitHub-Repository importieren, Domain verbinden und die erforderlichen Servervariablen hinterlegen. `NEXT_PUBLIC_SITE_URL=https://webstudio-expert.de` in Produktion; für Preview-Deployments deren tatsächlichen Ursprung verwenden. `NEXT_PUBLIC_*` sind öffentlich. `FORM_SECRET`, SMTP-Passwort und weitere Zugangsdaten dürfen diesen Präfix niemals verwenden. Ein GitHub-Push allein belegt noch kein erfolgreiches Vercel-Deployment. Keine Vercel-Zugangsdaten wurden übermittelt.

## Rechtstexte und tatsächlicher Betrieb

Impressum und Datenschutz sind mit den übermittelten Angaben ausgearbeitet, keine erfundenen Register-/USt-ID-Daten. Falls eine Wirtschafts-ID oder ein Registereintrag tatsächlich existiert beziehungsweise später hinzukommt, die optionalen Konfigurationsfelder ergänzen. Kleinunternehmerstatus ersetzt keine Prüfung tatsächlich vorhandener Identifikationsangaben.

Hosting auf Vercel und potenzielle internationale Verarbeitung sind benannt; SMTP ist bis zur Anbieterbenennung deaktiviert. Vor öffentlichem Betrieb die tatsächliche Vertragskonstellation mit Vercel, dessen Auftragsverarbeitungsbedingungen, Übermittlungsgrundlagen und Protokollaufbewahrung anhand des Accounts prüfen. Der angelegte Text behauptet keine anwaltliche Prüfung oder garantierte Rechtssicherheit. Anfragen ohne Auftrag sollen nach Abschluss grundsätzlich innerhalb von sechs Monaten gelöscht werden; das erfordert organisatorische Löschung im geschäftlichen Postfach. Gesetzliche Aufbewahrungspflichten für Vertrags-/Buchungsunterlagen gehen vor. Keine vermeintlich automatische Löschung von Postfachdaten behaupten.

Die Website schließt über Anfrageformulare keine entgeltlichen Verträge ab. Verbraucherinformationen, gegebenenfalls Widerruf und individuell vereinbarte Nutzungsrechte sind beim konkreten Vertragsabschluss zusätzlich bereitzustellen. Generische AGB oder eine erfundene rechtliche Freigabe werden nicht als Ersatz eingesetzt. Eine WCAG-Zertifizierung liegt nicht vor.

Recherchierte Ausgangspunkte (14.10.2026): [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html), [§ 19 UStG](https://www.gesetze-im-internet.de/ustg_1980/__19.html), [Preisangabenverordnung](https://www.gesetze-im-internet.de/pangv_2022/PAngV.pdf), [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html), [DSGVO](https://eur-lex.europa.eu/eli/reg/2016/679/oj), [Vercel DPA](https://vercel.com/legal/dpa), [LDI NRW](https://www.ldi.nrw.de/kontakt).

## Datenschutz, SEO und Darstellung

Keine Analyse- oder Werbedienste, externe Schriftarten oder eingebetteten Fremdkalender. Manuelle Theme-Wahl im lokalen Browser-Speicher. Exit-Hinweis ohne zusätzlichen Sitzungsspeicher-Eintrag; maximal einmal während des aktuellen SPA-Seitenbesuchs, nach Neuladen wieder möglich. Keine Anzeige auf Formularen oder Fehlerseiten.

Individuelle Metadaten, Canonicals, Social Cards, Breadcrumbs, JSON-LD, Sitemap und robots.txt. Ausführliche Standortseite für Dortmund, acht vertiefte Leistungsseiten und fünf Ratgeber. Englische Sprache vorbereitet; keine Teilübersetzungen oder massenhaften Stadtseiten veröffentlicht. Rechtliche Informationsseiten, reine Anfrageformulare und Vercel-Aliase sind auf noindex gesetzt. Sicherheitsheader inklusive CSP; Inline-Skripte/-Styles bleiben für Next.js-Hydration und Theme-Wahl erlaubt. Untrusted HTML niemals direkt rendern.

## Noch ausstehend

SMTP-/Postfachanbieter und Zugangsdaten, Vercel-Account-Verknüpfung mit Domain und Servervariablen, Prüfung der tatsächlichen Hosting-/Mail-Verträge sowie die manuelle Endabnahme. Verbindlicher Kalender und CRM-Datenspeicherung werden nach der offenen Speicherentscheidung beziehungsweise dem folgenden CRM-Briefing ergänzt. Keine automatisierten Tests, Playtests oder ausgehenden Testnachrichten wurden ausgeführt.
