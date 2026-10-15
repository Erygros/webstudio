"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resources, display, type Row } from "@/crm/resources";
import { crmFetch } from "./api";
import { Editor } from "./editor";
import { ResourcePanel } from "./resource-panel";
import { useDialer } from "./phone";
import { MailTools } from "./mail-tools";
import { MailActions } from "./mail-actions";
import { ProjectSummary } from "./project-summary";
import { WebsiteInquiryInbox } from "./website-inquiries";
export function Detail({
  resource: key,
  initial: row,
}: {
  resource: string;
  initial: Row;
}) {
  const router = useRouter();
  const r = resources[key];
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("Übersicht");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialer = useDialer();
  async function action(name: string) {
    setBusy(true);
    setError("");
    try {
      const result = await crmFetch<{ id?: string; resource?: string }>(
        "action",
        {
          method: "POST",
          body: JSON.stringify({
            action: name,
            id: row.id,
            requestKey: crypto.randomUUID(),
          }),
        },
      );
      if (result.id && result.resource)
        router.push(`/crm/${result.resource}/${result.id}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !confirm(
        "Datensatz endgültig löschen? Verknüpfte oder aufbewahrungspflichtige Daten können das Löschen verhindern.",
      )
    )
      return;
    try {
      await crmFetch(key === "dokumente" ? "documents" : `data/${key}`, {
        method: "DELETE",
        body: JSON.stringify({ id: row.id }),
      });
      router.push(`/crm/${key}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const company = ["leads", "kunden"].includes(key);
  const billing = ["angebote", "rechnungen"].includes(key);
  const tabs = company
    ? [
        "Übersicht",
        "Kontakte",
        "Kommunikation",
        "Website-Anfragen",
        "Follow-ups",
        "Angebote",
        "Rechnungen",
        "Projekte",
        "Dokumente",
        "Verträge",
        "Erlaubnisse",
        "Historie",
      ]
    : ["Übersicht"];
  return (
    <>
      <header className="crm-page-head">
        <Link className="crm-small-link" href={`/crm/${key}`}>
          ← {r.title}
        </Link>
        <h1>
          {display(
            row.name || row.title || row.number || row.subject || r.singular,
          )}
        </h1>
        <div className="crm-actions">
          {r.roles.length > 0 && (
            <button
              className="button secondary"
              onClick={() => setEditing(true)}
            >
              Bearbeiten
            </button>
          )}
          {company && (
            <>
              <button
                className="button"
                disabled={!!row.blocked}
                onClick={() => dialer.open(String(row.phone || ""), row.id)}
              >
                Anrufen
              </button>
              <Link
                className="button secondary"
                href={`/crm/emails?company=${row.id}`}
              >
                E-Mail schreiben
              </Link>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void action("lead.convert")}
              >
                Als Kunde übernehmen
              </button>
              <button
                className="plain-button"
                onClick={() => void action("lead.archive")}
              >
                Archivieren
              </button>
            </>
          )}
          {billing && (
            <>
              {key === "rechnungen" &&
                !!row.issued_at &&
                row.kind !== "Storno" &&
                row.document_status !== "Storniert" && (
                  <>
                    {[
                      ["reminder", "Zahlungserinnerung"],
                      ["dunning", "Mahnung"],
                    ].map(([kind, label]) => (
                      <button
                        key={kind}
                        className="button secondary"
                        onClick={() =>
                          void crmFetch<{ id: string }>("reminder", {
                            method: "POST",
                            body: JSON.stringify({ id: row.id, kind }),
                          })
                            .then((data) =>
                              router.push(`/crm/emails/${data.id}`),
                            )
                            .catch((e) => setError(e.message))
                        }
                      >
                        {label} vorbereiten
                      </button>
                    ))}
                  </>
                )}
              {!!row.issued_at && (
                <button
                  className="button secondary"
                  onClick={() =>
                    void crmFetch<{ id: string }>("billing-mail", {
                      method: "POST",
                      body: JSON.stringify({
                        id: row.id,
                        kind: key === "angebote" ? "quote" : "invoice",
                      }),
                    })
                      .then((data) => router.push(`/crm/emails/${data.id}`))
                      .catch((e) => setError(e.message))
                  }
                >
                  PDF-E-Mail vorbereiten
                </button>
              )}
              <a
                className="button secondary"
                href={`/api/crm/pdf?kind=${key === "angebote" ? "quote" : "invoice"}&id=${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                PDF öffnen
              </a>
              {!row.issued_at && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      key === "angebote" ? "quote.issue" : "invoice.issue",
                    )
                  }
                >
                  Verbindlich ausstellen
                </button>
              )}
              <button
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  void action(
                    key === "angebote" ? "quote.clone" : "invoice.clone",
                  )
                }
              >
                {key === "angebote"
                  ? "Neue Version / duplizieren"
                  : "Duplizieren"}
              </button>
              {key === "angebote" && (
                <>
                  <button
                    className="button secondary"
                    onClick={() => void action("quote.invoice")}
                  >
                    Rechnung erstellen
                  </button>
                  {!!row.issued_at && (
                    <>
                      <button
                        className="plain-button"
                        onClick={() => void action("quote.accept")}
                      >
                        Als angenommen markieren
                      </button>
                      <button
                        className="plain-button"
                        onClick={() => void action("quote.reject")}
                      >
                        Als abgelehnt markieren
                      </button>
                    </>
                  )}
                </>
              )}
              {key === "rechnungen" &&
                !!row.issued_at &&
                row.document_status !== "Storniert" &&
                row.kind !== "Storno" && (
                  <button
                    className="plain-button"
                    onClick={() => void action("invoice.cancel")}
                  >
                    Stornoentwurf erstellen
                  </button>
                )}
            </>
          )}
          {key === "dokumente" && (
            <>
              <a
                className="button secondary"
                href={`/api/crm/documents?id=${row.id}&preview=true`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Vorschau öffnen ↗
              </a>
              <a
                className="button"
                href={`/api/crm/documents?id=${row.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sicher herunterladen ↗
              </a>
            </>
          )}
          <button className="plain-button" onClick={() => void remove()}>
            Löschen
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {tabs.length > 1 && (
        <div className="crm-tabs">
          {tabs.map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      {tab === "Übersicht" && (
        <section className="crm-panel">
          <dl className="crm-detail-grid">
            {r.fields.map((f) => (
              <div key={f.key}>
                <dt>{f.label}</dt>
                <dd>{display(row[f.key])}</dd>
              </div>
            ))}
          </dl>
          {!r.fields.length && (
            <pre className="crm-json-view">{JSON.stringify(row, null, 2)}</pre>
          )}
          {company && !!row.blocked && (
            <p className="notice">
              Werbewiderspruch: werbliche Telefonate und E-Mails sind gesperrt.
            </p>
          )}
          {billing && (
            <p className="notice">
              {row.issued_at
                ? "Der ausgestellte Dokumentstand bleibt unveränderlich. Änderungen erfordern eine neue Version beziehungsweise einen Stornoprozess."
                : "Entwurf: Positionen ergänzen und Pflichtangaben prüfen. Eine PDF-Vorschau ist keine ausgestellte Rechnung."}{" "}
              XRechnung/ZUGFeRD-Export ist noch nicht verfügbar; PDFs werden
              nicht als E-Rechnung bezeichnet.
            </p>
          )}
        </section>
      )}
      {company && tab === "Kontakte" && (
        <ResourcePanel resource="kontakte" parent={row.id} />
      )}{" "}
      {company && tab === "Kommunikation" && (
        <>
          <ResourcePanel resource="telefonie" parent={row.id} />
          <ResourcePanel resource="emails" parent={row.id} />
        </>
      )}
      {company && tab === "Website-Anfragen" && (
        <WebsiteInquiryInbox companyId={row.id} />
      )}
      {company && tab === "Follow-ups" && (
        <ResourcePanel resource="followups" parent={row.id} />
      )}{" "}
      {company && tab === "Angebote" && (
        <ResourcePanel resource="angebote" parent={row.id} />
      )}{" "}
      {company && tab === "Rechnungen" && (
        <ResourcePanel resource="rechnungen" parent={row.id} />
      )}{" "}
      {company && tab === "Projekte" && (
        <ResourcePanel resource="projekte" parent={row.id} />
      )}{" "}
      {company && tab === "Dokumente" && (
        <ResourcePanel resource="dokumente" parent={row.id} />
      )}{" "}
      {company && tab === "Verträge" && (
        <ResourcePanel resource="vertraege" parent={row.id} />
      )}{" "}
      {company && tab === "Erlaubnisse" && (
        <ResourcePanel resource="berechtigungen" parent={row.id} />
      )}{" "}
      {company && tab === "Historie" && (
        <ResourcePanel
          resource="historie"
          parent={row.id}
          parentKey="entity_id"
        />
      )}
      {key === "angebote" && (
        <ResourcePanel resource="angebot_positionen" parent={row.id} />
      )}{" "}
      {key === "rechnungen" && (
        <>
          <ResourcePanel resource="rechnung_positionen" parent={row.id} />
          <ResourcePanel resource="zahlungen" parent={row.id} />
          {row.kind === "Schlussrechnung" && (
            <ResourcePanel resource="anzahlungen" parent={row.id} />
          )}
        </>
      )}{" "}
      {key === "projekte" && (
        <>
          <ProjectSummary id={row.id} />
          <ResourcePanel
            resource="aufgaben"
            parent={row.id}
            parentKey="project_id"
          />
          <ResourcePanel resource="meilensteine" parent={row.id} />
          <ResourcePanel resource="zeiten" parent={row.id} />
          <ResourcePanel
            resource="dokumente"
            parent={row.id}
            parentKey="project_id"
          />
        </>
      )}
      {company && <MailTools companyId={row.id} />}{" "}
      {key === "emails" && <MailActions row={row} />}
      {editing && (
        <Editor
          resource={key}
          row={row}
          onClose={() => setEditing(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}
