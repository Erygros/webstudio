"use client";
import { useEffect, useState } from "react";
import { reviewBank, reviewConditions, reviewWithdrawal } from "@/lib/reviews";
type Offer = {
  reference: string;
  name: string;
  platform: string;
  reviewUrl: string;
  commissionedAt: string | null;
  status: string;
};
export function ReviewOrder({ id, token }: { id: string; token: string }) {
  const [offer, setOffer] = useState<Offer | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState("");
  const [customerType, setCustomerType] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/bewertungen/auftrag?${new URLSearchParams({ id, token })}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setOffer(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [id, token]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/bewertungen/auftrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          id,
          token,
          terms: data.terms === "yes",
          earlyStart: data.earlyStart === "yes",
          earlyKnowledge: data.earlyKnowledge === "yes",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setSuccess(result.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!offer)
    return (
      <div className="form-panel" role={error ? "alert" : "status"}>
        {error || "Dein Angebot wird geladen …"}
      </div>
    );
  if (success || offer.commissionedAt)
    return (
      <div className="form-panel success-panel" role="status">
        <h2>Beauftragung erfasst.</h2>
        <p>
          {success ||
            `Deine Beauftragung für ${offer.reference} ist bereits gespeichert. Bitte nicht erneut beauftragen.`}
        </p>
        <p>
          Vorauszahlung: 59,00 € · Empfänger: {reviewBank.holder}
          <br />
          IBAN: {reviewBank.iban}
          <br />
          Verwendungszweck: {offer.reference}
        </p>
        <p>
          Bitte nur einmal überweisen. Bei erfolgloser Entfernung wird die
          Vorauszahlung vollständig erstattet.
        </p>
      </div>
    );
  return (
    <form className="form-panel review-order" onSubmit={submit}>
      <h2>Deine einzelne Bewertung</h2>
      <p>
        <strong>{offer.reference}</strong> · {offer.platform}
        <br />
        <a href={offer.reviewUrl} target="_blank" rel="noopener noreferrer">
          Bewertung öffnen
        </a>
      </p>
      <fieldset disabled={busy}>
        <label className="form-field">
          Rechnungsempfänger *
          <input
            name="billingName"
            defaultValue={offer.name}
            required
            maxLength={150}
          />
        </label>
        <label className="form-field">
          Straße und Hausnummer *
          <input
            name="street"
            required
            maxLength={150}
            autoComplete="street-address"
          />
        </label>
        <div className="field-grid">
          <label className="form-field">
            Postleitzahl *
            <input
              name="postcode"
              required
              maxLength={20}
              autoComplete="postal-code"
            />
          </label>
          <label className="form-field">
            Ort *
            <input
              name="city"
              required
              maxLength={100}
              autoComplete="address-level2"
            />
          </label>
        </div>
        <label className="form-field">
          Land *
          <input
            name="country"
            defaultValue="Deutschland"
            required
            maxLength={100}
            autoComplete="country-name"
          />
        </label>
        <label className="form-field">
          Ich beauftrage als
          <select
            name="customerType"
            required
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
          >
            <option value="" disabled>
              Bitte auswählen
            </option>
            <option value="business">
              Unternehmer im Rahmen meiner gewerblichen/beruflichen Tätigkeit
            </option>
            <option value="consumer">Verbraucher als Privatperson</option>
          </select>
        </label>
        <div className="review-contract">
          <h3>Leistungs- und Vertragsbedingungen</h3>
          {reviewConditions.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h3>Widerruf für Verbraucher</h3>
          {reviewWithdrawal.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {customerType === "consumer" && (
          <>
            <label className="consent">
              <input type="checkbox" name="earlyStart" value="yes" />
              <span>
                Optional: Ich verlange ausdrücklich, dass die Dienstleistung
                nach Zahlungseingang und Mandatsklärung bereits vor Ablauf der
                14-tägigen Widerrufsfrist beginnt.
              </span>
            </label>
            <label className="consent">
              <input type="checkbox" name="earlyKnowledge" value="yes" />
              <span>
                Optional zum vorzeitigen Beginn: Mir ist bekannt, dass mein
                Widerrufsrecht bei vollständiger Vertragserfüllung durch den
                Unternehmer erlischt. Ohne beide Erklärungen beginnt die
                Bearbeitung für Verbraucher grundsätzlich nach Ablauf der
                Widerrufsfrist.
              </span>
            </label>
          </>
        )}
        <label className="consent">
          <input type="checkbox" name="terms" value="yes" required />
          <span>
            Ich beauftrage die beschriebene Abwicklung für genau diese Bewertung
            zu den oben angegebenen Bedingungen. Ich bin selbst betroffen oder
            zur Beauftragung für das betroffene Unternehmen berechtigt.
          </span>
        </label>
        <div className="review-summary">
          <h3>59,00 € Vorauszahlung per Überweisung</h3>
          <p>
            Vollständiger Endpreis: 59,00 € nur bei erfolgreicher Entfernung,
            einschließlich der vorgesehenen außergerichtlichen anwaltlichen
            Tätigkeit. Keine gesonderte Umsatzsteuer gemäß § 19 UStG. Bei
            Misserfolg vollständige Rückerstattung. Keine weiteren Kosten ohne
            gesonderte Vereinbarung.
          </p>
          <p>
            Vertragspartner für die Abwicklung: Enrico Gross, Webstudio Expert.
            Anwaltliche Prüfung: IT-ADVO Rechtsanwälte Simbach & Kessler.
          </p>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <button className="button" type="submit" disabled={busy}>
          {busy
            ? "Beauftragung wird gespeichert …"
            : "Zahlungspflichtig beauftragen"}
        </button>
      </fieldset>
    </form>
  );
}
