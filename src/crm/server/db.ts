import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "node:crypto";
export const crmConfigured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
export const crmServiceConfigured = () =>
  crmConfigured() && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
export async function crmDb() {
  if (!crmConfigured())
    throw new Error("Supabase ist noch nicht eingerichtet.");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server Components refresh through proxy. */
          }
        },
      },
    },
  );
}
export function serviceDb() {
  if (!crmServiceConfigured())
    throw new Error("Serverseitiger Supabase-Zugang fehlt.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function session(required = true) {
  if (!crmConfigured()) {
    if (required) redirect("/crm/login");
    return null;
  }
  const db = await crmDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) {
    if (required) redirect("/crm/login");
    return null;
  }
  const { data: profile } = await db
    .from("crm_users")
    .select("id,name,role,enabled")
    .eq("id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!profile) {
    if (required) redirect("/crm/login");
    return null;
  }
  return {
    db,
    user,
    profile: profile as {
      id: string;
      name: string;
      role: string;
      enabled: boolean;
    },
  };
}
export async function apiSession(request: Request, roles?: string[]) {
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url)
      .origin;
    if (
      origin !== expected &&
      !(
        process.env.NODE_ENV === "development" &&
        origin === new URL(request.url).origin
      )
    )
      throw new Error("403:Herkunft der Anfrage ungültig.");
  }
  const current = await session(false);
  if (!current) throw new Error("401:Bitte anmelden.");
  if (roles && !roles.includes(current.profile.role))
    throw new Error("403:Keine Berechtigung.");
  if (request.method !== "GET" && crmServiceConfigured()) {
    const key = createHmac(
      "sha256",
      process.env.FORM_SECRET || process.env.CRM_ENCRYPTION_KEY || "",
    )
      .update("crm-write:" + current.user.id)
      .digest("hex");
    const { data, error } = await serviceDb().rpc("crm_rate_limit", {
      key_in: key,
      limit_in: 120,
      seconds_in: 60,
    });
    if (error)
      throw new Error("503:Datenbank-Migration für Missbrauchsschutz fehlt.");
    if (data !== true)
      throw new Error("429:Zu viele Änderungen. Bitte kurz warten.");
  }
  return current;
}
export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unbekannter Fehler";
  const match = /^(401|403|409|413|429|503):(.+)$/.exec(message);
  return Response.json(
    { error: match ? match[2] : message.slice(0, 400) },
    {
      status: match ? Number(match[1]) : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
