import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/services";
import { projects } from "@/data/projects";
import { site } from "@/config/site";
import { priceLabel, packages } from "@/config/pricing";
import { Button, Cta, SectionHead } from "@/components/ui";
import { Pricing } from "@/components/pricing";
import { Process } from "@/components/process";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Individuelle Websites, Shops und Software",
  `Individuelle Weblösungen für dein Vorhaben: Websites ${priceLabel(packages[0].price)}, Onlineshops und Software. Klarer Umfang, transparente Angebote und optionale Betreuung.`,
  "/",
);
export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">{site.name} / Individuelle Weblösungen</span>
        <div className="hero-top">
          <h1>
            Digitale Lösungen.
            <br />
            <span>Individuell entwickelt.</span>
          </h1>
          <div className="hero-copy">
            <p>
              Websites, Onlineshops und Softwarelösungen – entwickelt für deine
              Anforderungen.
            </p>
            <div className="buttons">
              <Button href="/projektanfrage">Projekt anfragen</Button>
              <Button secondary href="/leistungen">
                Leistungen entdecken
              </Button>
            </div>
          </div>
        </div>
        <Reveal className="hero-showcase">
          <Link href="/projekte/raum-architektur" className="hero-scene">
            <Image
              src={projects[0].image}
              alt="Architektur-Website-Mockup mit der Überschrift Räume, die bleiben und einem modernen Sichtbetonhaus"
              width={projects[0].imageWidth}
              height={projects[0].imageHeight}
              preload
              sizes="(max-width: 850px) 100vw, 60vw"
            />
            <span className="scene-label">
              Websites / Demonstrationsprojekt
            </span>
          </Link>
          <Link
            href="/projekte/form-objekte"
            className="hero-scene secondary-scene"
          >
            <Image
              src={projects[1].image}
              alt="Demo eines Onlineshops für Alltagsobjekte"
              width={projects[1].imageWidth}
              height={projects[1].imageHeight}
              sizes="(max-width: 850px) 100vw, 40vw"
            />
            <span className="scene-label">
              E-Commerce / Demonstrationsprojekt
            </span>
          </Link>
        </Reveal>
        <div className="hero-foot">
          <span>Von der ersten Website bis zur eigenen Plattform.</span>
          <strong>Websites {priceLabel(packages[0].price)}</strong>
          <span>Für Deutschland, Österreich und die Schweiz.</span>
        </div>
      </section>
      <section className="section">
        <SectionHead
          label="Leistungen"
          title="Dein Vorhaben. Die passende Lösung."
          description="Ein einzelner Auftritt oder ein verbundenes System. Wir entwickeln entlang deiner Anforderungen."
        />
        <div className="service-rows">
          {categories.map((c) => (
            <Link
              className="service-row"
              key={c.slug}
              href={`/leistungen/${c.slug}`}
            >
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section solutions">
        <SectionHead
          label="Projektgrößen"
          title="Klein anfangen. Weiterdenken."
        />
        <div className="solution-grid">
          <article>
            <h3>Websites und kleinere Webprojekte.</h3>
            <p>
              Eine gute erste Website braucht einen klaren Fokus. Für dein
              Angebot, deinen Verein oder deine eigene Arbeit.
            </p>
            <Link className="text-link" href="/leistungen/websites">
              Websites entdecken <span>↗</span>
            </Link>
          </article>
          <article>
            <h3>Shops und digitale Geschäftsmodelle.</h3>
            <p>
              Produkte verkaufen, Buchungen ermöglichen oder ein neues Geschäft
              aufbauen. Mit verständlichen Wegen für deine Kunden.
            </p>
            <Link className="text-link" href="/leistungen/e-commerce">
              E-Commerce entdecken <span>↗</span>
            </Link>
          </article>
          <article>
            <h3>Software und eigene Plattformen.</h3>
            <p>
              Wenn Standardlösungen nicht mehr passen: eigene Anwendungen für
              dein Team, deine Kunden und deine Prozesse.
            </p>
            <Link className="text-link" href="/leistungen/software">
              Software entdecken <span>↗</span>
            </Link>
          </article>
        </div>
      </section>
      <section className="section">
        <SectionHead
          label="Ausgewählte Arbeiten"
          title="So könnte es aussehen."
          description="Eigenständig gestaltete Demonstrationsprojekte. Beispiele für Gestaltung und Funktionskonzepte, keine Kundenreferenzen."
        />
        <Reveal className="project-grid">
          {projects.slice(0, 2).map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </Reveal>
        <div className="section-link">
          <Link className="text-link" href="/projekte">
            Alle Demonstrationsprojekte <span>↗</span>
          </Link>
        </div>
      </section>
      <section className="section process">
        <SectionHead
          label="Zusammenarbeit"
          title="Ein klarer Weg zum Ergebnis."
          description="Vom ersten Gespräch bis zur Übergabe. Mit vereinbarten Schritten und nachvollziehbaren Entscheidungen."
        />
        <Process />
      </section>
      <section className="section">
        <SectionHead
          label="Preise"
          title="Der passende Einstieg."
          description="Vier Ausgangspunkte für unterschiedliche Anforderungen. Dein konkretes Angebot richtet sich nach dem Projektumfang."
        />
        <Pricing compact />
        <div className="section-link">
          <Link className="text-link" href="/preise">
            Pakete und Konditionen ansehen <span>↗</span>
          </Link>
        </div>
      </section>
      <section className="section care-strip">
        <div>
          <span className="eyebrow">Nach dem Start</span>
          <h2>
            Gut betreut.
            <br />
            Auch nach der Übergabe.
          </h2>
        </div>
        <div>
          <p>
            Hosting, technische Pflege und Unterstützung kannst du passend zu
            deinem Bedarf ergänzen. Mit definiertem Umfang und ohne versteckte
            Pflichtabonnements.
          </p>
          <Button secondary href="/betreuung">
            Betreuung entdecken
          </Button>
        </div>
      </section>
      <Cta />
    </>
  );
}
