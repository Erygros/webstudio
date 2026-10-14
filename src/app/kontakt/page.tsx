import { business, site } from "@/config/site";
import { PageIntro, Breadcrumbs, Button, JsonLd } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { formReady } from "@/server/form-security";
import { canonicalUrl, organizationId, seo, websiteId } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = seo(
  `Kontakt – ${business.owner} in ${business.city}`,
  `${site.name} in ${business.city} erreichen: ${site.email}, ${site.phone}. Webprojekt besprechen, Rückruf oder Termin anfragen.`,
  "/kontakt",
);
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ rueckruf?: string }>;
}) {
  const q = await searchParams;
  const contacts = [
    {
      title: "E-Mail",
      description: "Für erste Fragen und vorhandene Projektunterlagen.",
      value: site.email,
      href: `mailto:${site.email}`,
    },
    {
      title: "Telefon",
      description: "Für ein direktes Gespräch über dein Anliegen.",
      value: site.phone,
      href: `tel:${site.phone.replace(/[^+\d]/g, "")}`,
    },
    {
      title: "SMS",
      description: "Für kurze Nachrichten direkt über deine Nachrichten-App.",
      value: "SMS schreiben",
      href: `sms:${site.phone.replace(/[^+\d]/g, "")}`,
    },
    {
      title: "Online-Termin",
      description:
        "Datum und Uhrzeit direkt auf dieser Website auswählen. Der Termin wird persönlich bestätigt.",
      value: "Termin anfragen",
      href: site.booking,
    },
  ];
  return (
    <>
      <Breadcrumbs items={[{ name: "Kontakt", href: "/kontakt" }]} />
      <PageIntro
        label="Kontakt"
        title="Lass uns dein Vorhaben besprechen."
        description="Ein kurzes Anliegen oder eine konkrete Projektidee. Wähle den passenden Kontaktweg."
      >
        <Button href="/projektanfrage">Projekt anfragen</Button>
      </PageIntro>
      <section className="section content-split">
        <div>
          <h2>Direkt in Verbindung.</h2>
          <p style={{ marginTop: 22 }}>
            Du erreichst Enrico Gross per Anruf, SMS oder E-Mail. Für ein
            geplantes Gespräch kannst du einen Wunschtermin anfragen.
          </p>
        </div>
        <div className="contact-grid">
          {contacts.map((c) => (
            <div className="contact-item" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              {c.value ? (
                <a
                  className="text-link"
                  href={c.href}
                  {...(c.href.startsWith("https")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {c.value} ↗
                </a>
              ) : (
                <span className="eyebrow">Noch nicht eingerichtet</span>
              )}
            </div>
          ))}
          <div className="contact-item">
            <h3>Rückruf</h3>
            <p>
              Hinterlasse dein Anliegen und eine Telefonnummer. Ein
              Rückruftermin wird anschließend abgestimmt.
            </p>
            <a className="text-link" href="/kontakt?rueckruf=ja#nachricht">
              Rückruf anfragen ↗
            </a>
          </div>
          <div className="contact-item">
            <h3>Projektanfrage</h3>
            <p>Mit Leistung, Umfang und Budgetrahmen gezielt starten.</p>
            <a className="text-link" href="/projektanfrage">
              Projekt beschreiben ↗
            </a>
          </div>
        </div>
      </section>
      <section className="section content-split">
        <h2>Webstudio Expert in Dortmund.</h2>
        <div className="prose">
          <address className="business-address">
            {site.name} · {business.owner}
            <br />
            {business.street}
            <br />
            {business.postcode} {business.city}
            <br />
            {business.country}
          </address>
          <p>
            Die Projektabstimmung erfolgt nach Vereinbarung per Telefon und
            E-Mail. Bitte stimme Gesprächstermine vorab ab.
          </p>
        </div>
      </section>
      <section className="section content-split solutions" id="nachricht">
        <div>
          <h2>
            {q.rueckruf === "ja"
              ? "Wann passt ein Gespräch?"
              : "Eine kurze Nachricht."}
          </h2>
          <p style={{ marginTop: 20 }}>
            Bitte sende keine Passwörter oder besonders sensiblen Daten.
          </p>
        </div>
        <InquiryForm
          key={q.rueckruf || "contact"}
          enabled={formReady()}
          mode={q.rueckruf === "ja" ? "callback" : "contact"}
        />
      </section>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "@id": `${canonicalUrl("/kontakt")}#page`,
          url: canonicalUrl("/kontakt"),
          name: "Kontakt zu Webstudio Expert in Dortmund",
          inLanguage: "de-DE",
          about: { "@id": organizationId },
          isPartOf: { "@id": websiteId },
        }}
      />
    </>
  );
}
