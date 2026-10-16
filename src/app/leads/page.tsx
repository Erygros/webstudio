import { Breadcrumbs, PageIntro, Faq } from "@/components/ui";
import { LeadStore } from "@/components/lead-store";
import { shopStatus } from "@/crm/server/lead-shop";
import { seo } from "@/lib/seo";
export const metadata = seo(
  "Exklusive B2B-Firmenkontakte kaufen",
  "500 bis 5.000 exklusive Firmenkontakte als CSV. Firmenname, Telefon, E-Mail und Website. Einmaliger Kauf und Lieferung per E-Mail nach Zahlungseingang.",
  "/leads",
);
export const dynamic = "force-dynamic";
export default async function Leads() {
  const status = await shopStatus();
  return (
    <>
      <Breadcrumbs items={[{ name: "Firmenkontakte", href: "/leads" }]} />
      <PageIntro
        label="Exklusive B2B-Firmenkontakte"
        title="Die passenden Daten. Für Ihren nächsten Schritt."
        description="Firmenkontakte für Ihre eigene B2B-Recherche: klarer Umfang, einmaliger Preis und eine exklusive Liste als CSV. Keine Abonnements."
      />
      <section className="section">
        <LeadStore available={status.available} />
      </section>
      <section className="section content-split">
        <h2>Vier Felder. Ein klarer Bestand.</h2>
        <div className="prose">
          <p>
            Jeder Kontakt enthält Firmenname, Telefonnummer, E-Mail-Adresse und
            Website. Die zugrunde liegende Datenbasis umfasst nach Angaben des
            Dateninhabers rund 456.376 bestehende Unternehmen und wurde um nicht
            mehr existierende Unternehmen bereinigt.
          </p>
          <p>
            Ausgeliefert werden ausschließlich vorhandene, für den Verkauf
            freigegebene Datensätze. Bereits verkaufte Kontakte werden von
            Webstudio Expert nicht erneut verkauft. Die Pakete enthalten keine
            frei wählbare Branchen- oder Regionsauswahl.
          </p>
          <p>
            Eine Firmenadresse ist keine Kaufanfrage und keine
            Werbeeinwilligung. Ob und auf welchem Weg Sie ein Unternehmen
            kontaktieren dürfen, ist vor der Nutzung zu prüfen.
          </p>
        </div>
      </section>
      <section className="section content-split">
        <h2>Vor dem Kauf.</h2>
        <Faq
          items={[
            {
              question: "Wie erhalte ich meine Leadliste?",
              answer:
                "Nach bestätigtem vollständigem Zahlungseingang senden wir Ihre Leadliste als CSV-Datei an die bei der Bestellung angegebene E-Mail-Adresse. Bitte achten Sie auf eine korrekte Adresse. Vor Zahlungseingang erfolgt kein Versand.",
            },
            {
              question: "Was bedeutet exklusiv?",
              answer:
                "Die für Ihre Bestellung zusammengestellten Kontakte werden nicht erneut durch Webstudio Expert verkauft. Öffentlich verfügbare Unternehmensdaten können unabhängig davon auch bei anderen Quellen erhältlich sein. Eine Weiterveräußerung der Liste ist ausgeschlossen.",
            },
            {
              question: "Ist die Liste eine Einwilligung für Werbe-E-Mails?",
              answer:
                "Nein. Der Kauf überträgt keine Werbeeinwilligung. Insbesondere E-Mail-Werbung unterliegt eigenen rechtlichen Voraussetzungen. Käufer sind für die zulässige Nutzung verantwortlich.",
            },
            {
              question: "Wie wird bezahlt?",
              answer:
                "Per Banküberweisung. Empfänger, IBAN, Bestellnummer als Verwendungszweck und vollständiger Zahlbetrag erscheinen nach der verbindlichen Bestellung und werden per E-Mail bestätigt. Es wird keine zusätzliche Umsatzsteuer berechnet (§ 19 UStG).",
            },
          ]}
        />
      </section>
    </>
  );
}
