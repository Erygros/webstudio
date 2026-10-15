"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Row } from "@/crm/resources";
import { inquiryData, inquiryFields, inquiryKind } from "@/crm/inquiries";
import { crmFetch } from "./api";

export function WebsiteFormStatus() {
  const [result, setResult] = useState<{
    ready: boolean;
    checks: { label: string; ok: boolean }[];
    emailNotifications: boolean;
    note: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true);
    setError("");
    try {
      setResult(await crmFetch("website-status"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <h2>Formularanbindung</h2>
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => void load()}
        >
          {busy ? "Verbindung wird geprüft …" : "Verbindung prüfen"}
        </button>
      </div>
      <p>
        Die Website speichert Anfragen direkt in dieser Datenbank. Ein
        SMTP-Postfach ist dafür nicht erforderlich.
      </p>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div role="status">
          <p>
            <strong>
              {result.ready
                ? "Datenbank und privater Speicher sind erreichbar."
                : "Die Verbindung ist noch nicht vollständig verfügbar."}
            </strong>
          </p>
          <ul>
            {result.checks.map((check) => (
              <li key={check.label}>
                {check.ok ? "✓" : "⚠"} {check.label}:{" "}
                {check.ok ? "bereit" : "prüfen"}
              </li>
            ))}
          </ul>
          <p>
            Zusätzliche E-Mail-Benachrichtigungen:{" "}
            {result.emailNotifications
              ? "aktiv"
              : "ausgeschaltet; CRM-Empfang bleibt unabhängig davon"}
            .
          </p>
          <p>{result.note}</p>
        </div>
      )}
    </section>
  );
}

export function WebsiteInquiryInbox({ companyId }: { companyId?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ offset: String(offset), q: query });
      if (companyId) params.set("parent", companyId);
      try {
        const result = await crmFetch<{ rows: Row[]; count: number }>(
          `data/anfragen?${params}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setRows(result.rows);
        setCount(result.count || 0);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [offset, query, companyId, revision]);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("crm-change", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("crm-change", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <span className="crm-caption">{count} Anfragen</span>
          <h2>Eingang von der Website</h2>
        </div>
        <button
          className="button secondary"
          onClick={() => setRevision((value) => value + 1)}
        >
          Aktualisieren
        </button>
      </div>
      <p>
        Kontakt-, Projekt-, Rückruf- und Terminwünsche. Die vollständige
        Nachricht bleibt beim ursprünglichen Eingang gespeichert.
      </p>
      <div className="crm-filterbar">
        <input
          aria-label="Anfragen nach Name suchen"
          placeholder="Nach Name suchen …"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOffset(0);
          }}
        />
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Eingang</th>
              <th>Art</th>
              <th>Kontakt</th>
              <th>Nachricht</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const data = inquiryData(row);
              return (
                <tr key={row.id}>
                  <td>
                    {new Date(String(row.created_at)).toLocaleString("de-DE", {
                      timeZone: "Europe/Berlin",
                    })}
                  </td>
                  <td>{inquiryKind(data)}</td>
                  <td>
                    <Link href={`/crm/anfragen/${row.id}`}>
                      {String(data.name || "Anfrage")}
                    </Link>
                    <br />
                    {String(data.company || "")}
                    <br />
                    {String(data.email || "")}
                  </td>
                  <td style={{ maxWidth: 400, whiteSpace: "pre-wrap" }}>
                    {String(data.description || "").slice(0, 200)}
                    {String(data.description || "").length > 200 ? " …" : ""}
                  </td>
                  <td>
                    <Link
                      className="crm-small-link"
                      href={`/crm/anfragen/${row.id}`}
                    >
                      Anfrage öffnen ↗
                    </Link>
                    {!!row.company_id && (
                      <>
                        <br />
                        <Link
                          className="crm-small-link"
                          href={`/crm/leads/${row.company_id}`}
                        >
                          Kontakt öffnen ↗
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="crm-empty">
                  {loading
                    ? "Anfragen werden geladen …"
                    : query
                      ? "Keine passenden Anfragen."
                      : "Noch keine Website-Anfragen eingegangen."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="crm-pagination">
        <span>
          {count
            ? `${offset + 1}–${Math.min(offset + 50, count)} von ${count}`
            : "0 Anfragen"}
        </span>
        <button
          className="plain-button"
          disabled={offset === 0 || loading}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          ← Zurück
        </button>
        <button
          className="plain-button"
          disabled={offset + 50 >= count || loading}
          onClick={() => setOffset(offset + 50)}
        >
          Weiter →
        </button>
      </div>
    </section>
  );
}

export function WebsiteInquiryDetails({ row }: { row: Row }) {
  const data = inquiryData(row);
  const [documents, setDocuments] = useState<Row[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!row.company_id) return;
    let active = true;
    void crmFetch<{ rows: Row[] }>(
      `data/dokumente?parent=${encodeURIComponent(String(row.company_id))}&inquiry=${encodeURIComponent(String(row.request_key))}`,
    )
      .then((result) => {
        if (active)
          setDocuments(
            result.rows.filter((document) =>
              String(document.path).startsWith(`website/${row.request_key}/`),
            ),
          );
      })
      .catch(() => {
        if (active)
          setError(
            "Dokumente konnten nicht geladen werden. Bitte öffne die Dokumentenverwaltung des Kontakts.",
          );
      });
    return () => {
      active = false;
    };
  }, [row.company_id, row.request_key]);
  return (
    <>
      <header className="crm-page-head">
        <Link className="crm-small-link" href="/crm/anfragen">
          ← Website-Anfragen
        </Link>
        <h1>
          {inquiryKind(data)}: {String(data.name || "Kontakt")}
        </h1>
        <p>
          Eingegangen am{" "}
          {new Date(String(row.created_at)).toLocaleString("de-DE", {
            timeZone: "Europe/Berlin",
          })}
        </p>
        <div className="crm-actions">
          {!!row.company_id && (
            <Link className="button" href={`/crm/leads/${row.company_id}`}>
              Kontakt bearbeiten ↗
            </Link>
          )}
          {!!data.email && (
            <a
              className="button secondary"
              href={`mailto:${String(data.email)}`}
            >
              Per E-Mail antworten ↗
            </a>
          )}
          {!!data.phone && (
            <a
              className="button secondary"
              href={`tel:${String(data.phone).replace(/[^+\d]/g, "")}`}
            >
              Anrufen ↗
            </a>
          )}
        </div>
      </header>
      <section className="crm-panel">
        <h2>Angaben aus dem Formular</h2>
        <dl className="crm-detail-grid">
          {inquiryFields(data).map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="crm-panel">
        <h2>Anhänge</h2>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        {documents.map((document) => (
          <a
            key={document.id}
            className="crm-list-row"
            href={`/api/crm/documents?id=${document.id}`}
          >
            {String(document.name)} ↗
          </a>
        ))}
        {!documents.length && !error && (
          <p>Keine gespeicherten Anhänge zu dieser Anfrage.</p>
        )}
      </section>
    </>
  );
}
