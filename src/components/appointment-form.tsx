"use client";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { inquirySchema } from "@/lib/inquiry-schema";

export function AppointmentForm({
  enabled,
  firstDate,
  lastDate,
}: {
  enabled: boolean;
  firstDate: string;
  lastDate: string;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function prepare() {
    try {
      const response = await fetch("/api/form-token", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.token)
        throw new Error("Formular derzeit nicht erreichbar");
      setToken(result.token || "");
    } catch {
      setError(
        "Das Formular ist momentan nicht erreichbar. Bitte lade die Seite neu oder kontaktiere uns direkt per E-Mail oder Telefon.",
      );
    }
  }
  useEffect(() => {
    if (enabled) void prepare();
  }, [enabled]);
  const times = Array.from(
    { length: 22 },
    (_, i) =>
      `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  );
  const mail = new URLSearchParams({
    subject: `Terminanfrage · ${site.name}`,
    body: `Wunschtermin: ${date || "noch offen"} ${time || ""} (Europe/Berlin)\nName: ${name}\nTelefon: ${phone}\nAnliegen: ${description}\n\nBitte bestätigen Sie den Termin persönlich.`,
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !enabled) return;
    const data = {
      mode: "appointment",
      appointment: date && time ? `${date}T${time}` : "",
      name,
      email,
      phone,
      description,
      consent: consent ? "yes" : "",
      token,
      website,
      service: "",
      company: "",
      projectType: "",
      features: [],
      budget: "",
      start: "",
      timeline: "",
      package: "",
      reference: "",
    };
    const checked = inquirySchema.safeParse(data);
    if (!checked.success) {
      setError(checked.error.issues.map((i) => i.message).join("\n"));
      return;
    }
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "string") body.set(key, value);
    });
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/anfrage", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Die Anfrage konnte nicht gesendet werden.");
        await prepare();
      } else {
        setSuccess(result.message);
        setName("");
        setEmail("");
        setPhone("");
        setDescription("");
      }
    } catch {
      setError(
        "Die Verbindung wurde unterbrochen. Ob deine Anfrage eingegangen ist, ist unklar. Bitte kontaktiere uns, bevor du sie erneut sendest.",
      );
      await prepare();
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <section className="form-panel success-panel">
        <h2>Terminwunsch eingegangen.</h2>
        <p role="status">{success}</p>
        <p>
          Bitte warte auf die persönliche Bestätigung von Enrico Gross. Der
          Termin ist noch nicht reserviert.
        </p>
        <Link href="/kontakt" className="button secondary">
          Zum Kontakt <Icon name="arrow-up-right" />
        </Link>
      </section>
    );
  return (
    <form className="form-panel" onSubmit={submit} noValidate>
      <span className="eyebrow">Gespräch / etwa 30 Minuten</span>
      <h2>Deinen Wunschtermin wählen.</h2>
      <p>
        Alle Uhrzeiten gelten für Deutschland (Europe/Berlin). Die Auswahl zeigt
        mögliche Wunschzeiten und keine geprüfte Verfügbarkeit.
      </p>
      {!enabled && (
        <div className="notice">
          Das Formular ist momentan nicht erreichbar. Du kannst deinen
          Terminwunsch über den Button unten per E-Mail anfragen.
        </div>
      )}
      <div className="field-grid">
        <label className="form-field">
          Wunschdatum *
          <input
            type="date"
            required
            value={date}
            min={firstDate}
            max={lastDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="form-field">
          Uhrzeit *
          <select
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">Uhrzeit auswählen</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {t} Uhr
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="field-grid">
        <label className="form-field">
          Name *
          <input
            required
            autoComplete="name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="form-field">
          E-Mail *
          <input
            required
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <label className="form-field">
        Telefon für das Gespräch (optional)
        <input
          type="tel"
          autoComplete="tel"
          maxLength={50}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label className="form-field">
        Worum geht es? *
        <textarea
          required
          minLength={10}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibe kurz dein Vorhaben …"
        />
      </label>
      <label className="consent">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Ich habe den{" "}
          <Link href="/datenschutz" target="_blank">
            Datenschutzhinweis
          </Link>{" "}
          gelesen. Der Termin wird erst nach persönlicher Bestätigung
          verbindlich.
        </span>
      </label>
      <div className="sr-only" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="form-controls">
        {enabled ? (
          <button className="button" disabled={!token || busy} type="submit">
            {busy ? (
              "Wird gesendet …"
            ) : (
              <>
                Termin anfragen <Icon name="arrow-up-right" />
              </>
            )}
          </button>
        ) : (
          <a
            className="button"
            href={`mailto:${site.email}?${mail.toString()}`}
          >
            Terminwunsch in E-Mail öffnen <Icon name="arrow-up-right" />
          </a>
        )}
      </div>
    </form>
  );
}
