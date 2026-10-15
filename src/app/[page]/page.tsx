import { Icon } from "@/components/icon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { contentPages } from "@/data/pages";
import { legalPages } from "@/data/legal";
import { Breadcrumbs, PageIntro, Cta } from "@/components/ui";
import { seo } from "@/lib/seo";
const pages = { ...contentPages, ...legalPages };
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((page) => ({ page }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = pages[page];
  if (!p) notFound();
  return {
    ...seo(p.seoTitle || p.title.replace(/\.$/, ""), p.description, `/${page}`),
    ...(p.legal ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const p = pages[page];
  if (!p) notFound();
  return (
    <>
      <Breadcrumbs items={[{ name: p.label, href: `/${page}` }]} />
      <PageIntro label={p.label} title={p.title} description={p.description} />
      {p.sections.map((s, i) => (
        <section
          key={s.title}
          className={`section content-split ${i % 2 ? "solutions" : ""}`}
        >
          <h2>{s.title}</h2>
          <div className="prose">
            <p style={{ whiteSpace: "pre-line" }}>{s.text}</p>
            {s.items && (
              <ul>
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {s.links && (
              <div className="buttons" style={{ marginTop: 22 }}>
                {s.links.map((link) => (
                  <Link className="text-link" href={link.href} key={link.href}>
                    {link.title} <Icon name="arrow-up-right" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
      {p.cta && <Cta />}
    </>
  );
}
