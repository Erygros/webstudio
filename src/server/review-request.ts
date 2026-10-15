import { site } from "@/config/site";
import { allowed, formReady } from "@/server/form-security";
export function publicReviewOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(site.url);
  url.hostname = url.hostname.startsWith("www.")
    ? url.hostname.slice(4)
    : `www.${url.hostname}`;
  return (
    origin === site.url ||
    origin === site.runtimeUrl ||
    origin === url.origin ||
    (process.env.NODE_ENV === "development" &&
      origin === new URL(request.url).origin)
  );
}
export async function protectReviewRequest(request: Request) {
  if (!formReady())
    throw new Error(
      "Das Formular ist momentan nicht erreichbar. Bitte kontaktiere uns direkt.",
    );
  if (!publicReviewOrigin(request))
    throw new Error(
      "Bitte die Website neu öffnen und das Formular erneut aufrufen.",
    );
  const ip = process.env.VERCEL
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    : "local";
  if (
    !(await allowed("reviews:global", 100, 3600)) ||
    !(await allowed(`reviews:ip:${ip}`, 8, 900))
  )
    throw new Error("Zu viele Anfragen. Bitte später erneut versuchen.");
}
export const reviewResponse = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
export async function readReviewJson(request: Request, limit = 12000) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Leere Anfrage.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Anfrage zu groß.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
