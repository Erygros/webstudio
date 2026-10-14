import { Breadcrumbs, PageIntro, SectionHead, Cta } from "@/components/ui";
import { Pricing } from "@/components/pricing";
import { additionalPrices, packages, priceLabel } from "@/config/pricing";
import { seo } from "@/lib/seo";
export const metadata = seo(
  `Preise – Websites ${priceLabel(packages[0].price)}`,
  `${packages.map((p) => `${p.name} ${priceLabel(p.price)}`).join(", ")}. Onlineshops ${priceLabel(additionalPrices[0][1])}. Betreuung optional.`,
  "/preise",
);
export default function Prices() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Preise", href: "/preise" }]} />
      <PageIntro
        label="Preise und Umfang"
        title="Ein passender Rahmen für dein Projekt."
        description="Die Pakete geben Orientierung. Du erhältst ein individuelles Angebot mit klar beschriebenen Leistungen und nachvollziehbaren Kosten."
      />
      <section className="section">
        <Pricing />
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
      <Cta />
    </>
  );
}
