import type { Metadata } from "next";
import { site } from "@/config/site";
export const canonicalUrl = (path: string) => new URL(path, site.url).href;
export const organizationId = `${site.url}/#organization`;
export const websiteId = `${site.url}/#website`;
export const publicIndexing =
  process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
type SeoOptions = {
  noIndex?: boolean;
  image?: { path: string; width: number; height: number; alt: string };
  article?: { modified: string };
};
export function seo(
  title: string,
  description: string,
  path: string,
  options: SeoOptions = {},
): Metadata {
  const image = options.image || {
    path: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "Webstudio Expert – Webdesign und Webentwicklung aus Dortmund",
  };
  const images = [
    {
      url: canonicalUrl(image.path),
      width: image.width,
      height: image.height,
      alt: image.alt,
    },
  ];
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(path) },
    ...(options.noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} · ${site.name}`,
      description,
      url: canonicalUrl(path),
      type: options.article ? "article" : "website",
      ...(options.article ? { modifiedTime: options.article.modified } : {}),
      locale: "de_DE",
      siteName: site.name,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
export function collectionSchema(
  path: string,
  name: string,
  items: { name: string; path: string }[],
) {
  const url = canonicalUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name,
    inLanguage: "de-DE",
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: canonicalUrl(item.path),
      })),
    },
  };
}
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
