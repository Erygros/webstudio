import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { serviceDb } from "./db";
import { osmIndustries, type OsmLead, type OsmResult } from "@/crm/osm";

export const searchSchema = z
  .object({
    postalCode: z
      .string()
      .regex(/^\d{5}$/, "Deutsche PLZ mit fünf Ziffern erforderlich."),
    industry: z.string().trim().min(2).max(100),
    radius: z.number().int().min(1).max(50),
  })
  .strict();
const leadSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    phone: z.string().max(80),
    email: z.union([z.email().max(254), z.literal("")]),
    industry: z.string().min(1).max(100),
  })
  .strict();
const previewSchema = z
  .object({
    actor: z.uuid(),
    batch: z.uuid(),
    expires: z.number(),
    postalCode: z.string().regex(/^\d{5}$/),
    rows: z.array(leadSchema).max(200),
  })
  .strict();
function signingKey() {
  const key =
    process.env.FORM_SECRET ||
    process.env.CRM_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 32)
    throw new Error("503:Servergeheimnis für sichere Importvorschauen fehlt.");
  return key;
}
export function signPreview(
  actor: string,
  postalCode: string,
  rows: OsmLead[],
) {
  const value = Buffer.from(
    JSON.stringify({
      actor,
      batch: randomUUID(),
      expires: Date.now() + 30 * 60 * 1000,
      postalCode,
      rows,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", signingKey())
    .update("osm-preview:v1:" + value)
    .digest("base64url");
  return value + "." + signature;
}
export function verifyPreview(token: string, actor: string) {
  const [value, signature, ...extra] = token.split(".");
  if (!value || !signature || extra.length)
    throw new Error("Ungültige Importvorschau.");
  const expected = createHmac("sha256", signingKey())
    .update("osm-preview:v1:" + value)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    throw new Error("Importvorschau wurde verändert. Bitte neu suchen.");
  const preview = previewSchema.parse(
    JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
  );
  if (preview.actor !== actor || preview.expires < Date.now())
    throw new Error("Importvorschau abgelaufen. Bitte neu suchen.");
  return preview;
}
export async function readBoundedJson(request: Request) {
  return JSON.parse(await limitedText(request.body, 512_000));
}
async function limitedText(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
) {
  if (!stream) throw new Error("Leere Antwort.");
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit)
        throw new Error("413:Datenmenge zu groß. Suchradius verkleinern.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  return Buffer.concat(chunks).toString("utf8");
}
async function providerJson(
  url: string,
  init: RequestInit,
  timeout: number,
  cacheSeconds = 0,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const endpoint = new URL(url);
    if (endpoint.protocol !== "https:")
      throw new Error("503:OSM-Endpunkt muss HTTPS verwenden.");
    const response = await fetch(endpoint, {
      ...init,
      signal: controller.signal,
      redirect: "error",
      headers: {
        "User-Agent":
          "WebstudioExpert-CRM/1.0 (https://webstudio-expert.de; kontakt@webstudio-expert.de)",
        Accept: "application/json",
        ...init.headers,
      },
      cache: cacheSeconds ? "force-cache" : "no-store",
      ...(cacheSeconds ? { next: { revalidate: cacheSeconds } } : {}),
    });
    if (response.status === 429)
      throw new Error(
        "429:Der kostenlose OSM-Dienst ist ausgelastet. Bitte später erneut suchen.",
      );
    if (!response.ok)
      throw new Error(
        "503:OSM-Suchdienst vorübergehend nicht verfügbar. Bitte später erneut versuchen.",
      );
    return JSON.parse(await limitedText(response.body, 4_000_000)) as unknown;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error(
        "503:OSM-Suche hat zu lange gedauert. Radius verkleinern oder später versuchen.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
const geoSchema = z
  .array(z.object({ lat: z.string(), lon: z.string() }))
  .max(1);
const overpassSchema = z.object({
  remark: z.string().optional(),
  elements: z
    .array(z.object({ tags: z.record(z.string(), z.string()).optional() }))
    .max(201),
});
async function claimProvider(key: string, seconds: number) {
  const { data, error } = await serviceDb().rpc("crm_lease", {
    job_key: key,
    seconds,
  });
  if (error)
    throw new Error("503:Datenbank-Schutz für OSM-Suchen ist nicht verfügbar.");
  if (!data)
    throw new Error(
      "429:Eine OSM-Suche läuft oder wurde gerade ausgeführt. Bitte kurz warten.",
    );
}
export async function searchOsm(
  criteria: z.infer<typeof searchSchema>,
  actor: string,
) {
  const { error: migrationError } = await serviceDb().rpc("crm_osm_classify", {
    rows_in: [],
    postcode_in: criteria.postalCode,
  });
  if (migrationError)
    throw new Error(
      "503:Bitte zuerst die OSM-Migration 015 in Supabase ausführen.",
    );
  const { data: allowed, error: rateError } = await serviceDb().rpc(
    "crm_rate_limit",
    { key_in: "osm-search:" + actor, limit_in: 6, seconds_in: 3600 },
  );
  if (rateError) throw new Error("503:Suchlimit konnte nicht geprüft werden.");
  if (!allowed)
    throw new Error(
      "429:Maximal sechs OSM-Suchen pro Stunde. Bitte später erneut versuchen.",
    );
  await claimProvider("osm-search-global", 60);
  await claimProvider("osm-geocoder-global", 2);
  const geocoder = new URL(
    process.env.OSM_GEOCODER_URL ||
      "https://nominatim.openstreetmap.org/search",
  );
  geocoder.search = new URLSearchParams({
    postalcode: criteria.postalCode,
    country: "Deutschland",
    countrycodes: "de",
    format: "jsonv2",
    limit: "1",
  }).toString();
  const positions = geoSchema.parse(
    await providerJson(geocoder.toString(), {}, 10000, 86400),
  );
  if (!positions.length)
    throw new Error("Für diese PLZ wurde kein Mittelpunkt gefunden.");
  const lat = Number(positions[0].lat),
    lon = Number(positions[0].lon);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < 47 ||
    lat > 56 ||
    lon < 5 ||
    lon > 16
  )
    throw new Error("PLZ-Mittelpunkt liegt außerhalb Deutschlands.");
  const normalized = criteria.industry
    .toLocaleLowerCase("de")
    .replace(/[^a-zäöüß]/g, "");
  const preset =
    osmIndustries.find(
      (i) =>
        i.label.toLocaleLowerCase("de").replace(/[^a-zäöüß]/g, "") ===
        normalized,
    ) ||
    (/garten|landschaft|galabau|gardener/.test(normalized)
      ? osmIndustries[0]
      : undefined);
  const around = `(around:${criteria.radius * 1000},${lat.toFixed(6)},${lon.toFixed(6)})`;
  const escaped = [...criteria.industry]
    .map((char) =>
      ".+*?^$[]{}()|".includes(char) || char.charCodeAt(0) === 92
        ? String.fromCharCode(92) + char
        : char,
    )
    .join("");
  const filters = preset
    ? preset.tags
        .map(
          ([key, value]) =>
            `nwr[${JSON.stringify(key)}=${JSON.stringify(value)}]${around};`,
        )
        .join("")
    : `nwr["name"][~"^(craft|shop|office|amenity)$"~"."][~"^(craft|shop|office|amenity|description|name|operator)$"~${JSON.stringify(escaped)},i]${around};`;
  const query = `[out:json][timeout:20][maxsize:33554432];(${filters});out tags 201;`;
  const result = overpassSchema.parse(
    await providerJson(
      process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      },
      28000,
    ),
  );
  if (result.remark)
    throw new Error(
      "503:Overpass konnte die Suche nicht vollständig ausführen. Radius verkleinern oder später erneut suchen.",
    );
  let unnamed = 0,
    invalidContacts = 0;
  const rows: OsmLead[] = [];
  for (const element of result.elements.slice(0, 200)) {
    const tags = element.tags || {};
    const name = (tags.name || "").trim();
    if (!name) {
      unnamed++;
      continue;
    }
    if (name.length > 200)
      throw new Error(
        "Firmenname überschreitet das CRM-Limit. Dieser Suchlauf kann nicht importiert werden.",
      );
    let phone = (
      tags["contact:phone"] ||
      tags.phone ||
      tags["contact:mobile"] ||
      tags.mobile ||
      ""
    )
      .split(";")[0]
      .trim();
    if (
      phone &&
      (phone.length > 80 ||
        phone.replace(/\D/g, "").length < 7 ||
        phone.replace(/\D/g, "").length > 18)
    ) {
      phone = "";
      invalidContacts++;
    }
    let email = (tags["contact:email"] || tags.email || "")
      .replace(/^mailto:/i, "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (email && !z.email().max(254).safeParse(email).success) {
      email = "";
      invalidContacts++;
    }
    rows.push({ name, phone, email, industry: criteria.industry });
  }
  rows.sort(
    (a, b) =>
      Number(!!b.phone) +
        Number(!!b.email) -
        (Number(!!a.phone) + Number(!!a.email)) ||
      a.name.localeCompare(b.name, "de"),
  );
  const { data: classified, error } = await serviceDb().rpc(
    "crm_osm_classify",
    { rows_in: rows, postcode_in: criteria.postalCode },
  );
  if (error)
    throw new Error(
      "503:Die OSM-Migration 015 fehlt oder die Duplikatprüfung ist nicht verfügbar.",
    );
  return {
    token: signPreview(actor, criteria.postalCode, rows),
    rows: classified as OsmResult[],
    found: rows.length + unnamed,
    unnamed,
    invalidContacts,
    truncated: result.elements.length > 200,
    ...criteria,
  };
}
