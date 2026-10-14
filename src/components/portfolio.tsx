"use client";
import { useState } from "react";
import { projects, projectCategories } from "@/data/projects";
import { ProjectCard } from "./project-card";
export function Portfolio() {
  const [filter, setFilter] = useState("Alle");
  const selected = projects.filter(
    (p) => filter === "Alle" || p.category === filter,
  );
  return (
    <>
      <div className="filters" aria-label="Projekte filtern">
        {projectCategories.map((c) => (
          <button
            key={c}
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        {selected.length} Projekte angezeigt
      </p>
      <div className="project-grid">
        {selected.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </>
  );
}
