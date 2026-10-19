"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { crmFetch } from "./api";
import { ResourcePanel } from "./resource-panel";
const businessFields: Record<string, string> = {
  name: "Unternehmensname",
  owner: "Inhaber",
  street: "Straße und Hausnummer",
  postcode: "PLZ",
  city: "Ort",
  email: "E-Mail",
  phone: "Telefon",
  taxNumber: "Steuernummer (nur internes CRM)",
  vatId: "USt-ID",
  iban: "IBAN",
  bankRecipient: "Kontoinhaber / Zahlungsempfänger (sonst Inhaber)",
  bic: "BIC (optional)",
  vatRate: "Umsatzsteuersatz in % (nur bei Regelbesteuerung)",
  paymentDays: "Zahlungsziel (Tage)",
  retentionMonths: "Löschprüfung nach Monaten",
  signature: "E-Mail-Signatur",
};
const integrationFields: Record<string, string[]> = {
  smtp: ["host", "port", "user", "password", "from"],
  imap: ["host", "port", "user", "password"],
  twilio: [
    "accountSid",
    "authToken",
    "apiKey",
    "apiSecret",
    "appSid",
    "callerId",
  ],
  sip: ["websocketUrl", "sipUri", "user", "password"],
  ai: ["baseUrl", "model", "apiKey"],
};
export function Settings() {
  const [business, setBusiness] = useState<Record<string, unknown>>({});
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({});
  const [provider, setProvider] = useState("smtp");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pushKey, setPushKey] = useState("");
  useEffect(() => {
    void crmFetch<{
      business: Record<string, unknown>;
      integrations: Record<string, boolean>;
      pushKey: string;
    }>("settings")
      .then((d) => {
        setBusiness(d.business);
        setIntegrations(d.integrations);
        setPushKey(d.pushKey);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault();
    try {
      await crmFetch("settings", {
        method: "POST",
        body: JSON.stringify({ kind: "business", data: business }),
      });
      setMessage(
        "Unternehmensdaten gespeichert. Bereits ausgestellte Belege bleiben unverändert.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function saveIntegration(e: React.FormEvent) {
    e.preventDefault();
    try {
      await crmFetch("settings", {
        method: "POST",
        body: JSON.stringify({
          kind: "integration",
          provider,
          data: credentials,
        }),
      });
      setCredentials({});
      setMessage(
        "Zugangsdaten verschlüsselt gespeichert. Die Verbindung ist damit noch nicht geprüft.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function push() {
    try {
      if (!pushKey)
        throw new Error("VAPID-Schlüssel fehlen in der Serverkonfiguration.");
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error(
          "Browser-Push wird von diesem Browser nicht unterstützt.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("Benachrichtigungen wurden nicht freigegeben.");
      const registration = await navigator.serviceWorker.register(
        "/crm-sw.js",
        { scope: "/crm/" },
      );
      const key = Uint8Array.from(
        atob(pushKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      await crmFetch("push", {
        method: "POST",
        body: JSON.stringify(subscription.toJSON()),
      });
      setMessage("Browser-Push aktiviert.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Konfiguration</span>
        <h1>Einstellungen.</h1>
        <p>
          Unternehmensdaten und Integrationen an einem Ort. Secrets werden nie
          zurück an den Browser ausgegeben.
        </p>
      </header>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="crm-dashboard-grid">
        <section className="crm-panel">
          <h2>Unternehmen und Buchhaltung</h2>
          <form onSubmit={saveBusiness}>
            <div className="crm-form-grid">
              {Object.entries(businessFields).map(([key, label]) => (
                <label
                  className={`form-field ${key === "signature" ? "crm-span-2" : ""}`}
                  key={key}
                >
                  {label}
                  {key === "signature" ? (
                    <textarea
                      value={String(business[key] || "")}
                      onChange={(e) =>
                        setBusiness({ ...business, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      value={String(business[key] ?? "")}
                      onChange={(e) =>
                        setBusiness({ ...business, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            <label className="consent">
              <input
                type="checkbox"
                checked={business.smallBusiness === true}
                onChange={(e) =>
                  setBusiness({ ...business, smallBusiness: e.target.checked })
                }
              />
              Kleinunternehmerregelung (§ 19 UStG) aktiv
            </label>
            <button className="button">Speichern</button>
          </form>
          <p className="crm-caption">
            Steuernummer/gegebenenfalls USt-ID und Bankdaten für Belege
            eintragen. Rechtlich und steuerlich prüfungsbedürftige Angaben vor
            Freigabe prüfen.
          </p>
        </section>
        <section className="crm-panel">
          <h2>Integrationen</h2>
          <div className="crm-integration-states">
            {Object.entries(integrations).map(([name, configured]) => (
              <div key={name}>
                <span>{name.toUpperCase()}</span>
                <span>
                  {configured ? "Konfiguriert" : "Nicht eingerichtet"}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={saveIntegration}>
            <label className="form-field">
              Anbieter
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setCredentials({});
                }}
              >
                {Object.keys(integrationFields).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            {integrationFields[provider].map((key) => (
              <label className="form-field" key={key}>
                {key}
                <input
                  autoComplete="off"
                  type={
                    /password|token|secret|apiKey/i.test(key)
                      ? "password"
                      : "text"
                  }
                  value={credentials[key] || ""}
                  onChange={(e) =>
                    setCredentials({ ...credentials, [key]: e.target.value })
                  }
                  placeholder="Leer lassen: bestehender Wert bleibt erhalten"
                />
              </label>
            ))}
            <button className="button">Verschlüsselt speichern</button>
          </form>
          <p className="crm-caption">
            CRM_ENCRYPTION_KEY muss serverseitig vorhanden sein.
            SIP-Konfiguration wird vorbereitet gespeichert; ohne
            WebRTC-SIP-Adapter ist sie noch nicht nutzbar.
            Gesprächsaufzeichnungen bleiben deaktiviert.
          </p>
        </section>
      </div>
      <section className="crm-panel">
        <h2>Konto und Benachrichtigungen</h2>
        <div className="crm-actions">
          <Link className="button secondary" href="/crm/passwort">
            Passwort ändern
          </Link>
          <button className="button secondary" onClick={() => void push()}>
            Browser-Push freigeben
          </button>
          <button
            className="button secondary"
            onClick={() =>
              void crmFetch("jobs?kind=workflows", {
                method: "POST",
                body: "{}",
              })
                .then(() => setMessage("Automatisierungen verarbeitet."))
                .catch((e) => setMessage(e.message))
            }
          >
            Automatisierungen ausführen
          </button>
          <a className="button secondary" href="/api/crm/export?all=true">
            Vollständiger JSON-Datenexport
          </a>
        </div>
        <p className="crm-caption">
          Der Export umfasst CRM-Datensätze ohne Integration-Secrets. Private
          Dateioriginale separat über Supabase sichern. Keine öffentliche
          Registrierung.
        </p>
      </section>
      <ResourcePanel resource="automatisierungen" />
      <ResourcePanel resource="wiederkehrend" />
    </>
  );
}
