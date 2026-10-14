import Link from "next/link";
import { articles } from "@/data/articles";
import { PageIntro, Breadcrumbs, Cta, JsonLd } from "@/components/ui";
import { collectionSchema, seo } from "@/lib/seo";
export const metadata = seo(
  "Wissen für dein Webprojekt",
  "Ratgeber zu Website-Kosten, Briefing, CMS, Webanwendungen und Übergabe. Vergleiche und Checklisten zur Vorbereitung deines Webprojekts.",
  "/wissen",
);
export default function Knowledge() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Wissen", href: "/wissen" }]} />
      <PageIntro
        label="Wissensbereich"
        title="Besser vorbereitet starten."
        description="Antworten, Vergleiche und Checklisten für dein Webprojekt. Veröffentlicht von Webstudio Expert; den Inhaltsstand findest du im jeweiligen Ratgeber."
      />
      <section className="section article-grid">
        {articles.map((a) => (
          <article className="article-card" key={a.slug}>
            <span className="eyebrow">Projektgrundlagen</span>
            <h2 style={{ fontSize: 28 }}>{a.title}</h2>
            <p>{a.intro}</p>
            <Link className="text-link" href={`/wissen/${a.slug}`}>
              Artikel lesen ↗
            </Link>
          </article>
        ))}
      </section>
      <JsonLd
        value={collectionSchema(
          "/wissen",
          "Ratgeber für dein Webprojekt",
          articles.map((a) => ({ name: a.title, path: `/wissen/${a.slug}` })),
        )}
      />
      <Cta />
    </>
  );
}
