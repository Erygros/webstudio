import { Button } from "@/components/ui";
export default function NotFound() {
  return (
    <section className="not-found not-found-page">
      <span className="not-found-code" aria-hidden="true">
        404
      </span>
      <span className="eyebrow">Fehler 404 / Nicht gefunden</span>
      <h1>Hier geht es nicht weiter.</h1>
      <p>
        Diese Seite existiert nicht oder wurde entfernt. Auf der Startseite oder
        in unseren Leistungen findest du den passenden nächsten Schritt.
      </p>
      <div className="buttons">
        <Button href="/leistungen">Leistungen ansehen</Button>
        <Button secondary href="/">
          Zur Startseite
        </Button>
      </div>
    </section>
  );
}
