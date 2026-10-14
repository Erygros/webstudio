import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { publicSeoPages } from "@/lib/seo-pages";
export default function sitemap(): MetadataRoute.Sitemap {
  return publicSeoPages().map(({ path, modified }) => ({
    url: `${site.url}${path}`,
    ...(modified ? { lastModified: modified } : {}),
  }));
}
