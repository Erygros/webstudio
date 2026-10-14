import Link from "next/link";
import { site } from "@/config/site";
import { serializeJsonLd } from "@/lib/seo";
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "↗"}</span>;
}
export function Button({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link href={href} className={`button ${secondary ? "secondary" : ""}`}>
      {children}
      <Arrow />
    </Link>
  );
}
export function PageIntro({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-intro">
      <span className="eyebrow">{label}</span>
      <h1>{title}</h1>
      <div className="intro-bottom">
        <p>{description}</p>
        {children}
      </div>
    </header>
  );
}
export function SectionHead({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-head">
      <div>
        {label && <span className="eyebrow">{label}</span>}
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Cta() {
  return (
    <section className="cta section">
      <span className="eyebrow">Der nächste Schritt</span>
      <div>
        <h2>Was hast du vor?</h2>
        <p>
          Eine erste Idee reicht. Gemeinsam klären wir Umfang, Möglichkeiten und
          Budget.
        </p>
      </div>
      <Button href="/projektanfrage">Projekt anfragen</Button>
    </section>
  );
}
export function Faq({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.question}>
          <summary>
            {item.question}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const all = [{ name: "Start", href: "/" }, ...items];
  return (
    <>
      <nav className="breadcrumbs" aria-label="Brotkrümelnavigation">
        <ol>
          {all.map((item, i) => (
            <li key={item.href}>
              {i === all.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        value={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: `${site.url}${item.href}`,
          })),
        }}
      />
    </>
  );
}
export function JsonLd({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(value) }}
    />
  );
}
