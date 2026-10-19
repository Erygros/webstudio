import { createHash } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { serviceDb } from "@/crm/server/db";
import { deliverBookingMail } from "@/crm/server/bookings";
import {
  publicReviewOrigin,
  readReviewJson,
  reviewResponse,
} from "@/server/review-request";
import { allowed } from "@/server/form-security";
export const runtime = "nodejs";
export const maxDuration = 60;
const schema = z
  .object({
    key: z.string().uuid(),
    kind: z.enum(["withdrawal", "cancellation"]),
    name: z.string().trim().min(2).max(160),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    reference: z.string().trim().min(2).max(200),
    termination: z.enum(["Ordentlich", "Außerordentlich"]),
    end: z
      .string()
      .max(10)
      .refine((s) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s)),
    reason: z.string().trim().max(4000),
    website: z.literal(""),
  })
  .strict();
export async function POST(request: Request) {
  try {
    if (!publicReviewOrigin(request))
      return reviewResponse(
        { message: "Bitte die Erklärung über unsere Website absenden." },
        403,
      );
    const value = schema.safeParse(await readReviewJson(request));
    if (!value.success)
      return reviewResponse(
        { message: "Bitte Name, E-Mail und Vertragsbezeichnung prüfen." },
        400,
      );
    const { key, kind, website: _trap, ...data } = value.data;
    if (
      kind === "cancellation" &&
      data.termination === "Außerordentlich" &&
      !data.reason
    )
      return reviewResponse(
        { message: "Bitte den Grund der außerordentlichen Kündigung angeben." },
        400,
      );
    // No account or challenge gate for the statutory cancellation/withdrawal functions.
    if (!(await allowed(`contract-declaration:${data.email}`, 30, 3600)))
      return reviewResponse(
        {
          message:
            "Bitte sende deine Erklärung direkt an kontakt@webstudio-expert.de. Diese Alternative steht dir jederzeit offen.",
        },
        429,
      );
    const { data: result, error } = await serviceDb().rpc(
      "crm_booking_declare",
      {
        key_in: key,
        hash_in: createHash("sha256")
          .update(JSON.stringify({ kind, ...data }))
          .digest("hex"),
        kind_in: kind,
        data_in: data,
      },
    );
    if (error) throw error;
    after(async () => {
      await Promise.allSettled([deliverBookingMail(), deliverBookingMail()]);
    });
    return reviewResponse(result);
  } catch {
    return reviewResponse(
      {
        message:
          "Der Eingang konnte nicht bestätigt werden. Du kannst deine Erklärung jederzeit per E-Mail an kontakt@webstudio-expert.de senden.",
      },
      503,
    );
  }
}
