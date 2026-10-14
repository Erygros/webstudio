import { z } from "zod";
import { apiSession, apiError } from "@/crm/server/db";
import { smtpConfig, voiceConfig } from "@/crm/server/integrations";
import { leadStatuses } from "@/crm/resources";

export async function GET(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator", "vertrieb"]);
    const { data, error } = await db.rpc("crm_work_state");
    if (error)
      throw new Error(
        "503:Die Arbeit-Migration 014 fehlt oder konnte nicht geladen werden.",
      );
    const [smtp, voice] = await Promise.all([smtpConfig(), voiceConfig()]);
    return Response.json(
      {
        ...data,
        integrations: {
          smtp: !!(smtp.host && smtp.user && smtp.password),
          phone: !!(
            voice.accountSid &&
            voice.authToken &&
            voice.apiKey &&
            voice.apiSecret &&
            voice.appSid &&
            voice.callerId
          ),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
const lead = z
  .object({
    name: z.string().trim().min(1).max(200),
    website: z
      .union([z.url().refine((v) => /^https?:\/\//.test(v)), z.literal("")])
      .default(""),
    contact_name: z.string().trim().max(200).default(""),
    phone: z.string().trim().max(80).default(""),
    email: z.union([z.email(), z.literal("")]).default(""),
    status: z.enum(leadStatuses as [string, ...string[]]).default("Neu"),
  })
  .strict();
const payloads = {
  scratch: z
    .object({
      view: z.number().int().min(1).max(4).optional(),
      lead: z
        .object({
          name: z.string().max(200),
          website: z.string().max(254),
          contact_name: z.string().max(200),
          phone: z.string().max(80),
          email: z.string().max(254),
          status: z.string().max(80),
        })
        .strict()
        .optional(),
      channel: z.enum(["email", "phone"]).optional(),
      due: z.string().max(40).optional(),
      reason: z.string().max(2000).optional(),
      mail: z
        .object({
          to_address: z.string().max(254),
          subject: z.string().max(500),
          body: z.string().max(20000),
          attachment_ids: z.array(z.uuid()).max(5),
        })
        .strict()
        .optional(),
    })
    .strict(),
  start: z.object({}).strict(),
  new: z.object({}).strict(),
  select: z.object({ company_id: z.uuid() }).strict(),
  lead: z.object({ lead }).strict(),
  draft: z
    .object({
      to_address: z.email(),
      subject: z.string().trim().min(1).max(500),
      body: z.string().min(1).max(20000),
      attachment_ids: z.array(z.uuid()).max(5).default([]),
    })
    .strict(),
  sync: z.object({}).strict(),
  plan: z
    .object({
      channel: z.enum(["email", "phone"]),
      due: z.iso.datetime({ offset: true }),
      reason: z.string().trim().min(1).max(2000),
    })
    .strict(),
  close: z.object({}).strict(),
  complete: z.object({}).strict(),
  pause: z.object({}).strict(),
  resume: z.object({}).strict(),
  skip: z.object({}).strict(),
};
export async function POST(request: Request) {
  try {
    const { db } = await apiSession(request, ["administrator", "vertrieb"]);
    const body = z
      .object({
        action: z.enum(
          Object.keys(payloads) as [
            keyof typeof payloads,
            ...(keyof typeof payloads)[],
          ],
        ),
        id: z.uuid().nullable().optional(),
        payload: z.unknown().optional(),
      })
      .strict()
      .parse(await request.json());
    const payload = payloads[body.action].parse(body.payload || {});
    if (!["start", "new", "select"].includes(body.action) && !body.id)
      throw new Error("Vorgang fehlt.");
    const { data, error } = await db.rpc("crm_work_action", {
      action_in: body.action,
      session_in: body.id || null,
      payload,
    });
    if (error) throw new Error(error.message);
    return Response.json(
      { session: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
