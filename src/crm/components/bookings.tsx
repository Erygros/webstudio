"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
import { euro } from "@/data/bookable-services";
type Row = {
  id: string;
  reference: string;
  kind: string;
  customer: {
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    street: string;
    house_number: string;
    postcode: string;
    city: string;
  };
  package: { name: string; scope: string[] };
  status: string;
  amount_cents: number;
  interval: string;
  company_id: string;
  project_id: string | null;
  description: string;
  requirements: string;
  callback: string;
  service_start: string | null;
  next_on: string | null;
  ends_on: string | null;
  created_at: string;
  terms: Record<string, unknown>;
};
type Declaration = {
  id: string;
  booking_id: string | null;
  kind: string;
  received_at: string;
  reviewed_at: string | null;
  data: {
    name: string;
    email: string;
    reference: string;
    termination: string;
    end: string;
    reason: string;
  };
};
type Cycle = {
  id: string;
  invoice_id: string;
  cycle: number;
  payment_id: string | null;
  period_on: string | null;
  crm_invoices: {
    number: string;
    total: number;
    payment_status: string;
    due_on: string;
  };
};
type Mail = {
  id: string;
  subject: string;
  recipient: string;
  status: string;
  error: string;
  sent_at: string | null;
};
type Detail = {
  booking: Row;
  cycles: Cycle[];
  mail: Mail[];
  events: { id: string; event: string; created_at: string }[];
  declarations: Declaration[];
  role: string;
};
type Listing = {
  rows: Row[];
  count: number;
  ready: boolean;
  consultation: boolean;
  role: string;
  declarations: Declaration[];
  clock: {
    last_tick: string | null;
    worker_last_seen: string | null;
    last_success: string | null;
    error: string;
  } | null;
  mailAlerts: Mail[];
};
const statuses = [
  "Beratung angefragt",
  "Buchung eingegangen",
  "Wartet auf Zahlung",
  "Bezahlt",
  "In Bearbeitung",
  "Abgeschlossen",
  "Storniert",
];
export function Bookings({ initialId }: { initialId?: string }) {
  const [list, setList] = useState<Listing | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [id, setId] = useState(initialId || ""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [date, setDate] = useState(""),
    [bankReference, setBankReference] = useState(""),
    [checked, setChecked] = useState(false),
    [nextStatus, setNextStatus] = useState("In Bearbeitung");
  async function load() {
    const l = await crmFetch<Listing>(
      `bookings?page=${page}&status=${encodeURIComponent(status)}`,
    );
    setList(l);
    if (id)
      setDetail(
        await crmFetch<Detail>(`bookings?id=${encodeURIComponent(id)}`),
      );
    else setDetail(null);
  }
  useEffect(() => {
    setMessage("");
    void load().catch((e) => setMessage(e.message));
    const refresh = () => {
      void load().catch((e) => setMessage(e.message));
    };
    window.addEventListener("crm-change", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("crm-change", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [id, page, status]); // eslint-disable-line react-hooks/exhaustive-deps
  async function action(
    action: string,
    data: Record<string, string | boolean> = {},
  ) {
    if (!id || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await crmFetch("bookings", {
        method: "POST",
        body: JSON.stringify({ id, action, data }),
      });
      setChecked(false);
      await load();
      setMessage("Gespeichert. Versand und Rechnungen siehe Verlauf.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  const accounting =
    list?.role === "administrator" || list?.role === "buchhaltung";
  const declaration = (d: Declaration) => (
    <article key={d.id} className="crm-panel">
      <h3>
        {d.kind === "withdrawal" ? "Widerruf" : "Kündigung"}: {d.data.reference}
      </h3>
      <p>
        {d.data.name} · {d.data.email}
        <br />
        {d.data.termination} · Gewünschtes Ende: {d.data.end || "Nächstmöglich"}
        <br />
        {d.data.reason}
        <br />
        Eingang:{" "}
        {new Date(d.received_at).toLocaleString("de-DE", {
          timeZone: "Europe/Berlin",
        })}
      </p>
      {!d.booking_id ? (
        <div>
          <p>
            Keine automatische Zuordnung. Kundenangaben prüfen und Erklärung
            zuordnen/bearbeiten; Eingang bleibt gespeichert.
          </p>
          {id && accounting && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    `Kundenidentität geprüft und diese Erklärung eindeutig der geöffneten Buchung ${detail?.booking.reference || id} zuordnen?`,
                  )
                )
                  void action("declaration_link", {
                    declaration_id: d.id,
                    checked: true,
                  });
              }}
            >
              Geprüft der geöffneten Buchung zuordnen
            </button>
          )}
        </div>
      ) : (
        <>
          {d.booking_id !== id ? (
            <button
              className="button secondary"
              onClick={() => setId(d.booking_id!)}
            >
              Buchung öffnen
            </button>
          ) : (
            !d.reviewed_at && (
              <>
                <p>
                  Vertragsende, Widerruf, Erstattung und gegebenenfalls
                  Rechnungsstorno zuerst bearbeiten. Bis zur Prüfung werden
                  keine neuen Monatsrechnungen erzeugt.
                </p>
                <button
                  className="button secondary"
                  disabled={busy || !accounting}
                  onClick={() => {
                    if (
                      confirm(
                        "Erklärung fachlich bearbeitet, Vertragsende/Storno/Erstattung erfasst? Erst danach als geprüft markieren.",
                      )
                    )
                      void action("declaration_review", {
                        declaration_id: d.id,
                      });
                  }}
                >
                  Bearbeitung als geprüft markieren
                </button>
              </>
            )
          )}
        </>
      )}
    </article>
  );
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / CRM</span>
        <h1>Buchungen & Beratung</h1>
        <p>
          Website-Buchungen, Rechnungen, tatsächliche Zahlungseingänge und
          Vertragsänderungen.
        </p>
      </header>
      {!!list?.mailAlerts?.length && (
        <section className="crm-panel">
          <h2>Versandstatus prüfen</h2>
          {list.mailAlerts.map((m) => (
            <article key={m.id}>
              <p>
                {m.subject} · {m.recipient}
                <br />
                {m.error}
              </p>
              {accounting && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      !confirm(
                        "Postfach und SMTP geprüft: Diese Nachricht wurde tatsächlich nicht versendet?",
                      )
                    )
                      return;
                    setBusy(true);
                    void crmFetch("bookings", {
                      method: "POST",
                      body: JSON.stringify({
                        action: "mail_retry",
                        data: { mail_id: m.id, checked: true },
                      }),
                    })
                      .then(load)
                      .catch((e) => setMessage(e.message))
                      .finally(() => setBusy(false));
                  }}
                >
                  Nach bestätigtem Nichtversand erneut freigeben
                </button>
              )}
            </article>
          ))}
        </section>
      )}
      <section className="crm-panel">
        <h2>Automatisierung</h2>
        <p>
          Letzter Versand-/Abrechnungslauf:{" "}
          {list?.clock?.worker_last_seen
            ? new Date(list.clock.worker_last_seen).toLocaleString("de-DE")
            : "Noch kein bestätigter Lauf"}
          <br />
          Letzter vollständig erfolgreicher Lauf:{" "}
          {list?.clock?.last_success
            ? new Date(list.clock.last_success).toLocaleString("de-DE")
            : "Noch keiner"}
        </p>
        {list?.clock?.error && <p role="alert">{list.clock.error}</p>}
        {list && !list.clock && (
          <p>
            Scheduler-Migration 202610190002_booking_scheduler.sql noch
            einrichten.
          </p>
        )}
        <button
          className="button secondary"
          onClick={() => void load().catch((e) => setMessage(e.message))}
        >
          Ansicht aktualisieren
        </button>
      </section>
      {message && (
        <p role="status" className="crm-panel">
          {message}
        </p>
      )}
      {list && (!list.ready || !list.consultation) && (
        <section className="crm-panel">
          <h2>Einrichtung vervollständigen</h2>
          <p>
            Für Buchungen werden SMTP, die Migration, vollständige
            Unternehmensdaten, Steuernummer oder USt-ID und eine gültige
            Bankverbindung benötigt. Für Beratungsanfragen genügen Datenbank und
            SMTP.
          </p>
          <Link href="/crm/einstellungen">
            Unternehmensdaten und SMTP einrichten
          </Link>
        </section>
      )}
      <section className="crm-panel">
        <label className="form-field">
          Statusfilter
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Alle</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="booking-table-scroll">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Buchung</th>
                <th>Kunde</th>
                <th>Paket</th>
                <th>Betrag</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list?.rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => {
                        setId(b.id);
                        setDate("");
                        setChecked(false);
                      }}
                    >
                      {b.reference}
                    </button>
                  </td>
                  <td>
                    {b.customer.name}
                    <br />
                    {b.customer.email}
                  </td>
                  <td>{b.package.name}</td>
                  <td>
                    {euro(b.amount_cents)}
                    {b.interval === "monthly" && b.kind === "booking"
                      ? " / Monat"
                      : ""}
                  </td>
                  <td>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list && !list.rows.length && <p>Keine passenden Buchungen.</p>}
        <div className="crm-actions">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Zurück
          </button>
          <span>
            Seite {page + 1} · {list?.count ?? "…"} Vorgänge
          </span>
          <button
            disabled={!list || (page + 1) * 25 >= list.count}
            onClick={() => setPage((p) => p + 1)}
          >
            Weiter
          </button>
        </div>
      </section>
      {detail && (
        <section className="crm-panel">
          <h2>
            {detail.booking.reference} · {detail.booking.package.name}
          </h2>
          <p>
            {detail.booking.status} ·{" "}
            {detail.booking.kind === "consultation"
              ? "Kostenlose Beratung"
              : euro(detail.booking.amount_cents) +
                (detail.booking.interval === "monthly"
                  ? " / Monat"
                  : " einmalig")}
          </p>
          <p>
            {detail.booking.customer.contact_name} ·{" "}
            {detail.booking.customer.name}
            <br />
            {detail.booking.customer.email} · {detail.booking.customer.phone}
            <br />
            {detail.booking.customer.street}{" "}
            {detail.booking.customer.house_number},{" "}
            {detail.booking.customer.postcode} {detail.booking.customer.city}
          </p>
          <p style={{ whiteSpace: "pre-line" }}>
            {detail.booking.description}
            <br />
            Zusatzwünsche (nicht beauftragt):{" "}
            {detail.booking.requirements || "Keine"}
            <br />
            Rückrufwunsch: {detail.booking.callback || "Keiner"}
          </p>
          <ul>
            {detail.booking.package.scope.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="crm-actions">
            <Link
              href={`/crm/${detail.booking.project_id ? "kunden" : "leads"}/${detail.booking.company_id}`}
            >
              Kundenakte
            </Link>
            {detail.booking.project_id && (
              <Link href={`/crm/projekte/${detail.booking.project_id}`}>
                Projekt öffnen
              </Link>
            )}
          </div>
          <details>
            <summary>
              Vertragsinformationen und dokumentierte Einwilligungen
            </summary>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {JSON.stringify(detail.booking.terms, null, 2)}
            </pre>
          </details>
          <h3>Rechnungen & Zahlungseingänge</h3>
          {accounting && (
            <>
              <label className="form-field">
                Datum des tatsächlichen Zahlungseingangs / abgestimmter
                Leistungsbeginn / Vertragsende
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="form-field">
                Bankreferenz des tatsächlich geprüften Zahlungseingangs
                <input
                  maxLength={500}
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <span>
                  Ich habe den Zahlungseingang auf dem Bankkonto tatsächlich
                  geprüft.
                </span>
              </label>
            </>
          )}
          {detail.cycles.map((c) => (
            <article className="crm-panel" key={c.id}>
              <p>
                <Link href={`/crm/rechnungen/${c.invoice_id}`}>
                  {c.crm_invoices.number}
                </Link>{" "}
                · {euro(Math.round(c.crm_invoices.total * 100))} ·{" "}
                {c.crm_invoices.payment_status} · Fällig:{" "}
                {c.crm_invoices.due_on} · Abschnitt {c.cycle}
              </p>
              {accounting && !c.payment_id && (
                <div className="crm-actions">
                  <button
                    className="button"
                    disabled={busy || !date || !bankReference || !checked}
                    onClick={() =>
                      void action("payment", {
                        cycle_id: c.id,
                        paid_on: date,
                        bank_reference: bankReference,
                      })
                    }
                  >
                    Tatsächlichen Zahlungseingang bestätigen
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      void action("reminder", { invoice_id: c.invoice_id })
                    }
                  >
                    Zahlungserinnerung senden
                  </button>
                </div>
              )}
            </article>
          ))}
          {accounting && detail.booking.kind === "booking" && (
            <>
              <h3>Leistungsbeginn & Vertragsende</h3>
              <p>
                Start: {detail.booking.service_start || "Noch abzustimmen"} ·
                Nächste Rechnung: {detail.booking.next_on || "Keine geplant"} ·
                Vertragsende: {detail.booking.ends_on || "Nicht festgelegt"}
              </p>
              <p>
                Das gewählte Datum muss mit dem Kunden abgestimmt sein. Bei
                Verbrauchern die dokumentierten Erklärungen zum vorzeitigen
                Beginn und die Widerrufsfrist beachten.
              </p>
              <div className="crm-actions">
                <button
                  className="button secondary"
                  disabled={busy || !date || !!detail.booking.service_start}
                  onClick={() => void action("start", { date })}
                >
                  Abgestimmten Leistungsbeginn speichern
                </button>
                {detail.booking.interval === "monthly" && (
                  <button
                    className="button secondary"
                    disabled={busy || !date}
                    onClick={() => void action("end", { date })}
                  >
                    Vertragsende bestätigen
                  </button>
                )}
              </div>
            </>
          )}
          <h3>Bearbeitungsstatus</h3>
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
          >
            {["In Bearbeitung", "Abgeschlossen", "Storniert"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              if (
                nextStatus !== "Storniert" ||
                confirm(
                  "Buchung stornieren? Rechnungsstorno und Erstattungen müssen zusätzlich in der Buchhaltung erfasst werden.",
                )
              )
                void action("status", { status: nextStatus });
            }}
          >
            Status speichern
          </button>
          <p>
            Eine Statusänderung storniert keine ausgestellte Rechnung und führt
            keine Erstattung aus. Dazu die bestehende Rechnungsverwaltung
            nutzen.
          </p>
          {detail.declarations.map(declaration)}
          <h3>E-Mail-Protokoll</h3>
          {detail.mail.map((m) => (
            <article key={m.id}>
              <p>
                {m.subject} · {m.recipient}
                <br />
                Status: {m.status}{" "}
                {m.sent_at && new Date(m.sent_at).toLocaleString("de-DE")}
                <br />
                {m.error}
              </p>
              {m.status === "unknown" && accounting && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Postfach und SMTP geprüft: Diese Nachricht wurde tatsächlich nicht versendet?",
                      )
                    )
                      void action("mail_retry", {
                        mail_id: m.id,
                        checked: true,
                      });
                  }}
                >
                  Nach bestätigtem Nichtversand erneut freigeben
                </button>
              )}
            </article>
          ))}
          <h3>Verlauf</h3>
          {detail.events.map((e) => (
            <p key={e.id}>
              {new Date(e.created_at).toLocaleString("de-DE")} · {e.event}
            </p>
          ))}
        </section>
      )}
      {list?.declarations.length ? (
        <section className="crm-panel">
          <h2>Offene Vertragsklärungen</h2>
          {list.declarations.map(declaration)}
        </section>
      ) : null}
    </>
  );
}
