import Link from "next/link";
import {
  bookingPackages,
  packageHref,
  packagePrice,
} from "@/data/bookable-services";
import { SectionHead, Button } from "./ui";
export function PackageDirectory({ compact = false }: { compact?: boolean }) {
  const items = compact
    ? bookingPackages.filter((p) =>
        [
          "social-media-management",
          "mobile-apps",
          "website-cybersecurity",
          "digitale-verkaufsprozesse",
        ].includes(p.slug),
      )
    : bookingPackages;
  return (
    <section className="section">
      <SectionHead
        label="Direkt buchbare Einstiegspakete"
        title="Klare Leistungen. Fester Umfang."
        description="Wähle dein Einstiegspaket oder lass dich vorab kostenlos beraten. Erweiterungen und externe Gebühren stimmen wir gesondert ab."
      />
      <div className="service-directory">
        {items.map((p) => (
          <Link href={packageHref(p)} key={p.slug}>
            <div>
              <h3>
                {p.name}
                {p.slug === "mobile-apps" ? " · Konzeptpaket" : ""}
              </h3>
              <p>{p.description}</p>
            </div>
            <strong>{packagePrice(p)}</strong>
          </Link>
        ))}
      </div>
      {compact && <Button href="/buchen">Alle Einstiegspakete ansehen</Button>}
    </section>
  );
}
