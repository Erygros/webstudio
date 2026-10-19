# Dienstleistungen und Online-Buchungen

## Einmalig nach dem Deployment

1. `supabase/bookings-install.sql` vollständig im SQL Editor des **bestehenden** Supabase-Projekts ausführen. Die Datei enthält beide neuen Migrationen in Reihenfolge. Nicht zusätzlich dieselben Migrationen einzeln ausführen. Vorhandene CRM-, Finanz- und Scheduler-Migrationen müssen bereits installiert sein.
2. Unter **CRM → Einstellungen → Unternehmensdaten** prüfen: Inhaber/Zahlungsempfänger, vollständige Geschäftsanschrift, gültige IBAN, optional BIC, Zahlungsziel (1–90 Tage), Kleinunternehmer-Schalter sowie die tatsächliche **Steuernummer oder USt-ID** für Rechnungen. Die persönliche Steuer-Identifikationsnummer ist nicht gemeint. Keine erfundenen Steuer- oder Bankdaten verwenden. Vorhandene Daten werden nicht durch Beispieldaten ersetzt.
3. Der bestehende SMTP-Zugang aus CRM oder Vercel wird wiederverwendet. `CRON_SECRET` muss in Vercel und im vorhandenen Supabase-Vault-Eintrag `webstudio_review_cron_secret` identisch sein. Es werden keine zusätzlichen Anbieter oder Zugangsdaten benötigt. Falls der bestehende Vault-Eintrag fehlt, wie beim Bewertungsschutz einmalig `select public.crm_configure_review_scheduler('DEIN_BESTEHENDES_CRON_SECRET');` ausführen. Das echte Secret niemals committen.
4. **CRM → Buchungen & Beratung → Automatisierung** zeigt den letzten tatsächlichen Versand-/Abrechnungslauf. Nach Einrichtung auf einen erfolgreichen Lauf achten. Die lokale Implementierung bestätigt keine erfolgreiche Verbindung zur produktiven Datenbank.

Ohne vollständige Einrichtung bleiben kostenpflichtige Bestellungen gesperrt. Eine Beratungsanfrage benötigt die Datenbankeinrichtung und SMTP, aber keine Bank- oder Steuerdaten. Es werden keine Buchungen oder Zahlungen simuliert.

## Zentrale Pakete

`src/data/bookable-services.ts` enthält alle zwölf Namen, Kategorien, SEO-Titel, Beschreibungen, Leistungsumfänge, Preise in EUR-Cent, Intervalle, Erweiterungen und Buchungs-/Beratungsfreigaben. Dort ändern und neu deployen. Preisänderungen gelten ausschließlich für neue Buchungen. Bestehende Verträge behalten ihren unveränderlichen Paket-/Preis-/Bedingungsschnappschuss. Bei Änderungen der Vertragsbedingungen auch `bookingTermsVersion` erhöhen.

Die vier bisherigen Websitepakete in `src/config/pricing.ts` wurden nicht geändert. Erweiterungen werden ohne ausdrücklich vereinbartes Angebot nicht mitbestellt. Die genannten Einstiegspreise sind vollständige Endpreise. Bei Regelbesteuerung muss der tatsächliche Steuersatz im CRM hinterlegt werden; der Endpreis bleibt verbindlich, die Rechnung trennt die enthaltene Steuer. Steuerstatusänderungen müssen auch in den bestehenden allgemeinen Preis- und Rechtstexten nachvollzogen werden.

## Bearbeitung im CRM

- Buchungen starten mit **Wartet auf Zahlung**, Beratungen mit **Beratung angefragt**. Jede Anfrage erhält eine Kunden-/Lead-Zuordnung, Aufgabe, interne Benachrichtigung und eine E-Mail-Warteschlange. Bestehende Stammdaten werden nicht überschrieben; die jeweilige Rechnungsanschrift steht im Buchungsschnappschuss.
- Die erste Rechnung ist eine Vorauszahlungs-/Anzahlungsrechnung ohne erfundenes Leistungsdatum. Ausgestellte Belege und PDFs werden in der bestehenden Buchhaltung und im privaten Speicher archiviert. Nach Leistungserbringung erfolgt die erforderliche Schlussabrechnung mit Verrechnung der Anzahlung über die vorhandene Rechnungsverwaltung.
- **Tatsächlichen Zahlungseingang bestätigen** erst nach Kontrolle des Bankkontos, mit Bankreferenz und Eingangsdatum. Teilzahlungen aus der bestehenden Buchhaltung werden berücksichtigt. Auch dort vollständig erfasste Zahlungen aktualisieren die Buchung. Ein Projekt wird bei vollständigem Zahlungseingang genau einmal erzeugt. Es gibt keinen Zugriff auf das Bankkonto und keine Zahlungssimulation.
- Anschließend das mit dem Kunden abgestimmte Startdatum speichern. Bei Verbrauchern ohne beide freiwilligen Erklärungen zum vorzeitigen Beginn bleibt der Ablauf der Widerrufsfrist geschützt.
- Monatspakete: unbefristet, monatliche Zahlung im Voraus ab gemeinsam abgestimmtem Start, Kündigung zum Ende des laufenden Leistungsmonats. Der Scheduler erstellt und versendet die folgenden Monatsrechnungen; Rechnungstermine bleiben am ursprünglichen Starttag verankert. Zahlungserinnerungen können in der Buchung ausgelöst werden, maximal eine je Rechnung und Kalendertag.
- Kündigungen und Widerrufe erscheinen im CRM mit Eingang, Inhalt und Kundenwunsch. Offene, zugeordnete Vertragserklärungen unterbrechen die Erzeugung weiterer Monatsrechnungen bis zur Prüfung. Unklare Zuordnungen nach Identitätsprüfung der geöffneten Buchung zuweisen. Vertragsende bzw. Storno und gegebenenfalls Gutschrift/Erstattung zuerst bearbeiten, danach die Erklärung als geprüft markieren. Eine Statusänderung ersetzt keine Rückzahlung oder Rechnungsstornierung.
- SMTP-Ausgänge haben die Zustände `queued`, `sending`, `sent`, `unknown`. Ein möglicher Versand nach einem Verbindungsabbruch wird nicht blind wiederholt. Unter **Versandstatus prüfen** können Administration/Buchhaltung nach tatsächlicher Prüfung des Nichtversands eine Wiederholung freigeben. Fehler vor dem SMTP-Versuch werden mit Abstand erneut vorbereitet. Bestätigungen behaupten keinen erfolgreichen E-Mail-Empfang beim Kunden.

## Öffentliche Seiten

`/buchen` enthält den vierstufigen Kaufprozess bzw. das kostenlose Beratungsformular. `/buchungsbedingungen`, `/vertrag-kuendigen` und `/vertrag-widerrufen` ergänzen Vertragsinformationen und gesetzliche Funktionen ohne Kundenkonto. Kontakt-, Termin-, Bewertungs-, Lead-Verkaufs- und bisherige Anfrageverfahren bleiben bestehen. Turnstile, Herkunftsprüfung, begrenzte Eingaben, Rate-Limits, RLS und transaktionale Idempotenz schützen die neue Verarbeitung.

Die zwölf Leistungsseiten werden über den bestehenden Servicekatalog in dieselbe `/sitemap.xml` aufgenommen. **Keine neue Sitemap-Adresse**. Mega-Menü und mobile Kategorien verweisen auf die bestehenden Übersichten sowie ausgewählte Einzelleistungen.

## Prüfung

Keine automatisierten Tests oder Playtests, keine Testbuchungen, Testzahlungen oder Test-E-Mails. Ausschließlich TypeScript-/Produktionsbuild und manuelle Quelltextprüfung. Die produktive SQL-Einrichtung und abschließende Funktionsprüfung erfolgen durch den Betreiber.
