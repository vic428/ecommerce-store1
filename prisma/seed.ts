/**
 * Seeds a store database from src/config and src/data.
 *
 *   npm run db:seed                     # safe to re-run
 *   npm run db:seed -- --reset-settings # also overwrite settings + homepage from config
 *
 * Re-run behaviour (so a live store's admin edits are not lost):
 *  - Settings and homepage blocks are only written when missing, unless --reset-settings.
 *  - Categories, shipping methods and products are upserted by slug/code.
 *  - Variant stock is only set when the variant is first created; after that, stock is
 *    managed through /admin/inventory.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductStatus, type HomepageBlockType } from "../src/generated/prisma/client";
import { settingsSchemas, homepageBlockSchemas, type SettingKey } from "../src/lib/settings-schema";
import {
  businessConfig,
  commerceConfig,
  featuresConfig,
  announcementConfig,
  footerConfig,
  shippingMethodsConfig,
} from "../src/config/store.config";
import { themeConfig } from "../src/config/theme.config";
import { navigationConfig } from "../src/config/navigation.config";
import { homepageConfig } from "../src/config/homepage.config";
import { categories } from "../src/data/categories";
import { products } from "../src/data/products";
import { toMinor } from "../src/lib/currency";

const resetSettings = process.argv.includes("--reset-settings");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedSettings() {
  const raw: Record<SettingKey, unknown> = {
    business: businessConfig,
    branding: themeConfig,
    commerce: commerceConfig,
    features: featuresConfig,
    navigation: navigationConfig,
    announcement: announcementConfig,
    footer: footerConfig,
  };
  for (const key of Object.keys(raw) as SettingKey[]) {
    // Parse first so invalid config fails loudly here rather than at runtime.
    const value = settingsSchemas[key].parse(raw[key]);
    if (resetSettings) {
      await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    } else {
      await db.setting.upsert({ where: { key }, create: { key, value }, update: {} });
    }
  }
  console.log(`✓ settings (${resetSettings ? "overwritten" : "kept existing"})`);
}

async function seedHomepage() {
  const existing = await db.homepageBlock.count();
  if (existing > 0 && !resetSettings) {
    console.log("✓ homepage blocks (kept existing)");
    return;
  }
  await db.homepageBlock.deleteMany();
  for (const [position, block] of homepageConfig.entries()) {
    const content = homepageBlockSchemas[block.type].parse(block.content);
    await db.homepageBlock.create({
      data: { type: block.type as HomepageBlockType, position, enabled: block.enabled ?? true, content },
    });
  }
  console.log(`✓ homepage blocks (${homepageConfig.length})`);
}

async function seedShipping(minorUnits: number) {
  void minorUnits; // shipping config is already in minor units
  for (const [position, m] of shippingMethodsConfig.entries()) {
    const data = { ...m, position, isActive: true };
    await db.shippingMethod.upsert({ where: { code: m.code }, create: data, update: data });
  }
  console.log(`✓ shipping methods (${shippingMethodsConfig.length})`);
}

async function seedCategories() {
  for (const [position, c] of categories.entries()) {
    const data = { ...c, position, isActive: true };
    await db.category.upsert({ where: { slug: c.slug }, create: data, update: data });
  }
  console.log(`✓ categories (${categories.length})`);
}

async function seedProducts(minorUnits: number, lowStockThreshold: number) {
  const categoryIds = new Map(
    (await db.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]),
  );

  for (const p of products) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) throw new Error(`Product "${p.slug}" references unknown category "${p.categorySlug}"`);

    const productData = {
      name: p.name,
      brand: p.brand ?? null,
      shortDescription: p.shortDescription ?? null,
      description: p.description ?? p.shortDescription ?? null,
      categoryId,
      price: toMinor(p.price, minorUnits),
      compareAtPrice: p.compareAtPrice ? toMinor(p.compareAtPrice, minorUnits) : null,
      attributes: p.attributes ?? undefined,
      isFeatured: p.isFeatured ?? false,
      ratingAvg: p.ratingAvg ?? 0,
      ratingCount: p.ratingCount ?? 0,
      salesCount: p.salesCount ?? 0,
      status: ProductStatus.ACTIVE,
    };

    const product = await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...productData },
      update: productData,
    });

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: p.images.map((im, position) => ({ productId: product.id, url: im.url, alt: im.alt, position })),
    });

    const variants = p.variants ?? [{ sku: `${p.slug.toUpperCase()}-DEFAULT`, stock: p.stock ?? 0 }];
    for (const [position, v] of variants.entries()) {
      const variantData = {
        productId: product.id,
        name: v.name ?? "Default",
        options: v.options ?? undefined,
        price: v.price ? toMinor(v.price, minorUnits) : null,
        position,
        lowStockThreshold,
      };
      const existing = await db.productVariant.findUnique({ where: { sku: v.sku } });
      if (existing) {
        await db.productVariant.update({ where: { sku: v.sku }, data: variantData });
      } else {
        await db.productVariant.create({
          data: {
            sku: v.sku,
            ...variantData,
            stock: v.stock,
            inventoryAdjustments: {
              create: { delta: v.stock, stockAfter: v.stock, reason: "INITIAL", note: "Seed data" },
            },
          },
        });
      }
    }
  }
  console.log(`✓ products (${products.length})`);
}

async function main() {
  await seedSettings();
  // Read back the stored commerce settings so prices use the store's real currency units.
  const commerce = settingsSchemas.commerce.parse(
    (await db.setting.findUnique({ where: { key: "commerce" } }))?.value ?? {},
  );
  await seedHomepage();
  await seedShipping(commerce.minorUnits);
  await seedCategories();
  await seedProducts(commerce.minorUnits, commerce.lowStockThreshold);
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
