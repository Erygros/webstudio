// Import original files from the respective owners. No logo-library redraws.
// Run manually when updating assets; not part of builds or visitor requests.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import JSZip from "jszip";

const destination = new URL("../public/platform-logos/", import.meta.url);
await mkdir(destination, { recursive: true });
const archives = new Map();
const woo = "https://woocommerce.com/wp-content/uploads/2025/01/woo-logos.zip";
const wix =
  "https://9ab0d111-ec70-4f4c-900e-a9399b76d84c.usrfiles.com/archives/9ab0d1_a1c94e33202642618be2265c769c77b9.zip";
const linkedin =
  "https://content.linkedin.com/content/dam/me/business/en-us/amp/xbu/linkedin-revised-brand-guidelines/logos/linkedin-logo.zip";
const assets = [
  {
    file: "nextjs-light.svg",
    url: "https://nextjs.org/_next/static/immutable/media/nextjs-logotype-light.00-_80jv8_dct.svg",
    page: "https://vercel.com/geist/brands",
  },
  {
    file: "nextjs-dark.svg",
    url: "https://nextjs.org/_next/static/immutable/media/nextjs-logotype-dark.3h4a2z2v_dkod.svg",
    page: "https://vercel.com/geist/brands",
  },
  {
    file: "typescript.svg",
    url: "https://www.typescriptlang.org/branding/ts-logo-512.svg",
    page: "https://www.typescriptlang.org/branding/",
  },
  {
    file: "woocommerce.svg",
    url: woo,
    entry: "Woo Logos/Woo_logo_color.svg",
    page: "https://woocommerce.com/brand-and-logo-guidelines/",
  },
  {
    file: "shopify.svg",
    url: "https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg",
    page: "https://www.shopify.com/brand-assets",
  },
  {
    file: "shopify-dark.svg",
    url: "https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-inverted-primary-logo-bdc6ddd67862d9bb1f8c559e1bb50dd233112ac57b29cac2edcf17ed2e1fe6fa.svg",
    page: "https://www.shopify.com/brand-assets",
  },
  {
    file: "google.png",
    url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    page: "https://www.google.com/",
  },
  {
    file: "trustpilot.svg",
    url: "https://cdn.trustpilot.net/brand-assets/4.1.0/logo-black.svg",
    page: "https://developers.trustpilot.com/resources-api/",
  },
  {
    file: "trustpilot-dark.svg",
    url: "https://cdn.trustpilot.net/brand-assets/4.1.0/logo-white.svg",
    page: "https://developers.trustpilot.com/resources-api/",
  },
  {
    file: "kununu.png",
    url: "https://news.kununu.com/wp-content/uploads/2026/03/kununu_Logo_height_60px.png",
    page: "https://news.kununu.com/presseinformationen/",
  },
  {
    file: "react-light.svg",
    url: "https://raw.githubusercontent.com/reactjs/react.dev/main/public/images/brand/wordmark_light.svg",
    page: "https://github.com/reactjs/react.dev/tree/main/public/images/brand",
  },
  {
    file: "react-dark.svg",
    url: "https://raw.githubusercontent.com/reactjs/react.dev/main/public/images/brand/wordmark_dark.svg",
    page: "https://github.com/reactjs/react.dev/tree/main/public/images/brand",
  },
  {
    file: "wordpress.png",
    url: "https://s.w.org/style/images/about/WordPress-logotype-standard.png",
    page: "https://wordpress.org/about/logos/",
  },
  {
    file: "wordpress-dark.png",
    url: "https://s.w.org/style/images/about/WordPress-logotype-standard-white.png",
    page: "https://wordpress.org/about/logos/",
  },
  {
    file: "shopware.svg",
    url: "https://images.ctfassets.net/nqzs8zsepqpi/1QpalaqpkTYUuSoIv7TfBl/2daad9bca9420191574a548d0b91b3fd/shopware-logo-brand-blue.svg",
    page: "https://www.shopware.com/en/press/",
  },
  {
    file: "webflow.svg",
    url: "https://dhygzobemt712.cloudfront.net/Mark/Mark_Logo_Blue.svg",
    page: "https://webflow.com/",
  },
  {
    file: "microsoft.png",
    url: "https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png",
    page: "https://www.microsoft.com/",
  },
  {
    file: "linkedin.png",
    url: linkedin,
    entry: "linkedin-logo/LI-Logo.png",
    page: "https://brand.linkedin.com/downloads",
  },
  {
    file: "pinterest.png",
    url: "https://s.pinimg.com/webapp/logo_transparent_144x144-3da7a67b.png",
    page: "https://business.pinterest.com/brand-guidelines/",
  },
  {
    file: "wix.svg",
    url: wix,
    entry: "WixLogoNew/SVG/Wix logoB.svg",
    page: "https://www.wix.com/about/design-assets",
  },
  {
    file: "wix-dark.svg",
    url: wix,
    entry: "WixLogoNew/SVG/Wix logoW.svg",
    page: "https://www.wix.com/about/design-assets",
  },
  {
    file: "squarespace.svg",
    url: "https://www.squarespace.com/",
    inline: "global-navigation__logo--desktop",
    page: "https://www.squarespace.com/",
  },
  {
    file: "jimdo.svg",
    url: "https://www.jimdo.com/",
    inline: 'data-logo="default"',
    page: "https://www.jimdo.com/",
  },
  {
    file: "meta.svg",
    url: "https://www.meta.com/brand/resources/meta/company-brand/",
    inline: "meta-company-logo",
    page: "https://www.meta.com/brand/resources/meta/company-brand/",
  },
  {
    file: "youtube.svg",
    url: "https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg",
    page: "https://brand.youtube/",
  },
  {
    file: "tiktok.svg",
    url: "https://newsroom.tiktok.com/",
    inline: "M25 3h7a10 10",
    page: "https://newsroom.tiktok.com/",
  },
];
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 20_000_000) throw new Error("Unexpected asset size");
  return bytes;
}
const ledger = [];
for (const asset of assets) {
  let bytes;
  if (asset.entry) {
    if (!archives.has(asset.url))
      archives.set(asset.url, await JSZip.loadAsync(await download(asset.url)));
    const entry = archives.get(asset.url).file(asset.entry);
    if (!entry)
      throw new Error(`Missing original archive member: ${asset.entry}`);
    bytes = await entry.async("nodebuffer");
  } else {
    bytes = await download(asset.url);
    if (asset.inline) {
      const svg = [
        ...bytes.toString("utf8").matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi),
      ].find(([value]) => value.includes(asset.inline))?.[0];
      if (!svg) throw new Error(`Missing original inline logo: ${asset.file}`);
      // Standalone SVG files need the namespace; path data and colors are kept.
      bytes = Buffer.from(
        svg.includes('xmlns="')
          ? svg
          : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'),
      );
    }
  }
  if (asset.file.endsWith(".svg")) {
    const svg = bytes.toString("utf8");
    if (
      !svg.includes("<svg") ||
      /<script\b|<foreignObject\b|\bonload\s*=|(?:href|src)=["']https?:/i.test(
        svg,
      )
    )
      throw new Error(`Not a standalone passive SVG: ${asset.file}`);
  } else if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    throw new Error(`Not an original PNG: ${asset.file}`);
  }
  await writeFile(new URL(asset.file, destination), bytes);
  ledger.push({
    ...asset,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  console.log(`${asset.file}: ${bytes.length} bytes`);
}
await writeFile(
  new URL("SOURCES.json", destination),
  JSON.stringify(ledger, null, 2) + "\n",
);
