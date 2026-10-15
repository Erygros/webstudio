import { categories, services } from "@/data/services";
import type { Row } from "@/crm/resources";

export function inquiryData(row: Row): Record<string, unknown> {
  return row.data && typeof row.data === "object" && !Array.isArray(row.data)
    ? (row.data as Record<string, unknown>)
    : {};
}
export function inquiryKind(data: Record<string, unknown>) {
  return (
    (
      {
        project: "Projektanfrage",
        contact: "Kontaktanfrage",
        callback: "Rückrufanfrage",
        appointment: "Terminanfrage",
      } as Record<string, string>
    )[String(data.mode)] || "Website-Anfrage"
  );
}
export function inquiryFields(data: Record<string, unknown>) {
  const labels: Record<string, string> = {
    name: "Name",
    company: "Unternehmen",
    email: "E-Mail",
    phone: "Telefon",
    description: "Nachricht",
    service: "Leistung",
    projectType: "Projektart",
    features: "Funktionen",
    budget: "Budget",
    start: "Gewünschter Beginn",
    timeline: "Zeitrahmen",
    package: "Paket",
    reference: "Demo als Ausgangspunkt",
    appointment: "Wunschtermin (Europe/Berlin, unbestätigt)",
    consent: "Datenschutzhinweis gelesen",
  };
  return Object.entries(labels).flatMap(([key, label]) => {
    let value = data[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    )
      return [];
    if (key === "service")
      value =
        services.find((s) => s.slug === value)?.name ||
        categories.find((c) => c.slug === value)?.name ||
        value;
    if (key === "consent") value = value === "yes" ? "Ja" : value;
    return [
      {
        key,
        label,
        value: Array.isArray(value) ? value.join(", ") : String(value),
      },
    ];
  });
}
