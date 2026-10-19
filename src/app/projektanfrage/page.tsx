import { PageIntro, Breadcrumbs } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { formReady } from "@/server/form-security";
import { categories, services } from "@/data/services";
import { projects } from "@/data/projects";
import { packages, carePackages } from "@/config/pricing";
import { seo } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = seo(
  "Projekt unverbindlich anfragen",
  "Beschreibe dein Vorhaben in sechs Schritten: Leistung, Umfang, Budget, Zeitrahmen, Beschreibung und Kontaktdaten – für Webprojekte, Branding, Marketing und Beratung.",
  "/projektanfrage",
  { noIndex: true },
);
export default async function Inquiry({
  searchParams,
}: {
  searchParams: Promise<{
    leistung?: string;
    paket?: string;
    referenz?: string;
  }>;
}) {
  const q = await searchParams;
  const service = [...categories, ...services].some(
    (c) => c.slug === q.leistung,
  )
    ? q.leistung
    : "";
  const selectedPackage = [
    ...packages.map((p) => p.name),
    ...carePackages.map((p) => `Betreuung ${p.name}`),
  ].includes(q.paket || "")
    ? q.paket
    : "";
  const reference = projects.some((p) => p.slug === q.referenz)
    ? q.referenz
    : "";
  return (
    <>
      <Breadcrumbs
        items={[{ name: "Projektanfrage", href: "/projektanfrage" }]}
      />
      <PageIntro
        label="Lass uns anfangen"
        title="Dein Projekt beginnt mit einer Idee."
        description="Beschreibe, was du vorhast. Wir klären die passende Lösung und erstellen ein Angebot mit definiertem Umfang."
      />
      <section className="section">
        <InquiryForm
          enabled={formReady()}
          initialService={service}
          initialPackage={selectedPackage}
          initialReference={reference}
        />
      </section>
    </>
  );
}
