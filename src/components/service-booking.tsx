"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  bookingPackages,
  bookingPackage,
  packageHref,
  packagePrice,
  bookingTermsVersion,
  bookingTerms,
  withdrawalText,
  withdrawalModel,
  monthlyTerms,
  euro,
} from "@/data/bookable-services";
import { Turnstile, useTurnstile } from "./turnstile";
type Result = {
  reference: string;
  kind: string;
  amount: number;
  status: string;
  createdAt: string;
  interval: string;
  bank: {
    recipient: string;
    iban: string;
    bic: string;
    paymentDays: number;
  } | null;
};
export function ServiceBooking({
  initialService,
  consultation = false,
}: {
  initialService: string;
  consultation?: boolean;
}) {
  const [slug, setSlug] = useState(initialService);
  const p = bookingPackage(slug) || bookingPackages[0];
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [ready, setReady] = useState<{
    ready: boolean;
    consultation: boolean;
    smallBusiness: boolean;
    paymentDays: number;
  } | null>(null);
  const [formToken, setFormToken] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [locked, setLocked] = useState(false);
  const [conflict, setConflict] = useState(false);
  const key = useRef("");
  const form = useRef<HTMLFormElement>(null);
  const bot = useTurnstile();
  const [data, setData] = useState({
    first: "",
    last: "",
    company: "",
    email: "",
    phone: "",
    street: "",
    house: "",
    postcode: "",
    city: "",
    description: "",
    requirements: "",
    callback: "",
    consumer: true,
    consent: false,
    earlyStart: false,
    earlyLoss: false,
    website: "",
  });
  useEffect(() => {
    key.current = crypto.randomUUID();
    // Retain only an opaque key across reloads, never customer data.
    const storageKey = `wse-checkout:${consultation ? "consultation" : "booking"}:${initialService}`;
    try {
      const previous = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (previous?.key && previous.expires > Date.now())
        key.current = previous.key;
      else
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            key: key.current,
            expires: Date.now() + 2 * 60 * 60 * 1000,
          }),
        );
    } catch {
      /* The in-memory key still protects retries if storage is unavailable. */
    }
    let alive = true;
    Promise.all([
      fetch("/api/form-token", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/buchungen", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([t, r]) => {
        if (alive) {
          setFormToken(t.token || "");
          setReady(r);
        }
      })
      .catch(() => {
        if (alive)
          setMessage(
            "Bitte kontaktiere uns derzeit direkt per E-Mail oder Telefon.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  const update = (name: string, value: string | boolean) =>
    setData((d) => ({ ...d, [name]: value }));
  const field = (
    name: keyof typeof data,
    label: string,
    required = true,
    type = "text",
  ) => (
    <label className="form-field" key={name}>
      {label}
      <input
        name={name}
        autoComplete={
          (
            {
              first: "given-name",
              last: "family-name",
              company: "organization",
              email: "email",
              phone: "tel",
              street: "address-line1",
              postcode: "postal-code",
              city: "address-level2",
            } as Record<string, string>
          )[name] || "off"
        }
        type={type}
        value={String(data[name])}
        required={required}
        maxLength={
          name === "email"
            ? 254
            : name === "house"
              ? 20
              : name === "postcode"
                ? 5
                : 160
        }
        pattern={name === "postcode" ? "[0-9]{5}" : undefined}
        readOnly={locked}
        onChange={(e) => update(name, e.target.value)}
      />
    </label>
  );
  async function submit() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setLocked(true);
    try {
      const response = await fetch("/api/buchungen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          key: key.current,
          kind: consultation ? "consultation" : "booking",
          service: p.slug,
          quotedCents: p.cents,
          quotedPaymentDays: ready?.paymentDays || 14,
          version: bookingTermsVersion,
          token: formToken,
          turnstile: bot.token,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        if ([400, 403, 429].includes(response.status)) setLocked(false);
        throw new Error(
          body.message ||
            "Der Eingang konnte nicht bestätigt werden. Bitte kontaktiere uns direkt.",
        );
      }
      setResult(body);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Verbindung unterbrochen. Bitte mit unveränderten Angaben erneut versuchen oder direkt Kontakt aufnehmen.",
      );
    } finally {
      setBusy(false);
      bot.reset();
    }
  }
  if (result) {
    const bank = result.bank;
    const due = new Date(result.createdAt);
    due.setDate(due.getDate() + (bank?.paymentDays || 14));
    return (
      <div className="form-panel booking-receipt" role="status">
        <span className="eyebrow">{result.reference}</span>
        <h2>
          {consultation
            ? "Deine Beratungsanfrage ist angekommen."
            : "Deine Buchung ist bestätigt."}
        </h2>
        <p>
          {consultation
            ? "Wir melden uns über deine angegebenen Kontaktdaten. Die Beratung ist kostenlos; eine Zahlung ist nicht erforderlich."
            : result.status === "Wartet auf Zahlung"
              ? "Deine Buchung wurde im CRM gespeichert. Bitte überweise den unten angegebenen Betrag. Dein Zahlungseingang wird separat bestätigt."
              : "Diese Buchung wurde bereits gespeichert. Beachte den aktuellen Status und führe keine doppelte Überweisung aus."}
        </p>
        <p>Die Bestätigungs-E-Mail ist für den Versand vorgemerkt.</p>
        <dl className="booking-summary">
          <dt>Leistung</dt>
          <dd>{p.name}</dd>
          <dt>Status</dt>
          <dd>{result.status}</dd>
          {bank && (
            <>
              <dt>Betrag</dt>
              <dd>
                {euro(result.amount)}
                {result.interval === "monthly"
                  ? " für den ersten Leistungsmonat"
                  : ""}
              </dd>
              <dt>Empfänger</dt>
              <dd>{bank.recipient}</dd>
              <dt>IBAN</dt>
              <dd>{bank.iban}</dd>
              {bank.bic && (
                <>
                  <dt>BIC</dt>
                  <dd>{bank.bic}</dd>
                </>
              )}
              <dt>Verwendungszweck</dt>
              <dd>{result.reference}</dd>
              <dt>Zahlungsziel</dt>
              <dd>
                {due.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" })}
              </dd>
            </>
          )}
        </dl>
        {!consultation && (
          <>
            <p>{p.interval === "monthly" ? monthlyTerms : bookingTerms}</p>
            <Link href="/buchungsbedingungen">
              Vertragsinformationen und Widerrufsrecht
            </Link>
          </>
        )}
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            const a = document.createElement("a");
            const url = URL.createObjectURL(
              new Blob(
                [
                  JSON.stringify(
                    {
                      buchung: result,
                      paket: p,
                      angaben: data,
                      bedingungen: bookingTerms,
                      widerruf: withdrawalText,
                      muster: withdrawalModel,
                    },
                    null,
                    2,
                  ),
                ],
                { type: "text/plain;charset=utf-8" },
              ),
            );
            a.href = url;
            a.download = `${result.reference}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Bestätigung speichern
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            try {
              sessionStorage.removeItem(
                `wse-checkout:${consultation ? "consultation" : "booking"}:${initialService}`,
              );
            } catch {}
            window.location.reload();
          }}
        >
          Eine weitere Anfrage beginnen
        </button>
      </div>
    );
  }
  const enabled = consultation
    ? ready?.consultation && p.consultation
    : ready?.ready && p.booking;
  const summary = (
    <div>
      <h2>{p.name}</h2>
      <p className="booking-price">
        {consultation ? "Kostenlose Beratung" : packagePrice(p)}
      </p>
      {!consultation && (
        <p className="price-note">
          {ready?.smallBusiness === false
            ? "Endpreis einschließlich gesetzlicher Umsatzsteuer."
            : "Endpreis. Kein Umsatzsteuerausweis gemäß § 19 UStG."}
        </p>
      )}
      <ul>
        {p.scope.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p>
        Zusätzlich auf Anfrage, nicht im Paket enthalten: {p.extras.join(", ")}.
        Ohne gesonderte Beauftragung entstehen daraus keine Zusatzkosten.
      </p>
      {!consultation && (
        <p>
          {p.interval === "monthly"
            ? monthlyTerms
            : "Einmalige Zahlung. Umsetzung nach bestätigter Zahlung und vollständiger Bereitstellung der benötigten Inhalte und Zugänge innerhalb von 20 Werktagen, soweit kein anderer Termin ausdrücklich vereinbart wird."}
        </p>
      )}
    </div>
  );
  return (
    <form
      ref={form}
      className="form-panel service-booking"
      onSubmit={(e) => {
        e.preventDefault();
        if (consultation || step === 3) void submit();
        else setStep((s) => s + 1);
      }}
    >
      {!consultation && (
        <ol className="booking-steps" aria-label="Buchungsschritte">
          {["Paket", "Kundendaten", "Übersicht", "Verbindlich buchen"].map(
            (s, i) => (
              <li key={s} aria-current={step === i ? "step" : undefined}>
                {i + 1}. {s}
              </li>
            ),
          )}
        </ol>
      )}
      {(consultation || step === 0) && (
        <>
          <label className="form-field">
            Gewünschte Dienstleistung
            <select
              value={p.slug}
              disabled={locked}
              onChange={(e) => setSlug(e.target.value)}
            >
              {bookingPackages
                .filter((p) => (consultation ? p.consultation : p.booking))
                .map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} · {consultation ? "Beratung" : packagePrice(p)}
                  </option>
                ))}
            </select>
          </label>
          {summary}
          <Link href={packageHref(p)}>Leistungsdetails ansehen</Link>
          {!consultation && (
            <p>
              Zahlung per Banküberweisung. Bestellungen mit Rechnungsanschrift
              in Deutschland.
            </p>
          )}
        </>
      )}
      {(consultation || step === 1) && (
        <>
          <h2>
            {consultation
              ? "Erzähl uns von deinem Vorhaben."
              : "Deine Kundendaten."}
          </h2>
          <div className="field-grid">
            {field("first", "Vorname")}
            {field("last", "Nachname")}
            {field("company", "Unternehmen (optional)", false)}
            {field("email", "E-Mail", true, "email")}
            {field("phone", "Telefon", true, "tel")}
          </div>
          {!consultation && (
            <>
              <div className="field-grid">
                {field("street", "Straße")}
                {field("house", "Hausnummer")}
                {field("postcode", "Postleitzahl")}
                {field("city", "Ort")}
              </div>
              <p>Rechnungsland: Deutschland</p>
              <label className="form-field">
                Bestellst du privat oder geschäftlich?
                <select
                  value={data.consumer ? "private" : "business"}
                  disabled={locked}
                  onChange={(e) =>
                    update("consumer", e.target.value === "private")
                  }
                >
                  <option value="private">Als Verbraucher / privat</option>
                  <option value="business">
                    Für meine gewerbliche oder selbstständige Tätigkeit
                  </option>
                </select>
              </label>
            </>
          )}
          <label className="form-field">
            Projektbeschreibung
            <textarea
              required
              minLength={10}
              maxLength={6000}
              readOnly={locked}
              value={data.description}
              onChange={(e) => update("description", e.target.value)}
              rows={5}
            />
          </label>
          {consultation ? (
            field("callback", "Gewünschter Rückruftermin (optional)", false)
          ) : (
            <label className="form-field">
              Zusätzliche Anforderungen (optional, nicht mitbestellt)
              <textarea
                maxLength={2000}
                readOnly={locked}
                value={data.requirements}
                onChange={(e) => update("requirements", e.target.value)}
              />
            </label>
          )}
        </>
      )}
      {!consultation && step >= 2 && (
        <>
          {summary}
          <h3>Deine Angaben</h3>
          <p>
            {data.first} {data.last}
            <br />
            {data.company}
            <br />
            {data.email} · {data.phone}
            <br />
            {data.street} {data.house}
            <br />
            {data.postcode} {data.city}, Deutschland
          </p>
          <p>{data.description}</p>
          {data.requirements && (
            <p>Zusatzwünsche, nur auf Anfrage: {data.requirements}</p>
          )}
          <p>
            Zahlung per Banküberweisung innerhalb von {ready?.paymentDays || 14}{" "}
            Tagen nach Buchung. Die Zahlungsinformationen werden nach Buchung
            angezeigt und per E-Mail übermittelt. Keine automatische Abbuchung.
          </p>
          <details>
            <summary>Vertragsbedingungen lesen</summary>
            <p>{bookingTerms}</p>
          </details>
          {data.consumer && (
            <details open={step === 3}>
              <summary>Widerrufsrecht für Verbraucher</summary>
              <p>{withdrawalText}</p>
              <p>{withdrawalModel}</p>
            </details>
          )}
        </>
      )}
      {(consultation || step === 3) && (
        <>
          <label className="consent">
            <input
              type="checkbox"
              required
              checked={data.consent}
              disabled={locked}
              onChange={(e) => update("consent", e.target.checked)}
            />
            <span>
              {consultation
                ? "Ich habe die Informationen zur Verarbeitung meiner Anfrage in der "
                : "Ich akzeptiere die Buchungsbedingungen und habe die Vertragsinformationen einschließlich der Widerrufsbelehrung gelesen. Hinweise zur Datenverarbeitung stehen in der "}
              <Link href="/datenschutz" target="_blank" rel="noopener">
                Datenschutzerklärung
              </Link>
              .{" "}
              {!consultation && (
                <Link
                  href="/buchungsbedingungen"
                  target="_blank"
                  rel="noopener"
                >
                  Buchungsbedingungen öffnen
                </Link>
              )}
            </span>
          </label>
          {!consultation && data.consumer && (
            <>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={data.earlyStart}
                  disabled={locked}
                  onChange={(e) => update("earlyStart", e.target.checked)}
                />
                <span>
                  Optional: Ich verlange ausdrücklich, dass vor Ablauf der
                  Widerrufsfrist mit der Dienstleistung begonnen wird. Bei
                  Widerruf kann für den bereits erbrachten Anteil ein
                  angemessener Betrag anfallen.
                </span>
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={data.earlyLoss}
                  disabled={locked}
                  onChange={(e) => update("earlyLoss", e.target.checked)}
                />
                <span>
                  Optional: Mir ist bekannt, dass mein Widerrufsrecht bei
                  vollständiger Vertragserfüllung durch den Unternehmer
                  erlischt, wenn ich zuvor ausdrücklich dem vorzeitigen Beginn
                  zugestimmt habe.
                </span>
              </label>
              <p>
                Ohne beide optionalen Erklärungen beginnt die Leistung erst nach
                Ablauf der Widerrufsfrist.
              </p>
            </>
          )}
          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={data.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>
          </div>
          <Turnstile
            action="service_booking"
            onToken={bot.setToken}
            generation={bot.generation}
          />
        </>
      )}
      {ready && !enabled && (
        <p role="status">
          Dieses Paket kannst du derzeit direkt über{" "}
          <a href="mailto:kontakt@webstudio-expert.de">
            kontakt@webstudio-expert.de
          </a>{" "}
          oder telefonisch anfragen.
        </p>
      )}
      {message && (
        <p className="error-message" role="alert">
          {message}
        </p>
      )}
      <div className="buttons">
        {!consultation && step > 0 && !locked && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setStep((s) => s - 1)}
          >
            Zurück und Angaben ändern
          </button>
        )}
        <button
          type="submit"
          className="button"
          disabled={
            busy ||
            !enabled ||
            ((consultation || step === 3) && (!formToken || !bot.ready))
          }
        >
          {busy
            ? "Wird gespeichert …"
            : consultation
              ? "Kostenlose Beratung anfragen"
              : step === 3
                ? "Zahlungspflichtig bestellen"
                : "Weiter"}
        </button>
      </div>
      {locked && !busy && (
        <p>
          Um doppelte Buchungen zu vermeiden, bleiben deine Angaben nach dem
          Absendeversuch unverändert. Du kannst mit denselben Angaben erneut
          absenden.
        </p>
      )}
      {conflict && (
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            if (
              !confirm(
                "Für diesen Vorgang kann bereits eine Buchung vorliegen. Möchtest du bewusst einen neuen, unabhängigen Vorgang beginnen? Bitte bei unklarem Bestellstatus zuerst Kontakt aufnehmen.",
              )
            )
              return;
            try {
              sessionStorage.removeItem(
                `wse-checkout:${consultation ? "consultation" : "booking"}:${initialService}`,
              );
            } catch {}
            window.location.reload();
          }}
        >
          Neuen unabhängigen Vorgang beginnen
        </button>
      )}
    </form>
  );
}
