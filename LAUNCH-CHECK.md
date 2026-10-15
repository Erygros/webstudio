# Launch-Stand vom 15. Oktober 2026

**Nachtrag zum gemeldeten Formularfehler 503:** Die Freischaltung des Formulars war bestätigt, die Speicherung scheiterte jedoch beim Datenbankaufruf. Für die gefundenen Fehler im gemeinsamen Audit-Trigger und bei der Zuordnung vorhandener E-Mail-Kontakte ist jetzt [202610150001_website_inquiry_repair.sql](supabase/migrations/202610150001_website_inquiry_repair.sql) auf der vorhandenen Supabase-Datenbank auszuführen. Erst danach eine neue Anfrage und deren CRM-Eingang kontrollieren. Die vorherige Aussage, dass für die reine Website-Umstellung keine Migration nötig war, ersetzte keine Prüfung der bereits installierten Datenbankfunktionen.

Die öffentlichen Formulare sind auf direkten CRM-Empfang umgestellt. Kontakt-, Rückruf-, Projekt- und Termin-Anfragen verwenden dieselbe serverseitig validierte Speicherung. Die bestehenden Supabase-Tabellen und die bereits installierte Funktion `crm_ingest_inquiry` werden wiederverwendet. Für diese Änderung ist keine neue Datenbankmigration erforderlich.

## Umgesetzt und im Quelltext geprüft

- Empfang erfordert die vorhandenen Supabase-Variablen, kein SMTP und keinen zusätzlichen Dienst. `FORM_SECRET` kann weiter als eigener Schlüssel verwendet werden. Ohne diesen Wert wird der Formularsignierschlüssel zweckgebunden und ausschließlich serverseitig aus dem vorhandenen Service-Schlüssel abgeleitet. Keine Schlüssel werden an Besucher ausgegeben.
- Eine Erfolgsmeldung folgt erst nach erfolgreicher CRM-Speicherung. Die Datenbankfunktion speichert die vollständigen Angaben, ordnet den Kontakt zu, erzeugt Aufgabe und Benachrichtigung und übernimmt Terminwünsche als unbestätigte Kalendereinträge. Vorhandene Kontaktdaten werden dabei nicht durch den Formularinhalt überschrieben.
- Getrennte Formularabgaben bleiben getrennte Anfragen, auch bei identischem Nachrichtentext. Wiederverwendung desselben signierten Formularnachweises wird im gemeinsamen Datenbankspeicher verhindert. Dateifehler nach gespeichertem Eingang werden als fehlende Anlagen ausgewiesen und machen aus dem gespeicherten Eingang keine angeblich fehlgeschlagene Anfrage.
- Privater Dateispeicher, keine öffentliche Uploadablage. Anhänge werden im CRM nach der konkreten Anfrage gefiltert. Nachrichten werden als Text ausgegeben, nicht als HTML ausgeführt. Dateityp- und Größenprüfung bleiben aktiv.
- Neuer Navigationseintrag **Website-Anfragen** unter `/crm/anfragen`, vollständige Nachrichtendetails mit Antwortwegen und Anhängen, Verknüpfung im Dashboard und eigener Anfragen-Reiter in Kontakt-/Kundendetails. Die Listen laden paginiert und reagieren auf bestehende CRM-Aktualisierungen. Suche nach Name.
- Veraltete öffentliche Einrichtungshinweise entfernt, Datenschutzbeschreibung mit dem direkten CRM-Empfang abgeglichen. E-Mail-Versand bleibt optional. Tatsächliche Ausfälle werden weiterhin verständlich angezeigt; ein fehlender Datenbankzugang wird nicht mit einem fingierten Erfolg kaschiert.
- Kontaktangaben, Impressum, Preise und Steuerhinweise sind zentral beziehungsweise anhand der übermittelten Angaben vorhanden. Portfolioeinträge bleiben ausdrücklich Demonstrationsprojekte. Eine Verbraucherbestellung oder automatische verbindliche Terminreservierung findet über die Anfrageformulare nicht statt.
- Canonicals, Sitemap und Unternehmensdaten folgen der tatsächlich ausgelieferten Produktionsadresse `https://www.webstudio-expert.de`. Auch ältere SEO-ENV-Werte ohne `www` werden für diese Domain normalisiert. Vercel-Aliase, CRM und API-Routen bleiben von der Indexierung ausgeschlossen. Formularanfragen akzeptieren beide bekannten öffentlichen Domainvarianten und den konfigurierten Laufzeitursprung.

## Beobachteter Live-Stand vor dem Deployment dieser Änderung

Einzelne lesende HTTP-Abrufe, keine Formularabgaben: `https://webstudio-expert.de/` war erreichbar und leitete auf `https://www.webstudio-expert.de/` weiter; dort HTTP 200. `/kontakt` lieferte ebenfalls HTTP 200, enthielt aber noch den bisherigen Einrichtungshinweis. `/api/form-token` meldete `enabled: false`. Der bisherige Canonical zeigte auf die weiterleitende Variante ohne `www`. Diese Beobachtung beschreibt das vorherige Deployment, nicht automatisch den Stand nach dem Push.

## Bestätigter Live-Stand nach Veröffentlichung

Nach dem Push von `66b7c20` wurde die neue Version öffentlich ausgeliefert. Erneute einzelne lesende Abrufe am 15.10.2026 ergaben: `/kontakt` HTTP 200, Canonical `https://www.webstudio-expert.de/kontakt`, kein alter Einrichtungshinweis und kein Hinweis auf ein momentan unerreichbares Formular. `/api/form-token` lieferte HTTP 200 und `enabled: true`. Damit ist die öffentliche Formularfreischaltung live bestätigt. Es wurde keine Formularabgabe vorgenommen; der tatsächliche Datenbankeintrag bleibt für die abschließende Abnahme zu kontrollieren. TypeScript und Produktionsbuild waren erfolgreich.

## Produktionsfreigabe

1. Das neue GitHub-Deployment in Vercel erfolgreich veröffentlichen.
2. In deinem bereits angemeldeten CRM **Website-Anfragen → Verbindung prüfen** öffnen. Die Anzeige prüft lesend den serverseitigen Zugang, die benötigten Tabellen und den privaten Dateispeicher. Es werden keine Probe-Anfragen angelegt. Sie führt die Speicherfunktionen nicht aus und ersetzt deshalb keine echte Formularabgabe.
3. Einmal bewusst eine eigene Kontaktanfrage von der öffentlichen Domain senden. Danach den vollständigen Eintrag unter **Website-Anfragen** sowie die Aufgabe prüfen. Für die Projektanfrage optional eine eigene unkritische Datei verwenden und deren Zuordnung kontrollieren. Ein Terminwunsch muss als unbestätigter Kalendereintrag erscheinen. Es wurden durch den Agenten keine Testkontakte, Probe-Termine oder ausgehenden Testnachrichten erzeugt.
4. DNS/HTTPS und den tatsächlichen Deployment-Stand auf Mobilgerät und Desktop manuell ansehen. Die ursprüngliche Vorgabe gegen automatisierte Tests bleibt berücksichtigt; eine vollständige visuelle oder interaktive Live-Abnahme wurde nicht vorgenommen.

Auf Vercel erforderlich: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Ein eigenes `FORM_SECRET` ist optional. `NEXT_PUBLIC_SITE_URL` muss weiterhin zur genutzten CRM-Adresse passen; bei einem Wechsel der CRM-Adresse auch die Supabase-Auth-Redirects berücksichtigen. `NEXT_PUBLIC_SEO_URL=https://www.webstudio-expert.de` ist der neue Standard. Für internen CRM-Empfang sind keine SMTP-Variablen nötig. Verifizierung und Suchmaschinen-Einreichung sind in `SEO-README.md` beschrieben.

## Grenzen der Launch-Aussage

TypeScript und Produktionsbuild prüfen die Kompilierung. Lokale Supabase-Zugangsdaten sind nicht vorhanden; die produktiven Vercel-Einstellungen und das angemeldete CRM konnten nicht direkt eingesehen werden. Eine vollständige Ende-zu-Ende-Freigabe ist daher erst nach erfolgreicher eigener Abgabe und Kontrolle des Eintrags möglich. Die Statusanzeige grenzt fehlende Serverkonfiguration oder fehlende Tabellen ein, ohne Geheimnisse offenzulegen.

Der Datenschutztext beschreibt die eingesetzte Speicherung; er ist keine anwaltliche Freigabe. Die tatsächlich verwendeten Hosting-/Datenbankverträge und organisatorischen Löschprozesse müssen zum Betrieb passen. Anbieterunterlagen: [Supabase DPA](https://supabase.com/legal/customer-resources/data-processing-addendum), [Vercel DPA](https://vercel.com/legal/dpa). Die öffentlichen Kontaktdaten sind vorhanden; die tatsächliche Zustellbarkeit des geschäftlichen Postfachs wurde nicht bestätigt.
