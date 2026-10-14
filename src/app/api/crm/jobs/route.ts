import { apiSession, apiError } from "@/crm/server/db";
import { syncMailbox, runWorkflows } from "@/crm/server/jobs";
import { timingSafeEqual } from "node:crypto";
import { sendBrowserNotifications } from "@/crm/server/push";
export const runtime = "nodejs";
export const maxDuration = 60;
async function run(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
    const cron =
      !!process.env.CRON_SECRET &&
      auth.length === expected.length &&
      timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
    if (!cron) await apiSession(request, ["administrator"]);
    const kind = new URL(request.url).searchParams.get("kind") || "all";
    const workflows = kind !== "imap" ? await runWorkflows() : null;
    let mail: unknown = null;
    if (kind !== "workflows") {
      try {
        mail = await syncMailbox();
      } catch (e) {
        mail = { error: (e as Error).message };
      }
    }
    const push = await sendBrowserNotifications();
    return Response.json({ workflows, mail, push });
  } catch (e) {
    return apiError(e);
  }
}
export const POST = run;
export async function GET(request: Request) {
  if (!request.headers.get("authorization"))
    return Response.json(
      { error: "Cron-Authentifizierung erforderlich." },
      { status: 401 },
    );
  return run(request);
}
