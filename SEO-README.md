# SEO, GEO und AEO für Webstudio Expert

Umsetzung vom 14.10.2026. Die öffentlichen Seiten sind auf das reale Unternehmen von Enrico Gross in Dortmund ausgerichtet. Ein bestimmter Suchplatz, eine Indexierung oder eine Nennung in KI-Antworten lässt sich nicht garantieren. Auch [Google schließt eine Platz-1-Garantie ausdrücklich aus](https://developers.google.com/search/docs/fundamentals/do-i-need-seo). Ohne Search-Console- und Bing-Zugang gibt es keine belastbare Ausgangsmessung der Rankings, Suchvolumina oder KI-Zitate.

## Umgesetzt

- Öffentliche Canonicals, Open Graph und Sitemap verwenden `https://webstudio-expert.de`. `NEXT_PUBLIC_SEO_URL` kann diesen Wert ändern. Die tatsächlich genutzte CRM-Adresse bleibt in `NEXT_PUBLIC_SITE_URL`; die öffentliche Herkunftsprüfung berücksichtigt beide konfigurierten Ursprünge.
- Vercel-Aliase und Preview-Deployments erhalten `X-Robots-Tag: noindex`. CRM, API-Routen, Rechtstexte, 404 und reine Anfrage-/Terminformulare sind ausgeschlossen. Formulare bleiben über Kontakt und Leistungsseiten erreichbar. Die Sitemap enthält nur die indexierbaren öffentlichen Inhaltsseiten.
- Einheitliche Unternehmens-, Inhaber-, Kontakt- und Standortdaten; verknüpfte JSON-LD-Entitäten für Unternehmen, Person, Website, Leistungen, Einstiegspreise, Artikel, Sammlungen, Breadcrumbs und tatsächlich sichtbare FAQs. Keine erfundenen Bewertungen, Erfolge, Kundenprojekte oder Öffnungszeiten.
- Suchorientierte Titel und Beschreibungen, Webdesign aus Dortmund auf der Startseite und eine ausführliche Seite für den tatsächlichen Standort. Keine Stadtseiten ohne eigenen Bezug.
- Acht zentrale Leistungsseiten mit Entscheidungshilfen und Vorbereitungsschritten. Fünf Ratgeber mit direkten Antworten, Vergleichen beziehungsweise Checklisten, Redaktionsangabe und nachvollziehbarem Inhaltsstand. Thematisch passende interne Verlinkung zwischen Angeboten und Ratgebern.
- Öffentliche Inhalte bleiben für allgemeine Suchmaschinen und die Such-Crawler von OpenAI, Perplexity und Claude erreichbar. Robots-Regeln werden für benannte Crawler inklusive der privaten Ausschlüsse wiederholt. Authentifizierung schützt das CRM unabhängig von robots.txt.
- Kostenlose Verifizierung über Meta-Tags für Google/Bing vorbereitet. Öffentlicher IndexNow-Schlüssel und manuelles Einreichungsskript vorhanden. Keine zusätzlichen Analyse- oder Werbe-Skripte, Cookies oder bezahlten SEO-Dienste.

## Suchthemen und Zielseiten

Die Themen sind anhand des Angebots geplant; es wurden keine gemessenen Suchvolumina oder Wettbewerbswerte erfunden.

| Suchabsicht                                            | Zielseite                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Webdesign / Webentwicklung Dortmund                    | `/`                                                                                                |
| Website für einen Betrieb in Dortmund erstellen lassen | `/region/dortmund`                                                                                 |
| Landingpage erstellen lassen                           | `/leistungen/websites/landingpages`                                                                |
| Unternehmenswebsite erstellen lassen                   | `/leistungen/websites/unternehmenswebsites`                                                        |
| Website-Kosten / Preise                                | `/preise`, ergänzender Ratgeber `/wissen/was-eine-website-kostet`                                  |
| CMS-Website / Inhalte selbst pflegen                   | `/leistungen/websites/cms-websites`, ergänzender Vergleich `/wissen/cms-oder-individuelle-website` |
| Website-Relaunch                                       | `/leistungen/websites/website-relaunch`                                                            |
| Onlineshop erstellen lassen                            | `/leistungen/e-commerce/onlineshops`                                                               |
| Individuelle Webanwendung                              | `/leistungen/software/individuelle-webanwendungen`                                                 |
| Website-Briefing / Projektvorbereitung                 | `/wissen/website-briefing`                                                                         |
| Website-Übergabe / Zugänge                             | `/wissen/website-uebergabe`                                                                        |

## Veröffentlichung und Konten

1. In Vercel `webstudio-expert.de` mit dem Produktionsprojekt verbinden. Die DNS-Werte aus dem Vercel-Domainbereich beim tatsächlichen DNS-Betreiber eintragen. Bestehende Mail-DNS-Einträge erhalten. `www.webstudio-expert.de` als Weiterleitung auf die Variante ohne `www` einrichten; diese entspricht den Canonicals. Siehe [Vercel: Domains und Weiterleitungen](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).
2. `NEXT_PUBLIC_SEO_URL=https://webstudio-expert.de` in Vercel Production setzen (dies ist auch der Code-Standard). `NEXT_PUBLIC_SITE_URL` nur entsprechend der tatsächlichen CRM-/Website-Adresse ändern; bestehende Auth-Callbacks und Telefonie berücksichtigen. Nach Änderungen an Variablen neu deployen.
3. In [Google Search Console](https://search.google.com/search-console) die endgültige Domain hinzufügen und mit dem dort erzeugten DNS-TXT-Eintrag verifizieren. Alternativ für eine URL-Präfix-Property den reinen HTML-Verifizierungscode als `GOOGLE_SITE_VERIFICATION` in Vercel hinterlegen und neu deployen. Keinen Beispieltokens verwenden. Sitemap `https://webstudio-expert.de/sitemap.xml` einreichen.
4. In [Bing Webmaster Tools](https://www.bing.com/webmasters/) dieselbe Website verifizieren oder aus Search Console importieren. Für die HTML-Methode den reinen `msvalidate.01`-Code als `BING_SITE_VERIFICATION` hinterlegen. Dieselbe Sitemap einreichen.
5. Erst wenn die Domain öffentlich das neue Deployment ausliefert, IndexNow aus diesem Checkout ausführen:

```powershell
npm run seo:indexnow
# Bei späteren Änderungen gezielt die betroffenen veröffentlichten Seiten:
npm run seo:indexnow -- / /preise /region/dortmund
```

Das Skript gleicht den veröffentlichten öffentlichen Schlüssel ab und verwendet ausschließlich URLs aus der veröffentlichten Sitemap. Private Bereiche und fremde Domains sind gesperrt. HTTP 200/202 bedeutet Einreichung beziehungsweise ausstehende Schlüsselprüfung, keine bestätigte Indexierung. Google wird damit nicht automatisch eine Indexierung zugesagt. [IndexNow-Dokumentation](https://www.indexnow.org/documentation)

Diese Konto- und Domainaktionen wurden nicht durchgeführt: Es liegt kein Zugriff auf DNS, Vercel, Google Search Console oder Bing Webmaster Tools vor. Der öffentliche Deployment-Stand ist durch den lokalen Build nicht bestätigt.

## Auffindbarkeit nach der Veröffentlichung weiterentwickeln

Einmal pro Woche dieselben Zeiträume vergleichen: indexierte Seiten, Suchanfragen, Impressionen, Klicks, Klickrate und durchschnittliche Position in Search Console; Crawling und verfügbare KI-Zitatdaten in Bing. Anfragequalität anhand tatsächlicher CRM-Anfragen beurteilen. Es gibt hier noch keine gemessene Ladezeit, Core-Web-Vitals-Auswertung oder Ranking-Zusage. Bildgrößen, responsive Bilder, Server-Rendering und sichtbare Inhalte sind bereits technisch angelegt.

Echte Projekte später mit Freigabe, nachvollziehbarem Auftrag und sachlichen Ergebnissen ergänzen. Die derzeitigen Konzepte bleiben als Demonstrationen gekennzeichnet. Relevante Erwähnungen können aus echten Kooperationen und fachlichen Veröffentlichungen entstehen. Keine gekauften Linkpakete, erfundenen Bewertungen oder massenhaft austauschbaren Artikel verwenden. [Google: Spam-Richtlinien](https://developers.google.com/search/docs/essentials/spam-policies)

Ein Google-Unternehmensprofil nur bei tatsächlicher Berechtigung einrichten: Google verlangt grundsätzlich persönlichen Kundenkontakt; reine Online-Unternehmen sind ausgeschlossen. Ein hier genanntes Impressum allein belegt keine Berechtigung oder einen öffentlich besuchbaren Standort. Keine Öffnungszeiten oder Kundenbesuche erfinden. [Google: Berechtigung für Unternehmensprofile](https://support.google.com/business/answer/13763036)

## Fachliche Grenzen

Googles KI-Suche nutzt die üblichen SEO-Grundlagen. Für sie sind keine zusätzlichen KI-Dateien oder besonderen Schema-Typen erforderlich; Google verwendet `llms.txt` nicht als Ranking-Maßnahme. Die Umsetzung konzentriert sich deshalb auf crawlbare, hilfreiche Inhalte. [Google: Leitfaden für KI-Suche](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

Strukturierte Daten beschreiben sichtbare Fakten. Sie garantieren keine hervorgehobenen Suchergebnisse. FAQ-Rich-Results sind bei Google grundsätzlich auf geeignete Gesundheits- und Regierungsseiten begrenzt; die FAQs dieses Unternehmens dienen der verständlichen Darstellung. [Google: Strukturierte Daten](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [Google: FAQ-Darstellung](https://developers.google.com/search/blog/2023/08/howto-faq-changes)

`OAI-SearchBot` ist der Such-Crawler von OpenAI; Trainings-Crawler sind davon getrennt. Die Freigabe öffentlicher Inhalte garantiert keine Aufnahme in ChatGPT-Antworten. [OpenAI: Crawler](https://developers.openai.com/api/docs/bots)

## Inhaltspflege und Validierung

`src/data/service-guides.ts`: vertiefte Leistungsinhalte. `src/data/articles.ts`: Ratgeber und tatsächliches Änderungsdatum. `src/data/regions.ts`: realer Standort. `src/lib/seo-pages.ts`: indexierbare Routen und Daten tatsächlicher Inhaltsrevisionen. `src/lib/business-schema.ts`: Unternehmensentitäten. `src/lib/seo.ts`: zentrale Metadaten. Preise und Kontakt bleiben zentral konfiguriert.

TypeScript-Prüfung und Produktionsbuild erfolgreich; das IndexNow-Skript wurde syntaktisch geprüft. Auf Nutzerwunsch keine automatisierten Tests, Browser-Playtests oder Lighthouse-Läufe. Es wurden keine Seiten an IndexNow eingereicht. Die Kompilierung bestätigt keine Live-Indexierung oder Rankings. Suchmaschinenkonto-, Domain- und Veröffentlichungsschritte bleiben erforderlich.
