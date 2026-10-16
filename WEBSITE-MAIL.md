# E-Mail-Benachrichtigungen bei Website-Anfragen

Alle Kontakt-, Projekt-, Rückruf-, Termin- und Bewertungsanfragen lösen nach bestätigter CRM-Speicherung zwei voneinander unabhängige Nachrichten aus:

- **Interne Benachrichtigung** an `bewerbung.enricogross30@gmail.com`: „Es wurde soeben ein Formular abgeschickt. Rufe es im CRM auf.“ Dazu Formularart, übermittelte Angaben und ein direkter Link zur gespeicherten Anfrage. Bei Bewertungen öffnet dieser genau den Vorgang über `/crm/bewertungen?vorgang=…`.
- **Kundenbestätigung** an die angegebene E-Mail-Adresse: kurze persönliche Eingangsbestätigung, Kontaktmöglichkeit und der Hinweis, dass damit noch kein Termin oder kostenpflichtiger Auftrag bestätigt ist. Bewertungsanfragen erhalten ein Vorgangszeichen; die bestehende ausführliche E-Mail nach rund sieben Minuten und eine spätere Vertragsbestätigung bleiben erhalten.

Der Empfänger ist serverseitig vorgegeben. Er wird nicht aus dem öffentlichen Formular oder dem bisherigen `INQUIRY_TO` übernommen. Keine zusätzliche Gmail-Anmeldung erforderlich: STRATO versendet die Nachricht per SMTP an dieses Empfängerpostfach. Es gibt keine SMS-Kosten und keinen neuen SMS-Anbieter.

## Einrichtung

Nach dem Deployment werden die bereits vorhandenen SMTP-Zugänge verwendet: aktive gespeicherte SMTP-Integration im CRM, ansonsten `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` aus Vercel. Bei STRATO `smtp.strato.de`, Port `465`; Absender bleibt das eigene STRATO-Postfach. Die private Gmail-Adresse ist nur Empfänger. Eine fehlerhafte aktive CRM-Konfiguration hat Vorrang vor korrekten Vercel-Werten und muss gegebenenfalls dort korrigiert werden.

Es sind **keine weitere SQL-Migration und keine neuen Umgebungsvariablen** nötig. Der bereits eingerichtete Bewertungs-Zeitgeber kann zusätzlich liegengebliebene Formular-E-Mails wieder aufnehmen. Er wird dafür nicht umkonfiguriert.

## Ablauf und Grenzen

Die Anfrage wird zuerst im CRM gespeichert. Danach werden Benachrichtigung und Kundenbestätigung im vorhandenen `crm_emails`-Postausgang angelegt und der unmittelbare SMTP-Versand versucht. Ein Fehler beim Versand der internen Nachricht verhindert nicht die separate Kundenbestätigung. Ein SMTP-Fehler macht eine erfolgreich gespeicherte Anfrage nicht rückwirkend zu einer fehlgeschlagenen Formularabgabe.

Ein zweckgebundener eindeutiger `sync_key` und eine atomare Zustandsänderung von `draft` nach `sending` verhindern doppeltes Senden derselben gespeicherten Mitteilung bei konkurrierenden Versandläufen. Bereits gesendete Mitteilungen werden beim Wiederaufruf nicht erneut gesendet. Unterschiedliche neue Formularabgaben sind weiterhin unterschiedliche Anfragen. Datensatzanlage und das Einreihen dieser zusätzlichen beiden E-Mails erfolgen nacheinander; ein vollständiger Prozessabbruch genau zwischen diesen Schritten kann eine manuelle Nachbearbeitung im CRM erfordern.

Wenn SMTP noch nicht konfiguriert ist oder eine Ausführung vor dem Versand abbricht, bleiben eingereihte unbeanspruchte Nachrichten als Entwürfe bestehen. Der bereits bestehende eigene Versand-Endpunkt bearbeitet regelmäßig ausschließlich Entwürfe mit dem internen Präfix `website-notice:v1:`; gewöhnliche manuelle E-Mail-Entwürfe werden nicht automatisch verschickt. Ohne fällige Bewertungsaufträge erfolgt dieser Aufruf über den vorhandenen Erreichbarkeitsnachweis etwa alle fünf Minuten. Bei normal konfiguriertem SMTP wird bereits innerhalb der Formularanfrage versendet; Verzögerungen des SMTP-Anbieters und Spamfilter liegen außerhalb der Anwendung.

Bei unterbrochenem/unklarem SMTP-Versand oder fehlender Speicherung des Versandresultats wird `unknown` gesetzt. Unterbrochene `sending`-Einträge werden nach zehn Minuten zur Prüfung zurückgehalten. Solche Nachrichten werden nicht blind erneut verschickt. Im CRM-E-Mail-Bereich sind Entwürfe, versandte und unklare E-Mails nachvollziehbar. Vor einem manuellen Neuversand sind das tatsächliche Postfach und gegebenenfalls SMTP-Protokolle zu prüfen; SMTP ermöglicht keine absolute Exactly-once-Garantie.

Anhänge werden in den zusätzlichen E-Mails nicht weitergeleitet. Die interne Nachricht benennt nur Dateinamen; Dateiinhalte bleiben im privaten CRM-Speicher. Die ursprüngliche Anfrage und die private CRM-Ansicht bleiben maßgeblich. Die öffentliche Datenschutzerklärung beschreibt die zusätzliche Gmail-Postfachkopie; deren Aufbewahrung und Löschung ist auch im Empfängerpostfach umzusetzen.

Es werden keine Bestätigungen aus dem Browser direkt versandt. Absender, Empfänger, Datenaufbereitung und Versand laufen ausschließlich serverseitig. Keine Bestätigungsnachrichten an den Betreiber oder Kunden wurden während der Implementierung als Test verschickt. Auf ausdrücklichen Wunsch keine automatisierten Tests; lediglich Build/TypeScript-Prüfung.
