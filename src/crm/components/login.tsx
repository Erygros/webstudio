"use client";
import { Turnstile, useTurnstile } from "@/components/turnstile";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export function Login({
  configured,
  passwordMode = false,
}: {
  configured: boolean;
  passwordMode?: boolean;
}) {
  const captcha = useTurnstile();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(action: string) {
    if (busy || (!passwordMode && !captcha.ready)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/crm/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          turnstileToken: captcha.token,
          ...(email ? { email } : {}),
          ...(password ? { password } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (action === "login") {
        router.push("/crm");
        router.refresh();
      } else setMessage(data.message || "Passwort geändert.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
    } finally {
      captcha.reset();
      setBusy(false);
    }
  }
  return (
    <div className="crm-login">
      <span className="eyebrow">Webstudio Expert / CRM</span>
      <h1>
        {passwordMode ? "Neues Passwort setzen." : "Dein Arbeitsbereich."}
      </h1>
      <p>
        {configured
          ? "Nur für freigeschaltete Benutzer. Es gibt keine öffentliche Registrierung."
          : "Supabase ist noch nicht eingerichtet. Hinterlege die Supabase-Variablen, führe die Migration aus und lege das Administratorkonto mit dem Setup-Skript an."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act(passwordMode ? "password" : "login");
        }}
      >
        {!passwordMode && (
          <label className="form-field">
            E-Mail
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        <label className="form-field">
          Passwort (mindestens 12 Zeichen)
          <input
            type="password"
            required
            minLength={12}
            autoComplete={passwordMode ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {!passwordMode && (
          <Turnstile
            action="crm_auth"
            onToken={captcha.setToken}
            generation={captcha.generation}
          />
        )}
        <button
          className="button"
          disabled={!configured || busy || (!passwordMode && !captcha.ready)}
        >
          {busy
            ? "Einen Moment …"
            : passwordMode
              ? "Passwort speichern"
              : "Anmelden"}
        </button>
        {!passwordMode && (
          <button
            type="button"
            className="plain-button"
            disabled={!configured || busy || !email || !captcha.ready}
            onClick={() => void act("reset")}
          >
            Passwort vergessen
          </button>
        )}
      </form>
      {message && (
        <p className="error-message" role="status">
          {message}
        </p>
      )}
      <Link className="text-link" href="/">
        Zur öffentlichen Website ↗
      </Link>
    </div>
  );
}
