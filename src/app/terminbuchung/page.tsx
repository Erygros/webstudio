import { Breadcrumbs, PageIntro } from "@/components/ui";
import { AppointmentForm } from "@/components/appointment-form";
import { formReady } from "@/server/form-security";
import { seo } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = seo(
  "Gespräch und Termin anfragen",
  "Wähle Datum und Uhrzeit für ein Gespräch mit Enrico Gross. Eigene Termin-Anfrage ohne externen Kalender; persönliche Bestätigung erforderlich.",
  "/terminbuchung",
  { noIndex: true },
);
export default function Booking() {
  const format = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
  });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 90);
  return (
    <>
      <Breadcrumbs
        items={[{ name: "Terminbuchung", href: "/terminbuchung" }]}
      />
      <PageIntro
        label="Lass uns sprechen"
        title="Eine feste Zeit für deine Idee."
        description="Wähle einen Wunschtermin für ein erstes Gespräch. Enrico Gross prüft den Vorschlag und bestätigt den Termin persönlich."
      />
      <section className="section content-split">
        <div className="prose">
          <h2>Direkt geplant.</h2>
          <p style={{ marginTop: 20 }}>
            Kein externer Kalender und kein Benutzerkonto. Ein erstes Gespräch
            hilft, Ziele, Umfang und nächste Schritte einzuordnen.
          </p>
          <h3>Was nach deiner Anfrage passiert</h3>
          <p>
            Wir melden uns per E-Mail oder Telefon. Falls dein Wunschzeitpunkt
            nicht passt, schlagen wir eine Alternative vor. Bitte plane erst
            nach der Bestätigung fest mit dem Termin.
          </p>
        </div>
        <AppointmentForm
          enabled={formReady()}
          firstDate={format.format(tomorrow)}
          lastDate={format.format(horizon)}
        />
      </section>
    </>
  );
}
