import Link from "next/link";
import { site } from "@/config/site";
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
        <p>
          Individuelle Weblösungen.
          <br />
          Vom ersten Auftritt bis zur eigenen Plattform.
        </p>
        <div>
          <Link href="/wissen">Wissen</Link>
          <Link href="/faq">Fragen & Antworten</Link>
          <Link href="/betreuung">Betreuung</Link>
          <Link href="/terminbuchung">Termin anfragen</Link>
        </div>
        <div>
          <Link href="/unternehmen">Unternehmen</Link>
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
