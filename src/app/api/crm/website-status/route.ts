import {
  apiError,
  apiSession,
  crmServiceConfigured,
  serviceDb,
} from "@/crm/server/db";
import { formReady } from "@/server/form-security";
import { websiteMailReady } from "@/crm/server/website-mail";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await apiSession(request, ["administrator", "vertrieb"]);
    const checks: { label: string; ok: boolean }[] = [
      { label: "Serverseitiger CRM-Zugang", ok: crmServiceConfigured() },
      { label: "Formularsignierung", ok: formReady() },
    ];
    if (crmServiceConfigured()) {
      const db = serviceDb();
      const { data: schema, error: schemaError } = await db.rpc(
        "crm_website_schema_status",
      );
      checks.push({
        label: "Reparatur der Formular-Speicherfunktion (202610150001)",
        ok:
          !schemaError &&
          schema?.version === "202610150001" &&
          schema?.audit_repaired === true,
      });
      const tables = [
        ["crm_website_inquiries", "id", "Anfragen-Speicher"],
        ["crm_companies", "id", "Kontakte / Leads"],
        ["crm_contacts", "id", "Ansprechpartner"],
        ["crm_tasks", "id", "Kontaktaufgaben"],
        ["crm_notifications", "id", "Benachrichtigungen"],
        ["crm_rate_limits", "key", "Gemeinsamer Missbrauchsschutz"],
        ["crm_webhook_events", "id", "Schutz vor mehrfacher Abgabe"],
      ] as const;
      checks.push(
        ...(await Promise.all(
          tables.map(async ([table, column, label]) => {
            const { error } = await db
              .from(table)
              .select(column, { head: true })
              .limit(1);
            return { label, ok: !error };
          }),
        )),
      );
      const { data, error } = await db.storage.getBucket("crm-private");
      checks.push({
        label: "Privater Dateispeicher",
        ok: !error && !!data && data.public === false,
      });
    }
    return Response.json(
      {
        ready: checks.every((c) => c.ok),
        checks,
        emailNotifications: await websiteMailReady(),
        note: "Nur lesende Verbindungsprüfung. Es wird keine Anfrage angelegt; das Speichern und die Datenbankfunktionen werden damit nicht ausgeführt.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
