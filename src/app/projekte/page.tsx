import { PageIntro, Breadcrumbs, Cta, JsonLd } from "@/components/ui";
import { portfolioItems } from "@/data/projects";
import { Portfolio } from "@/components/portfolio";
import { collectionSchema, seo } from "@/lib/seo";
export const metadata = seo(
  "Referenzen, Projekte und Gestaltungskonzepte",
  "Website-Referenzen und eigene Gestaltungskonzepte von Webstudio Expert. Entdecke Vereinswebsites, Unternehmensauftritte und klar gekennzeichnete Demonstrationsprojekte.",
  "/projekte",
);
export default function Projects() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Projekte", href: "/projekte" }]} />
      <PageIntro
        label="Portfolio"
        title="Referenzen und eigene Konzepte."
        description="Ausgewählte Websites und gestalterische Ansätze. Referenzen öffnen die jeweilige Website in einem neuen Tab. Eigene Entwürfe sind als Demonstrationsprojekte gekennzeichnet."
      />
      <section className="section">
        <Portfolio />
      </section>
      <JsonLd
        value={collectionSchema(
          "/projekte",
          "Referenzen und Gestaltungskonzepte von Webstudio Expert",
          portfolioItems.map((p) => ({
            name: `${p.name} – ${"externalUrl" in p ? "Referenz" : "Demonstrationskonzept"}`,
            path: "externalUrl" in p ? p.externalUrl : `/projekte/${p.slug}`,
          })),
        )}
      />
      <Cta />
    </>
  );
}
