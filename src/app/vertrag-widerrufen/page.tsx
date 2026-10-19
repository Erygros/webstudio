import { ContractDeclaration } from "@/components/contract-declaration";
import { PageIntro } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Vertrag widerrufen",
  "Widerruf ohne Anmeldung online erklären und Eingangsbestätigung erhalten.",
  "/vertrag-widerrufen",
  { noIndex: true },
);
export default function Page() {
  return (
    <>
      <PageIntro
        label="Widerruf"
        title="Vertrag widerrufen"
        description="Hier kannst du einen online abgeschlossenen Vertrag widerrufen. Die gesetzlichen Voraussetzungen und Fristen richten sich nach deiner Widerrufsbelehrung. Eine Begründung ist nicht erforderlich."
      />
      <section className="section booking-section">
        <ContractDeclaration withdrawal />
      </section>
    </>
  );
}
