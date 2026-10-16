"use client";
import { Icon } from "@/components/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import { Brand } from "@/components/brand";
const links = [
  ["Firmenkontakte", "/leads"],
  ["Projekte", "/projekte"],
  ["Preise", "/preise"],
  ["Unternehmen", "/unternehmen"],
  ["Kontakt", "/kontakt"],
] as const;
export function Navigation({
  categories,
}: {
  categories: { slug: string; name: string; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("system");
  const [dropdown, setDropdown] = useState(false);
  const path = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const serviceMenu = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    try {
      setTheme(localStorage.getItem("theme") || "system");
    } catch {}
  }, []);
  useEffect(() => {
    setOpen(false);
    setDropdown(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>("a, button") || [],
      );
    focusables()[0]?.focus();
    function keydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (e.key === "Tab") {
        const nodes = focusables();
        const first = nodes[0];
        const last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
    };
  }, [open]);
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (!serviceMenu.current?.contains(e.target as Node)) setDropdown(false);
    }
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, []);
  const toggleTheme = () => {
    const currentDark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    const next = currentDark ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  return (
    <>
      <header className="topbar">
        <Link
          href="/"
          className="brand"
          aria-label={`${site.name} – Startseite`}
        >
          <Brand />
        </Link>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          <div
            className="service-menu"
            ref={serviceMenu}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setDropdown(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDropdown(false);
                serviceMenu.current?.querySelector("button")?.focus();
              }
            }}
          >
            <button
              aria-expanded={dropdown}
              aria-controls="service-dropdown"
              onClick={() => setDropdown(!dropdown)}
            >
              Leistungen
              <svg
                className="dropdown-chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {dropdown && (
              <div id="service-dropdown" className="dropdown">
                <Link href="/leistungen" className="dropdown-overview">
                  Alle Leistungen{" "}
                  <span>
                    <Icon name="arrow-up-right" />
                  </span>
                </Link>
                {categories.map((c) => (
                  <Link key={c.slug} href={`/leistungen/${c.slug}`}>
                    <strong>{c.name}</strong>
                    <span>{c.count} Leistungen</span>
                  </Link>
                ))}
                <Link href="/bewertungen">
                  <strong>Bewertungsschutz</strong>
                  <span>Google, kununu, Trustpilot & weitere</span>
                </Link>
              </div>
            )}
          </div>
          {links.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Zwischen hellem und dunklem Modus wechseln"
            title={`Darstellung: ${theme}`}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" />
              <path d="M10 3a7 7 0 0 1 0 14Z" fill="currentColor" />
            </svg>
          </button>
          <Link className="nav-cta" href="/projektanfrage">
            Projekt anfragen{" "}
            <span aria-hidden="true">
              <Icon name="arrow-up-right" />
            </span>
          </Link>
          <button
            ref={menuButton}
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label="Menü öffnen"
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ opacity: 0, y: reduced ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              className="mobile-close"
              onClick={() => {
                setOpen(false);
                menuButton.current?.focus();
              }}
            >
              Menü schließen <Icon name="close" />
            </button>
            <nav aria-label="Mobile Hauptnavigation">
              <Link href="/leistungen" onClick={() => setOpen(false)}>
                Leistungen{" "}
                <span>
                  <Icon name="arrow-up-right" />
                </span>
              </Link>
              {categories.map((c) => (
                <Link
                  className="mobile-category"
                  key={c.slug}
                  href={`/leistungen/${c.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              <Link
                className="mobile-category"
                href="/bewertungen"
                onClick={() => setOpen(false)}
              >
                Bewertungen prüfen lassen
              </Link>
              {links.map(([name, href]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  {name}{" "}
                  <span>
                    <Icon name="arrow-up-right" />
                  </span>
                </Link>
              ))}
              <Link href="/projektanfrage" onClick={() => setOpen(false)}>
                Projekt anfragen{" "}
                <span>
                  <Icon name="arrow-up-right" />
                </span>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
