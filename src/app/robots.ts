import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { publicIndexing } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/api/", "/crm", "/crm/"];
  return {
    rules: ["*", "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"].map(
      (userAgent) => ({
        userAgent,
        allow: publicIndexing ? "/" : undefined,
        disallow: publicIndexing ? privatePaths : ["/"],
      }),
    ),
    sitemap: publicIndexing ? `${site.url}/sitemap.xml` : undefined,
  };
}
