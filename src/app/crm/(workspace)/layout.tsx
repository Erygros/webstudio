import { session } from "@/crm/server/db";
import { CRMFrame } from "@/crm/components/frame";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await session();
  return <CRMFrame profile={current!.profile}>{children}</CRMFrame>;
}
