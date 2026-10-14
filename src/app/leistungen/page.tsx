import Link from "next/link";
import { categories, services, serviceHref } from "@/data/services";
import {
  PageIntro,
  SectionHead,
  Cta,
  Breadcrumbs,
  JsonLd,
} from "@/components/ui";
import { collectionSchema, seo } from "@/lib/seo";
export const metadata = seo(
  "Webdesign, Onlineshops & Software: Leistungen",
  `${services.length} Leistungen in ${categories.length} Bereichen: Websites, E-Commerce, individuelle Software, KI, Optimierung und technische Betreuung.`,
  "/leistungen",
);
export default function Services() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Leistungen", href: "/leistungen" }]} />
      <PageIntro
        label="Leistungen"
        title="Alles, was dein Webprojekt braucht."
        description="Sechs Bereiche. Vom einzelnen Auftritt bis zur verbundenen Plattform. Wähle einen Bereich oder direkt die passende Leistung."
      />
      <nav className="section filters" aria-label="Leistungsbereiche">
        {categories.map((c) => (
          <Link className="button secondary" href={`#${c.slug}`} key={c.slug}>
            {c.short}
          </Link>
        ))}
      </nav>
      {categories.map((c) => (
        <section className="section" id={c.slug} key={c.slug}>
          <SectionHead
            label={`${c.services.length} Leistungen`}
            title={c.name}
            description={c.description}
          />
          <div className="service-directory">
            {c.services.map((s) => (
              <Link key={s.slug} href={serviceHref(s)}>
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.intro}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <JsonLd
        value={collectionSchema(
          "/leistungen",
          "Leistungen von Webstudio Expert",
          categories.map((c) => ({
            name: c.name,
            path: `/leistungen/${c.slug}`,
          })),
        )}
      />
      <Cta />
    </>
  );
}
