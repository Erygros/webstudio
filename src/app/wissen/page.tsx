import Link from "next/link";
import { articles } from "@/data/articles";
import { PageIntro, Breadcrumbs, Cta } from "@/components/ui";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Wissen für dein Webprojekt",
  "Kurze Grundlagen zu Websites, Webanwendungen, Kosten und Übergabe. Verständliche Informationen zur Planung deines nächsten Projekts.",
  "/wissen",
);
export default function Knowledge() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Wissen", href: "/wissen" }]} />
      <PageIntro
        label="Wissensbereich"
        title="Besser vorbereitet starten."
        description="Kurze Einordnungen zu Entscheidungen, die bei Webprojekten häufig anstehen."
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
      <Cta />
    </>
  );
}
