import { Icon } from "@/components/icon";
import { PackageDirectory } from "@/components/package-directory";
import Link from "next/link";
import { serviceAreas, serviceHref } from "@/data/services";
import {
  PageIntro,
  SectionHead,
  Cta,
  Breadcrumbs,
  JsonLd,
} from "@/components/ui";
import { collectionSchema, seo } from "@/lib/seo";
export const metadata = seo(
  "Webdesign, Marketing, Branding & digitale Beratung",
  "Websites, CMS und Shops, Software, KI, Marketing, Branding und digitale Unternehmensberatung. Entdecke die Leistungen von Webstudio Expert.",
  "/leistungen",
);
export default function Services() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Leistungen", href: "/leistungen" }]} />
      <PageIntro
        label="Leistungen"
        title="Dein Vorhaben. Unsere Leistungen."
        description="Von Website und Shop über Marke und Werbung bis zur digitalen Unternehmensberatung. Wähle einen Bereich oder direkt die passende Leistung."
      />
      <nav className="section filters" aria-label="Leistungsbereiche">
        {serviceAreas.map((c) => (
          <Link className="button secondary" href={`#${c.slug}`} key={c.slug}>
            {c.short}
          </Link>
        ))}
      </nav>
      <PackageDirectory />
      {serviceAreas.map((c) => (
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
                <span aria-hidden="true">
                  <Icon name="arrow-up-right" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <section className="section">
        <SectionHead
          label="Zusätzliche Dienstleistung"
          title="Rechtlich gegen unzulässige Bewertungen vorgehen."
          description="Google, kununu, Trustpilot und weitere Plattformen. Kostenlose Erstberatung; 59 € nur bei erfolgreicher Entfernung. Vorauszahlung nach Beauftragung, bei Misserfolg vollständig zurück."
        />
        <Link className="button" href="/bewertungen">
          Bewertung prüfen lassen <Icon name="arrow-up-right" />
        </Link>
      </section>
      <JsonLd
        value={collectionSchema(
          "/leistungen",
          "Leistungen von Webstudio Expert",
          serviceAreas.map((c) => ({
            name: c.name,
            path: `/leistungen/${c.slug}`,
          })),
        )}
      />
      <Cta />
    </>
  );
}
