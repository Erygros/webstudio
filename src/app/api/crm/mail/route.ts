import { z } from "zod";
import { apiSession, apiError } from "@/crm/server/db";
import { sendDraft } from "@/crm/server/mail";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, [
      "administrator",
      "vertrieb",
      "buchhaltung",
    ]);
    const body = z
      .object({
        id: z.uuid(),
        attachmentIds: z.array(z.uuid()).max(5).default([]),
      })
      .parse(await request.json());
    return Response.json(await sendDraft(db, body.id, body.attachmentIds));
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    const { db } = await apiSession(request);
    const { id } = z.object({ id: z.uuid() }).parse(await request.json());
    const { error } = await db
      .from("crm_emails")
      .update({ folder: "archive" })
      .eq("id", id)
      .in("folder", ["inbox", "sent", "draft"]);
    if (error) throw error;
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
