import Link from "next/link";
import { session } from "@/crm/server/db";
import { metrics } from "@/crm/server/metrics";
export default async function Dashboard() {
  const current = await session();
  const m = await metrics(current!.db);
  const bookings = await current!.db
    .from("crm_service_bookings")
    .select("id,reference,status,package")
    .order("created_at", { ascending: false })
    .limit(5);
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / Überblick</span>
        <h1>Was heute ansteht.</h1>
        <p>Echte Werte aus deiner Datenbank. Offene Schritte an einem Ort.</p>
        <div className="crm-actions">
          <Link className="button" href="/crm/leads">
            Lead hinzufügen ↗
          </Link>
          <Link className="button secondary" href="/crm/telefonie">
            Nummer wählen ↗
          </Link>
          <Link className="button secondary" href="/crm/followups">
            Wiedervorlagen
          </Link>
        </div>
      </header>
      <div className="crm-metrics">
        {m.counts.map((c) => (
          <article key={c.label}>
            <span>{c.label}</span>
            <strong>{c.value ?? "Kein Zugriff"}</strong>
          </article>
        ))}
      </div>
      <div className="crm-dashboard-grid">
        <section className="crm-panel">
          <h2>
            <Link href="/crm/buchungen">Buchungen & Beratung</Link>
          </h2>
          {bookings.error ? (
            <p>Buchungsbereich noch einrichten: SQL-Migration erforderlich.</p>
          ) : bookings.data?.length ? (
            bookings.data.map((b) => (
              <Link
                className="crm-list-row"
                href={`/crm/buchungen?vorgang=${b.id}`}
                key={b.id}
              >
                <span>
                  {b.reference} · {b.package.name}
                </span>
                <small>{b.status}</small>
              </Link>
            ))
          ) : (
            <p>Noch keine Buchungen.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Heutige Aufgaben</h2>
          {m.tasks.length ? (
            m.tasks.map((t) => (
              <Link
                className="crm-list-row"
                href={`/crm/aufgaben/${t.id}`}
                key={t.id}
              >
                <span>{t.title}</span>
                <small>{t.status}</small>
              </Link>
            ))
          ) : (
            <p className="crm-empty">Keine fälligen Aufgaben.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Anstehende Gespräche</h2>
          {m.events.length ? (
            m.events.map((e) => (
              <Link
                className="crm-list-row"
                href={`/crm/kalender/${e.id}`}
                key={e.id}
              >
                <span>{e.title}</span>
                <small>
                  {new Date(e.starts_at).toLocaleString("de-DE", {
                    timeZone: "Europe/Berlin",
                  })}
                </small>
              </Link>
            ))
          ) : (
            <p className="crm-empty">Keine geplanten Termine.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Neue Website-Anfragen</h2>
          {m.inquiries.length ? (
            m.inquiries.map((e) => (
              <Link
                className="crm-list-row"
                href={`/crm/anfragen/${e.id}`}
                key={e.id}
              >
                <span>{e.data?.name || "Anfrage"}</span>
                <small>
                  {new Date(e.created_at).toLocaleDateString("de-DE")}
                </small>
              </Link>
            ))
          ) : (
            <p className="crm-empty">Noch keine Anfragen.</p>
          )}
        </section>
        <section className="crm-panel">
          <h2>Aktivitätsfeed</h2>
          {m.activity.length ? (
            m.activity.map((a) => (
              <div className="crm-list-row" key={a.id}>
                <span>
                  {a.entity.replace("crm_", "")} · {a.action}
                </span>
                <small>
                  {new Date(a.created_at).toLocaleString("de-DE", {
                    timeZone: "Europe/Berlin",
                  })}
                </small>
              </div>
            ))
          ) : (
            <p className="crm-empty">Noch keine Aktivitäten.</p>
          )}
        </section>
      </div>
    </>
  );
}
