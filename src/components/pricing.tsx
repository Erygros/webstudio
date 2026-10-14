import Link from "next/link";
import {
  packages,
  carePackages,
  priceLabel,
  priceNote,
} from "@/config/pricing";
export function Pricing({
  compact = false,
  care = false,
}: {
  compact?: boolean;
  care?: boolean;
}) {
  const items = care ? carePackages : packages;
  return (
    <>
      <div className={`pricing-grid ${care ? "care-grid" : ""}`}>
        {items.map((p, i) => (
          <article
            key={p.name}
            className={`pricing-card ${i === 1 ? "featured" : ""}`}
          >
            <h3>{p.name}</h3>
            <div className="price">
              {priceLabel(p.price)}
              {care && <small> / Monat</small>}
            </div>
            {"summary" in p && <p>{p.summary}</p>}
            <ul>
              {(compact ? p.features.slice(0, 3) : p.features).map(
                (feature) => (
                  <li key={feature}>{feature}</li>
                ),
              )}
            </ul>
            <Link
              className="button secondary"
              href={`/projektanfrage?paket=${encodeURIComponent(care ? `Betreuung ${p.name}` : p.name)}`}
            >
              {care ? "Betreuung anfragen" : "Paket anfragen"}
              <span aria-hidden="true">↗</span>
            </Link>
          </article>
        ))}
      </div>
      <p className="price-note">
        {priceNote}
        {care &&
          " Nicht genutzte Pflegezeiten verfallen zum Monatsende. Zusatzarbeiten werden vorab angeboten. Reaktionszeiten und Hostingkosten werden separat vereinbart."}
      </p>
    </>
  );
}
