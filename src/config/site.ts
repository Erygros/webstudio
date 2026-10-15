function publicOrigin() {
  const url = new URL(
    process.env.NEXT_PUBLIC_SEO_URL || "https://www.webstudio-expert.de",
  );
  // Die Produktionsdomain leitet den Apex auf www um. Auch ältere ENV-Werte
  // müssen deshalb auf die tatsächlich ausgelieferte kanonische Adresse zeigen.
  if (url.hostname === "webstudio-expert.de")
    url.hostname = "www.webstudio-expert.de";
  return url.origin;
}
export const site = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "Webstudio Expert",
  // Canonicals bleiben auf der öffentlichen Domain, auch wenn das CRM über
  // eine Vercel-Adresse erreichbar ist. Laufzeit-/CSRF-Konfiguration separat.
  url: publicOrigin(),
  runtimeUrl: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://webstudio-expert.de",
  ).origin,
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
