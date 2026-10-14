import { generalFaq } from "@/data/faq";
import { PageIntro, Breadcrumbs, Faq, Cta } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Häufige Fragen zur Zusammenarbeit",
  "Antworten zu Projektumfang, Kosten, Zahlung, Übergabe, Hosting, Betreuung und Zusammenarbeit mit dem Studio.",
  "/faq",
);
export default function FaqPage() {
  return (
    <>
      <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />
      <PageIntro
        label="Fragen und Antworten"
        title="Vor dem ersten Schritt."
        description="Die wichtigsten Rahmenbedingungen im Überblick. Einzelheiten werden im konkreten Angebot festgehalten."
      />
      <section className="section content-split">
        <h2>Was häufig gefragt wird.</h2>
        <Faq items={generalFaq} />
      </section>
      <Cta />
    </>
  );
}
