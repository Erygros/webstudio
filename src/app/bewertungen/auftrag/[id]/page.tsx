import type { Metadata } from "next";
import { ReviewOrder } from "@/components/review-order";
import { PageIntro } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Bewertungsschutz · persönliche Beauftragung",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Order({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  return (
    <>
      <PageIntro
        label="Deine persönliche Beauftragung"
        title="Prüfen. Entscheiden. Beauftragen."
        description="Deine erste Anfrage war kostenlos. Hier kannst du das Angebot für genau eine Bewertung prüfen und bewusst verbindlich beauftragen."
      />
      <section className="section review-order-wrap">
        <ReviewOrder id={id} token={token || ""} />
      </section>
    </>
  );
}
