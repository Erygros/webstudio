import Link from "next/link";
import { business, site } from "@/config/site";
import { Brand } from "@/components/brand";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link
          className="brand"
          href="/"
          aria-label={`${site.name} – Startseite`}
        >
          <Brand />
        </Link>
        <address className="footer-address">
          <strong>
            {site.name} · {business.owner}
          </strong>
          <span>
            {business.street}, {business.postcode} {business.city}
          </span>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>{site.phone}</a>
        </address>
        <div>
          <Link href="/wissen">Wissen</Link>
          <Link href="/faq">Fragen & Antworten</Link>
          <Link href="/betreuung">Betreuung</Link>
          <Link href="/bewertungen">Bewertungsschutz</Link>
          <Link href="/terminbuchung">Termin anfragen</Link>
        </div>
        <div>
          <Link href="/unternehmen">Unternehmen</Link>
          <Link href="/ueber-uns">Über Enrico Gross</Link>
          <Link href="/region/dortmund">Webdesign in Dortmund</Link>
          <Link href="/white-label">White Label</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <div>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/cookie-einstellungen">Cookie-Einstellungen</Link>
          <Link href="/barrierefreiheit">Barrierefreiheit</Link>
        </div>
        <span>Entwickelt mit Klarheit.</span>
      </div>
    </footer>
  );
}
