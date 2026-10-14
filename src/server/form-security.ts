import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export function formReady() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM &&
    process.env.INQUIRY_TO &&
    process.env.MAIL_PROVIDER_NAME &&
    process.env.MAIL_PROVIDER_ADDRESS &&
    process.env.FORM_SECRET &&
    process.env.FORM_SECRET.length >= 32 &&
    [465, 587].includes(Number(process.env.SMTP_PORT || "587"))
  );
}
const hmac = (value: string) =>
  createHmac("sha256", process.env.FORM_SECRET || "")
    .update(value)
    .digest("hex");
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
  cleanup();
  const key = `nonce:${hmac(token)}`;
  if (entries.has(key) || entries.size >= 5000) return false;
  entries.set(key, { count: 1, expires: Date.now() + 2 * 60 * 60 * 1000 });
  return true;
}
