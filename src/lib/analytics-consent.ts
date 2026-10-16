export const analyticsConsentKey = "webstudio-vercel-analytics-consent-v1";

export function readTrackingConsent(key: string): boolean | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value &&
      typeof value.allowed === "boolean" &&
      typeof value.expires === "number" &&
      value.expires > Date.now()
      ? value.allowed
      : null;
  } catch {
    return null;
  }
}
