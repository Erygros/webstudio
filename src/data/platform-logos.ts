// Original brand assets and their provenance are kept in
// public/platform-logos/SOURCES.json; see scripts/import-platform-logos.mjs.
export type PlatformLogo = {
  name: string;
  image: string;
  darkImage?: string;
  url: string;
  compact?: boolean;
  monochrome?: "black" | "white";
  lightBackdrop?: boolean;
};
export const platformLogos: PlatformLogo[] = [
  {
    name: "Next.js",
    image: "nextjs-light.svg",
    darkImage: "nextjs-dark.svg",
    url: "https://nextjs.org/",
  },
  {
    name: "TypeScript",
    image: "typescript.svg",
    url: "https://www.typescriptlang.org/",
    compact: true,
  },
  {
    name: "WooCommerce",
    image: "woocommerce.svg",
    url: "https://woocommerce.com/",
  },
  {
    name: "Shopify",
    image: "shopify.svg",
    darkImage: "shopify-dark.svg",
    url: "https://www.shopify.com/",
  },
  { name: "Google", image: "google.png", url: "https://www.google.com/" },
  {
    name: "Trustpilot",
    image: "trustpilot.svg",
    darkImage: "trustpilot-dark.svg",
    url: "https://www.trustpilot.com/",
  },
  {
    name: "kununu",
    image: "kununu.png",
    url: "https://www.kununu.com/",
    lightBackdrop: true,
  },
  {
    name: "WordPress",
    image: "wordpress.png",
    darkImage: "wordpress-dark.png",
    url: "https://wordpress.org/",
  },
  {
    name: "React",
    image: "react-light.svg",
    darkImage: "react-dark.svg",
    url: "https://react.dev/",
  },
  { name: "Shopware", image: "shopware.svg", url: "https://www.shopware.com/" },
  {
    name: "Webflow",
    image: "webflow.svg",
    url: "https://webflow.com/",
    compact: true,
  },
  {
    name: "Wix",
    image: "wix.svg",
    darkImage: "wix-dark.svg",
    url: "https://www.wix.com/",
  },
  {
    name: "Squarespace",
    image: "squarespace.svg",
    url: "https://www.squarespace.com/",
    monochrome: "white",
  },
  {
    name: "Jimdo",
    image: "jimdo.svg",
    url: "https://www.jimdo.com/",
    lightBackdrop: true,
  },
  {
    name: "Microsoft",
    image: "microsoft.png",
    url: "https://www.microsoft.com/",
  },
  {
    name: "Meta",
    image: "meta.svg",
    url: "https://www.meta.com/",
    monochrome: "black",
  },
  {
    name: "YouTube",
    image: "youtube.svg",
    url: "https://www.youtube.com/",
    lightBackdrop: true,
  },
  {
    name: "LinkedIn",
    image: "linkedin.png",
    url: "https://www.linkedin.com/",
    lightBackdrop: true,
  },
  {
    name: "Pinterest",
    image: "pinterest.png",
    url: "https://www.pinterest.com/",
    compact: true,
  },
  {
    name: "TikTok",
    image: "tiktok.svg",
    url: "https://www.tiktok.com/",
    compact: true,
    monochrome: "black",
  },
];
