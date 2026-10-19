import Link from "next/link";
import { PageIntro } from "@/components/ui";
import {
  bookingTerms,
  monthlyTerms,
  withdrawalText,
  withdrawalModel,
} from "@/data/bookable-services";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Buchungsbedingungen und Widerruf",
  "Vertragsinformationen für Einstiegspakete, Banküberweisung, monatliche Leistungen und Widerrufsrecht für Verbraucher.",
  "/buchungsbedingungen",
);
export default function Page() {
  return (
    <>
      <PageIntro
        label="Vertragsinformationen · Stand 19.10.2026"
        title="Buchung. Zahlung. Deine Rechte."
        description="Diese Informationen gelten für die online buchbaren Einstiegspakete. Der konkrete Leistungsumfang und Preis werden vor deiner Bestellung und in der Bestätigung aufgeführt."
      />
      <section className="section prose">
        <h2>Vertrag und Durchführung</h2>
        <p>{bookingTerms}</p>
        <h2>Monatliche Leistungen</h2>
        <p>{monthlyTerms}</p>
        <p>
          Ein Leistungsmonat beginnt am abgestimmten Startdatum und endet am Tag
          vor dem entsprechenden Datum des Folgemonats. Fehlt dieser
          Kalendertag, endet er am letzten Tag des Folgemonats. Überfällige
          Beträge geben keine automatische Freigabe weiterer Zusatzleistungen.
          Eine Kündigung kann ohne Anmeldung online erklärt werden.
        </p>
        <Link className="button secondary" href="/vertrag-kuendigen">
          Verträge hier kündigen
        </Link>
        <h2>Preise und Zusatzkosten</h2>
        <p>
          Es gelten die vor der Bestellung angezeigten vollständigen Endpreise.
          Bei Anwendung der Kleinunternehmerregelung erfolgt kein
          Umsatzsteuerausweis gemäß § 19 UStG. Für reine Beratungsanfragen wird
          keine Rechnung gestellt. Externe Kosten und Zusatzanforderungen werden
          nur nach gesonderter Abstimmung beauftragt.
        </p>
        <h2>Widerrufsbelehrung</h2>
        <p>{withdrawalText}</p>
        <h2>Muster-Widerrufsformular</h2>
        <p>{withdrawalModel}</p>
        <Link className="button secondary" href="/vertrag-widerrufen">
          Vertrag widerrufen
        </Link>
        <h2>Datenschutz</h2>
        <p>
          Zur Durchführung des Vertrags verarbeiten wir die erforderlichen
          Kontakt-, Rechnungs-, Leistungs- und Zahlungsdaten. Weitere Angaben
          stehen in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </section>
    </>
  );
}
