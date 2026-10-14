import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import {
  Breadcrumbs,
  PageIntro,
  Button,
  Cta,
  SectionHead,
  JsonLd,
} from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
import { canonicalUrl, organizationId, seo } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((p) => p.slug === slug);
  if (!p) notFound();
  return seo(
    `${p.name} – Demonstrationsprojekt`,
    p.description,
    `/projekte/${slug}`,
    {
      image: {
        path: p.image,
        width: p.imageWidth,
        height: p.imageHeight,
        alt: `Demonstrationskonzept ${p.name}`,
      },
    },
  );
}
export default async function Project({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Projekte", href: "/projekte" },
          { name: p.name, href: `/projekte/${slug}` },
        ]}
      />
      <PageIntro
        label={`${p.category} / Demonstrationsprojekt`}
        title={p.name}
        description={p.description}
      >
        <Button href={`/projektanfrage?referenz=${p.slug}`}>
          Ähnliches Projekt anfragen
        </Button>
      </PageIntro>
      <section className="section">
        <div className="notice">
          Eigenständige Entwurfsstudie. Keine Kundenreferenz. Technologien
          beschreiben den vorgesehenen Umsetzungsvorschlag; es werden keine
          realen Geschäftsergebnisse behauptet.
        </div>
        <Image
          className="project-detail-image"
          src={p.image}
          width={p.imageWidth}
          height={p.imageHeight}
          sizes="100vw"
          alt={`Entwurfsansicht für ${p.name}`}
          preload
        />
      </section>
      <section className="section content-split">
        <h2>Vom Bedarf zur Oberfläche.</h2>
        <div className="prose">
          <h3>Die Aufgabe</h3>
          <p>{p.challenge}</p>
          <h3>Der Ansatz</h3>
          <p>{p.solution}</p>
          <h3>Geplante Funktionen</h3>
          <ul>
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <h3>Technologievorschlag</h3>
          <p>{p.technologies.join(" / ")}</p>
        </div>
      </section>
      <section className="section">
        <SectionHead title="Weitere Perspektiven." />
        <div className="project-grid">
          {projects
            .filter((x) => x.slug !== slug)
            .slice(0, 2)
            .map((x) => (
              <ProjectCard project={x} key={x.slug} />
            ))}
        </div>
        <Link className="text-link" href="/projekte" style={{ marginTop: 30 }}>
          Zur Projektübersicht ↗
        </Link>
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          "@id": `${canonicalUrl(`/projekte/${slug}`)}#konzept`,
          name: p.name,
          description: `${p.description} Eigenständiges Demonstrationskonzept, keine Kundenreferenz.`,
          genre: "Demonstrationskonzept",
          url: canonicalUrl(`/projekte/${slug}`),
          image: canonicalUrl(p.image),
          creator: { "@id": organizationId },
          inLanguage: "de-DE",
        }}
      />
      <Cta />
    </>
  );
}
