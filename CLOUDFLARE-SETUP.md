# Kostenloser Formularschutz mit Cloudflare Turnstile

Die Integration verwendet Turnstile Free ohne zusätzliche Pakete, kostenpflichtige APIs, DNS-Wechsel oder Umzug von Vercel. Sie aktiviert keine allgemeine Cloudflare-Firewall und keinen Cloudflare-Proxy.

## Einmalige Aktivierung

1. Im [Cloudflare-Dashboard](https://dash.cloudflare.com/) kostenlos anmelden, **Turnstile → Add widget / Widget hinzufügen** öffnen.
2. Name: `Webstudio Expert`. Als Hostnamen `webstudio-expert.de` und `www.webstudio-expert.de` eintragen (ohne https oder Pfad). Wird das CRM auch über eine Vercel-Adresse genutzt, diese genaue Adresse zusätzlich eintragen und als `NEXT_PUBLIC_SITE_URL` konfigurieren. Die kanonische öffentliche Domain bleibt `NEXT_PUBLIC_SEO_URL=https://www.webstudio-expert.de`.
3. Widget-Typ **Managed** wählen. **Pre-clearance ausschalten**. Keinen kostenpflichtigen Tarif buchen.
4. Beide Schlüssel in **Vercel → Projekt → Settings → Environment Variables** für Production eintragen:

   ```dotenv
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=DEIN_SITE_KEY
   TURNSTILE_SECRET_KEY=DEIN_SECRET_KEY
   ```

   Den Secret-Key nur serverseitig hinterlegen, niemals als `NEXT_PUBLIC_` oder im Chat. Keine Beispiel-/Testschlüssel in Production verwenden.
5. **Redeploy** ausführen. Der öffentliche Schlüssel wird beim Build eingebunden. Änderungen beider Werte erfordern ein neues Deployment. Keine SQL-Migration erforderlich.

Für lokale Entwicklung können dieselben Variablennamen in `.env.local` gesetzt werden; dazu `localhost` im Widget erlauben. Preview-Deployments nur aktivieren, wenn deren genaue Hostnamen im Widget und der Laufzeitkonfiguration freigegeben sind. Keine pauschale Freigabe aller Vercel-Subdomains.

## Verhalten und Abdeckung

- Kontakt-, Projekt-, Rückruf- und Terminanfragen: Aktion `inquiry`.
- Kostenlose Bewertungsanfragen: `review_inquiry`; Beauftragung per privatem Link: `review_order`.
- Kostenpflichtige Firmenkontakt-Bestellung: `lead_order` (erst auf der abschließenden Prüfansicht).
- CRM-Anmeldung und Passwort-Zurücksetzung: `crm_auth`. Das Setzen eines neuen Passworts mit gültiger Sitzung und das Abmelden bleiben sitzungsgeschützt.
- Sämtliche genannten POST-Endpunkte prüfen Turnstile serverseitig einschließlich Aktion und erlaubtem Hostnamen. Ungültige, abgelaufene oder bereits verwendete Nachweise verhindern die Verarbeitung. Nach einem Versandversuch wird ein neuer Nachweis angefordert. Bei Ausfall der Prüfung wird keine Anfrage oder Bestellung ungeprüft angenommen.
- Bestehende Herkunftsprüfung, Honeypot, Eingabeprüfung, Limits und signierte Formularnachweise bleiben erhalten. Turnstile ersetzt keine Anmeldung, Rollenprüfung oder sichere Uploadprüfung.
- Interne CRM-Aktionen, Cronjobs, geschützte Downloads und Twilio-Webhooks erhalten keine Browser-Challenge; dort gelten weiterhin ihre jeweiligen Sitzungs-, Rollen-, Token- und Signaturprüfungen.
- Ohne beide Schlüssel bleibt Turnstile zunächst inaktiv und der bisherige Formularschutz bestehen. Bei nur einem Schlüssel werden die geschützten Einsendungen blockiert. Beide Variablen gemeinsam setzen oder entfernen.
- Keine Formulardaten, Passwörter oder Anhänge werden von unserer Siteverify-Anfrage an Cloudflare übertragen. Der Browser übermittelt technische Sicherheitssignale; die Datenschutzerklärung beschreibt dies. Sicherheitsprüfungen sind getrennt vom optionalen Marketing-Tracking.

## Kontrolle nach Aktivierung

Eine echte Anfrage selbst absenden und deren Eingang im CRM sowie die E-Mail prüfen. Eine Anmeldung und ggf. den nächsten echten Kauf mit prüfen. Im Cloudflare-Dashboard müssen serverseitige Validierungen erscheinen. Solange die Schlüssel fehlen, ist der zusätzliche Cloudflare-Schutz noch nicht aktiv. Es wurden keine automatisierten Formular- oder E-Mail-Tests ausgeführt.

Offizielle Dokumentation: [Free-Tarif](https://developers.cloudflare.com/turnstile/plans/), [Serverprüfung](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Datenschutz](https://www.cloudflare.com/turnstile-privacy-policy/).
