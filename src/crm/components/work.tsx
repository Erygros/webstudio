"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { crmFetch } from "./api";
import { useDialer } from "./phone";
import { Editor } from "./editor";
import { DocumentUpload } from "./upload";
import { leadStatuses, type Row } from "@/crm/resources";
import { berlinDate, berlinInput, berlinInstant } from "@/crm/time";
import type { WorkData, WorkSession } from "@/crm/work";

const blankLead = {
  name: "",
  website: "",
  contact_name: "",
  phone: "",
  email: "",
  status: "Neu",
};
type LeadForm = typeof blankLead;
type MailForm = {
  to_address: string;
  subject: string;
  body: string;
  attachment_ids: string[];
};
const blankMail: MailForm = {
  to_address: "",
  subject: "",
  body: "",
  attachment_ids: [],
};
const steps = [
  "Lead erfassen",
  "Kontakt aufnehmen",
  "Wiedervorlage",
  "Vorgang abschließen",
  "Nächste Aufgabe",
];
const progress = [1, 25, 50, 75, 100];
function dateLabel(value: unknown) {
  return value
    ? new Date(String(value)).toLocaleString("de-DE", {
        timeZone: "Europe/Berlin",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}
function text(row: Row | null, key: string) {
  return String(row?.[key] || "");
}

export function Work() {
  const router = useRouter();
  const [data, setData] = useState<WorkData | null>(null);
  const dataRef = useRef<WorkData | null>(null);
  const [view, setView] = useState(1);
  const [lead, setLead] = useState<LeadForm>(blankLead);
  const [mail, setMail] = useState<MailForm>(blankMail);
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [due, setDue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [dirty, setDirty] = useState(0);
  const savedVersion = useRef(0);
  const changeVersion = useRef(0);
  const scratchQueue = useRef<Promise<unknown>>(Promise.resolve());
  const formRef = useRef({ lead, mail, channel, due, reason, view });
  formRef.current = { lead, mail, channel, due, reason, view };
  const [lookup, setLookup] = useState("");
  const [matches, setMatches] = useState<Row[]>([]);
  const [permission, setPermission] = useState(false);
  const [advance, setAdvance] = useState(true);
  const dialer = useDialer();
  const booted = useRef(false);
  const initialized = useRef("");
  const syncing = useRef(false);

  function initialize(next: WorkData, force = false) {
    const session = next.session;
    const identity = session?.id || "empty";
    if (!force && initialized.current === identity) return;
    initialized.current = identity;
    const scratch = session?.state.scratch;
    const currentLead = Object.fromEntries(
      Object.keys(blankLead).map((key) => [
        key,
        String(next.company?.[key] || blankLead[key as keyof LeadForm]),
      ]),
    ) as LeadForm;
    setLead({ ...currentLead, ...scratch?.lead });
    const template = next.templates[0];
    const replace = (value: unknown) =>
      String(value || "")
        .replaceAll("{{company}}", text(next.company, "name"))
        .replaceAll("{{name}}", text(next.company, "contact_name"));
    setMail(
      scratch?.mail ||
        (next.email
          ? {
              to_address: text(next.email, "to_address"),
              subject: text(next.email, "subject"),
              body: text(next.email, "body"),
              attachment_ids: (next.email.attachment_ids || []) as string[],
            }
          : {
              ...blankMail,
              to_address: text(next.company, "email"),
              subject: replace(template?.subject),
              body: replace(template?.body),
            }),
    );
    setChannel(
      scratch?.channel ||
        (session?.state.channel === "phone" ? "phone" : "email"),
    );
    setDue(
      scratch?.due ||
        (session?.state.due
          ? berlinInput(session.state.due)
          : next.company?.next_contact
            ? berlinInput(String(next.company.next_contact))
            : ""),
    );
    setReason(scratch?.reason || text(next.followup, "notes"));
    setView(
      scratch?.view && scratch.view <= (session?.stage || 1)
        ? scratch.view
        : session?.stage || 1,
    );
    changeVersion.current = 0;
    savedVersion.current = 0;
    setDirty(0);
    setSaved("");
  }
  const load = useCallback(async () => {
    const next = await crmFetch<WorkData>("work");
    dataRef.current = next;
    setData(next);
    return next;
  }, []);
  async function rawAction(
    action: string,
    payload: unknown = {},
    id = dataRef.current?.session?.id,
  ) {
    return crmFetch<{ session: WorkSession | null }>("work", {
      method: "POST",
      body: JSON.stringify({ action, id: id || null, payload }),
    });
  }
  const flush = useCallback(async () => {
    const session = dataRef.current?.session;
    if (
      !session ||
      !["active", "paused"].includes(session.status) ||
      changeVersion.current === savedVersion.current
    )
      return scratchQueue.current;
    const version = changeVersion.current;
    const form = formRef.current;
    scratchQueue.current = scratchQueue.current
      .catch(() => {})
      .then(async () => {
        await crmFetch("work", {
          method: "POST",
          body: JSON.stringify({
            action: "scratch",
            id: session.id,
            payload: form,
          }),
        });
        savedVersion.current = version;
        setSaved("Entwurf gespeichert");
      });
    return scratchQueue.current;
  }, []);
  function changed() {
    changeVersion.current++;
    setDirty(changeVersion.current);
    setSaved("Noch nicht gespeichert …");
  }
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void flush().catch((e) => {
        setSaved("Speichern fehlgeschlagen");
        setError(e.message);
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [dirty, flush]);
  useEffect(
    () => () => {
      void flush().catch(() => {});
    },
    [flush],
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (changeVersion.current !== savedVersion.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void (async () => {
      const first = await load();
      if (
        !first.session ||
        ["completed", "skipped"].includes(first.session.status)
      ) {
        await rawAction("start");
        initialize(await load(), true);
      } else initialize(first, true);
    })().catch((e) => setError(e.message));
  }, [load]);
  useEffect(() => {
    const refresh = () => {
      if (syncing.current) return;
      syncing.current = true;
      void (async () => {
        let next = await load();
        const current = next.session;
        if (
          current?.status === "active" &&
          current.stage === 2 &&
          !current.contact_at
        ) {
          await rawAction("sync", {}, current.id);
          next = await load();
        }
        if (current && next.session?.stage !== current.stage)
          setView(next.session?.stage || 1);
      })()
        .catch((e) => setError(e.message))
        .finally(() => {
          syncing.current = false;
        });
    };
    const timer = setInterval(refresh, 30000);
    window.addEventListener("crm-change", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("crm-change", refresh);
    };
  }, [load]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (lookup.trim().length < 2) {
        setMatches([]);
        return;
      }
      void crmFetch<{ rows: Row[] }>(
        `data/leads?q=${encodeURIComponent(lookup.trim())}`,
      )
        .then((d) =>
          setMatches(
            d.rows.filter(
              (row) =>
                !row.blocked &&
                !row.archived &&
                !row.is_customer &&
                !row.work_closed_at &&
                !["Kein Interesse", "Kunde gewonnen"].includes(
                  String(row.status),
                ),
            ),
          ),
        )
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [lookup]);
  async function perform(action: string, payload: unknown = {}, force = false) {
    setBusy(true);
    setError("");
    try {
      await flush();
      const result = await rawAction(action, payload);
      const next = await load();
      if (force || action === "lead" || action === "resume")
        initialize(next, true);
      else if (result.session) setView(result.session.stage);
      return next;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!advance || data?.session?.status !== "completed") return;
    const timer = setTimeout(() => {
      void perform("start", {}, true);
    }, 2200);
    return () => clearTimeout(timer);
    // The completed session ID identifies one transition, never restarts a live session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.session?.id, data?.session?.status, advance]);
  async function sendMail() {
    if (!confirm("Diese Werbe-E-Mail jetzt tatsächlich versenden?")) return;
    setBusy(true);
    setError("");
    try {
      await flush();
      const draft = await rawAction("draft", mail);
      if (!draft.session?.email_id) throw new Error("Entwurf fehlt.");
      await crmFetch("mail", {
        method: "POST",
        body: JSON.stringify({
          id: draft.session.email_id,
          attachmentIds: mail.attachment_ids,
        }),
      });
      await rawAction("sync");
      initialize(await load(), true);
    } catch (e) {
      setError((e as Error).message);
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  async function nextLead() {
    const current = dataRef.current?.session;
    if (current?.status === "active" || current?.status === "paused") {
      const skipped = await perform("skip");
      if (!skipped) return;
    }
    await perform("start", {}, true);
  }
  async function endWork() {
    const current = dataRef.current?.session;
    if (current && ["active", "paused"].includes(current.status)) {
      const next = await perform("pause");
      if (!next) return;
    }
    router.push("/crm");
  }
  const s = data?.session;
  const current = !!s && ["active", "paused"].includes(s.status);
  const paused = s?.status === "paused";
  const company = data?.company || null;
  const excluded =
    !!company &&
    (!!company.blocked ||
      !!company.archived ||
      !!company.is_customer ||
      !!company.work_closed_at ||
      ["Kein Interesse", "Kunde gewonnen"].includes(String(company.status)));
  const permittedEmail = !!data?.permissions.some((p) => p.channel === "email");
  const contactDone = !!s?.contact_at;
  const emailLocked = !!data?.email && data.email.folder !== "draft";
  const renderMail = (value: string) =>
    value
      .replaceAll("{{company}}", text(company, "name"))
      .replaceAll("{{name}}", text(company, "contact_name"));
  const pct = s ? progress[s.stage - 1] : 1;

  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / CRM</span>
        <h1>Arbeit.</h1>
        <p>Ein Lead. Ein nächster Schritt. Alles an einem Ort.</p>
      </header>
      <div className="crm-work-stats" aria-label="Tagesübersicht">
        {(
          [
            ["Bearbeitete Leads", "leads"],
            ["Versendete E-Mails", "emails"],
            ["Durchgeführte Anrufe", "calls"],
            ["Neue Wiedervorlagen", "followups"],
            ["Offene Aufgaben", "tasks"],
          ] as const
        ).map(([label, key]) => (
          <div key={key}>
            <strong>{data ? data.stats[key] : "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="crm-work-toolbar">
        <span>{berlinDate()} · Europe/Berlin</span>
        <label className="consent">
          <input
            type="checkbox"
            checked={advance}
            onChange={(e) => setAdvance(e.target.checked)}
          />
          Automatisch zum nächsten Lead
        </label>
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {!data ? (
        <section className="crm-panel">
          <p>
            {error
              ? "Arbeitsbereich konnte nicht geladen werden."
              : "Arbeitsliste wird geladen …"}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              void load()
                .then((d) => initialize(d, true))
                .catch((e) => setError(e.message));
            }}
          >
            Erneut laden
          </button>
        </section>
      ) : (
        <div className="crm-work-layout">
          <section className="crm-panel crm-work-wizard" aria-busy={busy}>
            <div className="crm-work-progress-head">
              <span>{company ? text(company, "name") : "Neuer Vorgang"}</span>
              <strong>{pct} %</strong>
            </div>
            <progress
              className="crm-work-progress"
              max={100}
              value={pct}
              aria-label="Fortschritt des aktuellen Vorgangs"
            />
            <ol className="crm-work-steps">
              {steps.map((label, index) => (
                <li key={label}>
                  <button
                    disabled={
                      !current || index + 1 > (s?.stage || 1) || busy || paused
                    }
                    aria-current={view === index + 1 ? "step" : undefined}
                    onClick={() => {
                      setView(index + 1);
                      changed();
                    }}
                  >
                    <span>{index + 1}</span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
            {paused ? (
              <div className="crm-work-empty">
                <span className="eyebrow">Vorgang pausiert</span>
                <h2>Später an derselben Stelle weiter.</h2>
                <p>Lead, Entwürfe und Fortschritt bleiben gespeichert.</p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void perform("resume")}
                >
                  Arbeit fortsetzen
                </button>
              </div>
            ) : !current ? (
              <div className="crm-work-empty">
                <span className="eyebrow">
                  {s?.status === "completed"
                    ? "Vorgang abgeschlossen"
                    : "Arbeitsliste"}
                </span>
                <h2>
                  {data.queue.length
                    ? "Bereit für den nächsten Lead."
                    : "Alle aktuellen Aufgaben sind erledigt."}
                </h2>
                {s?.status === "completed" &&
                  advance &&
                  data.queue.length > 0 && (
                    <p>Der nächste Vorgang startet gleich.</p>
                  )}
                {!data.queue.length && (
                  <p>
                    Künftige Wiedervorlagen erscheinen bei Fälligkeit. Andere
                    Projektaufgaben findest du unter „Aufgaben“.
                  </p>
                )}
                <div className="crm-actions">
                  <button
                    className="button"
                    disabled={busy || !data.queue.length}
                    onClick={() => void perform("start", {}, true)}
                  >
                    Nächsten Lead bearbeiten
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => void perform("new", {}, true)}
                  >
                    Neuen Lead hinzufügen
                  </button>
                  <button
                    className="plain-button"
                    disabled={busy}
                    onClick={() =>
                      void load().catch((e) => setError(e.message))
                    }
                  >
                    Arbeitsliste aktualisieren
                  </button>
                  <Link className="text-link" href="/crm">
                    Arbeit beenden ↗
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {excluded && (
                  <p className="notice">
                    Dieser Lead ist gesperrt oder abgeschlossen. Weitere
                    Kontaktaufnahme ist deaktiviert. Du kannst den Vorgang
                    beenden.
                  </p>
                )}
                {company && (
                  <div className="crm-work-lead-strip">
                    <span>{text(company, "status")}</span>
                    <span>{text(company, "phone") || "Telefon fehlt"}</span>
                    <span>{text(company, "email") || "E-Mail fehlt"}</span>
                  </div>
                )}
                {view === 1 && (
                  <>
                    <h2>Lead erfassen</h2>
                    {!company && (
                      <div className="crm-work-lookup">
                        <label className="form-field">
                          Vorhandenen Lead suchen
                          <input
                            type="search"
                            value={lookup}
                            onChange={(e) => setLookup(e.target.value)}
                            placeholder="Firmenname …"
                          />
                        </label>
                        {matches.map((row) => (
                          <button
                            className="crm-work-queue-item"
                            key={row.id}
                            disabled={busy}
                            onClick={() =>
                              void perform(
                                "select",
                                { company_id: row.id },
                                true,
                              )
                            }
                          >
                            <strong>{String(row.name)}</strong>
                            <span>
                              {String(row.email || row.phone || row.status)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void perform("lead", { lead });
                      }}
                    >
                      <fieldset disabled={busy || excluded}>
                        <div className="crm-form-grid">
                          {(
                            [
                              ["name", "Firmenname", "text"],
                              ["website", "Website", "url"],
                              [
                                "contact_name",
                                "Ansprechpartner (optional)",
                                "text",
                              ],
                              ["phone", "Telefonnummer", "tel"],
                              ["email", "E-Mail-Adresse", "email"],
                            ] as const
                          ).map(([key, label, type]) => (
                            <label className="form-field" key={key}>
                              {label}
                              <input
                                type={type}
                                required={key === "name"}
                                maxLength={key === "name" ? 200 : 254}
                                value={lead[key]}
                                onChange={(e) => {
                                  setLead((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }));
                                  changed();
                                }}
                                placeholder={
                                  key === "website"
                                    ? "https://…"
                                    : key === "phone"
                                      ? "+49…"
                                      : undefined
                                }
                              />
                            </label>
                          ))}
                          <label className="form-field">
                            Leadstatus
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                setLead({ ...lead, status: e.target.value });
                                changed();
                              }}
                            >
                              {leadStatuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <button className="button">Speichern & weiter</button>
                      </fieldset>
                    </form>
                  </>
                )}
                {view === 2 && (
                  <>
                    <h2>
                      {s?.source_follow_up
                        ? "Wiedervorlage bearbeiten"
                        : "Kontakt aufnehmen"}
                    </h2>
                    {s?.source_follow_up && (
                      <div className="notice">
                        <strong>
                          Fällig: {dateLabel(data.followup?.due_at)}
                        </strong>
                        <p>
                          {text(data.followup, "title")} ·{" "}
                          {text(data.followup, "notes") ||
                            "Kein zusätzlicher Grund gespeichert."}
                        </p>
                      </div>
                    )}
                    <WorkHistory data={data} />
                    {contactDone ? (
                      <div className="notice">
                        <p>
                          Kontaktaufnahme gespeichert: {dateLabel(s.contact_at)}
                          .{" "}
                          {s.call_id
                            ? "Gesprächsergebnis wurde übernommen."
                            : "E-Mail wurde vom SMTP-Dienst angenommen."}
                        </p>
                        <button
                          className="button"
                          onClick={() => setView(s.stage >= 4 ? 4 : 3)}
                        >
                          Weiter
                        </button>
                      </div>
                    ) : (
                      !excluded && (
                        <>
                          <div
                            className="crm-work-channel"
                            role="group"
                            aria-label="Kontaktweg"
                          >
                            <button
                              className={
                                channel === "email"
                                  ? "button"
                                  : "button secondary"
                              }
                              onClick={() => {
                                setChannel("email");
                                changed();
                              }}
                            >
                              E-Mail senden
                            </button>
                            <button
                              className={
                                channel === "phone"
                                  ? "button"
                                  : "button secondary"
                              }
                              onClick={() => {
                                setChannel("phone");
                                changed();
                              }}
                            >
                              Unternehmen anrufen
                            </button>
                          </div>
                          {channel === "email" ? (
                            <>
                              {!data.integrations.smtp && (
                                <p className="notice">
                                  E-Mail-Versand ist noch nicht eingerichtet. Du
                                  kannst deinen Entwurf speichern und den
                                  Vorgang pausieren.
                                </p>
                              )}
                              {!permittedEmail && (
                                <div className="notice">
                                  <p>
                                    Für Werbe-E-Mails fehlt eine dokumentierte
                                    Kontakterlaubnis.
                                  </p>
                                  <button
                                    className="plain-button"
                                    onClick={() => setPermission(true)}
                                  >
                                    Vorhandene Rechtsgrundlage dokumentieren
                                  </button>
                                </div>
                              )}
                              {emailLocked ? (
                                <p className="notice">
                                  Nachricht: {text(data.email, "folder")}.{" "}
                                  {data.email?.folder === "unknown" ||
                                  data.email?.folder === "sending"
                                    ? "Versandstatus prüfen. Nicht erneut senden."
                                    : "Bereits übergeben; keine erneute Sendung."}
                                </p>
                              ) : (
                                <fieldset disabled={busy}>
                                  <label className="form-field">
                                    Gespeicherte Vorlage
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        const t = data.templates.find(
                                          (t) => t.id === e.target.value,
                                        );
                                        if (t) {
                                          const replace = (v: unknown) =>
                                            String(v || "")
                                              .replaceAll(
                                                "{{company}}",
                                                text(company, "name"),
                                              )
                                              .replaceAll(
                                                "{{name}}",
                                                text(company, "contact_name"),
                                              );
                                          setMail((prev) => ({
                                            ...prev,
                                            subject: replace(t.subject),
                                            body: replace(t.body),
                                          }));
                                          changed();
                                        }
                                      }}
                                    >
                                      <option value="">
                                        {data.templates.length
                                          ? "Vorlage wechseln"
                                          : "Noch keine Vorlage vorhanden"}
                                      </option>
                                      {data.templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {String(t.name)}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="form-field">
                                    Empfänger
                                    <input
                                      type="email"
                                      value={mail.to_address}
                                      onChange={(e) => {
                                        setMail({
                                          ...mail,
                                          to_address: e.target.value,
                                        });
                                        changed();
                                      }}
                                    />
                                  </label>
                                  <label className="form-field">
                                    Betreff
                                    <input
                                      value={mail.subject}
                                      maxLength={500}
                                      onChange={(e) => {
                                        setMail({
                                          ...mail,
                                          subject: e.target.value,
                                        });
                                        changed();
                                      }}
                                    />
                                  </label>
                                  <label className="form-field">
                                    Nachricht
                                    <textarea
                                      rows={8}
                                      maxLength={20000}
                                      value={mail.body}
                                      onChange={(e) => {
                                        setMail({
                                          ...mail,
                                          body: e.target.value,
                                        });
                                        changed();
                                      }}
                                    />
                                  </label>
                                  <div className="crm-work-preview">
                                    <span className="eyebrow">
                                      Vollständige Vorschau
                                    </span>
                                    <p>
                                      <strong>An:</strong>{" "}
                                      {mail.to_address || "—"}
                                    </p>
                                    <p>
                                      <strong>
                                        {renderMail(mail.subject) ||
                                          "Betreff fehlt"}
                                      </strong>
                                    </p>
                                    <div className="crm-mail-body">
                                      {renderMail(mail.body)}
                                      {data.signature
                                        ? "\n\n" + data.signature
                                        : ""}
                                    </div>
                                    <p className="crm-caption">
                                      Anhänge: {mail.attachment_ids.length}
                                    </p>
                                  </div>
                                  <details>
                                    <summary>
                                      Anhänge auswählen oder hochladen
                                    </summary>
                                    {data.documents.map((doc) => (
                                      <label className="consent" key={doc.id}>
                                        <input
                                          type="checkbox"
                                          checked={mail.attachment_ids.includes(
                                            doc.id,
                                          )}
                                          disabled={
                                            !mail.attachment_ids.includes(
                                              doc.id,
                                            ) && mail.attachment_ids.length >= 5
                                          }
                                          onChange={(e) => {
                                            setMail((prev) => ({
                                              ...prev,
                                              attachment_ids: e.target.checked
                                                ? [
                                                    ...prev.attachment_ids,
                                                    doc.id,
                                                  ]
                                                : prev.attachment_ids.filter(
                                                    (id) => id !== doc.id,
                                                  ),
                                            }));
                                            changed();
                                          }}
                                        />
                                        {String(doc.name)}
                                      </label>
                                    ))}
                                    <DocumentUpload
                                      companyId={company!.id}
                                      onSaved={() => {
                                        void load();
                                      }}
                                    />
                                  </details>
                                  <div className="crm-actions">
                                    <button
                                      className="button secondary"
                                      onClick={() =>
                                        void perform("draft", mail)
                                      }
                                    >
                                      Entwurf speichern
                                    </button>
                                    <button
                                      className="button"
                                      disabled={
                                        !data.integrations.smtp ||
                                        !permittedEmail ||
                                        !mail.to_address ||
                                        !mail.subject ||
                                        !mail.body
                                      }
                                      onClick={() => void sendMail()}
                                    >
                                      E-Mail jetzt senden
                                    </button>
                                  </div>
                                </fieldset>
                              )}
                            </>
                          ) : (
                            <>
                              <p>
                                {text(company, "phone") ||
                                  "Ergänze zuerst eine Telefonnummer im Lead-Schritt."}
                              </p>
                              {!data.integrations.phone && (
                                <p className="notice">
                                  Browser-Telefonie ist nicht eingerichtet. Es
                                  wird kein Anruf simuliert.
                                </p>
                              )}
                              <div className="crm-actions">
                                <button
                                  className="button"
                                  disabled={
                                    busy ||
                                    !company?.phone ||
                                    !data.integrations.phone
                                  }
                                  onClick={() =>
                                    dialer.open(
                                      text(company, "phone"),
                                      company!.id,
                                      "marketing",
                                    )
                                  }
                                >
                                  CRM-Dialer öffnen
                                </button>
                                <button
                                  className="button secondary"
                                  disabled={busy}
                                  onClick={() => void perform("sync")}
                                >
                                  Gesprächsergebnis übernehmen & weiter
                                </button>
                              </div>
                              <p className="crm-caption">
                                Nach dem echten Anruf Ergebnis und Notizen im
                                Dialer speichern. Der Wizard übernimmt den
                                Kontakt automatisch.
                              </p>
                            </>
                          )}
                          {s?.source_follow_up && (
                            <button
                              className="plain-button"
                              onClick={() => {
                                setView(3);
                                changed();
                              }}
                            >
                              Wiedervorlage verschieben
                            </button>
                          )}
                        </>
                      )
                    )}
                    <button
                      className="plain-button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            "Lead abschließen und alle zugehörigen Wiedervorlagen beenden?",
                          )
                        )
                          void perform("close");
                      }}
                    >
                      Lead abschließen / keine weitere Kontaktaufnahme
                    </button>
                  </>
                )}
                {view === 3 && (
                  <>
                    <h2>
                      {contactDone
                        ? "Wiedervorlage festlegen"
                        : "Wiedervorlage verschieben"}
                    </h2>
                    {!excluded && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          try {
                            void perform("plan", {
                              channel,
                              due: berlinInstant(due),
                              reason,
                            });
                          } catch (err) {
                            setError((err as Error).message);
                          }
                        }}
                      >
                        <fieldset disabled={busy}>
                          <label className="form-field">
                            Nächster Kontakt
                            <select
                              value={channel}
                              onChange={(e) => {
                                setChannel(e.target.value as "email" | "phone");
                                changed();
                              }}
                            >
                              <option value="email">
                                Follow-up per E-Mail
                              </option>
                              <option value="phone">
                                Follow-up per Telefon
                              </option>
                            </select>
                          </label>
                          <div className="crm-actions">
                            {[2, 3].map((days) => (
                              <button
                                className="button secondary"
                                type="button"
                                key={days}
                                onClick={() => {
                                  const wall = new Date(
                                    berlinInput(new Date().toISOString()) +
                                      ":00Z",
                                  );
                                  wall.setUTCDate(wall.getUTCDate() + days);
                                  setDue(wall.toISOString().slice(0, 16));
                                  changed();
                                }}
                              >
                                In {days} Tagen
                              </button>
                            ))}
                          </div>
                          <label className="form-field">
                            Datum und Uhrzeit (Berlin)
                            <input
                              type="datetime-local"
                              required
                              value={due}
                              onChange={(e) => {
                                setDue(e.target.value);
                                changed();
                              }}
                            />
                          </label>
                          <label className="form-field">
                            Grund der Wiedervorlage
                            <textarea
                              required
                              maxLength={2000}
                              value={reason}
                              onChange={(e) => {
                                setReason(e.target.value);
                                changed();
                              }}
                              placeholder="Was soll beim nächsten Kontakt besprochen werden?"
                            />
                          </label>
                          <button className="button">
                            Wiedervorlage speichern & weiter
                          </button>
                        </fieldset>
                      </form>
                    )}
                    <button
                      className="plain-button"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            "Lead abschließen und keine weitere Kontaktaufnahme planen?",
                          )
                        )
                          void perform("close");
                      }}
                    >
                      Keine weitere Kontaktaufnahme
                    </button>
                  </>
                )}
                {view === 4 && (
                  <>
                    <h2>Dieser Vorgang ist vorbereitet.</h2>
                    <dl className="crm-work-summary">
                      <dt>Unternehmen</dt>
                      <dd>{text(company, "name")}</dd>
                      <dt>Kontaktaufnahme</dt>
                      <dd>
                        {contactDone
                          ? dateLabel(s?.contact_at)
                          : "Ohne erneute Kontaktaufnahme"}
                      </dd>
                      <dt>Nächster Schritt</dt>
                      <dd>
                        {s?.state.mode === "closed"
                          ? "Lead abgeschlossen · keine weitere Kontaktaufnahme"
                          : `${s?.state.channel === "phone" ? "Telefon" : "E-Mail"} · ${dateLabel(s?.state.due)}`}
                      </dd>
                      <dt>Grund</dt>
                      <dd>{s?.state.reason || "—"}</dd>
                    </dl>
                    <p>
                      Die Wiedervorlage ist mit Aufgaben und Kalender verknüpft.
                      Der nächste Lead erhält einen eigenen Fortschritt.
                    </p>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => void perform("complete")}
                    >
                      Vorgang abschließen & weiter
                    </button>
                  </>
                )}
                <div className="crm-work-footer">
                  <span className="crm-caption" role="status">
                    {saved || "Fortschritt dauerhaft gespeichert"}
                  </span>
                  <div className="crm-actions">
                    {view > 1 && (
                      <button
                        className="plain-button"
                        disabled={busy}
                        onClick={() => {
                          setView(Math.max(1, view - 1));
                          changed();
                        }}
                      >
                        ← Vorheriger Schritt
                      </button>
                    )}
                    <button
                      className="plain-button"
                      disabled={busy}
                      onClick={() => void perform("pause")}
                    >
                      Vorgang pausieren
                    </button>
                    <button
                      className="plain-button"
                      disabled={busy}
                      onClick={() => void nextLead()}
                    >
                      Lead überspringen
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
          <aside className="crm-panel crm-work-list">
            <div className="crm-panel-head">
              <h2>Als Nächstes</h2>
              <span>
                {data.queue.length}
                {data.queue.length === 100 ? "+" : ""}
              </span>
            </div>
            <p className="crm-caption">
              Überfällige und heute fällige Wiedervorlagen zuerst.
            </p>
            {data.queue.slice(0, 8).map((item) => (
              <div className="crm-work-queue-item" key={item.company_id}>
                <strong>{item.label}</strong>
                <span>
                  {item.rank <= 2
                    ? `${item.rank === 1 ? "Überfällig" : "Heute fällig"} · ${dateLabel(item.due_at)}`
                    : item.rank === 3
                      ? "Offener Lead"
                      : "Neuer Lead"}
                </span>
              </div>
            ))}
            {!data.queue.length && <p>Keine weiteren fälligen Leads.</p>}
            <div className="crm-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void nextLead()}
              >
                Nächsten Lead bearbeiten
              </button>
              <button
                className="plain-button"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    if (current) {
                      const skipped = await perform("skip");
                      if (!skipped) return;
                    }
                    await perform("new", {}, true);
                  })();
                }}
              >
                Neuen Lead hinzufügen
              </button>
            </div>
            <Link
              className="text-link"
              href="/crm"
              onClick={(e) => {
                e.preventDefault();
                void endWork();
              }}
            >
              Arbeit beenden ↗
            </Link>
            <p className="crm-caption">
              Vor dem Verlassen „Vorgang pausieren“ wählen, damit alle letzten
              Änderungen gespeichert sind. Übersprungene Leads bleiben 24
              Stunden aus der Arbeitsliste.
            </p>
          </aside>
        </div>
      )}
      {permission && company && (
        <Editor
          resource="berechtigungen"
          defaults={{ company_id: company.id, channel: "email" }}
          onClose={() => setPermission(false)}
          onSaved={() => {
            void load();
          }}
        />
      )}
    </>
  );
}
function WorkHistory({ data }: { data: WorkData }) {
  return (
    <details
      className="crm-work-history"
      open={!!data.session?.source_follow_up}
    >
      <summary>
        Bisheriger Verlauf · {text(data.company, "contact_attempts") || "0"}{" "}
        Anrufversuche
      </summary>
      {data.lastEmail && (
        <div>
          <strong>Letzte E-Mail · {dateLabel(data.lastEmail.sent_at)}</strong>
          <p>{text(data.lastEmail, "subject")}</p>
          <div className="crm-mail-body">{text(data.lastEmail, "body")}</div>
        </div>
      )}
      {data.calls.map((call) => (
        <div key={call.id}>
          <strong>
            {dateLabel(call.started_at)} ·{" "}
            {text(call, "outcome") || text(call, "status")}
          </strong>
          <p>{text(call, "notes") || "Keine Gesprächsnotizen"}</p>
        </div>
      ))}
      {data.history.map((entry) => (
        <p key={entry.id}>
          {dateLabel(entry.created_at)} · {text(entry, "old_status")} →{" "}
          {text(entry, "new_status")}
        </p>
      ))}
      {data.activity.map((entry) => (
        <p key={entry.id}>
          {dateLabel(entry.created_at)} ·{" "}
          {(
            {
              "work.started": "Vorgang gestartet",
              "work.lead": "Lead übernommen",
              "work.paused": "Vorgang pausiert",
              "work.active": "Vorgang fortgesetzt",
              "work.completed": "Vorgang abgeschlossen",
              "work.skipped": "Lead übersprungen",
              "work.contact": "Kontaktaufnahme dokumentiert",
              "work.followup": "Wiedervorlage gespeichert",
              "work.draft": "E-Mail-Entwurf gespeichert",
            } as Record<string, string>
          )[String(entry.action)] || String(entry.action)}
        </p>
      ))}
      {!data.calls.length &&
        !data.lastEmail &&
        !data.history.length &&
        !data.activity.length && <p>Noch keine Kontaktaufnahme gespeichert.</p>}
    </details>
  );
}
