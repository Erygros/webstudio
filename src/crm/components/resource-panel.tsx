"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resources, display, type Row } from "@/crm/resources";
import { crmFetch } from "./api";
import { Editor } from "./editor";
import { DocumentUpload } from "./upload";
import { Importer } from "./importer";
export function ResourcePanel({
  resource: resourceKey,
  parent,
  parentKey,
  title,
}: {
  resource: string;
  parent?: string;
  parentKey?: string;
  title?: string;
}) {
  const r = resources[resourceKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [folder, setFolder] = useState("");
  const [order, setOrder] = useState("created_at");
  const [asc, setAsc] = useState(false);
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<Row | true | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        offset: String(offset),
        order,
        asc: String(asc),
      });
      if (parent) params.set("parent", parent);
      if (parentKey) params.set("parentKey", parentKey);
      if (status) params.set("status", status);
      if (folder) params.set("folder", folder);
      const data = await crmFetch<{ rows: Row[]; count: number }>(
        `data/${resourceKey}?${params}`,
      );
      setRows(data.rows);
      setCount(data.count || 0);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    const refresh = () => void load();
    window.addEventListener("crm-change", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("crm-change", refresh);
    };
  }, [resourceKey, q, status, folder, offset, order, asc, parent, parentKey]);
  const fields = r.fields;
  const statuses = fields.find((f) => f.key === "status")?.options;
  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <span className="crm-caption">{count} Datensätze</span>
          <h2>{title || r.title}</h2>
        </div>
        <div className="crm-actions">
          {resourceKey === "dokumente" ? (
            <DocumentUpload
              companyId={
                parentKey === "company_id" || !parentKey ? parent : undefined
              }
              projectId={parentKey === "project_id" ? parent : undefined}
              onSaved={load}
            />
          ) : (
            r.roles.length > 0 && (
              <button className="button" onClick={() => setEditing(true)}>
                + {r.singular}
              </button>
            )
          )}
          {resourceKey === "leads" && !parent && (
            <button
              className="button secondary"
              onClick={() => setImporting(true)}
            >
              Importieren
            </button>
          )}
          <a
            className="crm-small-link"
            href={`/api/crm/export?resource=${resourceKey}`}
          >
            CSV exportieren
          </a>
        </div>
      </div>
      <div className="crm-filterbar">
        {resourceKey === "emails" && (
          <select
            aria-label="E-Mail-Ordner"
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Alle Ordner</option>
            {[
              ["inbox", "Posteingang"],
              ["sent", "Gesendet"],
              ["draft", "Entwürfe"],
              ["archive", "Archiv"],
              ["unknown", "Unklarer Versand"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <input
          aria-label={`${r.title} suchen`}
          placeholder="Suchen …"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
        />
        {statuses && (
          <select
            aria-label="Status filtern"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Alle Status</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
        <button className="plain-button" onClick={() => void load()}>
          Aktualisieren
        </button>
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
              {r.columns.map((key) => (
                <th key={key}>
                  <button
                    onClick={() => {
                      setOrder(key);
                      setAsc(order === key ? !asc : true);
                    }}
                  >
                    {fields.find((f) => f.key === key)?.label ||
                      (
                        {
                          created_at: "Erstellt",
                          number: "Nummer",
                          total: "Betrag (€)",
                          last_contact: "Letzter Kontakt",
                          contact_attempts: "Versuche",
                          folder: "Ordner",
                          started_at: "Beginn",
                          document_status: "Dokument",
                          payment_status: "Zahlung",
                          version: "Version",
                        } as Record<string, string>
                      )[key] ||
                      key}{" "}
                    {order === key ? (asc ? "↑" : "↓") : ""}
                  </button>
                </th>
              ))}
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {r.columns.map((key, i) => (
                  <td key={key}>
                    {i === 0 ? (
                      <Link href={`/crm/${resourceKey}/${row.id}`}>
                        {display(row[key])}
                      </Link>
                    ) : key === "status" || key.includes("status") ? (
                      <span className="crm-status">{display(row[key])}</span>
                    ) : key === "phone" && row[key] ? (
                      <a href={`tel:${row[key]}`}>{display(row[key])}</a>
                    ) : key === "email" && row[key] ? (
                      <Link href={`/crm/emails?company=${row.id}`}>
                        {display(row[key])}
                      </Link>
                    ) : (
                      display(row[key])
                    )}
                  </td>
                ))}
                <td>
                  <div className="crm-row-actions">
                    <Link
                      href={`/crm/${resourceKey}/${row.id}`}
                      aria-label="Details öffnen"
                    >
                      Öffnen ↗
                    </Link>
                    {r.roles.length > 0 && resourceKey !== "dokumente" && (
                      <button onClick={() => setEditing(row)}>
                        Bearbeiten
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={r.columns.length + 1} className="crm-empty">
                  {loading
                    ? "Daten werden geladen …"
                    : q || status
                      ? "Keine passenden Einträge."
                      : "Noch keine Einträge. Lege den ersten Datensatz an."}
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
            : "0 Einträge"}
        </span>
        <button
          className="plain-button"
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - 50))}
        >
          ← Zurück
        </button>
        <button
          className="plain-button"
          disabled={offset + 50 >= count}
          onClick={() => setOffset(offset + 50)}
        >
          Weiter →
        </button>
      </div>
      {editing && (
        <Editor
          resource={resourceKey}
          row={editing === true ? undefined : editing}
          defaults={
            parent
              ? { [parentKey || r.parent || "company_id"]: parent }
              : undefined
          }
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}{" "}
      {importing && (
        <Importer onClose={() => setImporting(false)} onSaved={load} />
      )}
    </section>
  );
}
