import { verifyTurnstile } from "@/server/turnstile";
import { z } from "zod";
import { crmDb, session, apiError } from "@/crm/server/db";
import { allowed } from "@/server/form-security";
import { cookies } from "next/headers";
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (
      origin !==
        new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin &&
      !(
        process.env.NODE_ENV === "development" &&
        origin === new URL(request.url).origin
      )
    )
      throw new Error("403:Ungültige Herkunft.");
    const body = z
      .object({
        action: z.enum(["login", "logout", "reset", "password"]),
        turnstileToken: z.string().max(2048).optional(),
        email: z.email().optional(),
        password: z.string().min(12).max(200).optional(),
      })
      .parse(await request.json());
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (!(await allowed(`crm-auth:${ip}`, 10, 900)))
      throw new Error("429:Zu viele Versuche. Bitte später erneut versuchen.");
    if (body.action === "login" || body.action === "reset") {
      const challenge = await verifyTurnstile(body.turnstileToken, "crm_auth");
      if (challenge) return challenge;
    }
    const db = await crmDb();
    if (body.action === "login") {
      if (!body.email || !body.password)
        throw new Error("E-Mail und Passwort erforderlich.");
      const { error } = await db.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error)
        throw new Error("Anmeldung nicht möglich. Bitte Zugangsdaten prüfen.");
      if (!(await session(false))) {
        await db.auth.signOut();
        throw new Error("Das Konto ist nicht als CRM-Benutzer freigeschaltet.");
      }
      (await cookies()).set("crm-work-prompt", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      });
    }
    if (body.action === "logout") {
      (await cookies()).delete("crm-work-prompt");
      const { error } = await db.auth.signOut();
      if (error) throw error;
    }
    if (body.action === "reset") {
      if (body.email) {
        await db.auth.resetPasswordForEmail(body.email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/crm/auth/callback?next=/crm/passwort`,
        });
      }
      return Response.json({
        message:
          "Falls ein freigeschaltetes Konto existiert, erhältst du eine Nachricht.",
      });
    }
    if (body.action === "password") {
      if (!(await session(false)))
        throw new Error(
          "401:Bitte über den Wiederherstellungslink oder dein Konto anmelden.",
        );
      if (!body.password)
        throw new Error("Passwort mit mindestens 12 Zeichen erforderlich.");
      const { error } = await db.auth.updateUser({ password: body.password });
      if (error) throw error;
    }
    return Response.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
