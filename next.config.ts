import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/internal/review-mail": ["./public/brand/wordmark-black.png"],
    "/api/internal/lead-shop": ["./public/brand/wordmark-black.png"],
    "/api/leads/order": ["./public/brand/wordmark-black.png"],
    "/api/crm/lead-shop": ["./public/brand/wordmark-black.png"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), speaker-selection=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.leadinfo.eu https://cdn.leadinfo.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://collector.leadinfo.net; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.twilio.com wss://*.twilio.com https://*.twilio.ie wss://*.twilio.ie https://api.leadinfo.com https://collector.leadinfo.net https://collector4.leadinfo.net; media-src 'self' blob: https://sdk.twiliocdn.com; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
        ],
      },
      {
        // Die endgültige Domain darf indexiert werden, Vercel-Aliase nicht.
        // Keine Weiterleitung: CRM und Vorschauen bleiben dort erreichbar.
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      ...(process.env.VERCEL_ENV === "preview"
        ? [
            {
              source: "/:path*",
              headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
            },
          ]
        : []),
      {
        source: "/leads/download",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/bewertungen/auftrag/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/crm/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};
export default config;
