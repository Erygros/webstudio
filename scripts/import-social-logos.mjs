// Original, unmodified PNGs from the platforms' official brand asset archives.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import JSZip from "jszip";

const destination = new URL("../public/social-logos/", import.meta.url);
const assets = [
  {
    name: "Facebook",
    file: "facebook.png",
    page: "https://www.meta.com/brand/resources/facebook/logo/",
    entry:
      "Facebook Brand Asset Pack/Logo/Primary Logo/Facebook_Logo_Primary.png",
  },
  {
    name: "Instagram",
    file: "instagram.png",
    page: "https://www.meta.com/brand/resources/instagram/instagram-brand/",
    entry: "01 Static Glyph/01 Gradient Glyph/Instagram_Glyph_Gradient.png",
  },
  {
    name: "LinkedIn",
    file: "linkedin.png",
    page: "https://brand.linkedin.com/downloads",
    archive:
      "https://content.linkedin.com/content/dam/me/business/en-us/amp/xbu/linkedin-revised-brand-guidelines/logos/in-logo.zip",
    entry: "in-logo/LI-In-Bug.png",
  },
];
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok)
    throw new Error(`Logo download failed: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
await mkdir(destination, { recursive: true });
const sources = [];
for (const asset of assets) {
  const html = asset.archive
    ? ""
    : (await download(asset.page)).toString("utf8");
  const archiveUrl =
    asset.archive ||
    html.match(/https:[^"<>\s]+\.zip[^"<>\s]*/)?.[0].replaceAll("&amp;", "&");
  if (!archiveUrl) throw new Error(`Official archive missing: ${asset.name}`);
  const archive = await download(archiveUrl);
  const zip = await JSZip.loadAsync(archive);
  const entry = zip.file(asset.entry);
  if (!entry)
    throw new Error(`Original archive member missing: ${asset.entry}`);
  const bytes = await entry.async("nodebuffer");
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new Error(`Invalid PNG: ${asset.name}`);
  await writeFile(new URL(asset.file, destination), bytes);
  sources.push({
    name: asset.name,
    file: asset.file,
    page: asset.page,
    archive: new URL(archiveUrl).pathname.split("/").at(-1),
    entry: asset.entry,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    archiveSha256: createHash("sha256").update(archive).digest("hex"),
  });
  console.log(`${asset.name}: original PNG saved (${bytes.length} bytes)`);
}
await writeFile(
  new URL("SOURCES.json", destination),
  JSON.stringify(sources, null, 2) + "\n",
);
