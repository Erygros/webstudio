"use client";
import { useEffect, useRef, useState } from "react";
import { crmFetch } from "./api";
import { parseCsv } from "@/crm/server/import-export";
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
type Dashboard = {
  rows: LeadOrder[];
  count: number;
  settings: { recipient: string; iban: string; enabled: boolean };
  status: { available: boolean; stock: number };
  clock: { last_tick: string | null; worker_seen: string | null };
  mail: Mail[];
  administrator: boolean;
  events: { action: string; created_at: string; detail: unknown }[];
};
function OrderCard({
  row,
  mail,
  reload,
}: {
  row: LeadOrder;
  mail: Mail[];
  reload: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [reference, setReference] = useState(""),
    [amount, setAmount] = useState(String(row.total_cents / 100)),
    [checked, setChecked] = useState(false),
    [notes, setNotes] = useState(row.internal_notes),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [events, setEvents] = useState<Dashboard["events"]>([]);
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
  async function history() {
    try {
      const d = await crmFetch<Dashboard>(`lead-shop?id=${row.id}`);
      setEvents(d.events);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <article className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <span className="crm-caption">
            {row.reference} · {new Date(row.created_at).toLocaleString("de-DE")}
          </span>
          <h3>{row.customer.company}</h3>
          <p>
            {row.quantity} Kontakte · {shopMoney(row.total_cents)} ·{" "}
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
          {open ? "Schließen" : "Bestellung öffnen"}
        </button>
      </div>
      {open && (
        <>
          <dl className="lead-summary">
            {Object.entries(row.customer).map(([key, value]) => (
              <div key={key}>
                <dt>
                  {{
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
                  }[key] || key}
                </dt>
                <dd>{value || "Nicht angegeben"}</dd>
              </div>
            ))}
          </dl>
          <p>
            Reservierung bis: {new Date(row.expires_at).toLocaleString("de-DE")}{" "}
            · Auszahlung: {row.bank.recipient} / {row.bank.iban}
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
              <h3>Zahlung zuordnen</h3>
              <p>
                Bankkonto tatsächlich prüfen. Die Website liest keine
                Kontoumsätze aus.
              </p>
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
                  Eindeutige Banktransaktionsreferenz
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
                  required
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <span>
                  Ich habe den tatsächlichen Zahlungseingang, Betrag und die
                  Zuordnung im Bankkonto geprüft.
                </span>
              </label>
              <div className="crm-actions">
                <button className="button" disabled={busy || !checked}>
                  Zahlung bestätigen und Bereitstellung auslösen
                </button>
                <button
                  className="button secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Unbezahlte Bestellung stornieren und Kontakte wieder freigeben?",
                      )
                    )
                      void action("cancel");
                  }}
                >
                  Bestellung stornieren
                </button>
              </div>
            </form>
          )}
          {row.paid_at && (
            <p>
              Zahlung bestätigt: {new Date(row.paid_at).toLocaleString("de-DE")}{" "}
              · Bereitstellung: {row.fulfillment_state} · Download:{" "}
              {row.revoked ? "Gesperrt" : "Nicht gesperrt"}
            </p>
          )}
          {row.error && <p role="alert">{row.error}</p>}
          <div className="crm-actions">
            {row.fulfillment_state === "failed" && row.status === "Bezahlt" && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => action("retry-file")}
              >
                Bereitstellung erneut einplanen
              </button>
            )}
            {row.status === "Bereitgestellt" && (
              <>
                <button
                  className="button secondary"
                  disabled={busy || row.revoked}
                  onClick={() => action("revoke")}
                >
                  Download sperren
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Download für weitere 90 Tage freigeben und E-Mail erneut einplanen?",
                      )
                    )
                      void action("renew");
                  }}
                >
                  Download erneuern und E-Mail senden
                </button>
              </>
            )}
          </div>
          <h3>E-Mail-Verlauf</h3>
          {mail.map((m) => (
            <div key={m.id}>
              <p>
                {m.kind === "download" ? "Downloadlink" : "Bestellbestätigung"}:{" "}
                {m.status}
                {m.sent_at
                  ? " · " + new Date(m.sent_at).toLocaleString("de-DE")
                  : ""}{" "}
                {m.error}
              </p>
              {m.status === "unknown" && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Gesendetes Postfach und SMTP-Protokoll geprüft? Erneut senden kann eine doppelte E-Mail erzeugen.",
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
          <h3>Protokoll</h3>
          <ul>
            {events.map((e, i) => (
              <li key={i}>
                {new Date(e.created_at).toLocaleString("de-DE")} · {e.action}
              </li>
            ))}
          </ul>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </article>
  );
}
function CatalogImport({ reload }: { reload: () => Promise<void> }) {
  const rows = useRef<string[][]>([]),
    [headers, setHeaders] = useState<string[]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [source, setSource] = useState(""),
    [date, setDate] = useState(""),
    [rights, setRights] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function file(file?: File) {
    if (!file) return;
    setMessage("");
    setHeaders([]);
    rows.current = [];
    if (file.size > 150000000) {
      setMessage(
        "CSV darf höchstens 150 MB groß sein. Größere Bestände in mehrere Dateien aufteilen.",
      );
      return;
    }
    setBusy(true);
    try {
      const parsed = parseCsv(await file.text());
      const head = parsed.shift();
      if (!head || !parsed.length)
        throw new Error("CSV enthält keine Datensätze.");
      if (parsed.length > 500000)
        throw new Error("Höchstens 500.000 Zeilen pro Datei.");
      rows.current = parsed;
      setHeaders(head);
      const map: Record<string, string> = {};
      head.forEach((v, i) => {
        const h = v.toLowerCase().replace(/[^a-z]/g, "");
        if (["firmenname", "firma", "name", "company"].includes(h))
          map.name = String(i);
        if (["telefonnummer", "telefon", "phone"].includes(h))
          map.phone = String(i);
        if (["emailadresse", "email"].includes(h)) map.email = String(i);
        if (["website", "webseite", "url"].includes(h)) map.website = String(i);
      });
      setMapping(map);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    setBusy(true);
    setMessage("");
    const batchId = crypto.randomUUID();
    let inserted = 0,
      invalid = 0,
      duplicates = 0;
    try {
      for (let offset = 0; offset < rows.current.length; offset += 1000) {
        if (offset) await new Promise((resolve) => setTimeout(resolve, 650));
        const batch = rows.current
          .slice(offset, offset + 1000)
          .map((r) =>
            Object.fromEntries(
              ["name", "phone", "email", "website"].map((k) => [
                k,
                (r[Number(mapping[k])] || "").trim(),
              ]),
            ),
          );
        const d = await crmFetch<{
          inserted: number;
          invalid: number;
          duplicates: number;
        }>("lead-shop", {
          method: "POST",
          body: JSON.stringify({
            action: "import",
            batchId,
            source,
            verifiedAt: date,
            rightsConfirmed: rights,
            rows: batch,
          }),
        });
        inserted += d.inserted;
        invalid += d.invalid;
        duplicates += d.duplicates;
        setMessage(
          `${Math.min(offset + 1000, rows.current.length)} / ${rows.current.length} verarbeitet · ${inserted} neu · ${invalid} ungültig · ${duplicates} Duplikate`,
        );
      }
      await reload();
      setMessage((m) => "Import abgeschlossen. " + m);
    } catch (e) {
      setMessage(
        (m) =>
          m +
          " · " +
          (e as Error).message +
          " Bereits gespeicherte Kontakte bleiben erhalten. Beim erneuten Import werden Duplikate übersprungen.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="crm-panel">
      <h2>Verkaufsbestand importieren</h2>
      <p>
        Nur vorhandene, rechtmäßig weitergebbare und auf bestehende Unternehmen
        geprüfte Kontakte. Keine Übernahme aus der normalen CRM-Lead-Tabelle.
        Die Daten werden exklusiv verkauft.
      </p>
      <label className="form-field">
        CSV-Datei
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={(e) => void file(e.target.files?.[0])}
        />
      </label>
      {headers.length > 0 && (
        <>
          <div className="crm-form-grid">
            {[
              ["name", "Firmenname"],
              ["phone", "Telefonnummer"],
              ["email", "E-Mail-Adresse"],
              ["website", "Website"],
            ].map(([key, label]) => (
              <label className="form-field" key={key}>
                {label}
                <select
                  value={mapping[key] ?? ""}
                  disabled={busy}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">Spalte auswählen</option>
                  {headers.map((h, i) => (
                    <option value={i} key={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p>
            {rows.current.length.toLocaleString("de-DE")} Zeilen. Alle vier
            Felder sind erforderlich. Doppelte Website-Domains, Telefonnummern
            oder E-Mail-Adressen werden auch über frühere Importe hinweg
            übersprungen; vorhandene und verkaufte Daten werden nicht
            überschrieben.
          </p>
          <label className="form-field">
            Datenquelle und Nachweis des Weitergaberechts
            <textarea
              required
              minLength={5}
              maxLength={2000}
              disabled={busy}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
          <label className="form-field">
            Datum der Bestandsprüfung
            <input
              type="date"
              required
              value={date}
              disabled={busy}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={rights}
              disabled={busy}
              onChange={(e) => setRights(e.target.checked)}
            />
            <span>
              Ich bestätige die dokumentierte Datenquelle, die erforderlichen
              Weitergaberechte, die Prüfung auf bestehende Unternehmen und die
              zulässige Verarbeitung der Kontaktdaten.
            </span>
          </label>
          <button
            className="button"
            disabled={
              busy ||
              !rights ||
              !date ||
              source.trim().length < 5 ||
              ["name", "phone", "email", "website"].some(
                (k) => mapping[k] === undefined || mapping[k] === "",
              )
            }
            onClick={run}
          >
            {busy ? "Import läuft …" : "Vorhandene Kontakte importieren"}
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export function LeadShopAdmin() {
  const [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0),
    [status, setStatus] = useState("");
  const [bank, setBank] = useState({ enabled: false, recipient: "", iban: "" }),
    [bankBusy, setBankBusy] = useState(false);
  async function load() {
    try {
      const d = await crmFetch<Dashboard>(
        `lead-shop?offset=${offset}&status=${encodeURIComponent(status)}`,
      );
      setData(d);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15 * 60 * 1000);
    const changed = () => void load();
    window.addEventListener("crm-change", changed);
    return () => {
      clearInterval(timer);
      window.removeEventListener("crm-change", changed);
    };
  }, [offset, status]);
  useEffect(() => {
    if (data?.settings) setBank(data.settings);
  }, [data?.settings.recipient, data?.settings.iban, data?.settings.enabled]);
  async function saveBank(e: React.FormEvent) {
    e.preventDefault();
    setBankBusy(true);
    try {
      await crmFetch("lead-shop", {
        method: "POST",
        body: JSON.stringify({ action: "settings", settings: bank }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBankBusy(false);
    }
  }
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / CRM</span>
        <h1>Lead-Verkauf</h1>
        <p>
          Bestellungen, Bankabgleich, exklusive Kontakte und Downloadfreigaben.
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
              {data.status.stock.toLocaleString("de-DE")} frei verfügbare
              Kontakte · Öffentlicher Verkauf:{" "}
              {data.status.available
                ? "Bereit"
                : "Gesperrt – Bankkonfiguration, Bestand, SMTP und Zeitgeber prüfen"}
            </p>
            <p>
              Letzter Versandlauf:{" "}
              {data.clock?.worker_seen
                ? new Date(data.clock.worker_seen).toLocaleString("de-DE")
                : "Noch keiner"}
              . Bankkontrolle durch die Buchhaltung alle 15 Minuten;
              Kontoumsätze werden nicht automatisch abgerufen.
            </p>
            <button className="button secondary" onClick={load}>
              Bestellungen aktualisieren
            </button>
          </section>
          {data.administrator && (
            <>
              <section className="crm-panel">
                <h2>Zahlungskonfiguration</h2>
                <form onSubmit={saveBank}>
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
                  </div>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={bank.enabled}
                      onChange={(e) =>
                        setBank({ ...bank, enabled: e.target.checked })
                      }
                    />
                    <span>
                      Verkauf aktivieren. Neue Bestellungen übernehmen diese
                      Bankdaten; vorhandene Bestellungen behalten ihre
                      gespeicherten Zahlungsinformationen.
                    </span>
                  </label>
                  <button className="button" disabled={bankBusy}>
                    Bankdaten speichern
                  </button>
                </form>
              </section>
              <CatalogImport reload={load} />
            </>
          )}
          <section className="crm-panel">
            <h2>Bestellungen ({data.count})</h2>
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
                  "Bereitgestellt",
                  "Storniert",
                  "Abgelaufen",
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
