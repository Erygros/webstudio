import { z } from "zod";
import { apiSession, apiError, serviceDb } from "@/crm/server/db";
import {
  encrypt,
  integration,
  smtpConfig,
  imapConfig,
  voiceConfig,
} from "@/crm/server/integrations";
export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator", "buchhaltung"]);
    const { data } = await db
      .from("crm_company_settings")
      .select("data")
      .eq("key", "business")
      .single();
    const [smtp, imap, voice] = await Promise.all([
      smtpConfig(),
      imapConfig(),
      voiceConfig(),
    ]);
    return Response.json(
      {
        business: data?.data || {},
        integrations: {
          smtp: !!(smtp.host && smtp.user && smtp.password),
          imap: !!(imap.host && imap.user && imap.password),
          twilio: !!(
            voice.accountSid &&
            voice.apiKey &&
            voice.apiSecret &&
            voice.appSid &&
            voice.callerId
          ),
          sip: false,
          ai: !!process.env.CRM_AI_API_KEY,
        },
        pushKey: process.env.NEXT_PUBLIC_VAPID_KEY || "",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator"]);
    const body = await request.json();
    if (body.kind === "business") {
      const fields = [
        "name",
        "owner",
        "street",
        "postcode",
        "city",
        "email",
        "phone",
        "smallBusiness",
        "taxNumber",
        "vatId",
        "iban",
        "paymentDays",
        "signature",
        "notificationSettings",
        "retentionMonths",
      ];
      const allowed = Object.fromEntries(
        Object.entries(body.data as Record<string, unknown>).filter(([key]) =>
          fields.includes(key),
        ),
      );
      if (typeof allowed.name !== "string" || String(allowed.name).length > 200)
        throw new Error("Unternehmensname ungültig.");
      if (typeof allowed.smallBusiness !== "boolean")
        throw new Error("Umsatzsteuerstatus ungültig.");
      const { error } = await db
        .from("crm_company_settings")
        .upsert({ key: "business", data: allowed }, { onConflict: "key" });
      if (error) throw error;
    } else if (body.kind === "integration") {
      const provider = z
        .enum(["smtp", "imap", "twilio", "sip", "ai"])
        .parse(body.provider);
      const data = z
        .record(z.string().max(80), z.string().max(4000))
        .parse(body.data);
      const existing = await integration(provider);
      const merged = {
        ...existing,
        ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "")),
      };
      const encrypted = encrypt(merged);
      const { error } = await serviceDb()
        .from("crm_integrations")
        .upsert(
          { provider, enabled: true, encrypted_config: encrypted },
          { onConflict: "provider" },
        );
      if (error)
        throw new Error("Integration konnte nicht gespeichert werden.");
    } else throw new Error("Ungültige Einstellung.");
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
