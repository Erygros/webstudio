"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function useTurnstile() {
  const [token, setToken] = useState("");
  const [generation, setGeneration] = useState(0);
  const reset = useCallback(() => {
    setToken("");
    setGeneration((n) => n + 1);
  }, []);
  return { token, setToken, generation, reset, ready: !siteKey || !!token };
}

export function Turnstile({
  action,
  onToken,
  generation,
}: {
  action: string;
  onToken: (token: string) => void;
  generation: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [size, setSize] = useState("compact");
  useEffect(() => {
    if (!siteKey || !container.current) return;
    const element = container.current;
    const resize = () =>
      setSize(element.clientWidth < 300 ? "compact" : "flexible");
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const api = window.turnstile;
    if (!siteKey || !loaded || !api || !container.current) return;
    callback.current("");
    let id: string | undefined;
    let active = true;
    try {
      id = api.render(container.current, {
        sitekey: siteKey,
        action,
        language: "de",
        theme: "auto",
        size,
        "refresh-expired": "auto",
        "refresh-timeout": "auto",
        "response-field": false,
        callback: (token: string) => {
          if (active) {
            callback.current(token);
            setError(false);
          }
        },
        "expired-callback": () => {
          if (active) callback.current("");
        },
        "error-callback": () => {
          if (active) {
            callback.current("");
            setError(true);
          }
        },
        "timeout-callback": () => {
          if (active) {
            callback.current("");
            setError(true);
          }
        },
      });
    } catch {
      setError(true);
    }
    return () => {
      active = false;
      callback.current("");
      if (id) api.remove(id);
    };
  }, [loaded, action, generation, retry, size]);
  if (!siteKey) return null;
  return (
    <div style={{ marginBlock: "1rem", width: "100%", minWidth: 0 }}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      <div ref={container} style={{ minHeight: 65, maxWidth: "100%" }} />
      {!loaded && !error && (
        <p role="status">Sicherheitsprüfung wird geladen …</p>
      )}
      {error && (
        <p role="alert">
          Sicherheitsprüfung nicht verfügbar. Bitte Browser-Schutz prüfen oder
          die Seite neu laden.{" "}
          {loaded && (
            <button
              type="button"
              className="plain-button"
              onClick={() => {
                setError(false);
                setRetry((n) => n + 1);
              }}
            >
              Erneut prüfen
            </button>
          )}
        </p>
      )}
      <small>
        Spam-Schutz durch Cloudflare. <a href="/datenschutz">Datenschutz</a>
      </small>
    </div>
  );
}
