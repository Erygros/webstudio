"use client";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
import {
  reviewPayments,
  reviewResults,
  reviewStatuses,
  validReviewUrl,
  type ReviewRequest,
} from "@/lib/reviews";
type Job = {
  id: string;
  request_id: string;
  kind: string;
  status: string;
  due_at: string;
  sent_at: string | null;
  error: string;
  subject: string | null;
  body: string | null;
};
const mailLabels: Record<string, string> = {
  pending: "Eingeplant",
  sending: "Versand läuft",
  sent: "Vom Mailserver angenommen",
  unknown: "Unklar – Postfach prüfen",
  failed: "Fehlgeschlagen",
  cancelled: "Nicht mehr vorgesehen",
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("de-DE") : "—";
function ReviewEditor({
  row,
  onSaved,
}: {
  row: ReviewRequest;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    id: row.id,
    status: row.status,
    payment_status: row.payment_status,
    result: row.result,
    internal_notes: row.internal_notes,
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      form.payment_status !== row.payment_status &&
      ["Eingegangen", "Erstattet"].includes(form.payment_status) &&
      !confirm(
        "Hast du diese Überweisung tatsächlich im Bankkonto geprüft? Die Website führt keine Banktransaktionen aus.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await crmFetch("reviews", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="review-crm-editor">
      <div className="field-grid">
        <label className="form-field">
          Vorgangsstatus
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as ReviewRequest["status"],
              })
            }
          >
            {reviewStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Zahlungsstatus · persönlich geprüft
          <select
            value={form.payment_status}
            onChange={(e) =>
              setForm({
                ...form,
                payment_status: e.target
                  .value as ReviewRequest["payment_status"],
              })
            }
          >
            {reviewPayments.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Ergebnis der rechtlichen Bearbeitung
          <select
            value={form.result}
            onChange={(e) =>
              setForm({
                ...form,
                result: e.target.value as ReviewRequest["result"],
              })
            }
          >
            {reviewResults.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="form-field">
        Interne Notizen
        <textarea
          value={form.internal_notes}
          maxLength={4000}
          rows={3}
          onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
        />
      </label>
      <p>
        Bei dokumentierter Vorauszahlung und erfolgloser Entfernung setzt das
        System den Zahlungsstatus auf „Erstattung erforderlich“. Eine
        Rücküberweisung erfolgt durch dich bei deiner Bank.
      </p>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Wird gespeichert …" : "Änderungen speichern"}
      </button>
    </form>
  );
}
export function ReviewsInbox({ initialId }: { initialId?: string }) {
  const [rows, setRows] = useState<ReviewRequest[]>([]),
    [jobs, setJobs] = useState<Job[]>([]),
    [count, setCount] = useState(0),
    [offset, setOffset] = useState(0),
    [q, setQ] = useState(""),
    [status, setStatus] = useState("");
  const [focusedId, setFocusedId] = useState(initialId || "");
  const [expanded, setExpanded] = useState(initialId || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [automation, setAutomation] = useState<{
    ready: boolean;
    schedulerEnabled: boolean;
    heartbeatFresh: boolean;
    workerFresh: boolean;
    smtpConfigured: boolean;
    lastTick: string | null;
    workerLastSeen: string | null;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const refresh = () => setRevision((v) => v + 1);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const result = await crmFetch<{
          rows: ReviewRequest[];
          jobs: Job[];
          count: number;
        }>(
          `reviews?${new URLSearchParams({ q, status, offset: String(offset), ...(focusedId ? { id: focusedId } : {}) })}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setRows(result.rows);
          setJobs(result.jobs);
          setCount(result.count);
          setError("");
        }
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, status, offset, revision, focusedId]);
  useEffect(() => {
    setFocusedId(initialId || "");
    setExpanded(initialId || "");
    setOffset(0);
  }, [initialId]);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  async function check() {
    setChecking(true);
    setError("");
    try {
      setAutomation(await crmFetch("reviews?automation=true"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }
  async function retry(id: string) {
    if (
      !confirm(
        "Bitte zuerst das gesendete Postfach und gegebenenfalls SMTP-Protokoll prüfen. Bist du sicher, dass diese Nachricht NICHT versandt wurde? Erneutes Senden kann sonst eine doppelte E-Mail auslösen.",
      )
    )
      return;
    try {
      await crmFetch("reviews", {
        method: "POST",
        body: JSON.stringify({ id, mailboxChecked: true }),
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Automatik und E-Mail</h2>
          <button
            className="button secondary"
            disabled={checking}
            onClick={() => void check()}
          >
            {checking ? "Wird gelesen …" : "Einrichtung prüfen"}
          </button>
        </div>
        <p>
          Kurze Eingangsbestätigung direkt nach der Anfrage, Konditionen nach
          etwa sieben Minuten; Vertragsbestätigung nach Beauftragung. Der
          Zeitgeber läuft in der vorhandenen Supabase-Datenbank, unabhängig von
          geöffneten Browsern.
        </p>
        {automation && (
          <div role="status">
            <strong>
              {automation.ready
                ? "Formular und Versandzeitgeber sind betriebsbereit."
                : "Einrichtung oder Erreichbarkeit noch prüfen."}
            </strong>
            <p>
              SMTP: {automation.smtpConfigured ? "konfiguriert" : "fehlt"} ·
              Zeitgeber:{" "}
              {automation.schedulerEnabled && automation.heartbeatFresh
                ? "aktiv"
                : "nicht bestätigt"}{" "}
              · Versandprozess:{" "}
              {automation.workerFresh ? "erreichbar" : "nicht bestätigt"}
              <br />
              Letzter Zeitgeberlauf: {date(automation.lastTick)} · Letzter
              Versandprozess-Aufruf: {date(automation.workerLastSeen)}
            </p>
            <p>
              Diese Anzeige liest Einstellungen und Laufzeiten. Sie verschickt
              keine Test-E-Mail und belegt keine Zustellung im
              Empfängerpostfach.
            </p>
          </div>
        )}
      </section>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <div>
            <span className="crm-caption">{count} Anfragen</span>
            <h2>Bewertungen</h2>
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={refresh}
          >
            Aktualisieren
          </button>
        </div>
        {focusedId && (
          <p>
            Einzelner Vorgang aus der Benachrichtigungs-E-Mail.{" "}
            <a className="crm-small-link" href="/crm/bewertungen">
              Alle Anfragen anzeigen
            </a>
          </p>
        )}
        <div className="crm-filterbar">
          <input
            aria-label="Nach Kontaktname suchen"
            placeholder="Kontaktname suchen …"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
          />
          <select
            aria-label="Vorgangsstatus filtern"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Alle Status</option>
            {reviewStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {busy && <p role="status">Anfragen werden geladen …</p>}
        <div className="review-crm-list">
          {rows.map((row) => {
            const mails = jobs.filter((j) => j.request_id === row.id);
            return (
              <article className="review-crm-card" key={row.id}>
                <div className="crm-panel-head">
                  <div>
                    <span className="crm-caption">
                      {row.reference} · {date(row.created_at)}
                    </span>
                    <h3>
                      {row.name} · {row.platform}
                    </h3>
                    <p>
                      {row.company ||
                        "Privatanfrage / kein Unternehmen angegeben"}
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    aria-expanded={expanded === row.id}
                    onClick={() =>
                      setExpanded(expanded === row.id ? "" : row.id)
                    }
                  >
                    {expanded === row.id ? "Schließen" : "Vorgang öffnen"}
                  </button>
                </div>
                <p>
                  <strong>{row.status}</strong> · {row.result} · Vorauszahlung:{" "}
                  {row.payment_status}
                  <br />
                  Beauftragung:{" "}
                  {row.commissioned_at
                    ? date(row.commissioned_at)
                    : "Noch nicht beauftragt"}
                </p>
                <p>
                  {mails
                    .map(
                      (j) =>
                        `${j.kind === "acknowledgment" ? "Erste E-Mail" : "Vertragsbestätigung"}: ${mailLabels[j.status] || j.status}`,
                    )
                    .join(" · ")}
                </p>
                {expanded === row.id && (
                  <div className="review-crm-details">
                    <p>
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                      {row.phone && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={`tel:${row.phone.replace(/[^+\d]/g, "")}`}>
                            {row.phone}
                          </a>
                        </>
                      )}
                      <br />
                      {validReviewUrl(row.review_url) ? (
                        <a
                          href={row.review_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Bewertung auf der Plattform öffnen
                        </a>
                      ) : (
                        row.review_url
                      )}
                    </p>
                    <p className="review-message">
                      {row.description || "Keine zusätzlichen Hinweise."}
                    </p>
                    <p>
                      Interne Mindestwartezeit bis (tatsächliche Widerrufsfrist
                      zusätzlich prüfen): {date(row.starts_after)}
                      <br />
                      Zahlung erfasst: {date(row.paid_at)} · Rücküberweisung
                      erfasst: {date(row.refunded_at)}
                      <br />
                      Konditionen:{" "}
                      {row.conditions_version || "Noch nicht beauftragt"}
                    </p>
                    {row.order_data && (
                      <details>
                        <summary>Gespeicherte Beauftragungsdaten</summary>
                        <pre className="review-mail-text">
                          {JSON.stringify(row.order_data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {mails.map((job) => (
                      <details key={job.id}>
                        <summary>
                          {job.kind === "acknowledgment"
                            ? "Erste E-Mail"
                            : "Vertragsbestätigung"}{" "}
                          · {mailLabels[job.status]}
                        </summary>
                        <p>
                          Vorgesehen: {date(job.due_at)} · Vom Server
                          angenommen: {date(job.sent_at)}
                        </p>
                        {job.error && (
                          <p className="error-message">{job.error}</p>
                        )}
                        {job.subject && <strong>{job.subject}</strong>}
                        {job.body && (
                          <pre className="review-mail-text">{job.body}</pre>
                        )}
                        {["unknown", "failed"].includes(job.status) && (
                          <button
                            className="button secondary"
                            onClick={() => void retry(job.id)}
                          >
                            Nach Postfachprüfung erneut einplanen
                          </button>
                        )}
                      </details>
                    ))}
                    <ReviewEditor
                      key={`${row.id}:${revision}`}
                      row={row}
                      onSaved={() => {
                        setExpanded("");
                        refresh();
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {!busy && rows.length === 0 && (
          <p>Noch keine passenden Bewertungsanfragen vorhanden.</p>
        )}
        <div className="crm-actions">
          <button
            className="button secondary"
            disabled={busy || offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 25))}
          >
            Zurück
          </button>
          <span>
            {count ? offset + 1 : 0}–{Math.min(offset + 25, count)} von {count}
          </span>
          <button
            className="button secondary"
            disabled={busy || offset + 25 >= count}
            onClick={() => setOffset(offset + 25)}
          >
            Weiter
          </button>
        </div>
      </section>
    </>
  );
}
