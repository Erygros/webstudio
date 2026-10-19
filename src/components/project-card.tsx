import { Icon } from "@/components/icon";
import Image from "next/image";
import Link from "next/link";
import type { PortfolioProject } from "@/data/projects";
export function ProjectCard({ project }: { project: PortfolioProject }) {
  const external = "externalUrl" in project;
  const href = external ? project.externalUrl : `/projekte/${project.slug}`;
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer", prefetch: false as const }
    : {};
  return (
    <article className="project-card">
      <Link
        href={href}
        {...linkProps}
        className="project-visual"
        aria-label={
          external
            ? `${project.name} – Website in neuem Tab öffnen`
            : `${project.name} – Projektdetails öffnen`
        }
      >
        <Image
          src={project.image}
          alt={
            external
              ? `Vorschau der Website ${project.name}`
              : `Gestaltete Demoansicht: ${project.name}`
          }
          width={project.imageWidth}
          height={project.imageHeight}
          sizes="(max-width: 760px) 100vw, 50vw"
        />
        <span className="project-open" aria-hidden="true">
          <Icon name="arrow-up-right" />
        </span>
      </Link>
      <div className="project-caption">
        <div>
          <span className="eyebrow">
            {project.category} ·{" "}
            {external ? "Referenz" : "Demonstrationsprojekt"}
          </span>
          <h3>
            <Link href={href} {...linkProps}>
              {project.name}
              {external && (
                <span className="sr-only"> – Website in neuem Tab öffnen</span>
              )}
            </Link>
          </h3>
        </div>
        <p>{project.description}</p>
      </div>
    </article>
  );
}
