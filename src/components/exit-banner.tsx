"use client";
import { Icon } from "@/components/icon";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ExitBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);
  const banner = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function dismiss() {
    if (banner.current?.contains(document.activeElement)) {
      const target = previousFocus.current?.isConnected
        ? previousFocus.current
        : document.getElementById("main");
      target?.focus({ preventScroll: true });
    }
    setVisible(false);
  }

  useEffect(() => {
    setVisible(false);
    if (
      pathname.startsWith("/projektanfrage") ||
      pathname.startsWith("/kontakt") ||
      pathname.startsWith("/bewertungen") ||
      pathname.startsWith("/terminbuchung")
    )
      return;
    if (shown.current) return;

    let armed = false;
    let furthestScroll = window.scrollY;
    const timer = window.setTimeout(() => {
      armed = true;
    }, 20_000);
    const touch = window.matchMedia("(hover: none), (pointer: coarse)");

    function show() {
      const active = document.activeElement;
      if (
        !armed ||
        shown.current ||
        document.visibilityState !== "visible" ||
        document.querySelector('[aria-modal="true"], .not-found') ||
        active?.matches("input, textarea, select")
      )
        return;
      shown.current = true;
      previousFocus.current = active instanceof HTMLElement ? active : null;
      setVisible(true);
    }

    function leave(event: MouseEvent) {
      if (!touch.matches && event.relatedTarget === null && event.clientY <= 0)
        show();
    }
    function scroll() {
      if (!touch.matches) return;
      furthestScroll = Math.max(furthestScroll, window.scrollY);
      // Auf Touchgeräten ein zurückhaltender Ersatz für fehlende Maus-Exit-Signale.
      if (furthestScroll >= 500 && furthestScroll - window.scrollY >= 160)
        show();
    }

    document.addEventListener("mouseout", leave);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", leave);
      window.removeEventListener("scroll", scroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [visible]);

  if (!visible) return null;
  return (
    <aside
      ref={banner}
      className="exit-banner"
      aria-labelledby="exit-banner-title"
    >
      <div className="exit-banner-copy">
        <h2 id="exit-banner-title">Eine Idee für dein nächstes Projekt?</h2>
        <p>Beschreibe kurz dein Vorhaben. Die Anfrage ist unverbindlich.</p>
      </div>
      <div className="exit-banner-actions">
        <Link
          className="button"
          href="/projektanfrage"
          onClick={() => setVisible(false)}
        >
          Projekt anfragen{" "}
          <span aria-hidden="true">
            <Icon name="arrow-up-right" />
          </span>
        </Link>
        <button className="plain-button" onClick={dismiss}>
          Später
        </button>
      </div>
      <button
        className="exit-banner-close"
        onClick={dismiss}
        aria-label="Hinweis schließen"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
