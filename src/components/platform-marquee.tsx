"use client";
import Image from "next/image";
import { useState } from "react";
import { platformLogos } from "@/data/platform-logos";

export function PlatformMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className="platform-strip"
      aria-labelledby="platform-strip-title"
      data-paused={paused}
    >
      <div className="platform-strip-heading">
        <h2 className="eyebrow" id="platform-strip-title">
          Technologien, Plattformen & Kanäle
        </h2>
        <button
          type="button"
          className="plain-button platform-pause"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Animation fortsetzen" : "Animation anhalten"}
        </button>
      </div>
      <div className="platform-viewport">
        <div className="platform-track">
          {[false, true].map((copy) => (
            <div
              className="platform-group"
              key={String(copy)}
              aria-hidden={copy || undefined}
            >
              {platformLogos.map((logo) => (
                <a
                  className="platform-logo"
                  href={logo.url}
                  key={logo.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={copy ? -1 : 0}
                  aria-label={
                    copy
                      ? undefined
                      : `${logo.name} – Anbieter in neuem Tab öffnen`
                  }
                  title={logo.name}
                  data-compact={logo.compact}
                  data-monochrome={logo.monochrome}
                  data-backdrop={logo.lightBackdrop}
                >
                  <Image
                    className={`platform-logo-image${logo.darkImage ? " platform-logo-light" : ""}`}
                    src={`/platform-logos/${logo.image}`}
                    alt={copy ? "" : logo.name}
                    width={160}
                    height={48}
                  />
                  {logo.darkImage && (
                    <Image
                      className="platform-logo-image platform-logo-dark"
                      src={`/platform-logos/${logo.darkImage}`}
                      alt=""
                      aria-hidden="true"
                      width={160}
                      height={48}
                    />
                  )}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
