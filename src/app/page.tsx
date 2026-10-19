import { Icon } from "@/components/icon";
import Image from "next/image";
import Link from "next/link";
import { serviceAreas } from "@/data/services";
import { projects } from "@/data/projects";
import { business, site } from "@/config/site";
import { priceLabel, packages } from "@/config/pricing";
import { Button, Cta, Faq, SectionHead } from "@/components/ui";
import { articles } from "@/data/articles";
import { Pricing } from "@/components/pricing";
import { Process } from "@/components/process";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { seo } from "@/lib/seo";
import { PlatformMarquee } from "@/components/platform-marquee";
export const metadata = seo(
  "Webdesign & Webentwicklung Dortmund",
  `Webdesign aus Dortmund von Enrico Gross: Landingpages ${priceLabel(packages[0].price)}, Unternehmenswebsites, Onlineshops und individuelle Software. Persönlich anfragen.`,
  "/",
);
export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">
          {site.name} / Webdesign und Webentwicklung
        </span>
        <div className="hero-top">
          <h1>
            Webdesign.
            <br />
            <span>Aus Dortmund.</span>
          </h1>
          <div className="hero-copy">
            <p>
              Enrico Gross entwickelt Websites, Onlineshops und individuelle
              Software für Selbstständige, Unternehmen und Vereine. Aus
              Dortmund, für den deutschsprachigen Raum.
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
      <PlatformMarquee />
      <section className="section content-split solutions">
        <div>
          <span className="eyebrow">Dein Ansprechpartner</span>
          <h2>Was entwickelt Webstudio Expert?</h2>
        </div>
        <div className="prose">
          <p>
            {site.name} ist das Einzelunternehmen von {business.owner} in{" "}
            {business.city}. Du kannst eine einfache Landingpage, eine
            mehrseitige Firmenwebsite, einen Shop oder eine eigene Webanwendung
            beauftragen. Gestaltung, Funktionen und Übergabe werden vor dem
            Start im Angebot beschrieben.
          </p>
          <p>
            Ergänzend begleiten wir deinen Markenauftritt, digitale und lokale
            Werbekampagnen sowie die Planung digitaler Geschäftsmodelle und
            Prozesse. Auch Websites und Shops auf bestehenden CMS- und
            Baukastenplattformen gehören zum Angebot. Diese Leistungen werden
            individuell kalkuliert; Werbebudgets und externe Kosten separat.
          </p>
          <p>
            Der Starter-Einstieg für eine einfache Landingpage beginnt bei{" "}
            {priceLabel(packages[0].price).replace("ab ", "")}, die
            Unternehmenswebsite im Business-Paket bei{" "}
            {priceLabel(packages[1].price).replace("ab ", "")}. Hosting,
            Lizenzen und Betreuung werden bei Bedarf separat vereinbart.
          </p>
          <div className="buttons" style={{ marginTop: 24 }}>
            <Link className="text-link" href="/region/dortmund">
              Website in Dortmund erstellen lassen{" "}
              <Icon name="arrow-up-right" />
            </Link>
            <Link className="text-link" href="/ueber-uns">
              Enrico Gross und die Arbeitsweise <Icon name="arrow-up-right" />
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionHead
          label="Leistungen"
          title="Dein Vorhaben. Die passende Lösung."
          description="Websites, Shops und Software. Dazu Branding, Werbekampagnen, CMS-Plattformen und digitale Unternehmensberatung – abgestimmt auf dein Vorhaben."
        />
        <div className="service-rows">
          {serviceAreas.map((c) => (
            <Link
              className="service-row"
              key={c.slug}
              href={`/leistungen/${c.slug}`}
            >
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span aria-hidden="true">
                <Icon name="arrow-up-right" />
              </span>
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
              Websites entdecken{" "}
              <span>
                <Icon name="arrow-up-right" />
              </span>
            </Link>
          </article>
          <article>
            <h3>Shops und digitale Geschäftsmodelle.</h3>
            <p>
              Produkte verkaufen, Buchungen ermöglichen oder ein neues Geschäft
              aufbauen. Mit verständlichen Wegen für deine Kunden.
            </p>
            <Link className="text-link" href="/leistungen/e-commerce">
              E-Commerce entdecken{" "}
              <span>
                <Icon name="arrow-up-right" />
              </span>
            </Link>
          </article>
          <article>
            <h3>Software und eigene Plattformen.</h3>
            <p>
              Wenn Standardlösungen nicht mehr passen: eigene Anwendungen für
              dein Team, deine Kunden und deine Prozesse.
            </p>
            <Link className="text-link" href="/leistungen/software">
              Software entdecken{" "}
              <span>
                <Icon name="arrow-up-right" />
              </span>
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
            Alle Demonstrationsprojekte{" "}
            <span>
              <Icon name="arrow-up-right" />
            </span>
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
            Pakete und Konditionen ansehen{" "}
            <span>
              <Icon name="arrow-up-right" />
            </span>
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
      <section className="section content-split">
        <div>
          <span className="eyebrow">Vor der Anfrage</span>
          <h2>Webdesign: die wichtigsten Fragen.</h2>
          <Link className="text-link" href="/faq" style={{ marginTop: 24 }}>
            Alle Fragen zur Zusammenarbeit <Icon name="arrow-up-right" />
          </Link>
        </div>
        <Faq
          items={[
            {
              question: "Was kostet eine Website bei Webstudio Expert?",
              answer: `Eine einfache Landingpage startet ${priceLabel(packages[0].price)}, eine mehrseitige Unternehmenswebsite im Business-Paket ${priceLabel(packages[1].price)}. Das individuelle Angebot berücksichtigt Inhalte, Gestaltung und Funktionen. Hosting und Betreuung sind optional; es wird keine Umsatzsteuer berechnet.`,
            },
            {
              question: "Ist die Zusammenarbeit nur in Dortmund möglich?",
              answer:
                "Der Unternehmenssitz ist Dortmund. Die Abstimmung kann per Telefon und E-Mail erfolgen, sodass Projekte in Deutschland, Österreich und der Schweiz möglich sind. Du erreichst Enrico Gross direkt, ohne eine eigene Anreise vorauszusetzen.",
            },
            {
              question: "Kann ich Inhalte nach der Übergabe selbst ändern?",
              answer:
                "Wenn regelmäßige Änderungen geplant sind, vereinbaren wir ein passendes CMS und eine Einweisung. Bei einer Website ohne CMS erfolgen Änderungen am Code. Welche Zugänge und Nutzungsrechte übergeben werden, steht im Angebot.",
            },
          ]}
        />
      </section>
      <section className="section">
        <SectionHead
          label="Entscheidungshilfe"
          title="Dein Webprojekt vorbereiten."
        />
        <div className="article-grid">
          {articles.slice(0, 3).map((a) => (
            <article className="article-card" key={a.slug}>
              <h3>{a.title}</h3>
              <p>{a.intro}</p>
              <Link className="text-link" href={`/wissen/${a.slug}`}>
                Ratgeber lesen <Icon name="arrow-up-right" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <Cta />
    </>
  );
}
