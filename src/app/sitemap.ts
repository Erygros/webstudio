import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { categories, services, serviceHref } from "@/data/services";
import { projects } from "@/data/projects";
import { contentPages } from "@/data/pages";
import { articles } from "@/data/articles";
import { regionalPages } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/leistungen",
    "/projekte",
    "/preise",
    "/betreuung",
    "/kontakt",
    "/projektanfrage",
    "/terminbuchung",
    "/faq",
    "/wissen",
    ...Object.keys(contentPages).map((p) => `/${p}`),
    ...categories.map((c) => `/leistungen/${c.slug}`),
    ...services.map(serviceHref),
    ...projects.map((p) => `/projekte/${p.slug}`),
    ...articles.map((a) => `/wissen/${a.slug}`),
    ...regionalPages.map((p) => `/region/${p.slug}`),
  ];
  return paths.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path.startsWith("/leistungen") ? 0.8 : 0.6,
  }));
}
