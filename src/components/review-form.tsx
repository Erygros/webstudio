"use client";
import { Turnstile, useTurnstile } from "@/components/turnstile";
import Link from "next/link";
import { useEffect, useState } from "react";
import { reviewPlatforms } from "@/lib/reviews";
import { site } from "@/config/site";

export function ReviewForm() {
  const captcha = useTurnstile();
  const [token, setToken] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [platform, setPlatform] = useState<string>("Google");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function prepare() {
    const [availabilityResponse, tokenResponse] = await Promise.all([
      fetch("/api/bewertungen", { cache: "no-store" }),
      fetch("/api/form-token", { cache: "no-store" }),
    ]);
    const [availability, form] = await Promise.all([
      availabilityResponse.json(),
      tokenResponse.json(),
    ]);
    setAvailable(Boolean(availability.available && tokenResponse.ok));
    setToken(form.token || "");
  }
  useEffect(() => {
    void prepare().catch(() => setAvailable(false));
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !captcha.ready) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("turnstileToken", captcha.token);
    form.set("token", token);
    try {
      const response = await fetch("/api/bewertungen", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403) void prepare().catch(() => {});
        throw new Error(
          result.message || "Anfrage konnte nicht gespeichert werden.",
        );
      }
      setSuccess(result.message);
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Die Verbindung wurde unterbrochen. Der Eingang konnte nicht bestätigt werden. Bitte kontaktiere uns direkt, bevor du eine neue Anfrage stellst."
          : (e as Error).message,
      );
    } finally {
      captcha.reset();
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="form-panel success-panel" role="status">
        <h2>Deine Anfrage ist angekommen.</h2>
        <p>{success}</p>
        <p>
          Bitte prüfe auch deinen Spam-Ordner. Überweise erst nach der
          gesonderten Beauftragung. Bei Rückfragen erreichst du uns unter{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      </div>
    );
  return (
    <form
      className="form-panel review-form"
      onSubmit={submit}
      id="bewertungsanfrage"
    >
      <h2>Kostenlose Erstberatung anfragen</h2>
      <p>
        Eine Bewertung pro Anfrage. Nur Kontaktdaten und der Link zur Bewertung
        sind nötig; bitte keine Plattform-Zugangsdaten senden.
      </p>
      {available === false && (
        <p role="status">
          Online-Anfragen sind momentan nicht verfügbar. Du erreichst uns unter{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> oder telefonisch.
        </p>
      )}
      <fieldset disabled={busy || !available}>
        <div className="field-grid">
          <label className="form-field">
            Bewertungsplattform *
            <select
              name="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {reviewPlatforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          {platform === "Andere Plattform" ? (
            <label className="form-field">
              Name der Plattform *
              <input name="platformOther" maxLength={100} required />
            </label>
          ) : (
            <input type="hidden" name="platformOther" value="" />
          )}
        </div>
        <label className="form-field">
          Link zur einzelnen Bewertung *
          <input
            name="reviewUrl"
            type="url"
            required
            maxLength={2048}
            placeholder="https://…"
          />
          <span className="review-help">
            Falls kein direkter Bewertungslink verfügbar ist: Profil-Link
            eintragen und die konkrete Bewertung unten beschreiben.
          </span>
        </label>
        <div className="field-grid">
          <label className="form-field">
            Dein Name *
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </label>
          <label className="form-field">
            E-Mail-Adresse *
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
        </div>
        <div className="field-grid">
          <label className="form-field">
            Telefon (optional)
            <input name="phone" type="tel" maxLength={50} autoComplete="tel" />
          </label>
          <label className="form-field">
            Unternehmen (optional)
            <input name="company" maxLength={150} autoComplete="organization" />
          </label>
        </div>
        <label className="form-field">
          Hinweise zur Bewertung (optional)
          <textarea
            name="description"
            rows={4}
            maxLength={2000}
            placeholder="Zum Beispiel: Datum der Bewertung oder warum du sie für unzutreffend hältst."
          />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="consent">
          <input name="privacy" value="yes" type="checkbox" required />
          <span>
            Ich habe den <Link href="/datenschutz">Datenschutzhinweis</Link>{" "}
            gelesen. Meine Angaben dürfen zur gewünschten Prüfung und
            Kontaktaufnahme verarbeitet und soweit erforderlich an die benannte
            Kanzlei übermittelt werden. Dies ist keine Werbeeinwilligung.
          </span>
        </label>
        <p className="review-help">
          Das Absenden ist kostenlos und unverbindlich. Eine kostenpflichtige
          Beauftragung erfolgt separat. Erstberatung kostenlos; 59,00 € Endpreis
          je erfolgreich entfernter Bewertung. Nach Beauftragung 59,00 €
          Vorauszahlung, bei Misserfolg vollständige Erstattung.
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <Turnstile
          action="review_inquiry"
          onToken={captcha.setToken}
          generation={captcha.generation}
        />
        <button
          className="button"
          type="submit"
          disabled={busy || !token || !captcha.ready}
        >
          {busy
            ? "Anfrage wird gespeichert …"
            : available === null
              ? "Formular wird geladen …"
              : "Kostenlose Prüfung anfragen"}
        </button>
      </fieldset>
    </form>
  );
}
