"use client";
import { useState } from "react";
import { resources } from "@/crm/resources";
import { crmFetch } from "./api";
import { Modal } from "./modal";
export function Importer({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [preview, setPreview] = useState<{
    columns: string[];
    rows: string[][];
  } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function file(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    const body = new FormData();
    body.set("file", file);
    try {
      const data = await crmFetch<NonNullable<typeof preview>>("import", {
        method: "POST",
        body,
      });
      setPreview(data);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importRows() {
    if (mapping.name === undefined || mapping.name === "") {
      setMessage("Firmenname muss zugeordnet sein.");
      return;
    }
    setBusy(true);
    try {
      const result = await crmFetch<{
        created: number;
        duplicates: number;
        errors: { row: number; error: string }[];
      }>("import", {
        method: "POST",
        body: JSON.stringify({ rows: preview?.rows, mapping }),
      });
      setMessage(
        `${result.created} angelegt, ${result.duplicates} Duplikate übersprungen. ${result.errors.map((e) => `Zeile ${e.row}: ${e.error}`).join("\n")}`,
      );
      onSaved();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Leads aus CSV / Excel importieren" onClose={onClose}>
      <p>
        Maximal 1.000 Zeilen und 2 MB. Formeln werden nicht ausgewertet.
        Werbeerlaubnisse werden nicht durch den Import erteilt.
      </p>
      <label className="form-field">
        Datei
        <input
          type="file"
          accept=".csv,.xlsx"
          disabled={busy}
          onChange={(e) => void file(e.target.files?.[0])}
        />
      </label>
      {preview && (
        <>
          <h3>Spalten zuordnen</h3>
          <div className="crm-form-grid">
            {resources.leads.fields
              .filter(
                (f) => !["checkbox", "datetime-local"].includes(f.type || ""),
              )
              .map((f) => (
                <label className="form-field" key={f.key}>
                  {f.label}
                  <select
                    value={mapping[f.key] || ""}
                    onChange={(e) =>
                      setMapping({ ...mapping, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Nicht importieren</option>
                    {preview.columns.map((c, i) => (
                      <option key={i} value={String(i)}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
          <h3>Vorschau ({preview.rows.length} Zeilen)</h3>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <tbody>
                {preview.rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="button"
            disabled={busy}
            onClick={() => void importRows()}
          >
            {busy ? "Wird importiert …" : "Import ausführen"}
          </button>
        </>
      )}
      {message && (
        <p role="status" className="error-message">
          {message}
        </p>
      )}
    </Modal>
  );
}
