"use client";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
import { shopMoney } from "@/lib/lead-shop";
import type { LeadOrder } from "@/crm/server/lead-shop";
type Mail = {
  id: string;
  order_id: string;
  kind: string;
  status: string;
  error: string;
  sent_at: string | null;
};
type Settings = {
  enabled: boolean;
  manual_delivery: boolean;
  notification_email: string;
  recipient: string;
  iban: string;
};
type Dashboard = {
  rows: LeadOrder[];
  count: number;
  settings: Settings;
  status: { available: boolean; manualDelivery: boolean };
  mail: Mail[];
  administrator: boolean;
  events: { action: string; created_at: string }[];
};
const mailLabels: Record<string, string> = {
  confirmation: "Bestätigung an Kunden",
  owner_order: "Bestellmeldung an Betreiber",
  owner_payment: "Zahlungsmeldung an Betreiber",
  owner_sent: "Versandmeldung an Betreiber",
  owner_cancelled: "Stornomeldung an Betreiber",
};
const states: Record<string, string> = {
  pending: "Eingeplant",
  sending: "Versand läuft",
  sent: "Vom Mailserver angenommen",
  unknown: "Unklar – Postfach prüfen",
  cancelled: "Deaktiviert",
};
function OrderCard({
  row,
  mail,
  reload,
  initialOpen,
}: {
  row: LeadOrder;
  mail: Mail[];
  reload: () => Promise<void>;
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen),
    [reference, setReference] = useState(""),
    [amount, setAmount] = useState(String(row.total_cents / 100)),
    [checked, setChecked] = useState(false),
    [notes, setNotes] = useState(row.internal_notes),
    [sentConfirmed, setSentConfirmed] = useState(false),
    [deliveryNote, setDeliveryNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [events, setEvents] = useState<Dashboard["events"]>([]);
  async function history() {
    try {
      const d = await crmFetch<Dashboard>(`lead-shop?id=${row.id}`);
      setEvents(d.events);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    if (initialOpen) void history();
  }, [initialOpen]);
  async function action(action: string, extra: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await crmFetch("lead-shop", {
        method: "POST",
        body: JSON.stringify({ action, id: row.id, ...extra }),
      });
      await reload();
      await history();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    company: "Firma",
    contact: "Ansprechpartner",
    street: "Straße",
    houseNumber: "Hausnummer",
    postcode: "PLZ",
    city: "Ort",
    country: "Land",
    email: "E-Mail",
    phone: "Telefon",
    vatId: "USt-IdNr.",
  };
  return (
    <article className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <span className="crm-caption">
            {row.reference} · {new Date(row.created_at).toLocaleString("de-DE")}
          </span>
          <h3>{row.customer.company}</h3>
          <p>
            {row.package} · {row.quantity.toLocaleString("de-DE")} Kontakte ·{" "}
            {shopMoney(row.total_cents)}
          </p>
          <p>
            <strong>{row.paid_at ? "Bezahlt" : "Nicht bezahlt"}</strong> ·{" "}
            {row.status}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => {
            setOpen(!open);
            if (!open) void history();
          }}
        >
          {open ? "Schließen" : "Bestellung ansehen"}
        </button>
      </div>
      {open && (
        <>
          <dl className="lead-summary">
            {Object.entries(row.customer).map(([key, value]) => (
              <div key={key}>
                <dt>{labels[key] || key}</dt>
                <dd>{value || "Nicht angegeben"}</dd>
              </div>
            ))}
          </dl>
          <p>
            Zahlungsanweisung: {row.bank.recipient} · {row.bank.iban} ·
            Verwendungszweck {row.reference}
          </p>
          {row.status === "Zahlung ausstehend" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action("pay", {
                  reference,
                  amountCents: Math.round(
                    Number(amount.replace(",", ".")) * 100,
                  ),
                  bankChecked: checked,
                });
              }}
            >
              <h3>Zahlung erfassen</h3>
              <div className="crm-form-grid">
                <label className="form-field">
                  Eingegangener Betrag in Euro
                  <input
                    required
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label className="form-field">
                  Banktransaktionsreferenz
                  <input
                    required
                    minLength={4}
                    maxLength={180}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </label>
              </div>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={checked}
                  required
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <span>
                  Ich habe den tatsächlichen Zahlungseingang und die Zuordnung
                  im Bankkonto geprüft.
                </span>
              </label>
              <div className="crm-actions">
                <button className="button" disabled={busy || !checked}>
                  Als bezahlt markieren
                </button>
                <button
                  className="button secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Unbezahlte Bestellung stornieren?"))
                      void action("cancel");
                  }}
                >
                  Stornieren
                </button>
              </div>
            </form>
          )}
          {row.paid_at && (
            <p>
              Zahlung bestätigt: {new Date(row.paid_at).toLocaleString("de-DE")}
            </p>
          )}
          {row.status === "Bezahlt" && (
            <section>
              <h3>Manueller Versand</h3>
              <p>
                Die CSV-Datei über dein eigenes E-Mail-Programm an{" "}
                <a href={`mailto:${row.customer.email}`}>
                  {row.customer.email}
                </a>{" "}
                versenden. Das CRM lädt keine Datei hoch und versendet keine
                Leadlisten.
              </p>
              <label className="form-field">
                Versandnotiz (optional)
                <input
                  maxLength={1000}
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={sentConfirmed}
                  onChange={(e) => setSentConfirmed(e.target.checked)}
                />
                <span>
                  Ich habe die gekaufte Liste außerhalb des CRM an den Kunden
                  versendet.
                </span>
              </label>
              <button
                className="button secondary"
                disabled={busy || !sentConfirmed}
                onClick={() =>
                  action("sent", { sentConfirmed: true, note: deliveryNote })
                }
              >
                Als extern versendet markieren
              </button>
            </section>
          )}
          {row.fulfilled_at && (
            <p>
              Extern versendet:{" "}
              {new Date(row.fulfilled_at).toLocaleString("de-DE")}{" "}
              {row.delivery_note}
            </p>
          )}
          <label className="form-field">
            Interne Notiz
            <textarea
              maxLength={5000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => action("notes", { notes })}
          >
            Notiz speichern
          </button>
          <details>
            <summary>E-Mail- und Änderungsverlauf</summary>
            {mail.map((m) => (
              <div key={m.id}>
                <p>
                  {mailLabels[m.kind] || m.kind}: {states[m.status] || m.status}{" "}
                  {m.error}
                </p>
                {m.status === "unknown" && (
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Gesendetes Postfach und SMTP-Protokoll geprüft? Eine Wiederholung kann doppelte Nachrichten erzeugen.",
                        )
                      )
                        void action("retry-mail", {
                          id: m.id,
                          mailboxChecked: true,
                        });
                    }}
                  >
                    Nach Postfachprüfung erneut senden
                  </button>
                )}
              </div>
            ))}
            <ul>
              {events.map((e, i) => (
                <li key={i}>
                  {new Date(e.created_at).toLocaleString("de-DE")} · {e.action}
                </li>
              ))}
            </ul>
          </details>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </article>
  );
}
export function LeadShopAdmin({ initialId }: { initialId?: string }) {
  const [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0),
    [status, setStatus] = useState("");
  const [bank, setBank] = useState<Settings>({
      enabled: false,
      manual_delivery: true,
      notification_email: "bewerbung.enricogross30@gmail.com",
      recipient: "",
      iban: "",
    }),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const d = await crmFetch<Dashboard>(
        `lead-shop?offset=${offset}&status=${encodeURIComponent(status)}${initialId ? `&id=${encodeURIComponent(initialId)}` : ""}`,
      );
      setData(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60000);
    return () => clearInterval(timer);
  }, [offset, status, initialId]);
  useEffect(() => {
    if (data?.settings)
      setBank({
        enabled: data.settings.enabled,
        manual_delivery: data.settings.manual_delivery,
        notification_email: data.settings.notification_email,
        recipient: data.settings.recipient,
        iban: data.settings.iban,
      });
  }, [
    data?.settings.enabled,
    data?.settings.manual_delivery,
    data?.settings.notification_email,
    data?.settings.recipient,
    data?.settings.iban,
  ]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await crmFetch("lead-shop", {
        method: "POST",
        body: JSON.stringify({ action: "settings", settings: bank }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / CRM</span>
        <h1>Lead-Verkauf</h1>
        <p>
          Verkaufsstatus, Zahlungsdaten und Bestellübersicht. CSV-Dateien werden
          lokal per E-Mail ausgeliefert.
        </p>
      </header>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <section className="crm-panel">
            <h2>Verkaufsstatus</h2>
            <p>
              Öffentlicher Verkauf:{" "}
              <strong>
                {data.status.available
                  ? "Aktiv"
                  : "Inaktiv – Verkaufseinstellungen, Bankdaten und SMTP prüfen"}
              </strong>
            </p>
            <p>
              Kein CSV-Upload und keine Bestandsprüfung erforderlich. Die
              exklusive Zusammenstellung und die Vermeidung mehrfach verkaufter
              Kontakte verwaltest du lokal.
            </p>
            <button className="button secondary" onClick={load}>
              Übersicht aktualisieren
            </button>
          </section>
          {data.administrator && (
            <section className="crm-panel">
              <h2>Verkauf und Zahlung konfigurieren</h2>
              <form onSubmit={save}>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={bank.manual_delivery}
                    onChange={(e) =>
                      setBank({ ...bank, manual_delivery: e.target.checked })
                    }
                  />
                  <span>
                    Manuelle Auslieferung aktivieren: Bestellungen ohne
                    hochgeladene CSV annehmen. Dateien werden ausschließlich
                    über unser eigenes E-Mail-Programm versendet.
                  </span>
                </label>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={bank.enabled}
                    onChange={(e) =>
                      setBank({ ...bank, enabled: e.target.checked })
                    }
                  />
                  <span>Verkauf auf der Website aktivieren</span>
                </label>
                <div className="crm-form-grid">
                  <label className="form-field">
                    Kontoinhaber / Empfänger
                    <input
                      required
                      maxLength={150}
                      value={bank.recipient}
                      onChange={(e) =>
                        setBank({ ...bank, recipient: e.target.value })
                      }
                    />
                  </label>
                  <label className="form-field">
                    IBAN
                    <input
                      required
                      value={bank.iban}
                      onChange={(e) =>
                        setBank({ ...bank, iban: e.target.value })
                      }
                    />
                  </label>
                  <label className="form-field">
                    E-Mail für Bestell- und Statusmeldungen
                    <input
                      required
                      type="email"
                      maxLength={254}
                      value={bank.notification_email}
                      onChange={(e) =>
                        setBank({ ...bank, notification_email: e.target.value })
                      }
                    />
                  </label>
                </div>
                <p>
                  Jede neue Bestellung wird mit Käuferdaten, Paket, Menge,
                  Preis, Zahlungsstatus und CRM-Link gemeldet. Zahlungs-,
                  Versand- und Stornoänderungen erhalten ebenfalls eine Meldung.
                  Kunden erhalten automatisch ihre Bestellbestätigung und
                  Überweisungsdaten.
                </p>
                <button className="button" disabled={busy}>
                  Einstellungen speichern
                </button>
              </form>
            </section>
          )}
          <section className="crm-panel">
            <h2>Bestellungen ({data.count})</h2>
            {initialId && (
              <a className="text-link" href="/crm/lead-verkauf">
                Alle Bestellungen anzeigen
              </a>
            )}
            <label className="form-field">
              Status
              <select
                value={status}
                onChange={(e) => {
                  setOffset(0);
                  setStatus(e.target.value);
                }}
              >
                <option value="">Alle</option>
                {[
                  "Zahlung ausstehend",
                  "Bezahlt",
                  "Versendet",
                  "Storniert",
                  "Abgelaufen",
                  "Bereitgestellt",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </section>
          {data.rows.map((row) => (
            <OrderCard
              key={row.id}
              row={row}
              mail={data.mail.filter((m) => m.order_id === row.id)}
              reload={load}
              initialOpen={row.id === initialId}
            />
          ))}
          {!data.rows.length && <p>Keine Bestellungen in dieser Auswahl.</p>}
          <div className="crm-actions">
            <button
              className="button secondary"
              disabled={!offset}
              onClick={() => setOffset(Math.max(0, offset - 25))}
            >
              Zurück
            </button>
            <button
              className="button secondary"
              disabled={offset + 25 >= data.count}
              onClick={() => setOffset(offset + 25)}
            >
              Weitere Bestellungen
            </button>
          </div>
        </>
      )}
    </>
  );
}
