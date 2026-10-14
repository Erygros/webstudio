import { z } from "zod";
import { apiSession, apiError } from "@/crm/server/db";
export async function POST(request: Request) {
  try {
    const { db, user } = await apiSession(request);
    const data = z
      .object({
        endpoint: z.url().max(2000),
        keys: z.object({
          p256dh: z.string().max(200),
          auth: z.string().max(100),
        }),
        expirationTime: z.number().nullable().optional(),
      })
      .parse(await request.json());
    const url = new URL(data.endpoint);
    if (
      url.protocol !== "https:" ||
      ![
        "fcm.googleapis.com",
        "push.services.mozilla.com",
        "push.apple.com",
        "wns.windows.com",
      ].some(
        (domain) =>
          url.hostname === domain || url.hostname.endsWith("." + domain),
      )
    )
      throw new Error("Unbekannter Push-Endpunkt.");
    const { error } = await db
      .from("crm_push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint: data.endpoint, subscription: data },
        { onConflict: "endpoint" },
      );
    if (error) throw error;
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
