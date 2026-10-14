"use client";
import { useEffect, useState } from "react";
import Decimal from "decimal.js";
import { crmFetch } from "./api";
type Stats = {
  counts: { label: string; value: number | null }[];
  callsByDay: Record<string, number>;
  statuses: Record<string, number>;
  payments: { amount: string | number; paid_on: string }[];
  conversion: { won: number; total: number };
  quoteAcceptance: { accepted: number; total: number };
};
export function Statistics() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  useEffect(() => {
    void crmFetch<Stats>(`statistics?from=${from}&to=${to}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [from, to]);
  const revenue =
    data?.payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0)) ||
    new Decimal(0);
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Auswertung</span>
        <h1>Entwicklung nachvollziehen.</h1>
        <div className="crm-filterbar">
          <label>
            Von{" "}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Bis{" "}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <a
            className="button secondary"
            href={`/api/crm/report?from=${from}&to=${to}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF-Bericht
          </a>
        </div>
      </header>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="crm-metrics">
            {data.counts.map((c) => (
              <article key={c.label}>
                <span>{c.label}</span>
                <strong>{c.value ?? "Kein Zugriff"}</strong>
              </article>
            ))}
            <article>
              <span>Erfasste Zahlungseingänge</span>
              <strong>{revenue.toFixed(2).replace(".", ",")} €</strong>
            </article>
            <article>
              <span>Lead-zu-Kunde-Konversion</span>
              <strong>
                {data.conversion.total
                  ? Math.round(
                      (data.conversion.won / data.conversion.total) * 100,
                    )
                  : 0}
                %
              </strong>
            </article>
            <article>
              <span>Angebotsannahmequote</span>
              <strong>
                {data.quoteAcceptance.total
                  ? Math.round(
                      (data.quoteAcceptance.accepted /
                        data.quoteAcceptance.total) *
                        100,
                    )
                  : 0}
                %
              </strong>
            </article>
          </div>
          <div className="crm-dashboard-grid">
            <section className="crm-panel">
              <h2>Anrufe pro Tag</h2>
              {Object.entries(data.callsByDay).length ? (
                Object.entries(data.callsByDay).map(([day, n]) => (
                  <div className="crm-chart-row" key={day}>
                    <span>{day}</span>
                    <meter
                      min={0}
                      max={Math.max(...Object.values(data.callsByDay), 1)}
                      value={n}
                    >
                      {n}
                    </meter>
                    <strong>{n}</strong>
                  </div>
                ))
              ) : (
                <p className="crm-empty">
                  Noch keine Anrufdaten in diesem Zeitraum.
                </p>
              )}
            </section>
            <section className="crm-panel">
              <h2>Leadstatus</h2>
              {Object.entries(data.statuses).map(([status, n]) => (
                <div className="crm-chart-row" key={status}>
                  <span>{status}</span>
                  <meter
                    min={0}
                    max={Math.max(...Object.values(data.statuses), 1)}
                    value={n}
                  >
                    {n}
                  </meter>
                  <strong>{n}</strong>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
      <section className="crm-panel">
        <h2>Optionaler Leseassistent</h2>
        <p>
          Der Assistent erhält nur einen begrenzten berechtigten Datenkontext
          und führt keine Aktionen aus. Ohne KI-Konfiguration bleibt die normale
          Auswertung nutzbar.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void crmFetch<{ answer: string }>("assistant", {
              method: "POST",
              body: JSON.stringify({ question }),
            })
              .then((d) => setAnswer(d.answer))
              .catch((e) => setAnswer(e.message));
          }}
        >
          <label className="form-field">
            Frage
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Welche Follow-ups sind fällig?"
            />
          </label>
          <button className="button">Frage stellen</button>
        </form>
        {answer && (
          <p className="crm-ai-answer" role="status">
            {answer}
          </p>
        )}
      </section>
    </>
  );
}
