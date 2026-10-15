"use client";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categories, services } from "@/data/services";
import {
  budgetOptions,
  featureOptions,
  timelineOptions,
  projectTypes,
  inquirySchema,
} from "@/lib/inquiry-schema";
import { site } from "@/config/site";
type Props = {
  enabled: boolean;
  initialService?: string;
  initialPackage?: string;
  initialReference?: string;
  mode?: "project" | "contact" | "callback";
};
const stepNames = [
  "Leistung",
  "Projekt & Funktionen",
  "Budget",
  "Zeitplanung",
  "Beschreibung",
  "Kontakt & Versand",
];
export function InquiryForm({
  enabled,
  initialService = "",
  initialPackage = "",
  initialReference = "",
  mode = "project",
}: Props) {
  const project = mode === "project";
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState("");
  const [data, setData] = useState({
    mode,
    service: initialService,
    projectType: "",
    budget: "",
    start: "",
    timeline: "",
    description: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    consent: "",
    package: initialPackage,
    reference: initialReference,
    website: "",
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const update = (field: keyof typeof data, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));
  const refreshToken = async () => {
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
  };
  useEffect(() => {
    if (enabled) void refreshToken();
  }, [enabled]);
  const changeStep = (value: number) => {
    setStep(value);
    setError("");
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  };
  const next = () => {
    if (step === 0 && !data.service)
      return setError("Bitte eine Leistung auswählen.");
    if (step === 1 && !data.projectType)
      return setError("Bitte eine Projektart auswählen.");
    if (step === 2 && !data.budget)
      return setError("Bitte einen Budgetrahmen auswählen.");
    if (
      step === 3 &&
      (!data.timeline ||
        (data.start && data.start < new Date().toISOString().slice(0, 10)))
    )
      return setError(
        "Bitte einen Zeitrahmen und, falls angegeben, ein zukünftiges Startdatum wählen.",
      );
    if (step === 4 && data.description.trim().length < 10)
      return setError(
        "Bitte beschreibe dein Vorhaben mit mindestens 10 Zeichen.",
      );
    changeStep(step + 1);
  };
  const chooseFiles = (list: FileList | null) => {
    const selected = Array.from(list || []);
    if (
      selected.length > 3 ||
      selected.some((f) => f.size > 2_000_000) ||
      selected.reduce((sum, f) => sum + f.size, 0) > 3_000_000 ||
      selected.some((f) => !/\.(pdf|png|jpe?g|txt)$/i.test(f.name))
    ) {
      setError(
        "Maximal 3 Dateien: PDF, PNG, JPG oder TXT. Pro Datei bis 2 MB, insgesamt bis 3 MB.",
      );
      if (fileInput.current) fileInput.current.value = "";
      setFiles([]);
      return;
    }
    setError("");
    setFiles(selected);
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !enabled) return;
    if (project && step < 5) {
      next();
      return;
    }
    const parsed = inquirySchema.safeParse({ ...data, token, features });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("\n"));
      return;
    }
    setBusy(true);
    setError("");
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => body.set(key, value));
    body.set("token", token);
    features.forEach((f) => body.append("features", f));
    files.forEach((f) => body.append("files", f));
    try {
      const response = await fetch("/api/anfrage", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || "Die Anfrage konnte nicht gesendet werden.");
        await refreshToken();
      } else {
        setSuccess(result.message);
        setFiles([]);
        setData((prev) => ({
          ...prev,
          description: "",
          name: "",
          email: "",
          phone: "",
          company: "",
        }));
        requestAnimationFrame(() => heading.current?.focus());
      }
    } catch {
      setError(
        "Die Verbindung wurde unterbrochen. Ob deine Anfrage eingegangen ist, ist unklar. Bitte kontaktiere uns, bevor du sie erneut sendest.",
      );
      await refreshToken();
    } finally {
      setBusy(false);
    }
  }
  const choices = (values: string[], field: keyof typeof data) => (
    <div className="choice-grid">
      {values.map((value) => (
        <label className="choice" key={value}>
          <input
            type="radio"
            name={field}
            checked={data[field] === value}
            onChange={() => update(field, value)}
          />
          {value}
        </label>
      ))}
    </div>
  );
  if (success)
    return (
      <div className="form-panel success-panel">
        <span className="eyebrow">Anfrage eingegangen</span>
        <h2 ref={heading} tabIndex={-1}>
          Danke für deine Anfrage.
        </h2>
        <p role="status">{success}</p>
        <Link href="/" className="button secondary">
          Zur Startseite <Icon name="arrow-up-right" />
        </Link>
      </div>
    );
  return (
    <div className={project ? "inquiry-layout" : ""}>
      {project && (
        <aside className="inquiry-aside">
          <span className="eyebrow">Projektanfrage</span>
          <h2>Ein guter Anfang.</h2>
          <p>
            Sechs kurze Schritte helfen uns, dein Vorhaben einzuordnen. Die
            Anfrage ist unverbindlich.
          </p>
          <ol className="steps">
            {stepNames.map((name, i) => (
              <li key={name} aria-current={i === step ? "step" : undefined}>
                <span>
                  {i < step ? <Icon name="check" size={14} /> : i + 1}
                </span>
                {name}
              </li>
            ))}
          </ol>
          {data.package && (
            <p>
              Gewähltes Paket: <strong>{data.package}</strong>
            </p>
          )}
          {data.reference && <p>Demo als Ausgangspunkt: {data.reference}</p>}
        </aside>
      )}
      <form
        className="form-panel"
        onSubmit={submit}
        noValidate
        aria-describedby={error ? "form-error" : undefined}
      >
        {!enabled && (
          <div className="notice" role="status">
            Das Formular ist momentan nicht erreichbar.{" "}
            <Link href={`mailto:${site.email}`}>
              Bitte sende deine Anfrage direkt per E-Mail.
            </Link>
          </div>
        )}
        <span className="eyebrow">
          {project
            ? `Schritt ${step + 1} von 6`
            : mode === "callback"
              ? "Rückrufanfrage"
              : "Direkte Nachricht"}
        </span>
        <h2 ref={heading} tabIndex={-1}>
          {project
            ? [
                "Worum geht es?",
                "Was soll entstehen?",
                "Welcher Rahmen passt?",
                "Wann möchtest du starten?",
                "Erzähl uns von deinem Vorhaben.",
                "Wie erreichen wir dich?",
              ][step]
            : mode === "callback"
              ? "Ein Gespräch vereinbaren."
              : "Was können wir für dich tun?"}
        </h2>
        {project && step === 0 && (
          <>
            <p>Wähle einen Bereich. Die genaue Lösung klären wir gemeinsam.</p>
            <div className="choice-grid">
              {categories.map((c) => (
                <label className="choice" key={c.slug}>
                  <input
                    type="radio"
                    name="category"
                    checked={
                      data.service === c.slug ||
                      services.some(
                        (s) => s.slug === data.service && s.category === c.slug,
                      )
                    }
                    onChange={() => update("service", c.slug)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <label className="form-field">
              Konkrete Leistung (optional)
              <select
                value={
                  services.some((s) => s.slug === data.service)
                    ? data.service
                    : ""
                }
                onChange={(e) => update("service", e.target.value)}
              >
                <option value="" disabled>
                  Leistung gezielt auswählen
                </option>
                {categories.map((c) => (
                  <optgroup label={c.name} key={c.slug}>
                    {c.services.map((s) => (
                      <option value={s.slug} key={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </>
        )}
        {project && step === 1 && (
          <>
            <p>Du musst noch keine technischen Details festlegen.</p>
            {choices(projectTypes, "projectType")}
            <fieldset style={{ border: 0, padding: 0 }}>
              <legend style={{ fontSize: 13 }}>
                Benötigte Funktionen (optional)
              </legend>
              <div className="choice-grid">
                {featureOptions.map((f) => (
                  <label className="choice" key={f}>
                    <input
                      type="checkbox"
                      checked={features.includes(f)}
                      onChange={(e) =>
                        setFeatures((prev) =>
                          e.target.checked
                            ? [...prev, f]
                            : prev.filter((x) => x !== f),
                        )
                      }
                    />
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {project && step === 2 && (
          <>
            <p>
              Ein Orientierungsrahmen. Das konkrete Angebot richtet sich nach
              dem Umfang.
            </p>
            {choices(budgetOptions, "budget")}
          </>
        )}
        {project && step === 3 && (
          <>
            <label className="form-field">
              Gewünschter Beginn (optional)
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={data.start}
                onChange={(e) => update("start", e.target.value)}
              />
            </label>
            <p>
              Welchen Zeitrahmen planst du? Termine werden erst nach Abstimmung
              verbindlich.
            </p>
            {choices(timelineOptions, "timeline")}
          </>
        )}
        {((project && step === 4) || !project) && (
          <>
            <label className="form-field">
              {mode === "callback"
                ? "Anliegen und bevorzugtes Zeitfenster"
                : "Beschreibung"}{" "}
              *
              <textarea
                required
                minLength={10}
                maxLength={5000}
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Ziel, vorhandene Inhalte und die wichtigsten Anforderungen …"
              />
            </label>
            {project && (
              <>
                <label className="form-field">
                  Dateien hinzufügen (optional)
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    onChange={(e) => chooseFiles(e.target.files)}
                  />
                </label>
                <p style={{ fontSize: 11 }}>
                  Bis zu 3 Dateien, je 2 MB und zusammen 3 MB. PDF, PNG, JPG
                  oder UTF-8-TXT. Bitte keine Passwörter oder besonders
                  sensiblen Daten senden.
                </p>
                {files.length > 0 && (
                  <div style={{ marginTop: 15 }}>
                    <p style={{ fontSize: 12 }}>
                      {files.map((f) => f.name).join(", ")}
                    </p>
                    <button
                      type="button"
                      className="plain-button"
                      onClick={() => {
                        setFiles([]);
                        if (fileInput.current) fileInput.current.value = "";
                      }}
                    >
                      Dateien entfernen
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {((project && step === 5) || !project) && (
          <>
            {project && (
              <div className="summary-list">
                <dl>
                  <dt>Leistung</dt>
                  <dd>
                    {services.find((s) => s.slug === data.service)?.name ||
                      categories.find((c) => c.slug === data.service)?.name}
                  </dd>
                  <dt>Projekt</dt>
                  <dd>{data.projectType}</dd>
                  <dt>Budget</dt>
                  <dd>{data.budget}</dd>
                  <dt>Zeitraum</dt>
                  <dd>{data.timeline}</dd>
                  <dt>Funktionen</dt>
                  <dd>{features.join(", ") || "Noch offen"}</dd>
                  <dt>Dateien</dt>
                  <dd>
                    {files.length ? `${files.length} Anhang/Anhänge` : "Keine"}
                  </dd>
                </dl>
              </div>
            )}
            <div className="field-grid">
              <label className="form-field">
                Name *
                <input
                  required
                  autoComplete="name"
                  value={data.name}
                  maxLength={100}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <label className="form-field">
                E-Mail *
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={data.email}
                  maxLength={254}
                  onChange={(e) => update("email", e.target.value)}
                />
              </label>
            </div>
            <div className="field-grid">
              <label className="form-field">
                Unternehmen (optional)
                <input
                  autoComplete="organization"
                  value={data.company}
                  maxLength={150}
                  onChange={(e) => update("company", e.target.value)}
                />
              </label>
              <label className="form-field">
                Telefon {mode === "callback" ? "*" : "(optional)"}
                <input
                  type="tel"
                  required={mode === "callback"}
                  autoComplete="tel"
                  value={data.phone}
                  maxLength={50}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </label>
            </div>
            <label className="consent">
              <input
                type="checkbox"
                required
                checked={data.consent === "yes"}
                onChange={(e) =>
                  update("consent", e.target.checked ? "yes" : "")
                }
              />
              <span>
                Ich habe den{" "}
                <Link href="/datenschutz" target="_blank">
                  Datenschutzhinweis
                </Link>{" "}
                gelesen. Meine Angaben werden zur Bearbeitung der Anfrage
                verwendet. *
              </span>
            </label>
          </>
        )}
        <div className="sr-only" aria-hidden="true">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              name="website"
              value={data.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </label>
        </div>
        {error && (
          <div className="error-message" id="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-controls">
          {project && step > 0 ? (
            <button
              type="button"
              className="plain-button"
              disabled={busy}
              onClick={() => changeStep(step - 1)}
            >
              <Icon name="arrow-left" /> Zurück
            </button>
          ) : (
            <span />
          )}
          {project && step < 5 ? (
            <button className="button" type="button" onClick={next}>
              Weiter{" "}
              <span aria-hidden="true">
                <Icon name="arrow-right" />
              </span>
            </button>
          ) : (
            <button
              className="button"
              type="submit"
              disabled={!enabled || busy || !token}
            >
              {busy ? (
                "Wird gesendet …"
              ) : enabled ? (
                <>
                  Anfrage absenden <Icon name="arrow-up-right" />
                </>
              ) : (
                "Derzeit nicht verfügbar"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
