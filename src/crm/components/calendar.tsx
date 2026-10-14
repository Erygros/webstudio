"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { crmFetch } from "./api";
import { Editor } from "./editor";
import { ResourcePanel } from "./resource-panel";
import type { Row } from "@/crm/resources";
export function Calendar() {
  const [events, setEvents] = useState<Row[]>([]);
  const [anchor, setAnchor] = useState(new Date().toISOString().slice(0, 10));
  const [view, setView] = useState("Monat");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const all: Row[] = [];
      let offset = 0;
      while (true) {
        const data = await crmFetch<{ rows: Row[]; count: number }>(
          `data/kalender?offset=${offset}&order=starts_at&asc=true`,
        );
        all.push(...data.rows);
        if (offset + 50 >= data.count) break;
        offset += 50;
        if (offset > 5000)
          throw new Error(
            "Mehr als 5.000 Termine: bitte eine serverseitige Bereichsabfrage konfigurieren.",
          );
      }
      setEvents(all);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const selected = new Date(anchor + "T12:00:00");
  const first = new Date(selected);
  if (view === "Monat") first.setDate(1);
  if (view === "Woche")
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const count =
    view === "Tag"
      ? 1
      : view === "Woche"
        ? 7
        : new Date(
            selected.getFullYear(),
            selected.getMonth() + 1,
            0,
          ).getDate();
  const days = Array.from({ length: count }, (_, i) => {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    return d;
  });
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Termine und Fristen</span>
        <h1>Deine Zeit im Überblick.</h1>
        <div className="crm-filterbar">
          <input
            type="date"
            aria-label="Kalenderdatum"
            value={anchor}
            onChange={(e) => setAnchor(e.target.value)}
          />
          {["Tag", "Woche", "Monat"].map((v) => (
            <button
              className={`button ${view === v ? "" : "secondary"}`}
              onClick={() => setView(v)}
              key={v}
            >
              {v}
            </button>
          ))}
          <button className="button" onClick={() => setCreating(true)}>
            + Termin
          </button>
        </div>
      </header>
      {error && <p className="error-message">{error}</p>}
      <div
        className={`crm-calendar ${view === "Tag" ? "crm-calendar-day" : ""}`}
      >
        {days.map((day) => {
          const date = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Berlin",
          }).format(day);
          const today = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Berlin",
          }).format(new Date());
          const shown = events.filter((e) => {
            const start = new Date(String(e.starts_at));
            const startDay = new Intl.DateTimeFormat("sv-SE", {
              timeZone: "Europe/Berlin",
            }).format(start);
            if (e.recurrence === "weekly")
              return start.getDay() === day.getDay() && startDay <= date;
            if (e.recurrence === "monthly")
              return start.getDate() === day.getDate() && startDay <= date;
            return startDay === date;
          });
          return (
            <section
              className={`crm-calendar-cell ${date === today ? "crm-calendar-today" : ""}`}
              key={date}
            >
              <h2>
                {day.toLocaleDateString("de-DE", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </h2>
              {shown.map((e) => (
                <Link href={`/crm/kalender/${e.id}`} key={e.id}>
                  <strong>{String(e.title)}</strong>
                  <span>
                    {new Date(String(e.starts_at)).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Berlin",
                    })}{" "}
                    · {String(e.status)}
                  </span>
                </Link>
              ))}
            </section>
          );
        })}
      </div>
      <ResourcePanel resource="followups" />
      <ResourcePanel resource="aufgaben" />
      {creating && (
        <Editor
          resource="kalender"
          onClose={() => setCreating(false)}
          onSaved={() => void load()}
        />
      )}
    </>
  );
}
