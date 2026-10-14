"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { navModules } from "@/crm/resources";
import { crmFetch } from "./api";
import { DialerProvider, Dialer } from "./phone";
export function CRMFrame({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: { id: string; name: string; role: string };
}) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!mobileOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [mobileOpen]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { label: string; group: string; href: string }[]
  >([]);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; href: string; read_at: string | null }[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2)
        void crmFetch<{ results: typeof results }>(
          `search?q=${encodeURIComponent(query)}`,
        )
          .then((d) => setResults(d.results))
          .catch(() => setResults([]));
      else setResults([]);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    void crmFetch<{ rows: typeof notifications }>("data/benachrichtigungen")
      .then((d) => setNotifications(d.rows))
      .catch(() => {});
    let cleanup = () => {};
    void crmFetch<{ token: string }>("session-token").then(
      async ({ token }) => {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );
        await client.realtime.setAuth(token);
        const channel = client
          .channel("crm-changes")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "*" },
            () => {
              void crmFetch<{ rows: typeof notifications }>(
                "data/benachrichtigungen",
              ).then((d) => setNotifications(d.rows));
              window.dispatchEvent(new Event("crm-change"));
              router.refresh();
            },
          )
          .subscribe();
        cleanup = () => {
          void client.removeChannel(channel);
        };
      },
    );
    return () => cleanup();
  }, [router]);
  async function logout() {
    await crmFetch("auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/crm/login");
    router.refresh();
  }
  function theme() {
    const dark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    const value = dark ? "light" : "dark";
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem("theme", value);
    } catch {}
  }
  return (
    <DialerProvider>
      <div
        className={`crm-shell ${collapsed ? "crm-collapsed" : ""} ${mobileOpen ? "crm-mobile-open" : ""}`}
      >
        <aside className="crm-sidebar" id="crm-sidebar">
          <div className="crm-sidebar-brand">
            <Link href="/crm">{collapsed ? "W." : "Webstudio Expert"}</Link>
            <button
              className="crm-icon-button"
              aria-label="Sidebar ein- oder ausklappen"
              onClick={() =>
                mobileOpen ? setMobileOpen(false) : setCollapsed(!collapsed)
              }
            >
              {collapsed ? "›" : "‹"}
            </button>
          </div>
          <span className="crm-sidebar-caption">
            {collapsed ? "CRM" : "DEIN ARBEITSBEREICH"}
          </span>
          <nav aria-label="CRM Navigation">
            {navModules.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/crm${slug ? "/" + slug : ""}`}
                onClick={() => setMobileOpen(false)}
                aria-current={
                  path === `/crm${slug ? "/" + slug : ""}` ? "page" : undefined
                }
                title={label}
              >
                <span className="crm-nav-initial">{label.slice(0, 1)}</span>
                <span className="crm-nav-label">{label}</span>
              </Link>
            ))}
          </nav>
          <Link className="crm-public-link" href="/">
            {collapsed ? "↗" : "Öffentliche Website ↗"}
          </Link>
        </aside>
        <div className="crm-workspace">
          <header className="crm-topbar">
            <button
              className="crm-icon-button crm-mobile-menu-toggle"
              aria-label="CRM-Menü öffnen oder schließen"
              aria-expanded={mobileOpen}
              aria-controls="crm-sidebar"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              ☰
            </button>
            <div className="crm-global-search">
              <input
                aria-label="Globale CRM-Suche"
                placeholder="Unternehmen, Projekte, Dokumente suchen …"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {results.length > 0 && (
                <div className="crm-search-results">
                  {results.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                      }}
                    >
                      <span>{r.label}</span>
                      <small>{r.group}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              className="crm-icon-button"
              onClick={theme}
              aria-label="Darstellung wechseln"
            >
              ◐
            </button>
            <button
              className="crm-icon-button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Benachrichtigungen"
            >
              ◎
              <small>
                {notifications.filter((n) => !n.read_at).length || ""}
              </small>
            </button>
            <Link className="crm-profile" href="/crm/einstellungen">
              {profile.name}
            </Link>
            <button className="plain-button" onClick={() => void logout()}>
              Abmelden
            </button>
          </header>
          {showNotifications && (
            <aside className="crm-notification-list">
              <h2>Benachrichtigungen</h2>
              {notifications.length ? (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => {
                      void crmFetch("data/benachrichtigungen", {
                        method: "PATCH",
                        body: JSON.stringify({
                          id: n.id,
                          read_at: new Date().toISOString(),
                        }),
                      });
                      setShowNotifications(false);
                    }}
                  >
                    {n.title}
                    {!n.read_at && <span>Neu</span>}
                  </Link>
                ))
              ) : (
                <p>Keine Benachrichtigungen.</p>
              )}
            </aside>
          )}
          <main id="main" className="crm-content" tabIndex={-1}>
            {children}
          </main>
        </div>
        <Dialer />
      </div>
    </DialerProvider>
  );
}
