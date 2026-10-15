import { Icon } from "@/components/icon";
import Image from "next/image";
import Link from "next/link";
import { projects } from "@/data/projects";
export function ProjectCard({
  project,
}: {
  project: (typeof projects)[number];
}) {
  return (
    <article className="project-card">
      <Link href={`/projekte/${project.slug}`} className="project-visual">
        <Image
          src={project.image}
          alt={`Gestaltete Demoansicht: ${project.name}`}
          width={project.imageWidth}
          height={project.imageHeight}
          sizes="(max-width: 760px) 100vw, 50vw"
        />
        <span className="project-open" aria-label="Projektdetails öffnen">
          <Icon name="arrow-up-right" />
        </span>
      </Link>
      <div className="project-caption">
        <div>
          <span className="eyebrow">
            {project.category} · Demonstrationsprojekt
          </span>
          <h3>
            <Link href={`/projekte/${project.slug}`}>{project.name}</Link>
          </h3>
        </div>
        <p>{project.description}</p>
      </div>
    </article>
  );
}
