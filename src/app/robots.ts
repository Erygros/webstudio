import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  const ready =
    !!process.env.NEXT_PUBLIC_SITE_URL && !site.url.includes("localhost");
  return {
    rules: {
      userAgent: "*",
      allow: ready ? "/" : undefined,
      disallow: ready ? ["/api/"] : ["/"],
    },
    sitemap: ready ? `${site.url}/sitemap.xml` : undefined,
  };
}
