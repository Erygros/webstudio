import { Icon } from "@/components/icon";
import { notFound } from "next/navigation";
import Link from "next/link";
import { regionalPages } from "@/data/regions";
import { business, site } from "@/config/site";
import {
  PageIntro,
  Cta,
  Breadcrumbs,
  Button,
  Faq,
  JsonLd,
} from "@/components/ui";
import { canonicalUrl, organizationId, seo, websiteId } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return regionalPages.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = regionalPages.find((p) => p.slug === slug);
  if (!p) notFound();
  return seo(
    p.title,
    "Website für deinen Betrieb in Dortmund: Enrico Gross entwickelt Landingpages und Firmenwebsites. Persönliche Abstimmung, klare Angebote und optionale Betreuung.",
    `/region/${slug}`,
  );
}
export default async function Region({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = regionalPages.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <Breadcrumbs
        items={[{ name: "Webdesign in Dortmund", href: `/region/${slug}` }]}
      />
      <PageIntro
        label="Regionale Weblösungen"
        title={p.title}
        description={p.content}
      >
        <Button href="/projektanfrage">Website anfragen</Button>
      </PageIntro>
      {p.sections.map((section, i) => (
        <section
          key={section.title}
          className={`section content-split ${i % 2 ? "solutions" : ""}`}
        >
          <h2>{section.title}</h2>
          <div className="prose">
            <p>{section.text}</p>
            {"items" in section && section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {"links" in section && section.links && (
              <div className="buttons" style={{ marginTop: 24 }}>
                {section.links.map((link) => (
                  <Link className="text-link" key={link.href} href={link.href}>
                    {link.title} <Icon name="arrow-up-right" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
      <section className="section content-split solutions">
        <h2>Kontakt in Dortmund.</h2>
        <div className="prose">
          <address className="business-address">
            {site.name} · {business.owner}
            <br />
            {business.street}
            <br />
            {business.postcode} {business.city}
          </address>
          <p>
            <a className="text-link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            <br />
            <a
              className="text-link"
              href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
            >
              {site.phone}
            </a>
          </p>
          <Button secondary href="/terminbuchung">
            Gesprächstermin anfragen
          </Button>
        </div>
      </section>
      <section className="section content-split">
        <h2>Fragen zur Website für deinen Betrieb.</h2>
        <Faq items={p.faq} />
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${canonicalUrl(`/region/${slug}`)}#page`,
          url: canonicalUrl(`/region/${slug}`),
          name: p.title,
          description: p.content,
          inLanguage: "de-DE",
          isPartOf: { "@id": websiteId },
          about: { "@id": organizationId },
          spatialCoverage: { "@type": "City", name: "Dortmund" },
        }}
      />
      <Cta />
    </>
  );
}
