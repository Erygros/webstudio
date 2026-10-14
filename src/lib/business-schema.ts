import { business, site } from "@/config/site";
import { canonicalUrl, organizationId, websiteId } from "@/lib/seo";

export const businessSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": organizationId,
      name: site.name,
      legalName: business.owner,
      url: site.url,
      description:
        "Webdesign, Onlineshops und individuelle Webentwicklung von Enrico Gross in Dortmund. Zusammenarbeit im deutschsprachigen Raum.",
      email: site.email,
      telephone: site.phone.replace(/[^+\d]/g, ""),
      address: {
        "@type": "PostalAddress",
        streetAddress: business.street,
        postalCode: business.postcode,
        addressLocality: business.city,
        addressCountry: "DE",
      },
      areaServed: [
        { "@type": "City", name: business.city },
        ...["Deutschland", "Österreich", "Schweiz"].map((name) => ({
          "@type": "Country",
          name,
        })),
      ],
      logo: {
        "@type": "ImageObject",
        "@id": `${site.url}/#logo`,
        url: canonicalUrl("/brand/wordmark-black.png"),
      },
      founder: { "@id": `${site.url}/#owner` },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Projektanfragen",
        telephone: site.phone.replace(/[^+\d]/g, ""),
        email: site.email,
        availableLanguage: "Deutsch",
      },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#owner`,
      name: business.owner,
      url: canonicalUrl("/ueber-uns"),
      worksFor: { "@id": organizationId },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: site.name,
      url: `${site.url}/`,
      inLanguage: "de-DE",
      publisher: { "@id": organizationId },
    },
  ],
};
