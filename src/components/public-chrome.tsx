"use client";
import { usePathname } from "next/navigation";
import { TrackingConsent } from "@/components/tracking-consent";
export function PublicChrome({
  children,
  header,
  footer,
  structuredData,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  structuredData: React.ReactNode;
}) {
  const path = usePathname();
  return path.startsWith("/crm") ? (
    <>{children}</>
  ) : (
    <>
      {header}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      {footer}
      <TrackingConsent />
      {structuredData}
    </>
  );
}
