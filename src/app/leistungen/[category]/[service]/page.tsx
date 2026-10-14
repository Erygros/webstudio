import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categories,
  services,
  serviceHref,
  serviceFaqs,
} from "@/data/services";
import { priceLabel, priceNote } from "@/config/pricing";
import { site } from "@/config/site";
import {
  Breadcrumbs,
  PageIntro,
  Button,
  SectionHead,
  Faq,
  JsonLd,
} from "@/components/ui";
import { seo } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return services.map((s) => ({ category: s.category, service: s.slug }));
}
async function resolve(params: Promise<{ category: string; service: string }>) {
  const p = await params;
  const c = categories.find((c) => c.slug === p.category);
  const s = c?.services.find((s) => s.slug === p.service);
  if (!c || !s) notFound();
  return { c, s };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; service: string }>;
}) {
  const { s } = await resolve(params);
  return seo(`${s.name} individuell umsetzen`, s.intro, serviceHref(s));
}
export default async function Service({
  params,
}: {
  params: Promise<{ category: string; service: string }>;
}) {
  const { c, s } = await resolve(params);
  const faq = serviceFaqs(s);
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Leistungen", href: "/leistungen" },
          { name: c.short, href: `/leistungen/${c.slug}` },
          { name: s.name, href: serviceHref(s) },
        ]}
      />
      <PageIntro
        label={c.name}
        title={`${s.name}. Passend zu deinem Vorhaben.`}
        description={s.intro}
      >
        <Button href={`/projektanfrage?leistung=${s.slug}`}>
          {s.name === "Monatliche Betreuungspakete"
            ? "Betreuung anfragen"
            : "Projekt anfragen"}
        </Button>
      </PageIntro>
      <section className="section content-split">
        <div>
          <span className="eyebrow">Leistungsumfang</span>
          <h2>Die wesentlichen Funktionen.</h2>
        </div>
        <div>
          <ul className="feature-list">
            {s.features.map((f) => (
              <li key={f}>
                {f}
                <span aria-hidden="true">✓</span>
              </li>
            ))}
          </ul>
          <p className="price-note">
            Die Auswahl wird auf dein Projekt abgestimmt und im Angebot
            verbindlich festgehalten.
          </p>
        </div>
      </section>
      <section className="section content-split solutions">
        <div>
          <span className="eyebrow">Nutzen und Einsatz</span>
          <h2>Für einen konkreten Bedarf.</h2>
        </div>
        <div className="prose">
          <h3>Was sich verbessert</h3>
          <p>{s.benefit}</p>
          <h3>Geeignete Anwendungsfälle</h3>
          <p>{s.useCase}</p>
          <h3>Was wir gemeinsam klären</h3>
          <p>
            Welche Anforderungen an {s.features[0].toLowerCase()} bestehen? Wie
            soll {s.features[1].toLowerCase()} in deine vorhandenen Abläufe
            eingebunden werden? Diese Entscheidungen bilden die Grundlage für
            den Umfang.
          </p>
        </div>
      </section>
      <section className="section">
        <SectionHead label="Umsetzung" title={`Der Weg zu ${s.name}.`} />
        <div className="process-grid">
          {c.approach.map((a, i) => (
            <article key={a}>
              <span className="step-number">0{i + 1}</span>
              <h3>{a}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="section content-split solutions">
        <div>
          <span className="eyebrow">Investition</span>
          <h2>
            {priceLabel(s.price)}
            {s.name === "Monatliche Betreuungspakete" && " / Monat"}
          </h2>
        </div>
        <div>
          <p>
            Ein konkretes Angebot berücksichtigt Funktionsumfang, vorhandene
            Inhalte und die erforderlichen Anbindungen. Laufende Anbieter- und
            Betriebskosten weisen wir separat aus.
          </p>
          <p className="price-note">{priceNote}</p>
          <div className="buttons" style={{ marginTop: 24 }}>
            <Button href={`/projektanfrage?leistung=${s.slug}`}>
              Angebot anfragen
            </Button>
          </div>
        </div>
      </section>
      <section className="section content-split">
        <h2>Fragen zu {s.name}.</h2>
        <Faq items={faq} />
      </section>
      <section className="section">
        <SectionHead title="Passende Ergänzungen." />
        <div className="service-directory">
          {c.services
            .filter((item) => item.slug !== s.slug)
            .slice(
              Math.max(0, c.services.indexOf(s) - 1),
              Math.max(0, c.services.indexOf(s) - 1) + 4,
            )
            .map((item) => (
              <Link href={serviceHref(item)} key={item.slug}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.intro}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
        </div>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: s.name,
          description: s.intro,
          url: `${site.url}${serviceHref(s)}`,
          serviceType: c.name,
          areaServed: ["DE", "AT", "CH"],
        }}
      />
    </>
  );
}
