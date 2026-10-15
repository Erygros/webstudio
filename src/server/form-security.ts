import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { crmServiceConfigured, serviceDb } from "@/crm/server/db";
function signingKey() {
  if (process.env.FORM_SECRET && process.env.FORM_SECRET.length >= 32)
    return process.env.FORM_SECRET;
  // Stabil über Vercel-Instanzen hinweg; niemals an den Browser ausgeben.
  // Zweckgebundene Ableitung erlaubt den CRM-Empfang ohne zusätzliche Variable.
  if (crmServiceConfigured())
    return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update("webstudio:website-forms:v1")
      .digest("hex");
  return null;
}
export function mailReady() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM &&
    process.env.INQUIRY_TO &&
    process.env.MAIL_PROVIDER_NAME &&
    process.env.MAIL_PROVIDER_ADDRESS &&
    [465, 587].includes(Number(process.env.SMTP_PORT || "587"))
  );
}
export function formReady() {
  return crmServiceConfigured() && !!signingKey();
}
const hmac = (value: string) => {
  const key = signingKey();
  if (!key) throw new Error("Formularsignierung nicht verfügbar.");
  return createHmac("sha256", key).update(value).digest("hex");
};
export function makeToken() {
  const payload = `${Date.now()}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${hmac(payload)}`;
}
export function verifyToken(token: string) {
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !/^\d{13}$/.test(parts[0]) ||
    !/^[a-f0-9]{32}$/.test(parts[1]) ||
    !/^[a-f0-9]{64}$/.test(parts[2])
  )
    return false;
  const age = Date.now() - Number(parts[0]);
  return (
    age >= 3000 &&
    age <= 2 * 60 * 60 * 1000 &&
    timingSafeEqual(
      Buffer.from(parts[2], "hex"),
      Buffer.from(hmac(`${parts[0]}.${parts[1]}`), "hex"),
    )
  );
}
type Entry = { count: number; expires: number };
const globalState = globalThis as typeof globalThis & {
  webstudioAbuse?: Map<string, Entry>;
};
const entries = (globalState.webstudioAbuse ??= new Map<string, Entry>());
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of entries)
    if (entry.expires <= now) entries.delete(key);
}
// Vercel-Limits gelten pro Funktionsinstanz; verteilter Schutz braucht gemeinsamen Speicher.
export async function allowed(key: string, limit: number, seconds: number) {
  if (crmServiceConfigured()) {
    const { data, error } = await serviceDb().rpc("crm_rate_limit", {
      key_in: hmac(key),
      limit_in: limit,
      seconds_in: seconds,
    });
    if (error) throw new Error("Missbrauchsschutz noch nicht eingerichtet.");
    return data === true;
  }
  cleanup();
  const hashed = `rate:${hmac(key)}`;
  const current = entries.get(hashed);
  if (current) {
    current.count += 1;
    return current.count <= limit;
  }
  if (entries.size >= 5000) return false;
  entries.set(hashed, { count: 1, expires: Date.now() + seconds * 1000 });
  return true;
}
export async function consumeToken(token: string) {
  if (crmServiceConfigured()) {
    const { error } = await serviceDb()
      .from("crm_webhook_events")
      .insert({ provider: "form", event_key: hmac(token) });
    return !error;
  }
  cleanup();
  const key = `nonce:${hmac(token)}`;
  if (entries.has(key) || entries.size >= 5000) return false;
  entries.set(key, { count: 1, expires: Date.now() + 2 * 60 * 60 * 1000 });
  return true;
}
