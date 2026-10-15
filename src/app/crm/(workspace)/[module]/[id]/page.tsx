import { notFound } from "next/navigation";
import { resources } from "@/crm/resources";
import { session } from "@/crm/server/db";
import { Detail } from "@/crm/components/detail";
import type { Row } from "@/crm/resources";
import { uuid } from "@/crm/server/validation";
import { WebsiteInquiryDetails } from "@/crm/components/website-inquiries";
export default async function Page({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  const { module: key, id } = await params;
  const r = resources[key];
  if (!r || !uuid.safeParse(id).success) notFound();
  const current = await session();
  const { data, error } = await current!.db
    .from(r.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  return key === "anfragen" ? (
    <WebsiteInquiryDetails row={data as Row} />
  ) : (
    <Detail resource={key} initial={data as Row} />
  );
}
