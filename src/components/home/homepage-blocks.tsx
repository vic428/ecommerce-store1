import { Suspense } from "react";
import { getActiveCategories, getProductsForBlock } from "@/lib/catalog";
import { getHomepageBlocks, getSettings, type HomepageBlock } from "@/lib/settings";
import { Benefits } from "./benefits";
import { CategoryStrip } from "./category-strip";
import { FeaturedProducts } from "./featured-products";
import { Hero } from "./hero";
import { Newsletter } from "./newsletter";
import { PromoBanner } from "./promo-banner";

/** Renders the homepage from the HomepageBlock table, respecting feature toggles. */
export async function HomepageBlocks() {
  const [settings, blocks] = await Promise.all([getSettings(), getHomepageBlocks()]);
  const { features, commerce } = settings;
  const rendered = await Promise.all(blocks.map((b) => renderBlock(b)));
  return <>{rendered}</>;

  async function renderBlock(block: HomepageBlock) {
    switch (block.type) {
      case "HERO":
        return <Hero key={block.id} content={block.content} />;
      case "CATEGORY_STRIP": {
        const all = await getActiveCategories();
        const picked = block.content.categorySlugs.length
          ? block.content.categorySlugs
              .map((s) => all.find((c) => c.slug === s))
              .filter((c) => c !== undefined)
          : all;
        return (
          <CategoryStrip
            key={block.id}
            title={block.content.title}
            categories={picked.slice(0, block.content.limit)}
          />
        );
      }
      case "FEATURED_PRODUCTS": {
        const products = await getProductsForBlock(
          block.content.source,
          block.content.productSlugs,
          block.content.limit,
        );
        return (
          <FeaturedProducts
            key={block.id}
            content={block.content}
            products={products}
            money={commerce}
            showPromo={features.promoBanners}
            showRatings={features.reviews}
          />
        );
      }
      case "PROMO_BANNER":
        return features.promoBanners ? <PromoBanner key={block.id} content={block.content} /> : null;
      case "BENEFITS":
        return <Benefits key={block.id} content={block.content} />;
      case "NEWSLETTER":
        // The form posts to a server action, which is resolved per request, so it streams in.
        return features.newsletter ? (
          <Suspense key={block.id} fallback={<div className="h-36" aria-hidden />}>
            <Newsletter title={block.content.title} description={block.content.description} />
          </Suspense>
        ) : null;
    }
  }
}
