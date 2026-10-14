import twilio from "twilio";
import { apiSession, apiError } from "@/crm/server/db";
import { voiceConfig } from "@/crm/server/integrations";
export async function POST(request: Request) {
  try {
    const { profile } = await apiSession(request, [
      "administrator",
      "vertrieb",
    ]);
    const c = await voiceConfig();
    if (!c.accountSid || !c.apiKey || !c.apiSecret || !c.appSid || !c.callerId)
      throw new Error("503:Telefonie ist nicht eingerichtet.");
    const token = new twilio.jwt.AccessToken(
      c.accountSid,
      c.apiKey,
      c.apiSecret,
      { identity: `crm_${profile.id.replace(/-/g, "")}`, ttl: 3600 },
    );
    token.addGrant(
      new twilio.jwt.AccessToken.VoiceGrant({
        outgoingApplicationSid: c.appSid,
        incomingAllow: true,
      }),
    );
    return Response.json(
      { token: token.toJwt() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
