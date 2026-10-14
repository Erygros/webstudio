import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, serviceHref } from "@/data/services";
import {
  PageIntro,
  Cta,
  Breadcrumbs,
  Button,
  SectionHead,
} from "@/components/ui";
import { seo } from "@/lib/seo";
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = categories.find((c) => c.slug === category);
  if (!c) notFound();
  return seo(c.name, c.description, `/leistungen/${c.slug}`);
}
export default async function Category({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = categories.find((c) => c.slug === category);
  if (!c) notFound();
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
        <Button href={`/projektanfrage?leistung=${c.slug}`}>
          Vorhaben besprechen
        </Button>
      </PageIntro>
      <section className="section">
        <SectionHead title="Was können wir für dich entwickeln?" />
        <div className="service-directory">
          {c.services.map((s) => (
            <Link href={serviceHref(s)} key={s.slug}>
              <div>
                <h3>{s.name}</h3>
                <p>{s.intro}</p>
              </div>
              <span aria-hidden="true">↗</span>
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
      <Cta />
    </>
  );
}
