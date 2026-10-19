import { ContractDeclaration } from "@/components/contract-declaration";
import { PageIntro } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Verträge hier kündigen",
  "Monatlichen Dienstleistungsvertrag ohne Anmeldung kündigen und Eingangsbestätigung erhalten.",
  "/vertrag-kuendigen",
  { noIndex: true },
);
export default function Page() {
  return (
    <>
      <PageIntro
        label="Vertrag"
        title="Verträge hier kündigen"
        description="Du kannst deinen monatlichen Vertrag zum Ende des laufenden Leistungsmonats kündigen. Außerordentliche Kündigungsrechte bleiben unberührt. Prüfe deine Angaben vor der Übermittlung."
      />
      <section className="section booking-section">
        <ContractDeclaration />
      </section>
    </>
  );
}
