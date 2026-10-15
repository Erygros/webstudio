# CRM · Webstudio Expert

## Reparatur für Formularfehler 503 (15.10.2026)

Auf einer vorhandenen Datenbank ausschließlich [202610150001_website_inquiry_repair.sql](supabase/migrations/202610150001_website_inquiry_repair.sql) vollständig im Supabase SQL Editor ausführen. Das gesamte Installationsskript nicht erneut auf einer bestehenden Datenbank starten. Die Reparatur ist wiederholbar, löscht keine Datensätze und deaktiviert keine Zugriffsregeln.

Der gemeinsame Audit-Trigger verwendete `NEW.status` auch bei Kontakten ohne entsprechende Spalte. Die neue Funktion liest vorherige und aktuelle Zeilen sicher als JSON und erfasst Statusänderungen ausschließlich bei Unternehmen. Der Eingang ordnet vorhandene E-Mail-Adressen vor dem INSERT zu, damit der globale Duplikat-Trigger nicht schon vor `ON CONFLICT` abbricht. Bestehende Kontaktdaten bleiben erhalten; Anfrage, Aufgabe und Benachrichtigung werden gemeinsam gespeichert.

Nach Ausführung das öffentliche Formular neu laden und erneut absenden. Im CRM unter **Website-Anfragen → Verbindung prüfen** wird der Reparaturstand `202610150001` geprüft. Die Statusanzeige ist weiterhin rein lesend und ersetzt keine Prüfung des tatsächlich gespeicherten Eintrags. Die SQL-Reparatur wurde mangels Datenbankzugang nicht durch den Agenten ausgeführt; es wurden keine Probe-Anfragen angelegt.

Technischer Hintergrund: [PostgreSQL – Auswertungsreihenfolge von Ausdrücken](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-EXPRESS-EVAL), [Trigger-Zeilen und ihre Felder](https://www.postgresql.org/docs/current/plpgsql-trigger.html).

Geschützter Arbeitsbereich unter `/crm`, integriert in die vorhandene Website. Die Website bleibt öffentlich, das CRM hat eigene Navigation und keine öffentliche Registrierung. Ohne Supabase-Konfiguration erscheint eine Einrichtungsseite; es gibt keine Fake-Datensätze oder simulierten erfolgreichen Integrationen.

## Einrichten

1. Ein **neues Supabase-Projekt** anlegen. In dessen SQL-Editor die Dateien aus `supabase/migrations/` in aufsteigender Reihenfolge ausführen, oder mit der Supabase CLI die Migrationen auf dieses Projekt übertragen. Die Migrationen wurden mangels Projektzugang nicht auf einer Datenbank ausgeführt. Vor Datenimport die vom Auftraggeber gewünschte manuelle Abnahme durchführen.
2. `.env.example` in die lokale/produktive Umgebung übernehmen. `NEXT_PUBLIC_SUPABASE_URL`, öffentlicher Anon-/Legacy-Publishable-Key und **serverseitiger** `SUPABASE_SERVICE_ROLE_KEY` setzen. Niemals den Service-Key mit `NEXT_PUBLIC_` versehen.
3. Supabase Auth: **öffentliche Registrierung deaktivieren**, öffentliche Site-URL und erlaubte Redirect-URLs `/crm/auth/callback` eintragen. Für Passwort-Reset den eigenen SMTP-Versand in Supabase Auth konfigurieren. Aufruf von Passwortlinks erfolgt im Browser, in dem die Wiederherstellung gestartet wurde (PKCE).
4. `node scripts/crm-secrets.mjs` erzeugt lokale Geheimnisse und VAPID-Schlüssel in der ignorierten `.env.local`, ohne sie auszugeben. Dieselben notwendigen Variablen in Vercel setzen. Die lokal bereits erzeugten Geheimnisse sind nicht im Repository. `CRM_ENCRYPTION_KEY` ist 32 Byte hex (64 Zeichen); sicher separat sichern. Ohne diesen Schlüssel sind verschlüsselte Integrationsdaten nicht wiederherstellbar.
5. `CRM_ADMIN_EMAIL` und ein eigenes `CRM_BOOTSTRAP_PASSWORD` (mindestens 12 Zeichen) setzen. `node --env-file=.env.local scripts/crm-admin.mjs` legt das echte Administratorkonto an. Es überschreibt keine vorhandenen Konten. Anschließend das Bootstrap-Passwort aus der Umgebung entfernen.
6. `npm ci`, `npm run dev` beziehungsweise `npm run build`. Anmeldung über `/crm/login`. Es werden ausdrücklich keine automatisierten Tests, Playtests oder automatisierten Testanrufe ausgeführt. Die Kompilierung ist keine Funktionsabnahme einer live konfigurierten Datenbank.

## Erweiterung „Arbeit“ auf einem bestehenden Projekt

Wenn die ursprünglichen Migrationen 001–013 bereits angewendet wurden, **nur `supabase/migrations/202610140014_work.sql` einmal ausführen**. Das gesamte Installationsskript darf nicht nochmals auf einer vorhandenen Datenbank ausgeführt werden. Danach den neuen Stand auf Vercel bereitstellen. Es werden keine zusätzlichen Zugangsdaten benötigt.

`/crm/arbeit` bietet einen geführten Vorgang mit Fortschritt, automatisch priorisierter Arbeitsliste, gespeicherten Formularentwürfen, Pause/Fortsetzen, Vorlagen und Anhängen, dem bestehenden Browser-Dialer, Kontaktverlauf und Tageszahlen. Ein Login-Cookie löst die Frage „Möchtest du jetzt arbeiten?“ einmal je Anmeldung aus. Die Freischaltung bleibt auf Administration/Vertrieb begrenzt.

Ein eigener Datensatz in `crm_work_sessions` speichert den Bearbeitungsstand. Je Benutzer und Unternehmen ist ein aktiver/pausierter Vorgang erlaubt. Fällige Wiedervorlagen werden vor offenen/neuen Leads angeboten; künftige Termine, gesperrte, archivierte, gewonnene und ausdrücklich abgeschlossene Leads sind ausgeschlossen. Überspringen stellt einen Lead für 24 Stunden zurück. Nach 100 % startet standardmäßig der nächste Vorgang; dieser Übergang lässt sich abschalten.

Wiedervorlage, Aufgabe und Kalender werden in einer Transaktion verknüpft; wiederholtes Speichern aktualisiert dieselben Einträge. Verschieben bearbeitet die bestehende Wiedervorlage. Der bestehende Gesprächsabschluss erstellt während eines Wizard-Vorgangs keine zusätzliche Wiedervorlage. Abgeschlossene Vorgänge bleiben gespeichert und erzeugen Einträge in der Lead-Historie. Der JSON-Export umfasst die Vorgänge.

Der Akquise-Wizard erstellt ausschließlich als Werbung gekennzeichnete E-Mail-Entwürfe. Er nutzt den bestehenden SMTP-Versand mit atomarer Versandübernahme und dokumentierter Kontakterlaubnis. Anrufe werden über den bestehenden Dialer gestartet. Fehlende Integrationen blockieren die jeweilige Aktion; Entwürfe/Pausieren bleiben nutzbar. Ein SMTP-Versand gilt als vom Server angenommen, nicht als garantierte Zustellung. Unklare Versandzustände werden nicht erneut gesendet. Fortschritt wird aus gespeichertem Versand beziehungsweise abgeschlossenem Gesprächsprotokoll übernommen.

Änderungen werden nach kurzer Eingabepause gespeichert; Pause und Aktionen warten auf die Speicherung. Beim Verlassen mit ungespeicherten Änderungen warnt der Browser. Die Tagesgrenzen und Wiedervorlagen verwenden Europe/Berlin. Realtime sowie regelmäßige Aktualisierung erneuern die Arbeitsliste und Tageszahlen. Tatsächlich durchgeführte Provider-Anrufe werden getrennt von manuellen Protokollen gezählt. Migration 014 wurde mangels direktem Projektzugang nicht auf der produktiven Datenbank ausgeführt; die abschließenden Funktionstests übernimmt der Auftraggeber.

## Leads importieren: OpenStreetMap / Overpass

Auf `/crm/leads` ist der Bereich **Leads importieren** integriert. Vorhandenes Supabase-Projekt: **nur `supabase/migrations/202610140015_osm_import.sql` einmal ausführen**, anschließend den neuen Stand deployen. Die Migration erstellt keine zweite Lead-Tabelle und verändert keine vorhandenen Unternehmensdaten. Kostenpflichtige APIs und zusätzliche API-Schlüssel werden nicht benötigt. Optional können `OVERPASS_API_URL` und `OSM_GEOCODER_URL` serverseitig geändert werden.

PLZ (Deutschland), Branche und Radius 1–50 km werden serverseitig validiert. Nominatim ermittelt nur den PLZ-Mittelpunkt; die Unternehmenssuche erfolgt über Overpass. Vorbelegte Branchen verwenden feste Tags, zum Beispiel `craft=gardener` für Garten-/Landschaftsbau. Freitext ist eine wörtliche Suche in OSM-Branchenmerkmalen, Namen und Beschreibungen und kein semantisches Branchenverzeichnis. Die OSM-Abdeckung und Kontaktangaben können unvollständig sein.

Limits: sechs Suchen je Benutzer/Stunde, eine Suche je Anwendung/Minute, separate globale Geocoder-Sperre, 20 Sekunden Overpass-Laufzeit/32 MB Abfragespeicher, HTTP-Abbruchfristen, begrenzte Antwortgröße und maximal 200 Vorschautreffer. Eine Begrenzung wird angezeigt; Fehler oder unvollständige Overpass-Antworten werden nicht als vollständiges Ergebnis ausgegeben. Ein identifizierender User-Agent und ein Tagescache ausschließlich für PLZ-Mittelpunkte berücksichtigen die öffentliche [Nominatim-Richtlinie](https://operations.osmfoundation.org/policies/nominatim/). Es gibt weder Autocomplete-Geocoding noch automatische Hintergrundabfragen oder Google-Scraping.

Overpass-Rohdaten werden nicht gecacht oder in Supabase gespeichert. In die Lead-Tabelle werden ausschließlich `name`, `phone`, `email`, `industry` und der geforderte Status `Neu` geschrieben; bestehende Schema-Defaults/Systemfelder bleiben bestehen. Ohne Namen wird der Treffer übersprungen. Ungültige/fehlende Kontakte bleiben leer. Bei mehreren OSM-Kontaktangaben wird die erste verwendet. Keine Adressen, Webseiten, Koordinaten oder OSM-IDs werden in die Lead-Tabelle übernommen. Suchparameter und vierfach beschränkte Vorschautreffer bleiben temporär im Browser, nicht in einer neuen Lead-Tabelle.

Die gleiche Datenbankfunktion prüft Vorschau und Import gegen alle vorhandenen Unternehmen und Ansprechpartner, einschließlich archivierter Kunden/Leads. Telefonvergleich normalisiert unter anderem `+49`, `0049`, nationale führende `0`, `(0)`, Leerzeichen und Trennzeichen. E-Mails werden getrimmt und ohne Groß-/Kleinschreibung verglichen. Firmennamen werden normalisiert (Schreibweise, deutsche Umlaute, Rechtsformen, Wortreihenfolge); Trigramm-Ähnlichkeiten werden **zur Prüfung zurückgehalten**, nicht automatisch zusammengeführt. Gleiche Namen mit vorhandener gleicher PLZ werden ausgeschlossen. Da importierte Leads absichtlich keine Standortdaten besitzen, werden regionenlos gleiche Namen konservativ zur manuellen Prüfung gehalten. Eine ausdrückliche Bestätigung als anderes Unternehmen kann nur Namensunsicherheit freigeben, nie ein Telefon-/E-Mail-Duplikat. Innerhalb eines Suchlaufs werden wiederholte Telefon-, E-Mail- und Namenswerte herausgefiltert.

Die Vorschau ist benutzergebunden, signiert und 30 Minuten gültig. Der Import übernimmt keine vom Browser frei eingesandten Firmendaten, sondern nur freigegebene Zeilen aus dieser Vorschau. Eine Datenbank-Transaktionssperre schützt die finale Prüfung; ein einmaliger Vorgangsschlüssel verhindert Wiederholung desselben Imports, auch bei mehrfachen Klicks. Unternehmens-/Kontakt-Schreibvorgänge nehmen dieselbe Sperre und verhindern neue identische Telefon-/E-Mail-Zuordnungen zu unterschiedlichen Unternehmen; alte Dubletten werden nicht verändert. Bestehende Daten werden niemals durch den Import aktualisiert. Der Verlauf kennzeichnet tatsächliche Importe als `osm.import`; die Lead-Liste wird nach dem Import aktualisiert.

Namensnennung **© OpenStreetMap contributors** und [ODbL 1.0](https://www.openstreetmap.org/copyright) bleiben im Importbereich sichtbar. Unternehmens-CSV-Exporte enthalten bei vorhandenen OSM-Importen zwei Lizenz-Kommentarzeilen; der vorhandene CSV-Importer erkennt diese Kopfzeilen. Das JSON-Backup enthält den Audit-Verlauf mit Herkunft. Bei Veröffentlichung oder Weitergabe OSM-basierter Daten sind Namensnennung und gegebenenfalls ODbL-Share-alike-Pflichten zu beachten; die Zusammenstellung mit eigenen Daten ist nicht automatisch von diesen Pflichten ausgenommen. OSM-Kontaktdaten sind keine Werbeeinwilligung; die vorhandenen Akquise-Sperren bleiben aktiv.

Die neue Migration wurde nicht auf der produktiven Datenbank ausgeführt. Keine automatisierten Tests, Playtests oder externen Testabfragen; abschließende Funktionsprüfung durch den Auftraggeber.

## Module

Dashboard aus Datenbankwerten; Leads/Kunden mit gemeinsamen Unternehmensdaten, mehreren Ansprechpartnern, Statusverlauf, Notizen, Suche, Sortierung, Filtern, Archivierung und Duplikatprüfung. Follow-ups besitzen einen eigenen Status. Aufgaben, Projekte, Checklisten, Meilensteine, manuelle Zeiterfassung, Budget-/Zeitkostenvergleich, Tag-/Woche-/Monatskalender mit Wiederholungen, private Dokumente, globale Suche, Notifications, Statistiken, CSV/XLSX-Import mit Spaltenmapping/Vorschau, CSV/JSON-Export, PDF-Berichte, Einstellungen und optionaler Leseassistent.

Archivierte Unternehmen bleiben nachvollziehbar. Verknüpfte oder geschützte Datensätze verhindern Löschung. Der Werbewiderspruch blockiert Werbeaktionen; dokumentierte Kontakterlaubnisse benötigen Kanal, Grundlage und Nachweis. Die Software entscheidet nicht selbst über die rechtliche Zulässigkeit einer Akquise. E-Mail-Inhalte werden als Text dargestellt; externe Trackingbilder werden nicht automatisch geladen.

## Datenmodell und Sicherheit

Die `crm_*`-Tabellen umfassen Benutzer/Rollen, Unternehmen/Kontakte/Erlaubnisse, Historie, Calls/Recording-Metadaten, Mailkonten/E-Mails/Vorlagen, Follow-ups, Projekte/Aufgaben/Checklisten/Zeiten, Kalender, Angebote/Positionen, Rechnungen/Positionen/Zahlungen/Anzahlungsbezüge/wiederkehrende Pläne, Verträge, Dokumente, Notifications, verschlüsselte Integrationen, Unternehmensdaten, Nummernzähler, Audit, Ereignisse, Workflow-Runs, Job-Leases, Ratenlimits und Push-Abonnements. UUIDs, Foreign Keys, Checks, Indizes, serverseitige Transaktionen und RLS.

Nur Auth-Benutzer mit freigeschaltetem `crm_users`-Profil erhalten Zugriff. Vorbereitet: administrator, vertrieb, buchhaltung; keine offene Selbstzuweisung von Rollen. Kritische Finanzfelder haben zusätzlich Column Privileges. Serverseitige APIs prüfen Identität/Rolle, Request-Origin, Daten und Schreibraten. Auth ist über Supabase SSR mit HttpOnly-Cookies eingebunden; Realtime erhält nach Zugriffsprüfung einen eigenen kurzlebigen Benutzer-Token, niemals den Service-Key. Kein Cache/keine Indexierung privater Seiten.

Integration-Secrets werden ausschließlich serverseitig mit AES-256-GCM verschlüsselt. Die Einstellungsoberfläche gibt gespeicherte Geheimnisse nicht zurück; leere Felder behalten vorhandene Werte. SMTP, IMAP und Twilio können alternativ über Server-Umgebungsvariablen konfiguriert werden. Keine Passwörter in Audit- oder Browserausgaben. Benutzer müssen vor Nutzung echte Datenschutz-/Auftragsverarbeitungsbedingungen der Anbieter berücksichtigen.

## Telefonie

Twilio Voice JavaScript SDK mit langlebigem Dialer im CRM-Layout: tatsächliche ausgehende/eingehende Verbindungen, Annehmen/Ablehnen/Beenden, Stumm, DTMF, Audiogeräte soweit im Browser unterstützt, Dauer und Gesprächsabschluss. Interne Navigation lässt den Dialer bestehen. Keine simulierten Anrufe. Fehlende Schlüssel zeigen „Nicht eingerichtet“.

Erforderlich: Account SID/Auth Token, API Key/Secret, TwiML-App SID und eine tatsächlich bei Twilio freigeschaltete Caller-ID. Die vorhandene Mobilnummer wird nicht automatisch als Twilio-Nummer ausgegeben. TwiML-App Voice-URL und die eingehende Rufnummer konfigurieren auf `https://webstudio-expert.de/api/crm/phone/webhook` (POST). Status-Webhooks werden serverseitig erzeugt. Signaturen werden gegen den exakten öffentlichen Ursprung geprüft; doppelte Events werden abgefangen. Technische Dauer/Status kommen aus Provider-Ereignissen, manuelle Protokolle bleiben getrennt gekennzeichnet.

Halten ist im implementierten Adapter nicht verfügbar. SIP-Einstellungen sind als alternative Konfiguration vorbereitet, **kein fertiger SIP-Dialer**; ein gewöhnlicher SIP-Account genügt nicht für WebRTC. Gesprächsaufzeichnung bleibt deaktiviert. Die Datenstruktur erfordert dokumentierte Einwilligungsmetadaten; eine aktive Recording-Funktion ist nicht freigeschaltet.

## E-Mail und Hintergrundverarbeitung

SMTP/IMAP mit TLS konfigurieren. Der echte Versand startet nur bewusst aus einem gespeicherten Entwurf. Atomare Anspruchnahme des Entwurfs verhindert parallelen Doppelversand. Ein Crash oder nicht eindeutiger SMTP-Status wird als **unknown** gespeichert und nicht automatisch wiederholt. Absolute Exactly-once-Zustellung kann SMTP nicht garantieren. Vor erneutem Versand das Postfach prüfen.

IMAP wird über einen **begrenzten Synchronisationsjob** abgerufen, nicht als dauerhafte Verbindung in Vercel. Job-Lease und UID/UIDVALIDITY-/Message-ID-Zuordnung verhindern Doppelimport. Synchronisiert werden INBOX und vom Mailserver per Special-Use als Sent, Archive oder Drafts ausgewiesene Ordner, insgesamt bis zu 30 Nachrichten je begrenztem Lauf. Weitere Nachrichten folgen in nachfolgenden Läufen. Provider ohne Special-Use-Kennzeichnung benötigen eine Erweiterung der Ordnerzuordnung. Manuelles CRM-Archivieren verschiebt nicht automatisch die Originalnachricht im Mailserver; CRM-Entwürfe werden nicht als fertiger bidirektionaler IMAP-Editor ausgegeben. Der Cron läuft standardmäßig täglich 06:00 UTC (Vercel-Hobby-kompatibel); häufigere Intervalle nur nach passender Plattformkonfiguration. Manuelle Synchronisation ist im CRM vorhanden. `CRON_SECRET` setzen.

Anlagen sind private, untrusted Dateien. Maximal 2 MB je Dokumentupload; bekannte unsichere Formate werden abgewiesen. Es gibt keinen vollständigen Malware-Scanner. Downloadlinks laufen nach 60 Sekunden ab. PDF/PNG/JPEG/Text bieten eine separate Vorschau; XML wird als Originaldownload geführt und nicht als aktive Seite eingebettet.

## Angebote und Rechnungen

Positionen, Mengen, Einzelpreise, Rabatt, Steuerstatus, Leistungs-/Gültigkeits-/Zahlungsdaten, PDF-Vorschau mit Branding, Nummernvergabe, Versionen, Umwandlung Angebot→Rechnung, Anzahlungen/Schlussrechnungen, Storno/Korrektur, manuelle Teilzahlungen, wiederkehrende Entwürfe und Zahlungsübersichten.

PostgreSQL NUMERIC und Decimal.js statt unpräziser JavaScript-Geldsummen. Nummern werden atomar vergeben. Beim Ausstellen werden Absender, Kunde und Positionen eingefroren; ausgegebene PDFs werden privat unveränderlich archiviert. Ein ausgestelltes Angebot ist **Ausgestellt**, erst nach tatsächlichem SMTP-Versand **Versendet**. Rechnungs-/Zahlungsstatus bleiben getrennt. Zahlungen werden nicht überschrieben; Überzahlungen werden abgewiesen. Stornoentwürfe müssen ausgestellt werden, bevor die Originalrechnung storniert wird. Korrekturen benötigen eine stornierte Ursprungsrechnung. Schlussrechnungen verrechnen dokumentierte Zahlungen auf zugeordnete Anzahlungsrechnungen. Bereits verrechnete Anzahlungen können nicht nochmals zugeordnet werden.

Unternehmensdaten, **private Steuernummer oder tatsächlich vorhandene USt-ID**, Kundenanschrift und Leistungsdatum vor Ausstellung ergänzen. Kleinunternehmerstatus ist voreingestellt. Bankdaten separat eintragen. Die Implementierung behauptet weder steuerliche Prüfung noch zertifizierte GoBD-Konformität/WORM-Archivierung. Fachliche Prüfung und Backups sind weiterhin erforderlich.

**E-Rechnungen:** XML-Originale können privat empfangen/hochgeladen und zugeordnet werden. XRechnung-/ZUGFeRD-Normprüfung, strukturierte Übernahme und normkonformer Export sind **noch nicht verfügbar**. Eine PDF wird nicht als E-Rechnung bezeichnet. Ausgangspunkt für fachliche Prüfung: [BMF E-Rechnung](https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html).

## Automatisierungen, Benachrichtigungen und KI

Konfigurierbare Regeln für neue Leads, ausgestellte/versendete/angenommene Angebote und tägliche Ereignisse. Aufgaben, Notifications und Kundenkonvertierung werden je Event/Regel idempotent in Datenbanktransaktionen ausgeführt. Wiederkehrende Rechnungen erzeugen nur **Entwürfe**, keinen ungeprüften automatischen Versand. Fällige Aufgaben/Follow-ups/Rechnungen erscheinen als Hinweise. Browser-Push erst nach Nutzerfreigabe; Push-Nachrichten enthalten nur einen allgemeinen CRM-Hinweis. VAPID-Schlüssel selbst erzeugbar, kein zusätzlicher Push-Anbieteraccount nötig; Zustellung erfolgt über den Browserdienst. Zustellung hängt von Browser, Freigabe und Lauf des Hintergrundjobs ab.

KI optional über einen OpenAI-kompatiblen HTTPS-Endpunkt. Nur begrenzte berechtigte Kennzahlen/Fälligkeiten werden übergeben, keine Integration-Secrets oder vollständige Postfachinhalte. Keine schreibenden Tools, Löschungen, Freigaben oder Versandaktionen. Ohne API-Schlüssel bleibt das CRM nutzbar. Vor Aktivierung tatsächlichen Anbieter und Datentransfer prüfen.

## Öffentliche Website

Bei vollständiger Supabase-Serverkonfiguration und vorhandenem Formulargeheimnis können Website-Anfragen **auch ohne SMTP** sicher im CRM gespeichert werden. Eingaben und Anhänge werden zugeordnet, Unternehmen anhand E-Mail geprüft, Aufgabe/Notification erstellt. Terminwünsche kommen mit Status **Angefragt** in den Kalender; sie werden nicht automatisch als bestätigt ausgegeben. Bestätigte Termine besitzen eine Überschneidungssperre in der Datenbank. Formularschutz verwendet bei Supabase-Konfiguration dauerhafte gemeinsame Ratenlimits und Nonce-Sperren. Ohne CRM-Konfiguration bleibt die vorhandene SMTP-/lokale Schutzvariante bestehen.

Vor Aktivierung die öffentliche Datenschutzerklärung um tatsächliches Supabase-Projekt, Vertragskonstellation, Standort, Fristen und weitere eingeschaltete Integrationen ergänzen. Ein CRUD-CRM allein ist kein automatisch vollständiges Datenschutz-/Löschkonzept.

## Veröffentlichung und Abnahme

Repository ist für Vercel vorbereitet. Erst Migrationen und echtes Adminprofil einrichten, öffentliche Registrierung sperren, Server-Variablen/Redirects setzen und Domain anbinden. Danach manuell RLS/Rollen, CRUD, Uploads, Rechnungs-/Stornoprozesse, echte E-Mail-Zustellung, Provider-Webhooks und mobile Bedienung prüfen. Es werden keine Zugangsdaten durch eine GitHub-Veröffentlichung ersetzt und keine erfolgreich durchgeführte Live-Abnahme behauptet.

Vollständiger logischer JSON-Export enthält CRM-Datensätze ohne Integration-Secrets und Supabase-Auth-Passwörter. Datei-Binärdaten, physische PostgreSQL-Backups, Auth-Daten und Schlüssel separat sichern; ein JSON-Export ist kein vollständiges Disaster-Recovery-Backup. Für Supabase Produktionsbetrieb regelmäßige Backups und Wiederherstellung organisatorisch einrichten.
