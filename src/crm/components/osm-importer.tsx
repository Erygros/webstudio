"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crmFetch } from "./api";
import { Modal } from "./modal";
import { osmIndustries, type OsmPreview, type OsmResult } from "@/crm/osm";
type ImportOutcome = {
  index: number;
  state: "imported" | "duplicate" | "review" | "error";
  reason?: string;
  id?: string;
};
type ImportResponse = {
  created: number;
  duplicates: number;
  held: number;
  outcomes: ImportOutcome[];
  alreadyImported?: boolean;
};

export function OsmImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [industry, setIndustry] = useState<string>(osmIndustries[0].label);
  const [radius, setRadius] = useState(5);
  const [preview, setPreview] = useState<OsmPreview | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [reviewed, setReviewed] = useState<number[]>([]);
  const [review, setReview] = useState<OsmResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"search" | "import" | null>(null);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<ImportResponse | null>(null);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy("search");
    setError("");
    setPreview(null);
    setOutcome(null);
    setSelected([]);
    setReviewed([]);
    try {
      const result = await crmFetch<OsmPreview>("osm", {
        method: "POST",
        body: JSON.stringify({
          action: "search",
          criteria: { postalCode, industry, radius },
        }),
      });
      setPreview(result);
      setSelected(
        result.rows
          .filter((row) => row.state === "new")
          .map((row) => row.index),
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function importLeads() {
    if (!preview || !selected.length || busy || outcome) return;
    setBusy("import");
    setError("");
    try {
      const result = await crmFetch<ImportResponse>("osm", {
        method: "POST",
        body: JSON.stringify({
          action: "import",
          token: preview.token,
          selected,
          reviewed: reviewed.filter((i) => selected.includes(i)),
        }),
      });
      setOutcome(result);
      window.dispatchEvent(new Event("crm-change"));
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(null);
    }
  }
  const duplicates =
    preview?.rows.filter((r) => r.state === "duplicate").length || 0;
  const newCount = preview?.rows.filter((r) => r.state === "new").length || 0;
  const heldCount =
    preview?.rows.filter(
      (r) => r.state === "review" && !reviewed.includes(r.index),
    ).length || 0;
  return (
    <section className="crm-panel crm-osm-importer">
      <div className="crm-panel-head">
        <div>
          <span className="crm-caption">OpenStreetMap / Overpass</span>
          <h2>Leads importieren</h2>
        </div>
        <button
          className="button secondary"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Bereich schließen" : "Unternehmen suchen"}
        </button>
      </div>
      <p>
        Unternehmen nach PLZ, Branche und Umkreis finden. Vor dem Import prüfst
        du die Ergebnisse.
      </p>
      {open && (
        <>
          <form className="crm-osm-search" onSubmit={search}>
            <fieldset disabled={!!busy}>
              <label className="form-field">
                Postleitzahl
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  value={postalCode}
                  placeholder="z. B. 44388"
                  onChange={(e) =>
                    setPostalCode(e.target.value.replace(/\D/g, ""))
                  }
                />
              </label>
              <label className="form-field">
                Branche auswählen oder eingeben
                <input
                  required
                  list="crm-osm-industries"
                  minLength={2}
                  maxLength={100}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
                <datalist id="crm-osm-industries">
                  {osmIndustries.map((item) => (
                    <option key={item.label} value={item.label} />
                  ))}
                </datalist>
              </label>
              <label className="form-field">
                Suchradius: {radius} km
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  required
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
              </label>
              <button className="button">
                {busy === "search"
                  ? "Unternehmen werden gesucht …"
                  : "Leads suchen"}
              </button>
            </fieldset>
          </form>
          <p className="crm-caption">
            Radius um den PLZ-Mittelpunkt, maximal 200 Treffer. Freitext sucht
            in OSM-Branchenmerkmalen, Namen und Beschreibungen; die auswählbaren
            Branchen verwenden gezielte OSM-Kategorien. Maximal sechs Suchen pro
            Stunde.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {preview && (
            <>
              <div className="crm-osm-counts" aria-label="Suchübersicht">
                <div>
                  <strong>
                    {preview.found}
                    {preview.truncated ? "+" : ""}
                  </strong>
                  <span>Gefunden</span>
                </div>
                <div>
                  <strong>{newCount}</strong>
                  <span>Neue Unternehmen</span>
                </div>
                <div>
                  <strong>{duplicates + preview.unnamed}</strong>
                  <span>Übersprungen</span>
                </div>
                <div>
                  <strong>{heldCount}</strong>
                  <span>Manuell zu prüfen</span>
                </div>
              </div>
              <p>
                {preview.industry} · PLZ {preview.postalCode} · {preview.radius}{" "}
                km
              </p>
              {preview.truncated && (
                <p className="notice">
                  Die Suche enthält mehr als 200 Treffer. Es wird nur die
                  begrenzte Vorschau angezeigt. Verkleinere den Radius oder
                  präzisiere die Branche.
                </p>
              )}
              {preview.invalidContacts > 0 && (
                <p className="crm-caption">
                  {preview.invalidContacts} ungültige Kontaktangaben wurden leer
                  gelassen.
                </p>
              )}
              {!preview.rows.length ? (
                <p>
                  Keine Unternehmen mit Firmennamen gefunden. Versuche eine
                  andere Branche oder einen anderen Radius. OSM enthält nicht
                  jedes Unternehmen und nicht alle Kontaktdaten.
                </p>
              ) : (
                <>
                  <div className="crm-table-wrap">
                    <table className="crm-table crm-osm-table">
                      <thead>
                        <tr>
                          <th>Import</th>
                          <th>Firmenname</th>
                          <th>Telefon</th>
                          <th>E-Mail</th>
                          <th>Branche</th>
                          <th>Prüfung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row) => {
                          const final = outcome?.outcomes.find(
                            (o) => o.index === row.index,
                          );
                          const eligible =
                            row.state === "new" ||
                            (row.state === "review" &&
                              reviewed.includes(row.index));
                          return (
                            <tr key={row.index}>
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`${row.name} importieren`}
                                  checked={selected.includes(row.index)}
                                  disabled={!eligible || !!busy || !!outcome}
                                  onChange={(e) =>
                                    setSelected((prev) =>
                                      e.target.checked
                                        ? [...prev, row.index]
                                        : prev.filter((i) => i !== row.index),
                                    )
                                  }
                                />
                              </td>
                              <td>{row.name}</td>
                              <td>{row.phone || "—"}</td>
                              <td>{row.email || "—"}</td>
                              <td>{row.industry}</td>
                              <td>
                                <span className="crm-osm-state">
                                  {final?.state === "imported"
                                    ? "Importiert"
                                    : final?.reason ||
                                      (reviewed.includes(row.index)
                                        ? "Manuell als eigenständig bestätigt"
                                        : row.reason)}
                                </span>
                                {row.match?.id && (
                                  <Link
                                    className="text-link"
                                    href={`/crm/leads/${row.match.id}`}
                                    target="_blank"
                                  >
                                    Bestehenden Lead öffnen ↗
                                  </Link>
                                )}
                                {row.state === "review" && !outcome && (
                                  <button
                                    className="plain-button"
                                    disabled={!!busy}
                                    onClick={() => {
                                      setReview(row);
                                      setConfirmed(false);
                                    }}
                                  >
                                    Manuell prüfen
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {outcome ? (
                    <p className="notice" role="status">
                      {outcome.alreadyImported
                        ? "Diese Vorschau wurde bereits verarbeitet. Prüfe die Lead-Liste und starte bei Bedarf eine neue Suche."
                        : `${outcome.created} neue Leads importiert · ${outcome.duplicates} inzwischen vorhandene Duplikate ausgeschlossen · ${outcome.held} zur Prüfung zurückgehalten · ${outcome.outcomes.filter((o) => o.state === "error").length} Fehler.`}
                    </p>
                  ) : (
                    <div className="crm-actions">
                      <button
                        className="button"
                        disabled={!!busy || !selected.length}
                        onClick={() => void importLeads()}
                      >
                        {busy === "import"
                          ? "Neue Leads werden gespeichert …"
                          : `Neue Leads importieren (${selected.length})`}
                      </button>
                      <button
                        className="plain-button"
                        disabled={!!busy}
                        onClick={() =>
                          setSelected(
                            preview.rows
                              .filter(
                                (row) =>
                                  row.state === "new" ||
                                  reviewed.includes(row.index),
                              )
                              .map((row) => row.index),
                          )
                        }
                      >
                        Alle freigegebenen auswählen
                      </button>
                      <button
                        className="plain-button"
                        disabled={!!busy}
                        onClick={() => setSelected([])}
                      >
                        Auswahl aufheben
                      </button>
                    </div>
                  )}
                  <p className="crm-caption">
                    Nur Firmenname, Telefonnummer, E-Mail und Branche werden
                    übertragen; der Status wird „Neu“. Bestehende Datensätze
                    bleiben unverändert. Die Vorschau ist 30 Minuten gültig und
                    kann einmal importiert werden. Zurückgehaltene Namen erst
                    prüfen, dann importieren.
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}
      <p className="crm-caption crm-osm-attribution">
        Daten:{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap contributors
        </a>{" "}
        ·{" "}
        <a
          href="https://opendatacommons.org/licenses/odbl/1-0/"
          target="_blank"
          rel="noreferrer"
        >
          ODbL 1.0
        </a>{" "}
        · Abfrage über Overpass. Die öffentlichen Dienste sind kostenlos und
        können zeitweise ausgelastet sein. OSM-Kontaktdaten stellen keine
        Werbeeinwilligung dar.
      </p>
      {review && (
        <Modal
          title="Firmenname manuell prüfen"
          onClose={() => setReview(null)}
        >
          <p>
            {review.reason}. Es werden keine Unternehmen automatisch
            zusammengeführt.
          </p>
          <div className="crm-osm-review">
            <div>
              <h3>Suchtreffer</h3>
              <p>
                <strong>{review.name}</strong>
              </p>
              <p>{review.phone || "Telefon fehlt"}</p>
              <p>{review.email || "E-Mail fehlt"}</p>
              <p>{review.industry}</p>
            </div>
            <div>
              <h3>
                {review.match?.id
                  ? "Bestehender CRM-Lead"
                  : "Ähnlicher Suchtreffer"}
              </h3>
              <p>
                <strong>{review.match?.name || "—"}</strong>
              </p>
              <p>{review.match?.phone || "Telefon fehlt"}</p>
              <p>{review.match?.email || "E-Mail fehlt"}</p>
              <p>{review.match?.industry || "—"}</p>
              {review.match?.id && (
                <Link
                  className="text-link"
                  href={`/crm/leads/${review.match.id}`}
                  target="_blank"
                >
                  Lead separat prüfen ↗
                </Link>
              )}
            </div>
          </div>
          <label className="consent">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Ich habe geprüft, dass dies ein anderes, eigenständiges Unternehmen
            ist.
          </label>
          <div className="crm-actions">
            <button
              className="button"
              disabled={!confirmed}
              onClick={() => {
                setReviewed((prev) => [...new Set([...prev, review.index])]);
                setSelected((prev) => [...new Set([...prev, review.index])]);
                setReview(null);
              }}
            >
              Als eigenständiges Unternehmen freigeben
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setReviewed((prev) => prev.filter((i) => i !== review.index));
                setSelected((prev) => prev.filter((i) => i !== review.index));
                setReview(null);
              }}
            >
              Nicht importieren
            </button>
          </div>
          <p className="crm-caption">
            Eine identische Telefonnummer oder E-Mail bleibt auch nach manueller
            Prüfung vom Import ausgeschlossen.
          </p>
        </Modal>
      )}
    </section>
  );
}
