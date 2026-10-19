import { PageIntro } from "@/components/ui";
import { ServiceBooking } from "@/components/service-booking";
import { bookingPackages } from "@/data/bookable-services";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Dienstleistung buchen oder kostenlos beraten lassen",
  "Einstiegspaket auswählen, Angaben prüfen und per Banküberweisung bezahlen. Alternativ eine kostenlose Beratung anfragen.",
  "/buchen",
  { noIndex: true },
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ leistung?: string; beratung?: string }>;
}) {
  const q = await searchParams;
  const consultation = q.beratung === "1";
  return (
    <>
      <PageIntro
        label={consultation ? "Kostenlose Beratung" : "Online-Buchung"}
        title={
          consultation
            ? "Erst klären. Dann entscheiden."
            : "Dein nächster Schritt."
        }
        description={
          consultation
            ? "Beschreibe dein Vorhaben. Deine Beratungsanfrage ist kostenlos und unverbindlich."
            : "Wähle ein klar begrenztes Einstiegspaket. Du prüfst alle Angaben und Kosten, bevor du verbindlich bestellst."
        }
      />
      <section className="section booking-section">
        <ServiceBooking
          key={`${q.leistung}-${consultation}`}
          initialService={q.leistung || bookingPackages[0].slug}
          consultation={consultation}
        />
      </section>
    </>
  );
}
