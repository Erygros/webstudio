"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crmFetch } from "./api";
import type { Row } from "@/crm/resources";
import { ResourcePanel } from "./resource-panel";
export function MailActions({ row }: { row: Row }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Row[]>([]);
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(row.attachment_ids) ? (row.attachment_ids as string[]) : [],
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void crmFetch<{ rows: Row[] }>(
      `data/dokumente${row.company_id ? "?parent=" + row.company_id : ""}`,
    ).then((d) => setDocuments(d.rows));
  }, [row.company_id]);
  async function send() {
    if (
      !confirm(
        "Diese E-Mail jetzt tatsächlich versenden? Werbliche Nachrichten benötigen eine dokumentierte Kontakterlaubnis.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await crmFetch("mail", {
        method: "POST",
        body: JSON.stringify({ id: row.id, attachmentIds: selected }),
      });
      setMessage("Nachricht vom SMTP-Dienst angenommen.");
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="crm-panel">
      <h2>Nachricht und Anhänge</h2>
      <div className="crm-mail-body">{String(row.body || "")}</div>
      {row.folder === "draft" && (
        <>
          <h3>Anhänge auswählen</h3>
          {documents.map((doc) => (
            <label className="consent" key={doc.id}>
              <input
                type="checkbox"
                checked={selected.includes(doc.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, doc.id]
                      : prev.filter((id) => id !== doc.id),
                  )
                }
              />
              {String(doc.name)}
            </label>
          ))}
          <button
            className="button"
            disabled={busy}
            onClick={() => void send()}
          >
            {busy ? "Wird gesendet …" : "E-Mail jetzt senden"}
          </button>
        </>
      )}
      {row.folder === "unknown" && (
        <p className="notice">
          Der Versandstatus ist unklar. Prüfe das Postfach, bevor du einen neuen
          Entwurf sendest.
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <button
        className="plain-button"
        onClick={() =>
          void crmFetch("mail", {
            method: "PATCH",
            body: JSON.stringify({ id: row.id }),
          })
            .then(() => router.refresh())
            .catch((e) => setMessage(e.message))
        }
      >
        Im CRM archivieren
      </button>
      <ResourcePanel
        resource="dokumente"
        parent={row.id}
        parentKey="email_id"
        title="Anhänge dieser Nachricht"
      />
    </section>
  );
}
