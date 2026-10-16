"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  allowsLeadinfo,
  leadinfoConsentDays,
  leadinfoConsentKey,
} from "@/lib/leadinfo";

function readConsent(): boolean | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(leadinfoConsentKey) || "null",
    );
    return value &&
      typeof value.allowed === "boolean" &&
      typeof value.expires === "number" &&
      value.expires > Date.now()
      ? value.allowed
      : null;
  } catch {
    return null;
  }
}

export function TrackingConsent({ settings = false }: { settings?: boolean }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
  }, [pathname]);

  function save(allowed: boolean) {
    try {
      localStorage.setItem(
        leadinfoConsentKey,
        JSON.stringify({
          allowed,
          expires: Date.now() + leadinfoConsentDays * 86400000,
        }),
      );
      // A fresh document also stops all previously installed provider listeners.
      window.location.reload();
    } catch {
      if (!allowed) setConsent(false);
      setError(
        "Dein Browser kann die Auswahl nicht speichern. Leadinfo wird ohne gespeicherte Zustimmung nicht geladen.",
      );
    }
  }

  if (
    !ready ||
    !allowsLeadinfo(pathname) ||
    (!settings && (consent !== null || pathname === "/cookie-einstellungen"))
  )
    return null;

  return (
    <section
      className={settings ? "tracking-settings" : "tracking-consent"}
      aria-label="Besuchsanalyse mit Leadinfo"
    >
      <h2>Besuchsanalyse mit Leadinfo</h2>
      <p>
        Mit deiner Zustimmung nutzen wir Leadinfo B.V. (Niederlande), um
        Unternehmensbesuche anhand der IP-Adresse zu erkennen und die Nutzung
        unserer öffentlichen Website auszuwerten. Dabei werden technische
        Besuchsdaten an Leadinfo übertragen; je nach Anbietereinstellung werden
        Cookies oder lokaler Browser-Speicher verwendet. Die Website
        funktioniert auch ohne Zustimmung.
      </p>
      <p>
        <Link href="/datenschutz">Datenschutz</Link> ·{" "}
        <Link href="/cookie-einstellungen">Einstellungen und Widerruf</Link>
      </p>
      {settings && (
        <p role="status">
          Aktueller Status:{" "}
          {consent === true
            ? "Zugestimmt"
            : consent === false
              ? "Abgelehnt"
              : "Noch keine Auswahl"}
          . Deine Auswahl wird für {leadinfoConsentDays} Tage in diesem Browser
          gespeichert. Du kannst sie jederzeit ändern. Bereits übertragene Daten
          werden durch einen Widerruf nicht automatisch gelöscht.
        </p>
      )}
      <div className="cookie-controls">
        <button
          className="button secondary"
          type="button"
          onClick={() => save(false)}
        >
          {settings ? "Ablehnen / Zustimmung widerrufen" : "Ablehnen"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => save(true)}
        >
          Leadinfo erlauben
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
