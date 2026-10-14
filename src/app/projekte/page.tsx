import { PageIntro, Breadcrumbs, Cta, JsonLd } from "@/components/ui";
import { projects } from "@/data/projects";
import { Portfolio } from "@/components/portfolio";
import { collectionSchema, seo } from "@/lib/seo";
export const metadata = seo(
  "Projekte und Gestaltungskonzepte",
  "Klar gekennzeichnete Demonstrationsprojekte für Websites, Shops, SaaS, Webanwendungen und Automatisierungen.",
  "/projekte",
);
export default function Projects() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Projekte", href: "/projekte" }]} />
      <PageIntro
        label="Portfolio"
        title="Ideen in einer konkreten Form."
        description="Diese Demonstrationsprojekte zeigen gestalterische und technische Ansätze. Sie sind keine beauftragten Kundenarbeiten und keine öffentlich nutzbaren Anwendungen."
      />
      <section className="section">
        <Portfolio />
      </section>
      <JsonLd
        value={collectionSchema(
          "/projekte",
          "Demonstrationskonzepte von Webstudio Expert",
          projects.map((p) => ({
            name: `${p.name} – Demonstrationskonzept`,
            path: `/projekte/${p.slug}`,
          })),
        )}
      />
      <Cta />
    </>
  );
}
