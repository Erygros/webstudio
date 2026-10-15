import { notFound } from "next/navigation";
import { resources } from "@/crm/resources";
import { ResourcePanel } from "@/crm/components/resource-panel";
import { Settings } from "@/crm/components/settings";
import { Statistics } from "@/crm/components/statistics";
import { Calendar } from "@/crm/components/calendar";
import { MailTools } from "@/crm/components/mail-tools";
import { Work } from "@/crm/components/work";
import { session } from "@/crm/server/db";
import { OsmImporter } from "@/crm/components/osm-importer";
import { ReviewsInbox } from "@/crm/components/reviews";
import {
  WebsiteFormStatus,
  WebsiteInquiryInbox,
} from "@/crm/components/website-inquiries";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ company?: string }>;
}) {
  const { module: key } = await params;
  const q = await searchParams;
  if (key === "bewertungen") {
    const current = await session();
    if (!["administrator", "vertrieb"].includes(current!.profile.role))
      return (
        <p>
          Bewertungsanfragen sind für Administration und Vertrieb verfügbar.
        </p>
      );
    return (
      <>
        <header className="crm-page-head">
          <span className="eyebrow">Webstudio Expert / CRM</span>
          <h1>Bewertungen</h1>
          <p>
            Kostenlose Anfragen, Beauftragungen und die Bearbeitung einzelner
            Bewertungen.
          </p>
        </header>
        <ReviewsInbox />
      </>
    );
  }
  if (key === "arbeit") {
    const current = await session();
    if (!["administrator", "vertrieb"].includes(current!.profile.role))
      return <p>Arbeit ist für Administration und Vertrieb verfügbar.</p>;
    return <Work />;
  }
  if (key === "einstellungen") return <Settings />;
  if (key === "statistiken") return <Statistics />;
  if (key === "kalender") return <Calendar />;
  const resource = resources[key];
  if (!resource) notFound();
  return (
    <>
      <header className="crm-page-head">
        <span className="eyebrow">Webstudio Expert / CRM</span>
        <h1>{resource.title}</h1>
        <p>
          {key === "telefonie"
            ? "Browser-Dialer unten rechts öffnen. Manuelle Protokolle sind als solche gekennzeichnet."
            : key === "rechnungen"
              ? "Dokument- und Zahlungsstatus bleiben getrennt. Ausgestellte Belege sind unveränderlich."
              : key === "leads"
                ? "Unternehmen erfassen, Kontakte pflegen und den nächsten Schritt planen."
                : "Alle Einträge werden dauerhaft in deiner Datenbank gespeichert."}
        </p>
      </header>
      {key === "emails" && <MailTools companyId={q.company} />}
      {key === "leads" && <OsmImporter />}
      {key === "anfragen" ? (
        <>
          <WebsiteFormStatus />
          <WebsiteInquiryInbox />
        </>
      ) : (
        <ResourcePanel resource={key} />
      )}
      {key === "telefonie" && <ResourcePanel resource="followups" />}
    </>
  );
}
