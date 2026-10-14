"use client";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
export function ProjectSummary({ id }: { id: string }) {
  const [data, setData] = useState<{
    minutes: number;
    cost: string;
    budget: string;
    remaining: string;
  } | null>(null);
  useEffect(() => {
    const load = () =>
      void crmFetch<NonNullable<typeof data>>(`project-summary?id=${id}`).then(
        setData,
      );
    load();
    window.addEventListener("crm-change", load);
    return () => window.removeEventListener("crm-change", load);
  }, [id]);
  if (!data) return null;
  return (
    <div className="crm-metrics">
      {[
        ["Erfasste Zeit", `${data.minutes} Minuten`],
        ["Erfasste Zeitkosten", `${data.cost} €`],
        ["Projektbudget", `${data.budget} €`],
        ["Budget abzüglich Zeitkosten", `${data.remaining} €`],
      ].map(([label, value]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}
