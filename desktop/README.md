# Webstudio Social für Windows

Lokale Desktop-Anwendung für **@webstudio_expert** auf Instagram und **Enrico Gross** auf LinkedIn. Kein zusätzliches Planungsabo, kein KI-Abonnement, kein eigener Cloud-Server. Internet und freigegebene Plattformzugänge werden zum Veröffentlichen benötigt. Es werden ausschließlich eigene, explizit eingeplante oder manuell bestätigte Beiträge veröffentlicht.

## Starten und installieren

Der Windows-Installer liegt nach dem Erstellen unter `desktop/release/Webstudio Social Setup 1.0.0.exe`. Installer starten, Installationsordner wählen und danach „Webstudio Social“ über die Desktop-Verknüpfung öffnen.

Aus dem Quellcode (Node.js und npm erforderlich):

```powershell
cd "C:\Users\Enric\OneDrive\Desktop\Weblösungen\desktop"
npm ci
npm start
```

Installer erstellen:

```powershell
npm run dist
```

Der Installer ist nicht mit einem kostenpflichtigen Herausgeberzertifikat signiert. Windows kann deshalb einen unbekannten Herausgeber melden. Die Website und ihre Vercel-Konfiguration benötigen keine Änderung. Die Desktop-Anwendung hat ein eigenes `package.json` und eigene Abhängigkeiten.

## Bereits ohne Kontoverbindung nutzbar

- Beitragsentwürfe mit einer Plattform pro Beitrag erstellen, bearbeiten und lokal speichern.
- Vier bearbeitbare Textvorlagen für Webstudio Expert verwenden; keine erfundenen Kunden, Referenzen oder Erfolgszahlen.
- Quadratische Beitragsgrafiken mit eigener Überschrift und Zusatzzeile als JPEG exportieren (1080 × 1080).
- Textvorschau, Beitragsübersicht, Filter und JSON-Export ohne Tokens.
- Eigene Profile, Website und CRM im Standardbrowser öffnen. Der CRM-Zugang bleibt dessen bestehende Anmeldung; es werden keine CRM-Schlüssel kopiert.

## Instagram verbinden

Die Anwendung unterstützt **Instagram API with Instagram Login**. Facebook-Page-Tokens gehören zu einer anderen Schnittstelle und passen hier nicht.

1. `webstudio_expert` als professionelles Instagram-Konto (Business) einrichten.
2. Unter [Meta for Developers](https://developers.facebook.com/apps/) eine eigene App mit Instagram Login einrichten. Das eigene Instagram-Konto als berechtigtes Konto/Testkonto hinzufügen und erforderliche Einladungen bestätigen.
3. Für das eigene Konto einen Instagram-User-Zugangstoken mit `instagram_business_basic` und `instagram_business_content_publish` erstellen. Ob Standardzugriff für die eigene App-Rolle genügt oder eine App-Prüfung nötig ist, richtet sich nach Metas tatsächlichen App-Einstellungen. Die Desktop-Anwendung umgeht diese Freigaben nicht.
4. In „Konten verbinden → Instagram“ den Token eintragen und speichern. Die Konto-ID kann leer bleiben: Die Anwendung ermittelt sie über die offizielle `/me`-Abfrage. Das erkannte Konto in der anschließenden Bestätigung prüfen. Tokens nur lokal verwenden, nicht in Chat, Git oder Screenshots einfügen.
5. Die API-Version ist mit `v25.0` vorbelegt; bei einer Plattformänderung die von Meta unterstützte Version eintragen.
6. „Verbindung prüfen“ liest das Profil, veröffentlicht nichts und verlangt den Benutzernamen `webstudio_expert`.

Für jeden Instagram-Beitrag ist eine **öffentlich erreichbare HTTPS-JPEG-Bildadresse** erforderlich. Instagram ruft das Bild selbst ab. Lokale Dateien, `localhost`, Login-geschützte Dateien und reine Vorschauseiten funktionieren nicht. Bereite beispielsweise eine JPEG-Datei unter `public/social/` der bestehenden Website vor und veröffentliche die Website; deren Bildadresse kann anschließend eingetragen werden. Ein JPEG-Export allein lädt noch kein Bild hoch. Die erzeugten quadratischen JPEG-Grafiken sind für diesen Ablauf vorgesehen; externe Bilder müssen zusätzlich Metas Format- und Größenbedingungen erfüllen.

Diese Version veröffentlicht einzelne Bildbeiträge mit Bildunterschrift. Videos, Stories und Karussells werden nicht unterstützt.

## LinkedIn verbinden

Die Anwendung veröffentlicht **Textbeiträge auf dem persönlichen Profil**, nicht auf einer Unternehmensseite. Ein öffentlich sichtbarer Profil-Link ist keine API-Mitglieds-ID.

1. Unter [LinkedIn Developers](https://www.linkedin.com/developers/apps) eine eigene Developer-App erstellen und eventuell geforderte zugehörige LinkedIn-Seite bestätigen.
2. Die Produkte **Share on LinkedIn** und **Sign In with LinkedIn using OpenID Connect** aktivieren. Benötigt werden `w_member_social`, `openid` und `profile`.
3. Über LinkedIns autorisierten OAuth-Ablauf für dein eigenes Profil einen Zugangstoken beziehen. Ein App-Secret wird nicht in die Desktop-Anwendung eingetragen und nicht in deren Programmdateien gebündelt. Falls LinkedIn für den Tokenabruf einen vertraulichen Client benötigt, erfolgt dieser Schritt in deiner eigenen lokalen Developer-Umgebung, nicht in einer fremden Token-Webseite.
4. Unter „Konten verbinden → LinkedIn“ den Token eintragen. Die Mitglieds-URN kann leer bleiben: Die Anwendung ermittelt sie beim Speichern über `/v2/userinfo`.
5. „Verbindung speichern“ wählen und den erkannten Profilnamen in der Bestätigung prüfen. API-Voreinstellung: `202606`; bei Versionsablauf eine unterstützte Version laut LinkedIn-Dokumentation eintragen.
6. „Verbindung prüfen“ liest dein Profil und gleicht die ID ab. Der Test bestätigt nicht die Schreibberechtigung; diese prüft LinkedIn beim Veröffentlichen.

Die `userinfo`-Abfrage wird auch vor einer Veröffentlichung durchgeführt, damit die eingegebene Mitglieds-ID zum Token gehört. Stelle selbst sicher, dass der Token für das angegebene Enrico-Gross-Profil erteilt wurde. Der Profil-Slug lässt sich nicht verlässlich in eine API-ID umrechnen.

## Planen und veröffentlichen

1. Plattform wählen, Titel und Text schreiben. Instagram benötigt zusätzlich die öffentliche Bildadresse.
2. „Entwurf speichern“ speichert nur lokal. „Jetzt veröffentlichen“ im Veröffentlichungsplan zeigt vor dem tatsächlichen Senden eine native Bestätigung.
3. Für automatische Veröffentlichung einen zukünftigen Zeitpunkt wählen und „Beitrag einplanen“ drücken. Das gibt **diesen konkreten Beitrag** frei. Der Zeitpunkt bezieht sich auf die im Editor angezeigte Zeitzone des PCs und wird intern als fester UTC-Zeitpunkt gespeichert.
4. Oben „Zeitplan aktivieren“ wählen. Die Anwendung prüft alle 15 Sekunden fällige Beiträge. Es handelt sich nicht um sekundengenaue Veröffentlichung.
5. Anwendung und PC müssen laufen und online sein. Das Schließen des Fensters minimiert in den Windows-Infobereich. Dort öffnet Doppelklick das Fenster; das Kontextmenü bietet „Beenden (Planung stoppt)“. Optional kann die installierte Anwendung beim Windows-Start im Hintergrund öffnen; Auswahl unter „Konten“ beim Speichern einer Verbindung übernehmen.

Standby, ausgeschalteter PC und fehlendes Internet verhindern den Versand. Mehr als 15 Minuten verpasste Beiträge werden zur manuellen Prüfung zurückgehalten. Es gibt keinen nachträglichen Massenversand und keine automatischen Wiederholungen bei Fehlern. Kontoverbindungen entfernen pausiert den Zeitplan.

Bei unklarer Plattformantwort oder Abbruch während des Sendens wird der Beitrag gesperrt und als „Eingang unklar“ angezeigt. **Zuerst das echte Profil prüfen**, dann über „Eingang klären“ als bereits veröffentlicht bestätigen oder ausdrücklich zum Entwurf zurücksetzen. Dadurch wird ein blindes doppeltes Senden vermieden. Eine mathematische Exactly-once-Garantie kann eine externe API ohne Idempotenzschlüssel nicht liefern.

Ein lokal gelöschter Beitrag wird auf Instagram/LinkedIn **nicht** gelöscht. Bereits veröffentlichte Beiträge bleiben unverändert. Für weitere Varianten einen neuen Entwurf erstellen.

## Daten und Sicherheit

Entwürfe, Veröffentlichungsergebnisse und Einstellungen liegen unter `%APPDATA%\Webstudio Social\social.json` (der tatsächliche Pfad wird in der Anwendung angezeigt). JSON wird zunächst in eine temporäre Datei geschrieben und dann ersetzt. Unlesbare Daten werden nicht stillschweigend durch leere Daten ersetzt.

Zugangstokens sind mit Electron `safeStorage` über Windows-DPAPI verschlüsselt. Das schützt sie im Ruhezustand vor anderen Windows-Benutzern, nicht vor Programmen, die bereits unter deinem Windows-Konto laufen. Keine Klartext-Tokens in renderer state, Beitrags-Exporten oder Logs. Bei einem Windows-Kontowechsel/anderen PC müssen Verbindungen neu eingerichtet werden. Tokens laufen nach Plattformregeln ab und sind bei Bedarf manuell zu erneuern; automatischer OAuth-Login und automatische Tokenverlängerung sind in dieser Version nicht enthalten.

Der Renderer lädt nur lokale Dateien, hat keinen Node-Zugriff und keine Netzwerkfreigabe. Externe Links stammen aus einer festen Liste und öffnen im Standardbrowser. API-Anfragen laufen ausschließlich im Hauptprozess zu festen Meta-/LinkedIn-Adressen. Es gibt keine Telemetrie, automatischen DMs, Kommentare, Likes oder bezahlten Anzeigen.

## Umfang und Prüfung

Die Anwendung verlangt kein eigenes kostenpflichtiges Planungs-/KI-Abonnement und kauft keine Reichweite. Plattformzugriff, Freigaben und Limits bestimmen Meta/LinkedIn; deren dauerhafte Bedingungen können wir nicht garantieren. Es wird kein bestimmter Kundenzuwachs versprochen.

Auf Wunsch wurden keine automatisierten Tests und keine echten Veröffentlichungen durchgeführt. Ein erfolgreicher Installer-Build bestätigt lediglich die Erstellung des Programmpakets, nicht die Freigabe deiner Plattformzugänge. Die ersten echten Veröffentlichungen bitte bewusst selbst auslösen und in beiden Profilen kontrollieren.

Referenzen: [Electron-Sicherheit](https://www.electronjs.org/docs/latest/tutorial/security), [Windows-Tokenverschlüsselung](https://www.electronjs.org/docs/latest/api/safe-storage), [Meta Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [LinkedIn Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin).
