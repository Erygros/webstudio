"use client";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
import { Editor } from "./editor";
import { ResourcePanel } from "./resource-panel";
import type { Row } from "@/crm/resources";
export function MailTools({ companyId }: { companyId?: string }) {
  const [compose, setCompose] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, unknown>>(
    companyId ? { company_id: companyId } : {},
  );
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<Row[]>([]);
  useEffect(() => {
    void crmFetch<{ rows: Row[] }>("data/vorlagen").then((d) =>
      setTemplates(d.rows),
    );
    if (companyId)
      void crmFetch<{ rows: Row[] }>(`data/leads?id=${companyId}`).then((d) =>
        setDefaults((prev) => ({
          ...prev,
          to_address: d.rows[0]?.email || "",
        })),
      );
  }, [companyId]);
  return (
    <section className="crm-panel">
      <div className="crm-actions">
        <button className="button" onClick={() => setCompose(true)}>
          E-Mail verfassen
        </button>
        <select
          aria-label="E-Mail-Vorlage"
          onChange={(e) => {
            const t = templates.find((t) => t.id === e.target.value);
            if (t) {
              setDefaults({ ...defaults, subject: t.subject, body: t.body });
              setCompose(true);
            }
          }}
        >
          <option value="">Vorlage auswählen</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {String(t.name)}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          onClick={() =>
            void crmFetch<{ mail?: { imported?: number; error?: string } }>(
              "jobs?kind=imap",
              { method: "POST", body: "{}" },
            )
              .then((d) =>
                setMessage(
                  d.mail?.error ||
                    `${d.mail?.imported || 0} Nachrichten synchronisiert.`,
                ),
              )
              .catch((e) => setMessage(e.message))
          }
        >
          Postfach synchronisieren
        </button>
      </div>
      <p className="crm-caption">
        SMTP / IMAP fehlen? Die Integration zeigt einen Einrichtungsfehler und
        simuliert keinen Versand. Entwürfe werden trotzdem gespeichert.
      </p>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}{" "}
      {compose && (
        <Editor
          resource="emails"
          defaults={defaults}
          onClose={() => setCompose(false)}
          onSaved={() =>
            setMessage(
              "Entwurf gespeichert. Öffne die Nachricht, um sie bewusst zu senden.",
            )
          }
        />
      )}
      <details>
        <summary>Vorlagen verwalten</summary>
        <ResourcePanel resource="vorlagen" />
      </details>
    </section>
  );
}
