import Link from "next/link";
import {
  BookingPackage,
  bookingHref,
  packageHref,
  packagePrice,
  monthlyTerms,
} from "@/data/bookable-services";
import { Breadcrumbs, PageIntro, Button, SectionHead, Faq, JsonLd } from "./ui";
import { canonicalUrl, organizationId } from "@/lib/seo";
import { categories, serviceHref } from "@/data/services";
export function ServicePackagePage({ p }: { p: BookingPackage }) {
  const c = categories.find((c) => c.slug === p.category)!;
  const faq = [
    {
      question: `Was ist im Einstiegspaket ${p.name} enthalten?`,
      answer: p.scope.join(". ") + ".",
    },
    {
      question: "Welche zusätzlichen Kosten können entstehen?",
      answer: `Der Paketpreis beträgt ${packagePrice(p)} als vollständiger Endpreis. Nicht enthalten sind ${p.extras.join(", ")}. Erweiterungen und externe Gebühren werden vorher separat abgestimmt und nur mit deiner Zustimmung beauftragt.`,
    },
    {
      question: "Wann beginnt die Leistung?",
      answer:
        p.interval === "monthly"
          ? monthlyTerms
          : "Nach bestätigtem Zahlungseingang und vollständiger Bereitstellung der benötigten Inhalte und Zugänge innerhalb von 20 Werktagen, sofern kein anderer Termin ausdrücklich vereinbart wird. Bei Verbrauchern beachten wir die Widerrufsfrist und gegebenenfalls ausdrücklich gewünschte vorzeitige Leistung.",
    },
    {
      question: "Kann ich mich vor der Buchung beraten lassen?",
      answer:
        "Ja. Über „Kostenlose Beratung anfragen“ kannst du deinen Bedarf unverbindlich beschreiben. Dabei entstehen weder eine Zahlungspflicht noch ein kostenpflichtiger Auftrag.",
    },
    {
      question: "Wie bezahle ich?",
      answer:
        "Per Banküberweisung. Nach der verbindlichen Buchung erhältst du eine Buchungsnummer, die Bankverbindung, das Zahlungsziel und eine Bestätigungs-E-Mail mit Rechnung. Der Zahlungseingang wird separat bestätigt.",
    },
  ];
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Leistungen", href: "/leistungen" },
          { name: c.short, href: `/leistungen/${c.slug}` },
          { name: p.name, href: packageHref(p) },
        ]}
      />
      <PageIntro label={c.name} title={p.name} description={p.description}>
        <div className="buttons">
          <Button href={bookingHref(p)}>Jetzt buchen</Button>
          <Button secondary href={bookingHref(p, true)}>
            Kostenlose Beratung anfragen
          </Button>
        </div>
      </PageIntro>
      <section className="section content-split">
        <div>
          <span className="eyebrow">Festes Einstiegspaket</span>
          <h2>{packagePrice(p)}</h2>
          <p className="price-note">
            Vollständiger Endpreis für den beschriebenen Umfang. Externe Kosten
            und Erweiterungen separat.
          </p>
        </div>
        <div>
          <h2>Das ist enthalten.</h2>
          <ul className="feature-list">
            {p.scope.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p>
            {p.interval === "monthly"
              ? monthlyTerms
              : "Einmalige Beauftragung. Das Einstiegspaket deckt genau den beschriebenen Umfang ab."}
          </p>
        </div>
      </section>
      <section className="section content-split solutions">
        <h2>Wenn du mehr vorhast.</h2>
        <div>
          <p>
            Diese Ergänzungen gehören nicht zum direkt buchbaren Paket und
            werden individuell angeboten:
          </p>
          <ul>
            {p.extras.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <Button href={bookingHref(p, true)} secondary>
            Erweiterung besprechen
          </Button>
        </div>
      </section>
      <section className="section">
        <SectionHead title="Von der Buchung zur Umsetzung." />
        <div className="process-grid">
          {[
            "Paket und Kundendaten auswählen",
            "Umfang und Endpreis prüfen",
            "Verbindlich buchen und überweisen",
            "Zahlung bestätigen und Start abstimmen",
          ].map((s, i) => (
            <article key={s}>
              <span className="step-number">0{i + 1}</span>
              <h3>{s}</h3>
            </article>
          ))}
        </div>
        <p>
          Die vollständigen{" "}
          <Link href="/buchungsbedingungen">
            Buchungsbedingungen und Widerrufsinformationen
          </Link>{" "}
          stehen vor deiner Bestellung zur Verfügung.
        </p>
      </section>
      <section className="section content-split">
        <h2>Fragen zu {p.name}.</h2>
        <Faq items={faq} />
      </section>
      <section className="section">
        <SectionHead title="Passende Ergänzungen." />
        <div className="service-directory">
          {c.services
            .filter((s) => s.slug !== p.slug)
            .slice(0, 4)
            .map((s) => (
              <Link key={s.slug} href={serviceHref(s)}>
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.intro}</p>
                </div>
              </Link>
            ))}
        </div>
        <div className="buttons">
          <Button href={bookingHref(p)}>Jetzt buchen</Button>
          <Button secondary href={bookingHref(p, true)}>
            Kostenlose Beratung anfragen
          </Button>
        </div>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: p.name,
          description: p.description,
          url: canonicalUrl(packageHref(p)),
          provider: { "@id": organizationId },
          areaServed: "DE",
          offers: {
            "@type": "Offer",
            price: (p.cents / 100).toFixed(2),
            priceCurrency: "EUR",
            url: canonicalUrl(packageHref(p)),
            description: `Festes Einstiegspaket: ${p.scope.join("; ")}`,
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: p.cents / 100,
              priceCurrency: "EUR",
              ...(p.interval === "monthly"
                ? { billingDuration: 1, unitText: "Monat" }
                : { unitText: "einmalig" }),
            },
          },
        }}
      />
    </>
  );
}
