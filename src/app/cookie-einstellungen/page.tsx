import { Preferences } from "@/components/preferences";
import { TrackingConsent } from "@/components/tracking-consent";
import { Breadcrumbs, PageIntro } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Cookie-Einstellungen und Darstellung",
  "Verwalte deine freiwillige Zustimmung zur Besuchsanalyse mit Leadinfo und die lokal gespeicherte Darstellung.",
  "/cookie-einstellungen",
  { noIndex: true },
);
export default function Cookies() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Cookie-Einstellungen", href: "/cookie-einstellungen" },
        ]}
      />
      <PageIntro
        label="Privatsphäre"
        title="Deine Privatsphäre. Deine Auswahl."
        description="Leadinfo wird erst nach deiner Zustimmung geladen. Hier kannst du deine Auswahl ändern oder für die Zukunft widerrufen."
      />
      <section className="section content-split">
        <h2>Deine Darstellung.</h2>
        <div className="prose">
          <p>
            Eine manuelle Wahl wird ausschließlich im lokalen Speicher deines
            Browsers gespeichert. Mit der Systemeinstellung folgt die Website
            wieder dem hellen oder dunklen Modus deines Geräts.
          </p>
          <Preferences />
          <TrackingConsent settings />
          <h3>Exit-Hinweis</h3>
          <p>
            Der Hinweis merkt sich seine Anzeige nur im Arbeitsspeicher der
            geöffneten Website. Dafür werden keine Cookies oder zusätzlichen
            Einträge im Browser-Speicher gesetzt.
          </p>
        </div>
      </section>
    </>
  );
}
