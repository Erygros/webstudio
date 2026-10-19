"use client";
import { useRef, useState } from "react";
export function ContractDeclaration({
  withdrawal = false,
}: {
  withdrawal?: boolean;
}) {
  const key = useRef("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const [data, setData] = useState({
    name: "",
    email: "",
    reference: "",
    termination: "Ordentlich",
    end: "",
    reason: "",
    website: "",
  });
  const [review, setReview] = useState(false);
  async function send() {
    setBusy(true);
    setMessage("");
    key.current ||= crypto.randomUUID();
    try {
      const r = await fetch("/api/vertragserklaerung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          key: key.current,
          kind: withdrawal ? "withdrawal" : "cancellation",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setReceipt(
        d.receipt ||
          `Deine Erklärung wurde am ${new Date(d.received_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} gespeichert. Vorgang: ${d.id}.`,
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Eingang unklar. Bitte direkt per E-Mail senden.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div className="form-panel">
        <h2>Deine Erklärung ist eingegangen.</h2>
        <p style={{ whiteSpace: "pre-line" }} role="status">
          {receipt}
        </p>
        <p>
          Eine Eingangsbestätigung ist für den unverzüglichen E-Mail-Versand
          vorgemerkt.
        </p>
        <button
          className="button"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([receipt], { type: "text/plain;charset=utf-8" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "vertragserklaerung.txt";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Erklärung und Eingangszeit speichern
        </button>
      </div>
    );
  return (
    <form
      className="form-panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!review) setReview(true);
        else void send();
      }}
    >
      <h2>
        {review ? "Erklärung prüfen und bestätigen" : "Deine Vertragsangaben"}
      </h2>
      {review ? (
        <>
          <dl className="booking-summary">
            {Object.entries(data)
              .filter(
                ([k]) =>
                  k !== "website" &&
                  (!withdrawal || !["termination", "end"].includes(k)),
              )
              .map(([k, v]) => (
                <div key={k}>
                  <dt>
                    {
                      {
                        name: "Name",
                        email: "E-Mail",
                        reference: "Vertrag",
                        termination: "Kündigungsart",
                        end: "Gewünschtes Ende",
                        reason: "Nachricht",
                      }[k]
                    }
                  </dt>
                  <dd>
                    {v ||
                      (k === "end"
                        ? "Zum nächstmöglichen Zeitpunkt"
                        : "Keine Angabe")}
                  </dd>
                </div>
              ))}
          </dl>
          <p>
            Mit der folgenden Schaltfläche übermittelst du deine{" "}
            {withdrawal ? "Widerrufserklärung" : "Kündigungserklärung"}.
          </p>
        </>
      ) : (
        <>
          <div className="field-grid">
            {(
              [
                ["name", "Name"],
                ["email", "E-Mail-Adresse"],
                [
                  "reference",
                  "Buchungsnummer oder eindeutige Vertragsbezeichnung",
                ],
              ] as const
            ).map(([k, label]) => (
              <label className="form-field" key={k}>
                {label}
                <input
                  required
                  maxLength={k === "email" ? 254 : 160}
                  type={k === "email" ? "email" : "text"}
                  value={data[k]}
                  onChange={(e) => setData({ ...data, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          {!withdrawal && (
            <>
              <label className="form-field">
                Art der Kündigung
                <select
                  value={data.termination}
                  onChange={(e) =>
                    setData({ ...data, termination: e.target.value })
                  }
                >
                  <option>Ordentlich</option>
                  <option>Außerordentlich</option>
                </select>
              </label>
              <label className="form-field">
                Gewünschtes Vertragsende (optional; sonst nächstmöglicher
                Zeitpunkt)
                <input
                  type="date"
                  value={data.end}
                  onChange={(e) => setData({ ...data, end: e.target.value })}
                />
              </label>
            </>
          )}
          <label className="form-field">
            {!withdrawal && data.termination === "Außerordentlich"
              ? "Kündigungsgrund (erforderlich)"
              : "Nachricht (optional)"}
            <textarea
              required={!withdrawal && data.termination === "Außerordentlich"}
              maxLength={4000}
              value={data.reason}
              onChange={(e) => setData({ ...data, reason: e.target.value })}
            />
          </label>
          <div className="honeypot" aria-hidden="true">
            <input
              aria-label="Website"
              tabIndex={-1}
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
            />
          </div>
        </>
      )}
      {message && <p role="alert">{message}</p>}
      <div className="buttons">
        {review && (
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setReview(false);
              key.current = "";
            }}
          >
            Angaben ändern
          </button>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Wird übermittelt …"
            : !review
              ? "Angaben prüfen"
              : withdrawal
                ? "Widerruf bestätigen"
                : "jetzt kündigen"}
        </button>
      </div>
      <p>
        Auch per E-Mail an{" "}
        <a href="mailto:kontakt@webstudio-expert.de">
          kontakt@webstudio-expert.de
        </a>{" "}
        oder per Brief an Enrico Gross, Karinstraße 5, 44388 Dortmund möglich.
        Kein Kundenkonto erforderlich.
      </p>
    </form>
  );
}
