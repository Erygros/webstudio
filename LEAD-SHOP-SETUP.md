# Lead-Verkauf mit manueller Auslieferung

Öffentliche Seite: /leads. Geschützte Verwaltung: /crm/lead-verkauf.

## Einmalig umstellen

1. Die Datei supabase/lead-shop-manual-install.sql vollständig im bestehenden Supabase SQL Editor ausführen. Sie richtet den bisherigen Shop nur ein, falls er noch fehlt, und ergänzt dann den manuellen Verkauf. Auch bei bereits ausgeführter erster Lead-Shop-Migration wird diese kombinierte Datei verwendet. Bestehendes CRM und der eingerichtete Bewertungs-Zeitgeber (pg_cron, pg_net, Vault) sind Voraussetzung. Keine komplette CRM-Neuinstallation ausführen.
2. Den passenden neuen Stand auf Vercel deployen. SMTP und der bestehende CRON_SECRET werden übernommen. Die SQL-Umstellung deaktiviert den Verkauf zunächst; Bankdaten und vorhandene Bestellungen bleiben erhalten.
3. Im CRM unter Lead-Verkauf die tatsächlichen Bankdaten prüfen, „Manuelle Auslieferung“ und „Verkauf auf der Website“ aktivieren. Ohne eingerichteten SMTP-Versand oder Bankdaten bleiben Bestellungen gesperrt. Eine CSV-Datei oder ein freier Datenbestand im CRM ist nicht erforderlich.
4. Das Benachrichtigungspostfach prüfen. Vorgabe: bewerbung.enricogross30@gmail.com; in denselben Einstellungen änderbar.

## Ablauf

- Kunde wählt Paket und Menge, prüft Rechnungsdaten und bestätigt die kostenpflichtige B2B-Bestellung. Die Preisstufen und § 19 UStG bleiben unverändert.
- Der Server berechnet den Preis verbindlich erneut und speichert Bestellnummer, Kundenangaben, Paket, Menge, Zahlbetrag sowie Bank- und Vertrags-Snapshot. Anfrage-Schlüssel verhindern doppelte Bestellungen bei Wiederholung.
- In derselben Transaktion entstehen die Kundenbestätigung mit Bankdaten und eine Betreiberbenachrichtigung mit Käuferdaten, Menge, Preis, Zahlungsstatus und direktem CRM-Link. Der Versand wird sofort angestoßen. Die SQL-Warteschlange bleibt bei Unterbrechungen erhalten und wird über den bestehenden Supabase-Zeitgeber nachbearbeitet.
- Die Buchhaltung prüft das tatsächliche Bankkonto außerhalb des CRM. Im CRM erfasst sie den vollständigen Betrag und eine eindeutige Banktransaktionsreferenz und markiert die Bestellung als bezahlt. Das löst eine weitere Betreiber-E-Mail aus, aber keinen Dateiversand an den Käufer.
- Die CSV-Liste wird ausschließlich lokal zusammengestellt und aus dem eigenen E-Mail-Programm an den Kunden verschickt. Das CRM lädt keine Verkaufsdatei hoch und generiert keinen neuen Downloadlink. Anschließend kann der tatsächliche externe Versand optional im CRM bestätigt werden. Auch diese Statusänderung sowie eine Stornierung erzeugen eine Betreiberbenachrichtigung.

Das CRM kontrolliert keine lokale Datei und kann deshalb die Anzahl/Qualität darin oder Exklusivität über mehrere Lieferungen hinweg nicht automatisch prüfen. Die zugesagte Exklusivität und die erforderlichen Datenrechte müssen lokal verwaltet werden. Es gibt keine automatische Schließung neuer unbezahlter Bestellungen nach 14 Tagen und keine Bestandsreservierung mehr.

## Nachrichten und Historie

Bestellmeldungen enthalten keine CSV-Anhänge. Kunden erhalten ihre Bestellbestätigung mit Logo und Signatur; Betreiber-E-Mails sind kompakt. Unklare SMTP-Zustände bleiben zur Postfachprüfung zurückgehalten und können im E-Mail-Verlauf nach Prüfung erneut eingeplant werden. SMTP-Annahme garantiert keine Zustellung. Eine Bestellbestätigung ist keine steuerliche Rechnung; Rechnungen bleiben Teil der bestehenden CRM-Rechnungsverwaltung.

Bereits früher gespeicherte Daten, Dateien und Vertrags-Snapshots werden nicht gelöscht. Noch nicht verschickte automatische Download-Mails werden bei der Umstellung deaktiviert. Vorhandene gültige, bezahlte Downloadlinks bleiben als historische Vertragsvorgänge geschützt erreichbar. Im aktuellen CRM-Verkaufsbereich gibt es keine Import- oder Dateifunktionen mehr. Die historischen Migrationen bleiben erhalten.

Die Umstellung kann ohne produktiven Datenbankzugang nicht hier ausgeführt werden. Keine automatisierten Tests, Testbestellungen oder Test-E-Mails. Produktionsbuild und Typprüfung bestätigen den Code, nicht die echte SMTP-Zustellung oder Einrichtung im Betreiberkonto. Keine neue Sitemap-Adresse; /leads bleibt in der vorhandenen sitemap.xml.
