import { articles } from "@/data/articles";
import { contentPages } from "@/data/pages";
import { projects } from "@/data/projects";
import { regionalPages } from "@/data/regions";
import { serviceGuides } from "@/data/service-guides";
import { serviceAreas, services, serviceHref } from "@/data/services";
import { expansionDate, serviceAreaContent } from "@/data/service-expansion";

// Datum nur bei tatsächlicher Inhaltsänderung pflegen, nicht pro Build erneuern.
const contentRevision = "2026-10-14";
export function publicSeoPages(): { path: string; modified?: string }[] {
  return [
    { path: "/leads", modified: "2026-10-16" },
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
      modified: ["/", "/preise"].includes(path)
        ? expansionDate
        : contentRevision,
    })),
    ...["/leistungen", "/projekte", "/betreuung", "/faq"].map((path) => ({
      path,
      ...(["/leistungen", "/projekte"].includes(path)
        ? { modified: expansionDate }
        : {}),
    })),
    ...Object.keys(contentPages).map((p) => ({ path: `/${p}` })),
    ...serviceAreas.map((c) => ({
      path: `/leistungen/${c.slug}`,
      ...(serviceAreaContent[c.slug] ||
      ["websites", "e-commerce"].includes(c.slug)
        ? { modified: expansionDate }
        : {}),
    })),
    ...services.map((s) => ({
      path: serviceHref(s),
      ...(s.modified
        ? { modified: s.modified }
        : serviceGuides[s.slug]
          ? { modified: contentRevision }
          : {}),
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
