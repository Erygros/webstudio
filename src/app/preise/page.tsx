import Link from "next/link";
import {
  Breadcrumbs,
  PageIntro,
  SectionHead,
  Cta,
  Faq,
  JsonLd,
} from "@/components/ui";
import { Pricing } from "@/components/pricing";
import { additionalPrices, packages, priceLabel } from "@/config/pricing";
import { canonicalUrl, organizationId, seo } from "@/lib/seo";
export const metadata = seo(
  `Website-Kosten & Preise ${priceLabel(packages[0].price)}`,
  `${packages.map((p) => `${p.name} ${priceLabel(p.price)}`).join(", ")}. Onlineshops ${priceLabel(additionalPrices[0][1])}. Betreuung optional.`,
  "/preise",
);
export default function Prices() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Preise", href: "/preise" }]} />
      <PageIntro
        label="Preise und Umfang"
        title="Was kostet eine Website?"
        description={`Eine einfache Landingpage startet ${priceLabel(packages[0].price)}, eine mehrseitige Unternehmenswebsite ${priceLabel(packages[1].price)}, ein Onlineshop ${priceLabel(additionalPrices[0][1])}. Der verbindliche Preis richtet sich nach dem vereinbarten Umfang.`}
      />
      <section className="section">
        <Pricing />
      </section>
      <section className="section content-split">
        <div>
          <h2>Einmalige und laufende Kosten.</h2>
          <Link
            className="text-link"
            href="/wissen/was-eine-website-kostet"
            style={{ marginTop: 24 }}
          >
            So entsteht ein Website-Angebot ↗
          </Link>
        </div>
        <Faq
          items={[
            {
              question: `Was enthält der Einstiegspreis ${priceLabel(packages[0].price)}?`,
              answer: `Das Starter-Paket ${priceLabel(packages[0].price)} umfasst eine einfache Landingpage, responsive Umsetzung, eine Kontaktmöglichkeit, Basis-SEO und die einmalige Übergabe. Zusätzliche Seiten, ein CMS oder besondere Funktionen gehören nur bei gesonderter Vereinbarung zum Angebot.`,
            },
            {
              question: "Welche Kosten können nach dem Start anfallen?",
              answer:
                "Domain, Hosting und gegebenenfalls Softwarelizenzen verursachen eigene Anbietergebühren. Technische Betreuung ist optional. Das Angebot trennt Umsetzung, vereinbarte Zusatzleistungen und laufende Kosten.",
            },
            {
              question:
                "Wird auf die genannten Preise Umsatzsteuer aufgeschlagen?",
              answer:
                "Nein. Die angegebenen Beträge sind Endpreise; der Nettobetrag entspricht dem Endbetrag. Webstudio Expert berechnet gemäß § 19 UStG keine Umsatzsteuer.",
            },
          ]}
        />
      </section>
      <section className="section content-split solutions">
        <h2>Weitere Lösungen.</h2>
        <ul className="additional-prices">
          {additionalPrices.map(([name, price]) => (
            <li key={name}>
              <span>{name}</span>
              <strong>{priceLabel(price)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="section">
        <SectionHead title="Klar geregelt. Vor dem Start." />
        <div className="terms-grid">
          {[
            [
              "Zahlung nach Vereinbarung",
              "Eine vereinbarte Anzahlung wird vor Projektstart fällig. Die Restzahlung erfolgt nach vereinbarter Abnahme. Ratenzahlung für größere Projekte ist auf Anfrage möglich.",
            ],
            [
              "Übergabe mit definierten Rechten",
              "Code und Dateien werden nach vollständiger Zahlung im vereinbarten Nutzungs- und Rechteumfang übergeben. Lizenzen von Drittanbietern weisen wir separat aus.",
            ],
            [
              "Betreuung bleibt optional",
              "Hosting und Betreuung werden nur auf Wunsch vereinbart. Es gibt keine versteckten Pflichtabonnements. Anbietergebühren und Zusatzleistungen stehen im Angebot.",
            ],
          ].map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <SectionHead
          label="Nach dem Projekt"
          title="Monatliche Betreuung."
          description="Ein begrenzter, transparenter Umfang. Hostingkosten sind abhängig vom Anbieter und separat vereinbart."
        />
        <Pricing care />
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          "@id": `${canonicalUrl("/preise")}#angebote`,
          name: "Webprojekt-Pakete",
          itemListElement: packages.map((p) => ({
            "@type": "Offer",
            name: p.name,
            url: canonicalUrl("/preise"),
            seller: { "@id": organizationId },
            ...(p.price === null
              ? {}
              : {
                  priceSpecification: {
                    "@type": "PriceSpecification",
                    minPrice: p.price,
                    priceCurrency: "EUR",
                    valueAddedTaxIncluded: true,
                  },
                }),
            itemOffered: {
              "@type": "Service",
              name: `${p.name} – ${p.summary}`,
              description: p.features.join(", "),
              provider: { "@id": organizationId },
            },
          })),
        }}
      />
      <Cta />
    </>
  );
}
