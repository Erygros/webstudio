# Leadinfo

Tracker: `LI-6AD2003ABA2D7`, Skript: `https://cdn.leadinfo.eu/ping.js`.

Der Loader steht im globalen HTML-Head. Erst eine explizite, gültige Zustimmung in `webstudio-leadinfo-consent-v1` lädt das Anbieterskript. Zustimmung und Ablehnung gelten 180 Tage; ohne verfügbaren lokalen Speicher bleibt Tracking aus. Ablehnen und Erlauben sind gleichwertig erreichbar. Änderung und Widerruf sind unter `/cookie-einstellungen` möglich. Änderungen laden das Dokument neu, damit ein bereits laufendes Skript beendet wird. Änderungen in einem anderen Tab lösen ebenfalls ein Neuladen aus. Bereits übermittelte Daten werden dadurch nicht gelöscht.

Ausgenommen sind `/crm`, `/api` und `/bewertungen/auftrag` einschließlich Unterseiten. Bei aktivem Tracking folgen interne Links vollständigen Dokumentnavigationen: Dadurch bleibt kein geladener Tracker beim Wechsel in das CRM oder einen privaten Auftrag aktiv. Öffentliche Seitenbesuche werden jeweils durch den regulären Anbieter-Loader erfasst. Formularfunktionen arbeiten weiterhin unabhängig von der Analysezustimmung.

Die Content-Security-Policy erlaubt ausschließlich die benötigten Leadinfo-Skript- und Erfassungsdomains zusätzlich zu den bestehenden Quellen. Keine Freigabe von Bildschirmaufzeichnungsdomains oder Leadbot-Frames.

## Im Leadinfo-Konto prüfen

- Die Domain `www.webstudio-expert.de` muss zum Tracker gehören.
- Formular-Tracking, Persona Insights und Bildschirmaufzeichnungen **ausgeschaltet lassen**. Diese Funktionen sind nicht Teil dieser Integration oder der hierfür erteilten Zustimmung. Die Kontoeinstellungen können nicht aus diesem Repository verwaltet werden.
- Vertrag zur Auftragsverarbeitung sowie Datenaufbewahrung/Löschung im Anbieter-Konto prüfen und passend festlegen.
- Nach dem Deployment die öffentliche Website öffnen, „Leadinfo: Unternehmensbesuche erkennen“ auswählen und „Auswahl speichern“ drücken. Vercel Web Analytics ist separat auswählbar. Anschließend die Installation im Leadinfo-Portal prüfen. Ohne Zustimmung oder bei einem Inhaltsblocker wird der Tracker absichtlich nicht geladen; eine automatische Anbieterprüfung kann ihn dann als nicht gefunden melden.

Quellen: [Leadinfo Datenschutz](https://help.leadinfo.com/de/ist-die-verwendung-von-leadinfo-dsgvo-konform), [CSP](https://help.leadinfo.com/en/why-is-the-leadinfo-tracker-blocked-on-my-website), [Formular-Tracking](https://help.leadinfo.com/en/form-tracking).

Keine Übernahme erkannter Unternehmen in die CRM-Datenbank. Kein API-Schlüssel und keine zusätzliche Umgebungsvariable erforderlich.
