import { readFileSync } from "node:fs";

// Manuell nach Deployment ausführen. Kein Cron, kein Secret und kein Tracking.
// Die öffentlich erreichbare Schlüsseldatei weist die Domain-Berechtigung nach.
const site = new URL(
  process.env.NEXT_PUBLIC_SEO_URL || "https://www.webstudio-expert.de",
);
if (site.hostname === "webstudio-expert.de")
  site.hostname = "www.webstudio-expert.de";
const key = readFileSync(
  new URL("../public/indexnow-key.txt", import.meta.url),
  "utf8",
).trim();
const keyLocation = new URL("/indexnow-key.txt", site).href;
const supplied = process.argv.slice(2);

async function publicText(url) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "WebstudioExpert-IndexNow/1.0" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  if (/noindex/i.test(response.headers.get("x-robots-tag") || ""))
    throw new Error("Die Domain ist noch von der Indexierung ausgeschlossen.");
  const text = await response.text();
  if (text.length > 2_000_000) throw new Error("Unerwartet große Antwort.");
  return text;
}

try {
  if (
    site.protocol !== "https:" ||
    site.username ||
    site.password ||
    site.port ||
    site.pathname !== "/" ||
    site.search ||
    site.hash ||
    /(^localhost$|\.vercel\.app$)/i.test(site.hostname)
  )
    throw new Error(
      "IndexNow nur für die öffentliche HTTPS-Produktionsdomain verwenden.",
    );
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key))
    throw new Error("Ungültiger IndexNow-Schlüssel.");
  if ((await publicText(keyLocation)).trim() !== key)
    throw new Error(
      "Die veröffentlichte Schlüsseldatei fehlt oder stimmt nicht mit diesem Checkout überein. Zuerst deployen.",
    );

  const sitemap = await publicText(new URL("/sitemap.xml", site).href);
  const available = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(
    (match) => match[1].trim().replace(/&amp;/g, "&"),
  );
  if (!available.length)
    throw new Error("Die veröffentlichte Sitemap enthält keine Seiten.");
  const requested = supplied.length
    ? supplied.map((path) => new URL(path, site).href)
    : available;
  const urlList = [...new Set(requested)];
  const allowlist = new Set(available);
  for (const value of urlList) {
    const url = new URL(value);
    if (
      url.origin !== site.origin ||
      url.username ||
      url.password ||
      url.hash ||
      url.search ||
      /^\/(crm|api)(\/|$)/.test(url.pathname) ||
      !allowlist.has(url.href)
    )
      throw new Error(
        `Nur öffentliche URLs aus der veröffentlichten Sitemap sind zulässig: ${url.pathname}`,
      );
  }
  if (urlList.length > 10000)
    throw new Error("Höchstens 10.000 URLs je Einreichung.");

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: site.host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(20000),
  });
  if (![200, 202].includes(response.status))
    throw new Error(
      `IndexNow hat die Einreichung nicht bestätigt (HTTP ${response.status}).`,
    );
  console.log(
    `${urlList.length} öffentliche URLs eingereicht (HTTP ${response.status}).${response.status === 202 ? " Die Schlüsselprüfung steht noch aus." : ""} Dies bestätigt keine Indexierung oder Position.`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "IndexNow-Einreichung fehlgeschlagen.",
  );
  process.exitCode = 1;
}
