"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Device, Call } from "@twilio/voice-sdk";
import { crmFetch } from "./api";
import { Modal } from "./modal";
const DialerContext = createContext<{
  open: (number?: string, companyId?: string) => void;
}>({ open: () => {} });
type PhoneState = { visible: boolean; number: string; company?: string };
const Context = createContext<{
  state: PhoneState;
  setState: React.Dispatch<React.SetStateAction<PhoneState>>;
} | null>(null);
export function DialerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PhoneState>({
    visible: false,
    number: "",
  });
  return (
    <DialerContext.Provider
      value={{
        open: (number = "", company) =>
          setState({ visible: true, number, company }),
      }}
    >
      <Context.Provider value={{ state, setState }}>
        {children}
      </Context.Provider>
    </DialerContext.Provider>
  );
}
export const useDialer = () => useContext(DialerContext);
export function Dialer() {
  const ctx = useContext(Context)!;
  const { state, setState } = ctx;
  const device = useRef<Device | null>(null);
  const active = useRef<Call | null>(null);
  const [status, setStatus] = useState("Nicht eingerichtet");
  const [incoming, setIncoming] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [speakers, setSpeakers] = useState<{ id: string; label: string }[]>([]);
  const [purpose, setPurpose] = useState("operational");
  const [finish, setFinish] = useState<string | null>(null);
  const [outcome, setOutcome] = useState("Interessiert");
  const [notes, setNotes] = useState("");
  const [callback, setCallback] = useState("");
  const [caller, setCaller] = useState("");
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(
      () => setDuration(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [started]);
  useEffect(() => () => device.current?.destroy(), []);
  async function attach(call: Call) {
    active.current = call;
    call.on("accept", () => {
      setStatus("Verbunden");
      setIncoming(false);
      setStarted(Date.now());
    });
    call.on("disconnect", () => {
      setStatus("Beendet");
      setStarted(null);
      active.current = null;
      const sid = call.parameters.CallSid;
      const storedId = call.customParameters.get("CrmCallId");
      if (storedId) {
        setFinish(storedId);
        return;
      }
      if (sid)
        void crmFetch<{ rows: { id: string }[] }>(
          `data/telefonie?sid=${encodeURIComponent(sid)}`,
        ).then((d) => {
          const match = d.rows.find(
            (r: Record<string, unknown>) => r.provider_sid === sid,
          );
          if (match) setFinish(match.id);
        });
    });
    call.on("cancel", () => {
      setIncoming(false);
      active.current = null;
      setStatus("Bereit");
    });
    call.on("error", (e: Error) => {
      setError(e.message);
      setStatus("Verbindungsfehler");
    });
  }
  async function connect() {
    setError("");
    setStatus("Wird eingerichtet …");
    try {
      const { token } = await crmFetch<{ token: string }>("phone/token", {
        method: "POST",
        body: "{}",
      });
      const { Device } = await import("@twilio/voice-sdk");
      const d = new Device(token, { logLevel: 0 });
      device.current = d;
      d.on("registered", () => setStatus("Bereit"));
      d.on("error", (e: Error) => {
        setError(e.message);
        setStatus("Fehler");
      });
      d.on("tokenWillExpire", () => {
        void crmFetch<{ token: string }>("phone/token", {
          method: "POST",
          body: "{}",
        }).then((v) => d.updateToken(v.token));
      });
      d.on("incoming", (call: Call) => {
        setState((prev) => ({
          ...prev,
          visible: true,
          number: call.parameters.From || "",
        }));
        setIncoming(true);
        setStatus("Eingehender Anruf");
        void attach(call);
        void crmFetch<{ rows: { name: string }[] }>(
          `data/leads?q=${encodeURIComponent(call.parameters.From || "")}`,
        ).then((r) => setCaller(r.rows[0]?.name || ""));
      });
      await d.register();
    } catch (e) {
      setStatus("Nicht eingerichtet");
      setError((e as Error).message);
    }
  }
  async function call() {
    setError("");
    try {
      if (!device.current) throw new Error("Telefonie zuerst verbinden.");
      if (!/^\+[1-9]\d{7,14}$/.test(state.number.replace(/\s/g, "")))
        throw new Error("Internationale Telefonnummer angeben, z. B. +49…");
      setDuration(0);
      setStatus("Verbindungsaufbau");
      const c = await device.current.connect({
        params: {
          To: state.number.replace(/\s/g, ""),
          CompanyId: state.company || "",
          Purpose: purpose,
        },
      });
      await attach(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function audioDevices() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(
        list
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({ id: d.deviceId, label: d.label })),
      );
      setSpeakers(
        list
          .filter((d) => d.kind === "audiooutput")
          .map((d) => ({ id: d.deviceId, label: d.label })),
      );
    } catch {
      setError("Mikrofonzugriff wurde nicht erlaubt oder ist nicht verfügbar.");
    }
  }
  async function finishCall() {
    try {
      await crmFetch("action", {
        method: "POST",
        body: JSON.stringify({
          action: "call.finish",
          id: finish,
          requestKey: crypto.randomUUID(),
          outcome,
          notes,
          ...(callback ? { callback: new Date(callback).toISOString() } : {}),
        }),
      });
      setFinish(null);
      setNotes("");
      setCallback("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <button
        className="crm-dialer-toggle"
        onClick={() => setState({ ...state, visible: !state.visible })}
      >
        Telefon{" "}
        {started !== null
          ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`
          : "↗"}
      </button>
      {state.visible && (
        <aside className="crm-dialer" aria-label="Browser-Telefon">
          <div className="crm-panel-head">
            <h2>Telefon</h2>
            <button
              className="crm-icon-button"
              aria-label="Dialer minimieren"
              onClick={() => setState({ ...state, visible: false })}
            >
              −
            </button>
          </div>
          <p className="crm-caption">
            {status}
            {caller ? " · " + caller : ""}
          </p>
          <input
            aria-label="Telefonnummer"
            type="tel"
            value={state.number}
            onChange={(e) => setState({ ...state, number: e.target.value })}
            placeholder="+49 …"
          />
          <div className="crm-keypad">
            {"123456789*0#".split("").map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (active.current) active.current.sendDigits(n);
                  else setState({ ...state, number: state.number + n });
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="form-field">
            Anrufzweck
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="operational">
                Bestehender Vorgang / angefragter Kontakt
              </option>
              <option value="marketing">
                Werblicher Kontakt (Nachweis erforderlich)
              </option>
            </select>
          </label>
          <div className="crm-actions">
            {!device.current && (
              <button className="button" onClick={() => void connect()}>
                Telefonie verbinden
              </button>
            )}
            {incoming ? (
              <>
                <button
                  className="button"
                  onClick={() => active.current?.accept()}
                >
                  Annehmen
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    active.current?.reject();
                    setIncoming(false);
                    setStatus("Bereit");
                  }}
                >
                  Ablehnen
                </button>
              </>
            ) : (
              !active.current && (
                <button
                  className="button"
                  disabled={!device.current}
                  onClick={() => void call()}
                >
                  Anrufen
                </button>
              )
            )}
            {active.current && (
              <>
                <button
                  className="button secondary"
                  onClick={() => active.current?.disconnect()}
                >
                  Beenden
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    active.current?.mute(!muted);
                    setMuted(!muted);
                  }}
                >
                  {muted ? "Mikrofon an" : "Stumm"}
                </button>
              </>
            )}
          </div>
          <button className="plain-button" onClick={() => void audioDevices()}>
            Audiogeräte auswählen
          </button>
          {devices.length > 0 && (
            <select
              aria-label="Mikrofon"
              onChange={(e) =>
                void device.current?.audio?.setInputDevice(e.target.value)
              }
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label || "Mikrofon"}
                </option>
              ))}
            </select>
          )}
          {speakers.length > 0 && (
            <select
              aria-label="Lautsprecher"
              onChange={(e) => {
                void device.current?.audio?.speakerDevices.set(e.target.value);
              }}
            >
              {speakers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label || "Lautsprecher"}
                </option>
              ))}
            </select>
          )}
          <p className="crm-caption">
            Aufzeichnung deaktiviert. Halten wird für diesen Provider nicht
            angeboten. SIP benötigt eine eigene WebRTC-kompatible Infrastruktur.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </aside>
      )}
      {finish && (
        <Modal title="Gespräch abschließen" onClose={() => setFinish(null)}>
          <label className="form-field">
            Ergebnis
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              {[
                "Interessiert",
                "Nicht erreicht",
                "Kein Interesse",
                "Später erneut anrufen",
                "Follow-up-E-Mail senden",
                "Angebot gewünscht",
                "Kunde gewonnen",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Gesprächsnotiz
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <label className="form-field">
            Rückruf (optional)
            <input
              type="datetime-local"
              value={callback}
              onChange={(e) => setCallback(e.target.value)}
            />
          </label>
          <button className="button" onClick={() => void finishCall()}>
            Ergebnis speichern
          </button>
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </>
  );
}
