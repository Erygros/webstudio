"use client";
import { Turnstile, useTurnstile } from "@/components/turnstile";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  leadPrice,
  leadPrices,
  leadTerms,
  leadTermsVersion,
  shopMoney,
  leadUnitPrice,
} from "@/lib/lead-shop";

const fields = [
  ["company", "Firmenname", "text"],
  ["contact", "Ansprechpartner", "text"],
  ["street", "Straße", "text"],
  ["houseNumber", "Hausnummer", "text"],
  ["postcode", "Postleitzahl", "text"],
  ["city", "Ort", "text"],
  ["country", "Land", "text"],
  ["email", "E-Mail-Adresse", "email"],
  ["phone", "Telefonnummer", "tel"],
  ["vatId", "USt-IdNr. (optional)", "text"],
] as const;
type Receipt = {
  reference: string;
  totalCents: number;
  quantity: number;
  bank: { recipient: string; iban: string };
  status: string;
};
export function LeadStore({ available }: { available: boolean }) {
  const captcha = useTurnstile();
  const [quantity, setQuantity] = useState(1000),
    [selection, setSelection] = useState<{
      package: "Standard" | "Enterprise";
      quantity: number;
    } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
      country: "Deutschland",
    }),
    [step, setStep] = useState<"form" | "review">("form");
  const [accepted, setAccepted] = useState(false),
    [businessOnly, setBusinessOnly] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null),
    [token, setToken] = useState(""),
    [attempted, setAttempted] = useState(false);
  const requestId = useRef(""),
    checkout = useRef<HTMLDivElement>(null);
  async function select(pack: "Standard" | "Enterprise", n: number) {
    if (attempted || receipt) return;
    setSelection({ package: pack, quantity: n });
    setStep("form");
    setError("");
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const r = await fetch("/api/form-token", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error();
      setToken(d.token);
    } catch {
      setError("Bestellung aktuell nicht möglich. Bitte kontaktieren Sie uns.");
    }
    setTimeout(
      () =>
        checkout.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      30,
    );
  }
  async function submit() {
    if (!selection || !accepted || !businessOnly || busy || !captcha.ready)
      return;
    setBusy(true);
    setAttempted(true);
    setError("");
    try {
      const payload = {
        ...form,
        vatId: form.vatId || "",
        ...selection,
        requestId: requestId.current,
        quotedCents: leadPrice(selection.quantity),
        termsVersion: leadTermsVersion,
        termsAccepted: accepted,
        businessOnly,
        website: "",
      };
      // Keep a stable id for retries, including a browser refresh with identical data.
      const signature = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              JSON.stringify(
                Object.fromEntries(
                  Object.entries({ ...payload, requestId: "" }).sort(
                    ([a], [b]) => a.localeCompare(b),
                  ),
                ),
              ),
            ),
          ),
        ),
      )
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      try {
        const previous = JSON.parse(
          sessionStorage.getItem("lead-shop-request") || "null",
        );
        if (previous?.signature === signature && previous?.id) {
          payload.requestId = previous.id;
          requestId.current = previous.id;
        } else
          sessionStorage.setItem(
            "lead-shop-request",
            JSON.stringify({ signature, id: payload.requestId }),
          );
      } catch {
        /* in-memory id remains stable */
      }
      const response = await fetch("/api/leads/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          formToken: token,
          turnstileToken: captcha.token,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400) setAttempted(false);
        throw new Error(
          data.message ||
            "Bestellstatus unklar. Bitte kontaktieren Sie uns vor einer erneuten Bestellung.",
        );
      }
      setReceipt(data);
      window.dispatchEvent(new Event("crm-change"));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Bestellstatus unklar. Bitte kontaktieren Sie uns.",
      );
    } finally {
      captcha.reset();
      setBusy(false);
    }
  }
  return (
    <>
      <div className="lead-packages">
        <article className="lead-package">
          <span className="eyebrow">Standard</span>
          <h2>500 Firmenkontakte.</h2>
          <p>
            Ein klarer Einstieg. Einmaliger Kauf, exklusive Zusammenstellung.
          </p>
          <strong className="lead-price">{shopMoney(14900)}</strong>
          <p className="lead-unit">{leadUnitPrice(14900, 500)} pro Kontakt</p>
          <ul>
            <li>Firmenname und Website</li>
            <li>Telefonnummer und E-Mail-Adresse</li>
            <li>CSV-Datei per E-Mail nach Zahlungseingang</li>
            <li>Kein erneuter Verkauf durch uns</li>
          </ul>
          <button
            className="button"
            disabled={!available || attempted || !!receipt}
            onClick={() => select("Standard", 500)}
          >
            Jetzt kaufen
          </button>
        </article>
        <article className="lead-package">
          <span className="eyebrow">Enterprise</span>
          <h2>Ihr Umfang. Ihr Preis.</h2>
          <p>500 bis 5.000 Kontakte – mit Mengenrabatt.</p>
          <label className="form-field">
            Anzahl der Firmenkontakte
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {leadPrices.map((_, i) => (
                <option key={i} value={(i + 1) * 500}>
                  {((i + 1) * 500).toLocaleString("de-DE")} Kontakte
                </option>
              ))}
            </select>
          </label>
          <input
            aria-label="Anzahl der Firmenkontakte per Schieberegler"
            type="range"
            min="500"
            max="5000"
            step="500"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <div aria-live="polite">
            <strong className="lead-price">
              {shopMoney(leadPrice(quantity))}
            </strong>
            <p className="lead-unit">
              {leadUnitPrice(leadPrice(quantity), quantity)} pro Kontakt ·{" "}
              {quantity.toLocaleString("de-DE")} Kontakte
            </p>
          </div>
          <p className="lead-saving">
            {Math.round(
              (1 - leadPrice(quantity) / quantity / (14900 / 500)) * 100,
            )}{" "}
            % günstiger pro Kontakt gegenüber 500 Kontakten
          </p>
          <button
            className="button"
            disabled={!available || attempted || !!receipt}
            onClick={() => select("Enterprise", quantity)}
          >
            Jetzt kaufen
          </button>
        </article>
      </div>
      <p className="lead-tax">
        Alle Preise netto = vollständiger Zahlbetrag. Steuerbefreiung für
        Kleinunternehmer gemäß § 19 UStG; keine zusätzliche Umsatzsteuer.
        Ausschließlich B2B.
      </p>
      {!available ? (
        <p className="notice">
          Die Pakete sind derzeit nicht bestellbar. Für Rückfragen{" "}
          <Link href="/kontakt">kontaktieren Sie uns</Link>.
        </p>
      ) : null}
      <div ref={checkout} className="lead-checkout">
        {receipt ? (
          <section className="success-panel" role="status">
            <span className="eyebrow">Bestellbestätigung</span>
            <h2>Ihr Kauf wurde bestätigt.</h2>
            <p>
              Nach bestätigtem Zahlungseingang senden wir Ihre Leadliste als
              CSV-Datei an die bei der Bestellung angegebene E-Mail-Adresse.
            </p>
            <dl className="lead-summary">
              <dt>Bestellnummer / Verwendungszweck</dt>
              <dd>{receipt.reference}</dd>
              <dt>Empfänger</dt>
              <dd>{receipt.bank.recipient}</dd>
              <dt>IBAN</dt>
              <dd>{receipt.bank.iban.replace(/(.{4})/g, "$1 ").trim()}</dd>
              <dt>Vollständiger Rechnungsbetrag</dt>
              <dd>{shopMoney(receipt.totalCents)}</dd>
              <dt>Umfang</dt>
              <dd>{receipt.quantity} Firmenkontakte</dd>
              <dt>Status</dt>
              <dd>{receipt.status}</dd>
            </dl>
            <p>
              Bitte geben Sie bei der Überweisung die Bestellnummer an. Die
              Zahlungsinformationen erhalten Sie auch per E-Mail. Die
              Bestellbestätigung ersetzt keine Rechnung.
            </p>
          </section>
        ) : (
          selection && (
            <section aria-labelledby="lead-checkout-title">
              <span className="eyebrow">
                {step === "form" ? "Rechnungsdaten" : "Bestellung prüfen"}
              </span>
              <h2 id="lead-checkout-title">
                {selection.package} · {selection.quantity} Kontakte ·{" "}
                {shopMoney(leadPrice(selection.quantity))}
              </h2>
              {step === "form" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep("review");
                    checkout.current?.scrollIntoView({ block: "start" });
                  }}
                >
                  <div className="field-grid">
                    {fields.map(([key, label, type]) => (
                      <label className="form-field" key={key}>
                        {label}
                        <input
                          type={type}
                          maxLength={
                            key === "houseNumber"
                              ? 20
                              : key === "postcode"
                                ? 20
                                : key === "phone"
                                  ? 50
                                  : 180
                          }
                          required={key !== "vatId"}
                          value={form[key] || ""}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button className="button" type="submit">
                    Angaben prüfen
                  </button>
                </form>
              ) : (
                <>
                  <dl className="lead-summary">
                    {fields.map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{form[key] || "Nicht angegeben"}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    className="button secondary"
                    disabled={attempted || busy}
                    onClick={() => setStep("form")}
                  >
                    Angaben ändern
                  </button>
                  <h3>Bestellbedingungen</h3>
                  {leadTerms.map((term) => (
                    <p className="lead-condition" key={term}>
                      {term}
                    </p>
                  ))}
                  <p>
                    Datenschutzhinweise zur Bestellung finden Sie in unserer{" "}
                    <Link
                      className="text-link"
                      href="/datenschutz"
                      target="_blank"
                    >
                      Datenschutzerklärung
                    </Link>
                    .
                  </p>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={businessOnly}
                      disabled={attempted}
                      onChange={(e) => setBusinessOnly(e.target.checked)}
                    />
                    <span>
                      Ich bestelle als Unternehmer für mein Unternehmen.
                    </span>
                  </label>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={accepted}
                      disabled={attempted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>
                      Ich akzeptiere die Bestellbedingungen und habe Umfang,
                      Exklusivität und den vollständigen Zahlbetrag geprüft.
                    </span>
                  </label>
                  <p>
                    <strong>
                      Zu zahlen: {shopMoney(leadPrice(selection.quantity))}
                    </strong>{" "}
                    · Banküberweisung · keine zusätzliche Umsatzsteuer
                  </p>
                  <Turnstile
                    action="lead_order"
                    onToken={captcha.setToken}
                    generation={captcha.generation}
                  />
                  <button
                    className="button"
                    disabled={
                      !accepted ||
                      !businessOnly ||
                      busy ||
                      !token ||
                      !captcha.ready
                    }
                    onClick={submit}
                  >
                    {busy
                      ? "Bestellung wird gespeichert …"
                      : "Kostenpflichtig bestellen"}
                  </button>
                </>
              )}
              {error && (
                <p role="alert" className="notice">
                  {error}
                </p>
              )}
            </section>
          )
        )}
      </div>
    </>
  );
}
