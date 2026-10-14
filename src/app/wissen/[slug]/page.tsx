import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/data/articles";
import { PageIntro, Breadcrumbs, Cta, JsonLd } from "@/components/ui";
import { site } from "@/config/site";
import { seo } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return seo(a.title, a.intro, `/wissen/${slug}`);
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Wissen", href: "/wissen" },
          { name: a.title, href: `/wissen/${slug}` },
        ]}
      />
      <PageIntro
        label="Projektgrundlagen"
        title={a.title}
        description={a.intro}
      />
      <section className="section">
        <article className="article-body">
          {a.sections.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          <Link className="text-link" href={a.link} style={{ marginTop: 30 }}>
            Passende Leistungen ansehen ↗
          </Link>
        </article>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.intro,
          inLanguage: "de-DE",
          mainEntityOfPage: `${site.url}/wissen/${slug}`,
        }}
      />
      <Cta />
    </>
  );
}
