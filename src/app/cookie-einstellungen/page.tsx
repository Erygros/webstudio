import { Preferences } from "@/components/preferences";
import { Breadcrumbs, PageIntro } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Cookie-Einstellungen und Darstellung",
  "Diese Website verwendet derzeit keine Analyse- oder Werbe-Cookies. Verwalte die lokal gespeicherte Darstellung.",
  "/cookie-einstellungen",
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
        title="Nur das, was gebraucht wird."
        description="In dieser Version sind keine Analyse- oder Werbedienste aktiv. Ein Einwilligungsbanner ist für diese Dienste daher aktuell nicht eingebunden."
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
          <h3>Exit-Hinweis</h3>
          <p>
            Der Hinweis merkt sich seine Anzeige nur im Arbeitsspeicher der
            geöffneten Website. Dafür werden keine Cookies oder zusätzlichen
            Einträge im Browser-Speicher gesetzt.
          </p>
          <h3>Spätere Analysefunktionen</h3>
          <p>
            Vor einer Aktivierung einwilligungspflichtiger Dienste muss eine
            passende Einwilligungsverwaltung eingerichtet werden. Es werden
            keine versteckten Tracking-Skripte geladen.
          </p>
        </div>
      </section>
    </>
  );
}
