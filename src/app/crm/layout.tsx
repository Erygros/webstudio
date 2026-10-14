import type { Metadata } from "next";
import "./crm.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "CRM · Webstudio Expert",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="crm-root">{children}</div>;
}
