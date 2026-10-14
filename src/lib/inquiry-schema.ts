import { z } from "zod";
import { categories, services } from "@/data/services";
export const budgetOptions = [
  "249–799 €",
  "800–1.499 €",
  "1.500–4.999 €",
  "5.000–14.999 €",
  "Ab 15.000 €",
  "Noch offen",
];
export const featureOptions = [
  "CMS / Inhalte pflegen",
  "Buchung / Termine",
  "Shop / Zahlungen",
  "Login / geschützter Bereich",
  "Schnittstellen",
  "Mehrsprachigkeit",
  "Noch zu klären",
];
export const timelineOptions = [
  "Innerhalb von 4 Wochen",
  "In 1–3 Monaten",
  "In 3–6 Monaten",
  "Flexibel / noch offen",
];
export const projectTypes = [
  "Neues Projekt",
  "Bestehendes Projekt erweitern",
  "Relaunch / Migration",
  "Beratung / Analyse",
];
const clean = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Bitte mindestens ${min} Zeichen eingeben.`)
    .max(max, `Bitte auf ${max} Zeichen begrenzen.`)
    .refine(
      (v) => !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v),
      "Unzulässige Zeichen.",
    );
export const inquirySchema = z
  .object({
    mode: z.enum(["project", "contact", "callback", "appointment"]),
    service: z
      .string()
      .max(100)
      .refine(
        (v) =>
          !v ||
          categories.some((c) => c.slug === v) ||
          services.some((s) => s.slug === v),
        "Bitte eine vorhandene Leistung wählen.",
      ),
    projectType: z.string().max(100),
    features: z
      .array(
        z
          .string()
          .refine((v) => featureOptions.includes(v), "Unbekannte Funktion."),
      )
      .max(7),
    budget: z.string().max(100),
    start: z.string().max(10),
    timeline: z.string().max(100),
    description: clean(10, 5000),
    name: clean(2, 100),
    email: z
      .email("Bitte eine gültige E-Mail-Adresse angeben.")
      .max(254)
      .refine((v) => !/[\r\n]/.test(v), "Ungültige Adresse."),
    company: clean(0, 150),
    phone: clean(0, 50).refine(
      (v) => !v || /^[+()\d\s./-]{5,50}$/.test(v),
      "Bitte eine gültige Telefonnummer angeben.",
    ),
    consent: z.literal("yes", {
      error: "Bitte den Datenschutzhinweis bestätigen.",
    }),
    package: clean(0, 100),
    reference: clean(0, 100),
    website: z.string().max(200),
    token: z.string().min(1).max(300),
    appointment: z.string().max(16).default(""),
  })
  .superRefine((data, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (data.mode === "project") {
      if (!data.service) add("service", "Bitte eine Leistung wählen.");
      if (!projectTypes.includes(data.projectType))
        add("projectType", "Bitte eine Projektart wählen.");
      if (!budgetOptions.includes(data.budget))
        add("budget", "Bitte einen Budgetrahmen wählen.");
      if (!timelineOptions.includes(data.timeline))
        add("timeline", "Bitte einen Zeitrahmen wählen.");
    }
    if (
      data.start &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(data.start) ||
        Number.isNaN(Date.parse(data.start)) ||
        new Date(data.start).toISOString().slice(0, 10) !== data.start ||
        data.start < new Date().toISOString().slice(0, 10))
    )
      add("start", "Bitte ein gültiges zukünftiges Startdatum wählen.");
    if (data.mode === "callback" && !data.phone)
      add("phone", "Bitte eine Telefonnummer für den Rückruf angeben.");
    if (data.mode === "appointment") {
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(data.appointment))
        add("appointment", "Bitte Datum und Uhrzeit wählen.");
      else {
        const [day, time] = data.appointment.split("T");
        const date = new Date(`${day}T12:00:00Z`);
        const today = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Europe/Berlin",
        }).format(new Date());
        const horizon = new Date();
        horizon.setDate(horizon.getDate() + 90);
        const last = new Intl.DateTimeFormat("sv-SE", {
          timeZone: "Europe/Berlin",
        }).format(horizon);
        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== day ||
          day <= today ||
          day > last ||
          !/^(0[8-9]|1[0-8]):(00|30)$/.test(time)
        )
          add(
            "appointment",
            "Bitte einen gültigen Wunschtermin ab morgen innerhalb der nächsten 90 Tage zwischen 08:00 und 18:30 Uhr wählen.",
          );
      }
    }
  });
