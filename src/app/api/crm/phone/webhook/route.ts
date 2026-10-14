import twilio from "twilio";
import { voiceConfig } from "@/crm/server/integrations";
import { serviceDb } from "@/crm/server/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const c = await voiceConfig();
    if (!c.authToken) return new Response("Not configured", { status: 503 });
    const url = new URL(request.url);
    const form = await request.formData();
    const fields = Object.fromEntries(
      [...form.entries()].map(([key, value]) => [key, String(value)]),
    );
    const external =
      (process.env.NEXT_PUBLIC_SITE_URL || url.origin) +
      url.pathname +
      url.search;
    const signature = request.headers.get("x-twilio-signature") || "";
    if (!twilio.validateRequest(c.authToken, signature, external, fields))
      return new Response("Invalid signature", { status: 403 });
    const svc = serviceDb();
    if (url.searchParams.get("kind") === "status") {
      const sid = fields.CallSid;
      const key = [sid, fields.SequenceNumber || "", fields.CallStatus].join(
        ":",
      );
      const duration = Number(fields.CallDuration || 0);
      if (!Number.isFinite(duration))
        return new Response("Invalid duration", { status: 400 });
      const { error } = await svc.rpc("crm_call_status", {
        event_in: key,
        sid_in: fields.ParentCallSid || sid,
        status_in: fields.CallStatus,
        duration_in: Math.max(0, Math.round(duration)),
      });
      if (error)
        return new Response("Status persistence unavailable", { status: 503 });
      return new Response("OK");
    }
    const response = new twilio.twiml.VoiceResponse();
    const from = fields.From || "";
    if (from.startsWith("client:crm_")) {
      const raw = from.replace("client:crm_", "");
      if (!/^[a-f0-9]{32}$/.test(raw))
        return new Response("Invalid identity", { status: 403 });
      const userId = raw.replace(
        /(.{8})(.{4})(.{4})(.{4})(.{12})/,
        "$1-$2-$3-$4-$5",
      );
      const { data: user } = await svc
        .from("crm_users")
        .select("role")
        .eq("id", userId)
        .eq("enabled", true)
        .single();
      if (!user || !["administrator", "vertrieb"].includes(user.role))
        return new Response("Unauthorized", { status: 403 });
      const to = fields.To || "";
      if (!/^\+[1-9]\d{7,14}$/.test(to)) {
        response.say({ language: "de-DE" }, "Ungültige Telefonnummer.");
        return new Response(response.toString(), {
          headers: { "Content-Type": "text/xml" },
        });
      }
      const { data: lookup } = await svc.rpc("crm_lookup_phone", {
        number_in: to,
      });
      const { data: selectedCompany } = await svc
        .from("crm_companies")
        .select("*")
        .eq("id", fields.CompanyId || "00000000-0000-0000-0000-000000000000")
        .maybeSingle();
      const company =
        lookup || (fields.Purpose === "operational" ? selectedCompany : null);
      if (company?.blocked) {
        response.say({ language: "de-DE" }, "Kontakt gesperrt.");
        return new Response(response.toString(), {
          headers: { "Content-Type": "text/xml" },
        });
      }
      if (fields.Purpose === "marketing") {
        if (!company) {
          response.say(
            { language: "de-DE" },
            "Dokumentierte Kontakterlaubnis fehlt.",
          );
          return new Response(response.toString(), {
            headers: { "Content-Type": "text/xml" },
          });
        }
        const { data: permission } = await svc
          .from("crm_contact_permissions")
          .select("id")
          .eq("company_id", company.id)
          .eq("channel", "phone")
          .is("withdrawn_at", null)
          .limit(1);
        if (!permission?.length) {
          response.say({ language: "de-DE" }, "Kontakterlaubnis fehlt.");
          return new Response(response.toString(), {
            headers: { "Content-Type": "text/xml" },
          });
        }
      }
      const { error: callError } = await svc.from("crm_calls").upsert(
        {
          provider_sid: fields.CallSid,
          provider: "twilio",
          user_id: userId,
          company_id: company?.id || null,
          phone: to,
          direction: "outbound",
          status: "initiated",
        },
        { onConflict: "provider_sid", ignoreDuplicates: true },
      );
      if (callError) throw new Error(callError.message);
      const dial = response.dial({
        callerId: c.callerId,
        answerOnBridge: true,
      });
      dial.number(
        {
          statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/phone/webhook?kind=status`,
          statusCallbackEvent: [
            "initiated",
            "ringing",
            "answered",
            "completed",
          ],
        },
        to,
      );
    } else {
      const { data: company } = await svc.rpc("crm_lookup_phone", {
        number_in: from,
      });
      const { error: callError } = await svc.from("crm_calls").upsert(
        {
          provider_sid: fields.CallSid,
          provider: "twilio",
          company_id: company?.id || null,
          phone: from,
          direction: "inbound",
          status: "ringing",
        },
        { onConflict: "provider_sid", ignoreDuplicates: true },
      );
      if (callError) throw new Error(callError.message);
      const { data: admin } = await svc
        .from("crm_users")
        .select("id")
        .eq("role", "administrator")
        .eq("enabled", true)
        .limit(1)
        .single();
      if (admin) {
        const { data: record } = await svc
          .from("crm_calls")
          .select("id")
          .eq("provider_sid", fields.CallSid)
          .single();
        const client = response.dial().client(
          {
            statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/phone/webhook?kind=status`,
            statusCallbackEvent: [
              "initiated",
              "ringing",
              "answered",
              "completed",
            ],
          },
          `crm_${admin.id.replace(/-/g, "")}`,
        );
        if (record) client.parameter({ name: "CrmCallId", value: record.id });
      } else response.reject();
    }
    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch {
    return new Response("Voice service unavailable", { status: 503 });
  }
}
