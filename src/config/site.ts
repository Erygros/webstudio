export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Webstudio Expert",
  url: (
    process.env.NEXT_PUBLIC_SITE_URL || "https://webstudio-expert.de"
  ).replace(/\/$/, ""),
  locale: "de-DE",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "kontakt@webstudio-expert.de",
  phone: process.env.NEXT_PUBLIC_PHONE || "+49 155 67504871",
  booking: "/terminbuchung",
};
export const business = {
  owner: "Enrico Gross",
  street: "Karinstraße 5",
  postcode: "44388",
  city: "Dortmund",
  country: "Deutschland",
  vatId: process.env.BUSINESS_VAT_ID || "",
  economicId: process.env.BUSINESS_ECONOMIC_ID || "",
  register: process.env.BUSINESS_REGISTER || "",
};
// Englisch ist vorbereitet, wird erst nach vollständiger Übersetzung veröffentlicht.
export const locales = {
  default: "de",
  available: ["de"],
  planned: ["en"],
} as const;
export const regionalPages: { slug: string; title: string; content: string }[] =
  [];
