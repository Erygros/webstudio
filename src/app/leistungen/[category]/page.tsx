import { Icon } from "@/components/icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceAreas, serviceHref } from "@/data/services";
import { serviceAreaContent } from "@/data/service-expansion";
import { categorySeo } from "@/data/service-guides";
import {
  PageIntro,
  Cta,
  Breadcrumbs,
  Button,
  SectionHead,
  JsonLd,
  Faq,
} from "@/components/ui";
import { collectionSchema, seo } from "@/lib/seo";
export function generateStaticParams() {
  return serviceAreas.map((c) => ({ category: c.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = serviceAreas.find((c) => c.slug === category);
  if (!c) notFound();
  return seo(
    categorySeo[c.slug] || c.name,
    c.description,
    `/leistungen/${c.slug}`,
  );
}
export default async function Category({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = serviceAreas.find((c) => c.slug === category);
  if (!c) notFound();
  const content = serviceAreaContent[c.slug];
  const links =
    content?.links ||
    (["websites", "e-commerce"].includes(c.slug)
      ? [
          {
            title: "CMS, Baukastensysteme und Shop-Plattformen",
            href: "/leistungen/cms-baukaesten",
          },
          {
            title: "Digitale Strategie und Systemberatung",
            href: "/leistungen/digitale-beratung",
          },
        ]
      : []);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Leistungen", href: "/leistungen" },
          { name: c.short, href: `/leistungen/${c.slug}` },
        ]}
      />
      <PageIntro
        label="Leistungsbereich"
        title={c.name}
        description={c.description}
      >
        <Button href={`/projektanfrage?leistung=${c.inquiryService || c.slug}`}>
          Vorhaben besprechen
        </Button>
      </PageIntro>
      {content && (
        <section className="section content-split solutions">
          <div>
            <span className="eyebrow">Überblick</span>
            <h2>Auf dein Vorhaben abgestimmt.</h2>
          </div>
          <div className="prose">
            <p>{content.answer}</p>
            <h3>Umfang und Kosten</h3>
            <p>{content.scope}</p>
          </div>
        </section>
      )}
      <section className="section">
        <SectionHead title="Die passende Leistung für dein Vorhaben." />
        <div className="service-directory">
          {c.services.map((s) => (
            <Link href={serviceHref(s)} key={s.slug}>
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
      <section className="section solutions">
        <SectionHead title="So gehen wir vor." />
        <div className="process-grid">
          {c.approach.map((step, i) => (
            <article key={step}>
              <span className="step-number">0{i + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>
      {content && (
        <>
          <section className="section content-split">
            <h2>Das hilft bei der Vorbereitung.</h2>
            <div className="prose">
              <ul>
                {content.preparation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Button
                href={`/projektanfrage?leistung=${c.inquiryService || c.slug}`}
              >
                Individuelles Angebot anfragen
              </Button>
            </div>
          </section>
          <section className="section content-split solutions">
            <h2>Häufige Fragen.</h2>
            <Faq items={content.faq} />
          </section>
        </>
      )}
      {links.length > 0 && (
        <section className="section">
          <SectionHead title="Sinnvoll verbunden." />
          <div className="service-directory">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <h3>{link.title}</h3>
                <span aria-hidden="true">
                  <Icon name="arrow-up-right" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <JsonLd
        value={collectionSchema(
          `/leistungen/${c.slug}`,
          c.name,
          c.services.map((s) => ({ name: s.name, path: serviceHref(s) })),
        )}
      />
      <Cta />
    </>
  );
}
