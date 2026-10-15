import { Icon } from "@/components/icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/data/articles";
import { PageIntro, Breadcrumbs, Cta, Faq, JsonLd } from "@/components/ui";
import { site } from "@/config/site";
import { canonicalUrl, organizationId, seo, websiteId } from "@/lib/seo";
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
  return seo(a.title, a.intro, `/wissen/${slug}`, {
    article: { modified: a.updated },
  });
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
          <div className="article-meta">
            <Link href="/unternehmen">Redaktion: {site.name}</Link>
            <time dateTime={a.updated}>
              Stand:{" "}
              {new Intl.DateTimeFormat("de-DE", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Berlin",
              }).format(new Date(a.updated))}
            </time>
          </div>
          <section aria-labelledby="kurzantwort">
            <h2 id="kurzantwort">Die kurze Antwort.</h2>
            <p>{a.answer}</p>
          </section>
          <nav className="article-toc" aria-label="Inhalt dieses Ratgebers">
            <strong>In diesem Ratgeber</strong>
            <ol>
              {a.sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#abschnitt-${i + 1}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          {a.comparison && (
            <div
              className="comparison-wrap"
              role="region"
              aria-label={a.comparison.caption}
              tabIndex={0}
            >
              <table className="comparison-table">
                <caption>{a.comparison.caption}</caption>
                <thead>
                  <tr>
                    {a.comparison.columns.map((column) => (
                      <th scope="col" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.comparison.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) =>
                        i === 0 ? (
                          <th scope="row" key={i}>
                            {cell}
                          </th>
                        ) : (
                          <td key={i}>{cell}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {a.sections.map((s, i) => (
            <section key={s.title} id={`abschnitt-${i + 1}`}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
              {s.items && (
                <ul>
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <section>
            <h2>Häufige Fragen.</h2>
            <Faq items={a.faq} />
          </section>
          {a.sources && (
            <section>
              <h2>Quellen und weiterführende Informationen.</h2>
              <ul>
                {a.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href}>{source.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2>Passende nächste Schritte.</h2>
            <div className="buttons">
              {a.related.map((link) => (
                <Link className="text-link" key={link.href} href={link.href}>
                  {link.title} <Icon name="arrow-up-right" />
                </Link>
              ))}
            </div>
          </section>
        </article>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `${canonicalUrl(`/wissen/${slug}`)}#article`,
          headline: a.title,
          description: a.intro,
          inLanguage: "de-DE",
          mainEntityOfPage: canonicalUrl(`/wissen/${slug}`),
          url: canonicalUrl(`/wissen/${slug}`),
          dateModified: a.updated,
          author: { "@id": organizationId },
          publisher: { "@id": organizationId },
          isPartOf: { "@id": websiteId },
          image: canonicalUrl("/opengraph-image"),
        }}
      />
      <Cta />
    </>
  );
}
