import type { Metadata } from "next";
import { site } from "@/config/site";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ExitBanner } from "@/components/exit-banner";
import { PublicChrome } from "@/components/public-chrome";
import { JsonLd } from "@/components/ui";
import { businessSchema } from "@/lib/business-schema";
import { publicIndexing } from "@/lib/seo";
import { categories } from "@/data/services";
import { packages, priceLabel } from "@/config/pricing";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} – Webdesign & Webentwicklung Dortmund`,
    template: `%s · ${site.name}`,
  },
  description: `Webdesign und Webentwicklung aus Dortmund: Websites ${priceLabel(packages[0].price)}, Onlineshops und individuelle Software von Enrico Gross.`,
  applicationName: site.name,
  category: "Webdesign und Webentwicklung",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : {},
  },
  robots: {
    index: publicIndexing,
    follow: publicIndexing,
    ...(publicIndexing
      ? {
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {}),
  },
};
const themeScript =
  "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Zum Inhalt
        </a>
        <PublicChrome
          structuredData={<JsonLd value={businessSchema} />}
          header={
            <Navigation
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
                count: c.services.length,
              }))}
            />
          }
          footer={
            <>
              <Footer />
              <ExitBanner />
            </>
          }
        >
          {children}
        </PublicChrome>
      </body>
    </html>
  );
}
