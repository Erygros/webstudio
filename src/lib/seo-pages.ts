import { articles } from "@/data/articles";
import { contentPages } from "@/data/pages";
import { projects } from "@/data/projects";
import { regionalPages } from "@/data/regions";
import { serviceGuides } from "@/data/service-guides";
import { categories, services, serviceHref } from "@/data/services";

// Datum nur bei tatsächlicher Inhaltsänderung pflegen, nicht pro Build erneuern.
const contentRevision = "2026-10-14";
export function publicSeoPages(): { path: string; modified?: string }[] {
  return [
    { path: "/bewertungen", modified: "2026-10-15" },
    {
      path: "/wissen",
      modified: articles.reduce(
        (latest, article) =>
          article.updated > latest ? article.updated : latest,
        contentRevision,
      ),
    },
    ...["/", "/preise", "/kontakt"].map((path) => ({
      path,
      modified: contentRevision,
    })),
    ...["/leistungen", "/projekte", "/betreuung", "/faq"].map((path) => ({
      path,
    })),
    ...Object.keys(contentPages).map((p) => ({ path: `/${p}` })),
    ...categories.map((c) => ({ path: `/leistungen/${c.slug}` })),
    ...services.map((s) => ({
      path: serviceHref(s),
      ...(serviceGuides[s.slug] ? { modified: contentRevision } : {}),
    })),
    ...projects.map((p) => ({ path: `/projekte/${p.slug}` })),
    ...articles.map((a) => ({
      path: `/wissen/${a.slug}`,
      modified: a.updated,
    })),
    ...regionalPages.map((p) => ({
      path: `/region/${p.slug}`,
      modified: contentRevision,
    })),
  ];
}
