import { services, serviceHref } from "./services";
export type ServiceMenuGroup = {
  name: string;
  links: { name: string; href: string }[];
};
const link = (name: string, slug: string, category: string) => ({
  name,
  href: services.find((s) => s.slug === slug)
    ? serviceHref(services.find((s) => s.slug === slug)!)
    : `/leistungen/${category}`,
});
export const serviceMenuGroups: ServiceMenuGroup[] = [
  {
    name: "Webentwicklung",
    links: [
      link("Websites", "unternehmenswebsites", "websites"),
      link("Landingpages", "landingpages", "websites"),
      link("Webanwendungen", "individuelle-webanwendungen", "software"),
      link("Mobile Apps", "mobile-apps", "software"),
      { name: "CMS & Baukastensysteme", href: "/leistungen/cms-baukaesten" },
      { name: "Alle Website-Leistungen", href: "/leistungen/websites" },
    ],
  },
  {
    name: "E-Commerce",
    links: [
      link("Onlineshops", "onlineshops", "e-commerce"),
      link("Shopify", "shopify-shops", "e-commerce"),
      link("WooCommerce", "woocommerce-shops", "e-commerce"),
      link("Marketplace-Management", "marketplace-management", "e-commerce"),
      { name: "Alle Shop-Leistungen", href: "/leistungen/e-commerce" },
    ],
  },
  {
    name: "Marketing & Werbung",
    links: [
      link("Google Ads", "google-ads", "marketing"),
      link("Meta Ads", "meta-ads-fuer-facebook-und-instagram", "marketing"),
      link("TikTok Ads", "tiktok-ads", "marketing"),
      link("Social-Media-Management", "social-media-management", "marketing"),
      link("E-Mail-Marketing", "e-mail-marketing", "marketing"),
      link(
        "Lokale & klassische Werbung",
        "regionale-werbekampagnen",
        "marketing",
      ),
      { name: "Alle Marketing-Leistungen", href: "/leistungen/marketing" },
    ],
  },
  {
    name: "Branding & Content",
    links: [
      link(
        "Logo & Corporate Design",
        "corporate-identity-und-corporate-design",
        "branding",
      ),
      link("Brand Assets", "digitale-brand-asset-pakete", "branding"),
      link("Video & Contentproduktion", "video-contentproduktion", "branding"),
      link("Recruiting-Websites", "recruiting-karrierewebsites", "websites"),
      { name: "Alle Branding-Leistungen", href: "/leistungen/branding" },
    ],
  },
  {
    name: "Software & Automatisierung",
    links: [
      link("SaaS-Entwicklung", "saas-plattformen", "software"),
      link("KI-Chatbots", "ki-chatbots", "ki-automatisierung"),
      link("WhatsApp Business", "whatsapp-business", "ki-automatisierung"),
      link("API-Integrationen", "api-integrationen", "software"),
      link(
        "Digitale Verkaufsprozesse",
        "digitale-verkaufsprozesse",
        "ki-automatisierung",
      ),
      link("E-Learning-Plattformen", "e-learning-plattformen", "software"),
      { name: "Software im Überblick", href: "/leistungen/software" },
      { name: "KI & Automatisierung", href: "/leistungen/ki-automatisierung" },
    ],
  },
  {
    name: "Weitere Services",
    links: [
      { name: "SEO & GEO", href: "/leistungen/optimierung" },
      link("Website-Cybersecurity", "website-cybersecurity", "optimierung"),
      { name: "Hosting & Wartung", href: "/leistungen/betreuung" },
      link(
        "E-Mail & Cloud-Einrichtung",
        "e-mail-cloud-einrichtung",
        "betreuung",
      ),
      link(
        "Google-Unternehmensprofil",
        "google-unternehmensprofil",
        "optimierung",
      ),
      {
        name: "Digitale Unternehmensberatung",
        href: "/leistungen/digitale-beratung",
      },
      { name: "Bewertungsschutz", href: "/bewertungen" },
    ],
  },
];
