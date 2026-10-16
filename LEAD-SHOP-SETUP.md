# Exklusiver Lead-Verkauf

Öffentlich: `/leads`. Geschützte Verwaltung: `/crm/lead-verkauf` (Administration und Buchhaltung). Bankkonfiguration und Import nur für Administration.

## Einmalig einrichten

1. Im bestehenden Supabase SQL Editor **nur** `supabase/migrations/202610160001_lead_shop.sql` vollständig einmal ausführen. Voraussetzung sind das bestehende CRM und der bereits eingerichtete Supabase-Zeitgeber für Bewertungs-E-Mails (pg_cron, pg_net, Vault). Nicht die komplette CRM-Installation erneut ausführen.
2. Den neuen Stand über das bestehende Vercel-Projekt deployen. Die vorhandenen Supabase- und SMTP-Variablen sowie der bereits mit Vault abgeglichene `CRON_SECRET` werden wiederverwendet. Keine neuen Anbieter oder Schlüssel erforderlich.
3. Im CRM unter **Lead-Verkauf → Zahlungskonfiguration** tatsächlichen Kontoinhaber und IBAN eintragen. Es sind absichtlich keine Kontodaten vorbelegt. Verkauf zunächst deaktiviert lassen.
4. Im selben Bereich die vorhandene CSV auswählen, vier Spalten zuordnen und Datenquelle/Weitergaberecht sowie Datum der Bestandsprüfung dokumentieren. Die Bestätigung umfasst die erforderlichen Rechte und die Bestandsbereinigung. Erst danach importieren. Der Code ersetzt keine Prüfung der tatsächlichen Rechte oder der Erreichbarkeit durch den Dateninhaber.
5. Bestand und Zeitgeber prüfen: Im CRM müssen freie Kontakte und ein aktueller Versandlauf erscheinen. Anschließend Verkauf aktivieren. Mindestens 500 freie gültige Kontakte werden für das kleinste Paket benötigt. Ohne Einrichtung bleiben die Kaufbuttons gesperrt; es gibt keine Demo-Kontakte.

## CSV-Import

UTF-8-CSV, Komma oder Semikolon, maximal 150 MB / 500.000 Datenzeilen pro Datei. Spalten für Firmenname, Telefonnummer, E-Mail und Website sind Pflicht; andere Spalten werden nicht übernommen. Vorschau/Zuordnung erfolgen im Browser. Importpakete enthalten höchstens 1.000 Zeilen und werden begrenzt nacheinander gesendet. Fortschritt zeigt neue, ungültige und doppelte Datensätze.

Website muss eine HTTP(S)-Adresse sein; Firmenname und Telefonnummer müssen vorhanden und E-Mail-Adressen syntaktisch gültig sein. Internationale Telefonnummern bitte mit Ländervorwahl angeben; nationale führende Null wird als deutsche Vorwahl normalisiert. Es findet weder ein SMTP-Test der Adressen noch ein Website-Scraping oder Anruf statt. Unternehmensbestand/Weitergaberecht werden anhand des dokumentierten Importnachweises freigegeben.

Eine normalisierte Website-Domain, Telefonnummer oder E-Mail-Adresse darf nur einmal im Verkaufsbestand vorkommen. Das schützt auch vor erneut importierten verkauften Kontakten. Gemeinsame Zentralnummern, Domains oder Sammelpostfächer verschiedener Niederlassungen können deshalb weitere Zeilen ausschließen. Vorhandene Einträge werden niemals überschrieben. Nach einer Unterbrechung ist ein erneuter Import möglich; bereits importierte Zeilen werden übersprungen. Die normale CRM-Lead-Tabelle bleibt unberührt.

## Bestellung und Exklusivität

Standard: 500 Kontakte / 149 €. Enterprise verwendet exakt die vereinbarten Preisstufen von 500 bis 5.000 Kontakten. Preise sind vollständige Zahlbeträge ohne zusätzliche USt. (§ 19 UStG). Nettobetrag = Endbetrag. Keine frei wählbare Branche/Region.

Der Kunde prüft seine Rechnungsdaten und akzeptiert B2B-Bestellung und gespeicherte Vertragsbedingungen vor dem kostenpflichtigen Abschluss. Postgres berechnet den Preis erneut, vergibt eine eindeutige Bestellnummer, speichert Kunden- und Bankdaten als Snapshot und reserviert exakt die gekaufte Menge in einer Transaktion. Eine globale Bestands-Sperre verhindert Überschneidungen bei parallelen Bestellungen. Bestehende Reservierungen und dauerhaft verkaufte Kontakte werden ausgeschlossen. Ein zweckgebundener Anfrage-Schlüssel schützt Wiederholungen derselben Bestellung; der Browser merkt sich dafür nur Schlüssel und Daten-Hash, keine Rechnungsdaten, im Sitzungsspeicher.

Unbezahlte Reservierungen laufen nach 14 Tagen ab oder können im CRM storniert werden. Ausschließlich unverkaufte Kontakte werden dann wieder freigegeben. Bei verspäteter Zahlung darf die Buchhaltung nicht die alte Reservierung freigeben: Zahlung außerhalb des Systems klären und gegebenenfalls erstatten. Bereits verkaufte Kontakte werden auch bei gesperrtem Download niemals wieder zum Verkauf freigegeben.

## Zahlung und Auslieferung

Es gibt **keine Bank-API**: Buchhaltung muss tatsächliche Kontoumsätze selbst prüfen. Der interne Zeitgeber erinnert die berechtigten Benutzer bei offenen Bestellungen alle 15 Minuten; die CRM-Liste aktualisiert sich ebenfalls im Viertelstundentakt. Das ist keine Zusage einer tatsächlich ausgeführten Bankprüfung und kein automatischer Kontoabgleich. Diese Intervalle stehen nicht auf der Verkaufsseite oder in Kunden-E-Mails.

Zahlung bestätigen erfordert eine ausdrücklich bestätigte Kontoprüfung, den exakten vollständigen Betrag und eine eindeutige Banktransaktionsreferenz. Danach sind die Kontakte dauerhaft verkauft. Der vorhandene Supabase-Zeitgeber ruft den neuen, durch denselben `CRON_SECRET` geschützten Worker auf. Dieser erstellt exakt N Zeilen mit vier Datenfeldern aus dem Bestell-Snapshot. Der Speicherbucket ist privat; für normale Benutzer oder anonyme Zugriffe gibt es keine Freigabepolicy. CSV-Zellen sind gegen Tabellenkalkulations-Formeln escaped.

Nach erfolgreicher Speicherung wird ein individueller HMAC-Downloadzugang freigegeben und eine E-Mail eingeplant. Der Link gilt 90 Tage und kann im CRM gesperrt oder erneut freigegeben werden. Der Download-Endpunkt prüft Token, Zahlung, Freigabe, Frist und Datei-Prüfsumme serverseitig; direkte öffentliche Speicherlinks existieren nicht. Mailversand und Freigaben/Abrufe werden protokolliert. Die E-Mail enthält keine CSV-Datei als Anhang. Kunden erhalten zuerst eine Bestellbestätigung mit Zahlungsinformationen und gespeicherten Bedingungen. Eine Bestellbestätigung ist keine steuerliche Rechnung; Rechnungen werden weiterhin über die bestehende CRM-Rechnungsverwaltung ausgestellt.

Bei fehlgeschlagener Dateierstellung zeigt das CRM den Fehler und erlaubt erneute Bereitstellung. Unklare SMTP-Zustände werden nicht automatisch erneut versendet; vor manueller Wiederholung das Gesendet-Postfach prüfen. SMTP-Annahme garantiert keine Zustellung. Bankdatenänderungen gelten für neue Bestellungen, nicht für bereits erteilte Zahlungsanweisungen.

## Betriebsprüfung durch den Betreiber

Die Migration kann ohne produktiven Datenbankzugang nicht hier ausgeführt werden. Keine automatisierten Tests oder Testbestellungen durchgeführt. Produktionsbuild und Typprüfung prüfen den Code, nicht tatsächliche Bankeingänge, Datenqualität, die Supabase-Einrichtung oder reale SMTP-Zustellung. Vor Aktivierung bitte die eingerichtete Umgebung und Datenrechte kontrollieren.

`/leads` wird der bestehenden `/sitemap.xml` hinzugefügt. Keine neue Sitemap-Adresse. Downloadseiten sind noindex, no-store, ohne Referrer und von Leadinfo/Vercel Analytics ausgeschlossen.
