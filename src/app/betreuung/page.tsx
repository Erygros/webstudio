import { Icon } from "@/components/icon";
import Link from "next/link";
import { PageIntro, Breadcrumbs, SectionHead, Faq, Cta } from "@/components/ui";
import { Pricing } from "@/components/pricing";
import { seo } from "@/lib/seo";
import { carePackages, priceLabel } from "@/config/pricing";
export const metadata = seo(
  `Website-Wartung & Betreuung ${priceLabel(carePackages[0].price)} / Monat`,
  `Optionale Betreuung ${priceLabel(carePackages[0].price)} pro Monat: technische Pflege, klar begrenzte Inhaltsarbeiten und vereinbarter Support. Hosting separat nach Bedarf.`,
  "/betreuung",
);
export default function Care() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Betreuung", href: "/betreuung" }]} />
      <PageIntro
        label="Betrieb und Pflege"
        title="Website-Wartung und Betreuung."
        description="Eine Website braucht nicht jeden Monat ein neues Projekt. Für wiederkehrende Aufgaben vereinbaren wir einen passenden Betreuungsumfang."
      />
      <section className="section">
        <Pricing care />
      </section>
      <section className="section content-split solutions">
        <h2>Ein Vertrag mit klaren Grenzen.</h2>
        <div className="prose">
          <p>
            Vor Beginn halten wir Systeme, Aufgaben, Zeitkontingente,
            Supportkanäle und Zuständigkeiten fest. Vertragslaufzeit und
            Kündigung richten sich nach dem individuellen Angebot.
          </p>
          <h3>Zusätzliche Arbeiten</h3>
          <p>
            Größere Änderungen, neue Funktionen und Aufwände außerhalb des
            Kontingents werden vorher angeboten. Enthaltene Zeiten werden nicht
            in den Folgemonat übertragen.
          </p>
          <h3>Hosting und Bereitschaft</h3>
          <p>
            Hostingkosten und eine gegebenenfalls benötigte Bereitschaft sind
            nicht automatisch enthalten. Verbindliche Reaktionszeiten gelten nur
            nach gesonderter Vereinbarung.
          </p>
          <Link className="text-link" href="/leistungen/betreuung">
            Alle Betreuungsleistungen <Icon name="arrow-up-right" />
          </Link>
        </div>
      </section>
      <section className="section content-split">
        <h2>Fragen zur Betreuung.</h2>
        <Faq
          items={[
            {
              question: "Kann eine bestehende Website übernommen werden?",
              answer:
                "Nach einer Bestandsaufnahme klären wir, welche Komponenten betreut werden können und ob vorab technische Arbeiten notwendig sind.",
            },
            {
              question: "Ist Hosting in den Monatsbeträgen enthalten?",
              answer:
                "Nein. Hosting richtet sich nach Plattform und Ressourcenbedarf und wird separat vereinbart.",
            },
            {
              question: "Was passiert mit nicht genutzter Pflegezeit?",
              answer:
                "Sie verfällt am Monatsende. Größere Aufgaben planen wir als eigene, vorher angebotene Arbeiten.",
            },
            {
              question: "Ist Support rund um die Uhr enthalten?",
              answer:
                "Nein. Kanäle, Zeitfenster und gegebenenfalls Reaktionszeiten werden ausdrücklich im Vertrag festgehalten.",
            },
          ]}
        />
      </section>
      <Cta />
    </>
  );
}
