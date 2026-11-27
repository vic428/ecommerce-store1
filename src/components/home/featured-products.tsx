import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { ProductCardData } from "@/lib/catalog";
import type { HomepageBlock } from "@/lib/settings";
import type { CommerceSettings } from "@/lib/settings-schema";
import { Container, SectionTitle } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { StoreImage } from "@/components/common/store-image";
import { ProductCard } from "@/components/products/product-card";

type Content = Extract<HomepageBlock, { type: "FEATURED_PRODUCTS" }>["content"];

export function FeaturedProducts({
  content,
  products,
  money,
  showPromo,
  showRatings,
}: {
  content: Content;
  products: ProductCardData[];
  money: Pick<CommerceSettings, "currency" | "locale" | "minorUnits">;
  showPromo: boolean;
  showRatings: boolean;
}) {
  if (products.length === 0) return null;
  const promo = showPromo ? content.promo : undefined;

  return (
    <section aria-labelledby="featured-products" className="py-6 sm:py-8">
      <Container>
        <SectionTitle
          action={
            <Link href="/shop" className="flex items-center gap-1.5 text-sm font-semibold hover:underline">
              View All Products <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          }
        >
          <span id="featured-products">{content.title}</span>
        </SectionTitle>

        <ul
          className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${promo ? "xl:grid-cols-6" : "xl:grid-cols-5"}`}
        >
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} money={money} showRating={showRatings} />
            </li>
          ))}
          {promo && (
            <li className="col-span-2 md:col-span-3 xl:col-span-1">
              <div className="rounded-brand bg-secondary text-secondary-fg relative flex h-full min-h-56 flex-col justify-between overflow-hidden p-5">
                <div className="relative z-10 max-w-[60%] xl:max-w-none">
                  {promo.eyebrow && (
                    <p className="text-primary mb-2 flex items-center gap-2 text-sm font-bold">
                      <span aria-hidden className="bg-primary h-0.5 w-5" />
                      {promo.eyebrow}
                    </p>
                  )}
                  <p className="text-2xl leading-tight font-bold">
                    {promo.title}
                    {promo.highlight && (
                      <>
                        <br />
                        <span className="text-primary text-4xl font-extrabold">{promo.highlight}</span>
                      </>
                    )}
                  </p>
                  {promo.description && (
                    <p className="text-secondary-fg/80 mt-1 text-sm">{promo.description}</p>
                  )}
                </div>
                <ButtonLink
                  href={promo.cta.href}
                  size="md"
                  className="relative z-10 mt-4 self-start rounded-full"
                >
                  {promo.cta.label} <ArrowRight aria-hidden className="h-4 w-4" />
                </ButtonLink>
                <div aria-hidden className="text-primary absolute right-3 bottom-3 h-28 w-28 xl:h-24 xl:w-24">
                  {promo.imageUrl ? (
                    <StoreImage src={promo.imageUrl} alt="" sizes="120px" className="bg-transparent" />
                  ) : (
                    <ShoppingBag className="h-full w-full" strokeWidth={1} />
                  )}
                </div>
              </div>
            </li>
          )}
        </ul>
      </Container>
    </section>
  );
}
