"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="not-found">
      <span className="eyebrow">Seite konnte nicht geladen werden</span>
      <h1>Versuche es noch einmal.</h1>
      <p>
        Beim Laden ist ein Fehler aufgetreten. Deine Eingaben werden nicht
        automatisch erneut gesendet.
      </p>
      <div className="buttons">
        <button className="button" onClick={reset}>
          Erneut laden ↗
        </button>
        <Link className="button secondary" href="/">
          Zur Startseite
        </Link>
      </div>
    </section>
  );
}
