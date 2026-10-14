"use client";
import { useEffect, useState } from "react";
import { resources, type Row } from "@/crm/resources";
import { crmFetch } from "./api";
import { Modal } from "./modal";
import { berlinInstant, berlinInput } from "@/crm/time";
export function Editor({
  resource: resourceKey,
  row,
  defaults = {},
  onClose,
  onSaved,
}: {
  resource: string;
  row?: Row;
  defaults?: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const resource = resources[resourceKey];
  const [values, setValues] = useState<Record<string, unknown>>({
    ...defaults,
    ...row,
  });
  const [related, setRelated] = useState<Record<string, Row[]>>({});
  const [relationQueries, setRelationQueries] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      for (const key of new Set(
        resource.fields.map((f) => f.relation).filter((v): v is string => !!v),
      ))
        void (async () => {
          const d = await crmFetch<{ rows: Row[] }>(
            `data/${key}?q=${encodeURIComponent(relationQueries[key] || "")}`,
          );
          const selected = resource.fields
            .filter((f) => f.relation === key)
            .map((f) => String(values[f.key] || ""))
            .filter(Boolean);
          for (const id of selected)
            if (!d.rows.some((r) => r.id === id)) {
              const existing = await crmFetch<{ rows: Row[] }>(
                `data/${key}?id=${encodeURIComponent(id)}`,
              );
              d.rows.push(...existing.rows);
            }
          if (active) setRelated((prev) => ({ ...prev, [key]: d.rows }));
        })().catch((e) => {
          if (active)
            setError(
              e instanceof Error
                ? e.message
                : "Verknüpfungen konnten nicht geladen werden.",
            );
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [resource, relationQueries, values]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {};
      for (const f of resource.fields) {
        let v = values[f.key];
        if (v === undefined || v === "" || v === null) {
          if (f.required) throw new Error(`${f.label} fehlt.`);
          if (row && v !== undefined) body[f.key] = null;
          continue;
        }
        if (f.type === "checkbox") v = !!v;
        if (f.type === "number") v = String(v).replace(",", ".");
        if (f.type === "datetime-local") v = berlinInstant(String(v));
        if (f.type === "json" && typeof v === "string") v = JSON.parse(v);
        body[f.key] = v;
      }
      if (row) body.id = row.id;
      await crmFetch(`data/${resourceKey}`, {
        method: row ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      window.dispatchEvent(new Event("crm-change"));
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${resource.singular} ${row ? "bearbeiten" : "anlegen"}`}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="crm-form-grid">
          {resource.fields.map((f) => (
            <label
              className={`form-field ${f.type === "textarea" || f.type === "json" ? "crm-span-2" : ""}`}
              key={f.key}
            >
              {f.label}
              {f.required ? " *" : ""}
              {f.type === "textarea" || f.type === "json" ? (
                <textarea
                  required={f.required}
                  maxLength={20000}
                  value={
                    typeof values[f.key] === "object"
                      ? JSON.stringify(values[f.key], null, 2)
                      : String(values[f.key] || "")
                  }
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                />
              ) : f.type === "select" ? (
                <>
                  {f.relation && (
                    <input
                      type="search"
                      aria-label={`${f.label} suchen`}
                      placeholder={`${f.label} suchen …`}
                      value={relationQueries[f.relation] || ""}
                      onChange={(e) =>
                        setRelationQueries((prev) => ({
                          ...prev,
                          [f.relation!]: e.target.value,
                        }))
                      }
                    />
                  )}
                  <select
                    required={f.required}
                    value={String(values[f.key] || "")}
                    onChange={(e) =>
                      setValues({ ...values, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Auswählen</option>
                    {f.relation
                      ? (related[f.relation] || []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {String(r.name || r.title || r.number || r.id)}
                          </option>
                        ))
                      : f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o || "Keine Wiederholung"}
                          </option>
                        ))}
                  </select>
                </>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.checked })
                  }
                />
              ) : (
                <input
                  type={f.type || "text"}
                  step={f.type === "number" ? "0.001" : undefined}
                  min={f.type === "number" ? 0 : undefined}
                  required={f.required}
                  value={
                    f.type === "datetime-local" && values[f.key]
                      ? String(values[f.key]).length === 16
                        ? String(values[f.key])
                        : berlinInput(String(values[f.key]))
                      : String(values[f.key] ?? "")
                  }
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="crm-actions">
          <button className="button" disabled={busy}>
            {busy ? "Wird gespeichert …" : "Speichern"}
          </button>
          <button type="button" className="button secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </Modal>
  );
}
