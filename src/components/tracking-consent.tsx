"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  analyticsConsentKey,
  readTrackingConsent,
} from "@/lib/analytics-consent";
import {
  allowsLeadinfo,
  leadinfoConsentDays,
  leadinfoConsentKey,
} from "@/lib/leadinfo";

export function TrackingConsent({ settings = false }: { settings?: boolean }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean | null>(
    null,
  );
  const [leadinfoSelected, setLeadinfoSelected] = useState(false);
  const [analyticsSelected, setAnalyticsSelected] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const leadinfo = readTrackingConsent(leadinfoConsentKey);
    const analytics = readTrackingConsent(analyticsConsentKey);
    setConsent(leadinfo);
    setAnalyticsConsent(analytics);
    setLeadinfoSelected(leadinfo === true);
    setAnalyticsSelected(analytics === true);
    setReady(true);
  }, [pathname]);

  function save(leadinfo: boolean, analytics: boolean) {
    try {
      const expires = Date.now() + leadinfoConsentDays * 86400000;
      localStorage.setItem(
        leadinfoConsentKey,
        JSON.stringify({ allowed: leadinfo, expires }),
      );
      localStorage.setItem(
        analyticsConsentKey,
        JSON.stringify({ allowed: analytics, expires }),
      );
      // A fresh document also stops all previously installed provider listeners.
      window.location.reload();
    } catch {
      setError(
        "Dein Browser kann die Auswahl nicht vollständig speichern. Bitte prüfe die Browser-Einstellungen. Ohne gespeicherte Zustimmung wird der jeweilige Dienst nicht geladen.",
      );
    }
  }

  if (
    !ready ||
    !allowsLeadinfo(pathname) ||
    (!settings &&
      ((consent !== null && analyticsConsent !== null) ||
        pathname === "/cookie-einstellungen"))
  )
    return null;

  return (
    <section
      className={settings ? "tracking-settings" : "tracking-consent"}
      aria-label="Freiwillige Besuchsanalyse"
    >
      <h2>Freiwillige Besuchsanalyse</h2>
      <p>
        Du entscheidest für jeden Dienst einzeln. Ohne Zustimmung bleiben beide
        ausgeschaltet; alle Funktionen der Website stehen dir weiterhin zur
        Verfügung.
      </p>
      <label className="consent">
        <input
          type="checkbox"
          checked={leadinfoSelected}
          onChange={(event) => setLeadinfoSelected(event.target.checked)}
        />
        <span>Leadinfo: Unternehmensbesuche erkennen</span>
      </label>
      <p>
        Mit deiner Zustimmung nutzen wir Leadinfo B.V. (Niederlande), um
        Unternehmensbesuche anhand der IP-Adresse zu erkennen und die Nutzung
        unserer öffentlichen Website auszuwerten. Dabei werden technische
        Besuchsdaten an Leadinfo übertragen; je nach Anbietereinstellung werden
        Cookies oder lokaler Browser-Speicher verwendet. Die Website
        funktioniert auch ohne Zustimmung.
      </p>
      <label className="consent">
        <input
          type="checkbox"
          checked={analyticsSelected}
          onChange={(event) => setAnalyticsSelected(event.target.checked)}
        />
        <span>Vercel Web Analytics: Website-Nutzung auswerten</span>
      </label>
      <p>
        Vercel Inc. (USA) erhält technische Besuchsdaten für zusammengefasste
        Statistiken, etwa Seitenaufrufe, Herkunft und Geräteinformationen. Web
        Analytics verwendet dafür keine Analyse-Cookies. CRM und private
        Bestellseiten werden ausgeschlossen; URL-Parameter und Formularinhalte
        werden nicht als Analyseereignisse übermittelt.
      </p>
      <p>
        <Link href="/datenschutz">Datenschutz</Link> ·{" "}
        <Link href="/cookie-einstellungen">Einstellungen und Widerruf</Link>
      </p>
      {settings && (
        <p role="status">
          Leadinfo:{" "}
          {consent === true
            ? "Zugestimmt"
            : consent === false
              ? "Abgelehnt"
              : "Noch keine Auswahl"}
          . Vercel Web Analytics:{" "}
          {analyticsConsent === true
            ? "Zugestimmt"
            : analyticsConsent === false
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
          onClick={() => save(false, false)}
        >
          {settings ? "Alle Zustimmungen widerrufen" : "Alle ablehnen"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => save(leadinfoSelected, analyticsSelected)}
        >
          Auswahl speichern
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => save(true, true)}
        >
          Alle erlauben
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
