"use client";
import { usePathname } from "next/navigation";
export function PublicChrome({
  children,
  header,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
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
    </>
  );
}
