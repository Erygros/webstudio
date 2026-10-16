# Vercel Web Analytics

Integration über das offizielle Paket `@vercel/analytics/next` in der öffentlichen Website-Hülle. Keine Speed Insights oder kostenpflichtigen benutzerdefinierten Ereignisse hinzugefügt.

## Aktivierung

Im Vercel-Dashboard das bestehende Website-Projekt öffnen und unter **Analytics / Web Analytics → Enable** aktivieren, falls noch nicht geschehen. Anschließend muss ein Deployment mit aktivierter Analytics-Einstellung erfolgen. Keine API-Schlüssel oder zusätzlichen Umgebungsvariablen nötig. Die Dashboard-Einstellung kann ohne Zugang zum Vercel-Konto hier nicht bestätigt oder verändert werden. Eine kostenpflichtige Erweiterung wurde nicht gebucht.

## Einwilligung und Datenumfang

Web Analytics wird erst nach einer eigenen Zustimmung geladen. Die vorhandene Leadinfo-Zustimmung wird nicht übernommen. Das Banner und `/cookie-einstellungen` bieten beide Dienste einzeln an. Der lokale Schlüssel `webstudio-vercel-analytics-consent-v1` speichert die Wahl für 180 Tage. Widerruf lädt das Dokument neu; Änderungen in einem anderen Tab ebenfalls. Vor jedem Ereignis wird die weiterhin gültige Zustimmung erneut geprüft.

`/crm`, `/api` und `/bewertungen/auftrag` samt Unterseiten werden beim Laden und vor dem Ereignisversand ausgeschlossen. URL-Suchparameter und Fragmente werden entfernt; nur Seitenaufrufe werden zugelassen. Es werden keine Formularfelder, CRM-Daten oder benutzerdefinierten Ereignisse versendet. Das SDK verwendet im Produktionsbetrieb gleichnamige Vercel-Routen auf dem eigenen Origin; die vorhandene CSP erlaubt diese bereits über `self`.

Die Website-Datenschutzhinweise sind ergänzt. Die Integration ersetzt keine Prüfung der Vercel-Vertrags- und Aufbewahrungseinstellungen im Betreiberkonto. Ein erfolgreicher Build bestätigt nicht den Dateneingang im Dashboard.

Quelle: [Vercel-Einrichtung](https://vercel.com/docs/analytics/quickstart), [beforeSend](https://vercel.com/docs/analytics/package), [Datenschutz](https://vercel.com/docs/analytics/privacy-policy).
