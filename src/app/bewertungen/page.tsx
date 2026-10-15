import {
  Breadcrumbs,
  PageIntro,
  Button,
  SectionHead,
  Faq,
  JsonLd,
} from "@/components/ui";
import { ReviewForm } from "@/components/review-form";
import { seo, organizationId, canonicalUrl } from "@/lib/seo";
import { reviewLawyers } from "@/lib/reviews";
export const metadata = seo(
  "Negative Bewertungen rechtlich prüfen lassen",
  "Kostenlose Erstberatung zu Google-, kununu-, Trustpilot- und weiteren Bewertungen. 59 € nur bei erfolgreicher Entfernung; Vorauszahlung bei Misserfolg zurück.",
  "/bewertungen",
);
export default function Reviews() {
  return (
    <>
      <Breadcrumbs
        items={[{ name: "Bewertungsschutz", href: "/bewertungen" }]}
      />
      <PageIntro
        label="Bewertungsschutz"
        title="Dein Ruf verdient eine faire Bewertung."
        description="Negative Bewertungen auf Google, kununu, Trustpilot oder anderen Plattformen? Lass prüfen, ob ein rechtliches Vorgehen möglich ist. Die Erstberatung ist kostenlos."
      >
        <Button href="#bewertungsanfrage">
          Kostenlose Erstberatung anfragen
        </Button>
      </PageIntro>
      <section className="section review-intro-grid">
        <div>
          <span className="eyebrow">
            Ein klarer Preis. Kein Erfolgsversprechen.
          </span>
          <h2>59 € bei erfolgreicher Entfernung.</h2>
          <p>
            Der Endpreis gilt pro Bewertung und unabhängig von der Plattform,
            einschließlich der für diesen außergerichtlichen Versuch
            vorgesehenen anwaltlichen Tätigkeit. Gemäß § 19 UStG wird keine
            Umsatzsteuer ausgewiesen.
          </p>
          <p>
            Nach deiner gesonderten Beauftragung zahlst du 59 € im Voraus per
            Überweisung. Kann die Bewertung nicht entfernt werden oder fehlt
            eine rechtliche Grundlage, erhältst du die Vorauszahlung vollständig
            zurück.
          </p>
          <p>
            Eine negative Meinung allein ist kein Löschgrund. Ob Ansprüche
            bestehen und wie die Plattform reagiert, muss individuell geprüft
            werden. Die Entscheidung liegt nicht bei uns.
          </p>
        </div>
        <aside className="review-summary">
          <span className="eyebrow">Dein Ablauf</span>
          <ol>
            <li>
              <strong>Bewertung verlinken.</strong>
              <p>
                Plattform wählen, Bewertungslink und Kontaktdaten eintragen.
              </p>
            </li>
            <li>
              <strong>E-Mail erhalten.</strong>
              <p>
                Nach etwa 5–10 Minuten erhältst du dein Vorgangszeichen,
                Konditionen und einen geschützten Beauftragungslink.
              </p>
            </li>
            <li>
              <strong>Bewusst beauftragen.</strong>
              <p>
                Erst nach deiner Bestätigung wird die Vorauszahlung von 59 €
                fällig. Der rechtliche Entfernungsversuch startet nach
                Zahlungseingang und Mandatsklärung.
              </p>
            </li>
            <li>
              <strong>Ergebnis erhalten.</strong>
              <p>
                Bei Erfolg ist der Preis durch die Vorauszahlung beglichen. Ohne
                Erfolg wird sie vollständig erstattet.
              </p>
            </li>
          </ol>
        </aside>
      </section>
      <section className="section content-split">
        <div>
          <SectionHead
            label="Anwaltliche Prüfung"
            title="Rechtliche Schritte gehören in anwaltliche Hände."
          />
          <p>
            Webstudio Expert übernimmt Organisation und Kommunikation. Die
            rechtliche Prüfung und gegebenenfalls anwaltliche Vertretung
            erfolgen durch die Kanzlei {reviewLawyers}.
          </p>
          <p>
            Rechtsanwalt Colin Simbach: IT-Recht und Reputationsschutz.
            Rechtsanwalt Sebastian Kessler: IT-Recht. Eine gegebenenfalls
            erforderliche Vollmacht oder Mandatsvereinbarung wird gesondert
            eingeholt.
          </p>
          <p>
            Für zulässige Kritik bieten wir keine pauschale Löschung an.
            Plattformen prüfen Beanstandungen nach ihren Verfahren und den
            geltenden rechtlichen Vorgaben.
          </p>
        </div>
        <ReviewForm />
      </section>
      <section className="section">
        <SectionHead
          label="Vor deiner Anfrage"
          title="Was du wissen solltest."
        />
        <Faq
          items={[
            {
              question: "Kann jede negative Bewertung entfernt werden?",
              answer:
                "Nein. Eine Bewertung muss rechtlich angreifbar sein. Zulässige Meinungsäußerungen dürfen bestehen bleiben. Ein Lösch-Erfolg und eine bestimmte Dauer werden nicht garantiert.",
            },
            {
              question: "Welche Plattformen sind möglich?",
              answer:
                "Du kannst Google, kununu, Trustpilot, Facebook, Yelp, Tripadvisor oder eine andere Bewertungsplattform angeben. Ob im konkreten Fall ein rechtlich zulässiges Vorgehen möglich ist, wird individuell geprüft.",
            },
            {
              question: "Wann muss ich bezahlen?",
              answer:
                "Das erste Formular und die Erstberatung sind kostenlos. Nach gesonderter verbindlicher Beauftragung sind 59 € per Überweisung im Voraus zu zahlen. Erst danach und nach Mandatsklärung beginnt die Bearbeitung; Verbraucherrechte zum Widerruf werden berücksichtigt.",
            },
            {
              question: "Was passiert, wenn die Entfernung nicht gelingt?",
              answer:
                "Dann fallen für diesen Versuch keine Kosten an. Die Vorauszahlung wird vollständig zurücküberwiesen, grundsätzlich innerhalb von 14 Tagen nach Feststellung des erfolglosen Abschlusses.",
            },
            {
              question: "Entstehen zusätzliche Anwaltskosten?",
              answer:
                "Die 59 € sind der vollständige Preis für die beschriebene einzelne Bewertung einschließlich der vorgesehenen außergerichtlichen anwaltlichen Tätigkeit. Gerichtliche Verfahren und weitere Leistungen sind nicht enthalten und werden nicht ohne gesonderte ausdrückliche Vereinbarung beauftragt.",
            },
          ]}
        />
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Organisation der rechtlichen Prüfung und Entfernung unzulässiger Bewertungen",
          url: canonicalUrl("/bewertungen"),
          provider: { "@id": organizationId },
          description:
            "Kostenlose Erstberatung. 59 EUR Endpreis nur bei erfolgreicher Entfernung je Bewertung; Vorauszahlung wird bei Misserfolg vollständig erstattet.",
          offers: {
            "@type": "Offer",
            price: "59.00",
            priceCurrency: "EUR",
            url: canonicalUrl("/bewertungen"),
            description:
              "Je erfolgreich entfernter Bewertung, einschließlich vorgesehener außergerichtlicher anwaltlicher Tätigkeit. Vorauszahlung; vollständige Erstattung bei Misserfolg.",
          },
        }}
      />
    </>
  );
}
