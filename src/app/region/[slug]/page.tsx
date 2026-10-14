import { notFound } from "next/navigation";
import { regionalPages } from "@/config/site";
import { PageIntro, Cta } from "@/components/ui";
import { seo } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return regionalPages.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = regionalPages.find((p) => p.slug === slug);
  if (!p) notFound();
  return seo(p.title, p.content.slice(0, 155), `/region/${slug}`);
}
export default async function Region({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = regionalPages.find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <>
      <PageIntro
        label="Regionale Weblösungen"
        title={p.title}
        description={p.content}
      />
      <Cta />
    </>
  );
}
