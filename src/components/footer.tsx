import Link from "next/link";
import Image from "next/image";
import { business, site } from "@/config/site";
import { Brand } from "@/components/brand";
const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61595296811136",
    logo: "/social-logos/facebook.png",
    label: "Webstudio Expert auf Facebook",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/webstudio_expert",
    logo: "/social-logos/instagram.png",
    label: "Webstudio Expert auf Instagram",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/enrico-gross-7bb190444/",
    logo: "/social-logos/linkedin.png",
    label: "Enrico Gross auf LinkedIn",
  },
];
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
          <Link href="/leads">Firmenkontakte kaufen</Link>
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
      <nav className="footer-socials" aria-label="Social-Media-Kanäle">
        <span>Folge uns</span>
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${social.label} (öffnet in einem neuen Tab)`}
            title={social.name}
          >
            <Image
              src={social.logo}
              alt=""
              width={28}
              height={28}
              sizes="28px"
            />
          </a>
        ))}
      </nav>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <div>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/cookie-einstellungen">Cookie-Einstellungen</Link>
          <Link href="/barrierefreiheit">Barrierefreiheit</Link>
          <Link href="/buchungsbedingungen">Buchungsbedingungen</Link>
          <Link href="/vertrag-kuendigen">Verträge hier kündigen</Link>
          <Link href="/vertrag-widerrufen">Vertrag widerrufen</Link>
        </div>
        <span>Entwickelt mit Klarheit.</span>
      </div>
    </footer>
  );
}
