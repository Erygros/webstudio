import "server-only";
import { site } from "@/config/site";

// Without either key, deployment remains staged with the existing protections.
// Partial configuration fails closed; the secret never reaches the browser.
export async function verifyTurnstile(
  token: unknown,
  action: string,
): Promise<Response | null> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey && !secret) return null;
  const reject = (message: string, status: number) =>
    Response.json(
      { message, error: message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  if (!siteKey || !secret)
    return reject(
      "Die Sicherheitsprüfung ist derzeit nicht verfügbar. Bitte später erneut versuchen oder direkt Kontakt aufnehmen.",
      503,
    );
  if (typeof token !== "string" || !token || token.length > 2048)
    return reject(
      "Bitte die Sicherheitsprüfung abschließen und erneut absenden.",
      403,
    );
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) throw new Error("siteverify unavailable");
    const result = await response.json();
    const hostnames = new Set([
      new URL(site.url).hostname,
      new URL(site.runtimeUrl).hostname,
    ]);
    const canonical = new URL(site.url).hostname;
    hostnames.add(
      canonical.startsWith("www.") ? canonical.slice(4) : `www.${canonical}`,
    );
    if (process.env.NODE_ENV === "development") {
      hostnames.add("localhost");
      hostnames.add("127.0.0.1");
    }
    if (
      result.success !== true ||
      result.action !== action ||
      !hostnames.has(result.hostname)
    )
      return reject(
        "Die Sicherheitsprüfung ist ungültig oder abgelaufen. Bitte erneut prüfen und absenden.",
        403,
      );
    return null;
  } catch {
    return reject(
      "Die Sicherheitsprüfung ist momentan nicht erreichbar. Bitte später erneut versuchen.",
      503,
    );
  }
}
