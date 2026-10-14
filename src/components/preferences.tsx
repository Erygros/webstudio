"use client";
import { useState } from "react";
export function Preferences() {
  const [status, setStatus] = useState("");
  function setTheme(value: string) {
    if (value === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem("theme", value);
      setStatus("Darstellung gespeichert.");
    } catch {
      setStatus(
        "Darstellung geändert. Dein Browser erlaubt keine dauerhafte Speicherung.",
      );
    }
  }
  return (
    <>
      <div className="cookie-controls">
        <button className="button secondary" onClick={() => setTheme("system")}>
          Systemeinstellung verwenden
        </button>
        <button className="button secondary" onClick={() => setTheme("light")}>
          Hell
        </button>
        <button className="button secondary" onClick={() => setTheme("dark")}>
          Dunkel
        </button>
      </div>
      <p role="status" style={{ marginTop: 20 }}>
        {status}
      </p>
    </>
  );
}
