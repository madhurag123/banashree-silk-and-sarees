import Store from "../store";
import { products, seed } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug[0] === "product") {
    try {
      await seed();
      const p = (await products()).find((x) => x.slug === slug[1]);
      if (p) return { title: p.name, description: p.description };
    } catch {}
  }
  return {
    title: slug[0].replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  let structured = null;
  if (slug[0] === "product") {
    try {
      await seed();
      const p = (await products()).find((x) => x.slug === slug[1]);
      if (p)
        structured = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: (p.sample ? "Sample — " : "") + p.name,
          description: p.description,
          sku: p.id,
          brand: { "@type": "Brand", name: "Banashree silk and sarees" },
          material: p.fabric,
          ...(!p.sample
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "INR",
                  price: (p.price / 100).toFixed(2),
                  availability: p.variants.some((v: any) => v.stock > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        };
    } catch {}
  }
  return (
    <>
      {structured && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Store route={slug[0]} id={slug[1]} />
    </>
  );
}
