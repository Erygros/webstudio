import type { Metadata } from "next";
import { site } from "@/config/site";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ExitBanner } from "@/components/exit-banner";
import { PublicChrome } from "@/components/public-chrome";
import { JsonLd } from "@/components/ui";
import { categories } from "@/data/services";
import { packages, priceLabel } from "@/config/pricing";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} – Individuelle Weblösungen`,
    template: `%s · ${site.name}`,
  },
  description: `Websites, Onlineshops und individuelle Software. Professionelle Weblösungen ${priceLabel(packages[0].price)} für Projekte jeder Größe.`,
  robots:
    process.env.NEXT_PUBLIC_SITE_URL && !site.url.includes("localhost")
      ? { index: true, follow: true }
      : { index: false, follow: false },
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
        <JsonLd
          value={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: site.url,
            inLanguage: "de-DE",
          }}
        />
      </body>
    </html>
  );
}
