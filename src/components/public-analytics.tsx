"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { allowsLeadinfo } from "@/lib/leadinfo";
import {
  analyticsConsentKey,
  readTrackingConsent,
} from "@/lib/analytics-consent";

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (
    readTrackingConsent(analyticsConsentKey) !== true ||
    !allowsLeadinfo(window.location.pathname) ||
    event.type !== "pageview"
  )
    return null;
  try {
    const url = new URL(event.url, window.location.origin);
    if (url.origin !== window.location.origin || !allowsLeadinfo(url.pathname))
      return null;
    url.search = "";
    url.hash = "";
    return { ...event, url: url.href };
  } catch {
    return null;
  }
}

export function PublicAnalytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    setAllowed(readTrackingConsent(analyticsConsentKey) === true);
    function changed(event: StorageEvent) {
      if (event.key === analyticsConsentKey || event.key === null)
        window.location.reload();
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [pathname]);
  if (!allowed || !allowsLeadinfo(pathname)) return null;
  return <Analytics beforeSend={beforeSend} debug={false} />;
}
