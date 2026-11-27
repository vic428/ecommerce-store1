import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isListed, purchaseBlock, type MerchantStatus, type ProductStatus } from "./availability";

const ok = {
  merchant: { status: "ACTIVE" as MerchantStatus },
  product: { status: "PUBLISHED" as ProductStatus },
  variant: { isActive: true, stock: 5 },
  quantity: 1,
};

describe("listing visibility", () => {
  test("published products of active merchants are listed", () => {
    assert.ok(isListed({ status: "PUBLISHED" }, { status: "ACTIVE" }));
    assert.ok(isListed({ status: "OUT_OF_STOCK" }, { status: "ACTIVE" }));
  });

  test("inactive, suspended or terminated merchants hide all listings", () => {
    for (const status of [
      "SUSPENDED",
      "INACTIVE",
      "TERMINATED",
      "LEAD",
      "ONBOARDING",
      "PENDING_APPROVAL",
    ] as const) {
      assert.equal(isListed({ status: "PUBLISHED" }, { status }), false, status);
    }
  });

  test("draft, pending, unavailable, archived and rejected products are hidden", () => {
    for (const status of ["DRAFT", "PENDING_REVIEW", "UNAVAILABLE", "ARCHIVED", "REJECTED"] as const) {
      assert.equal(isListed({ status }, { status: "ACTIVE" }), false, status);
    }
  });
});

describe("purchase rules", () => {
  test("in-stock published product from an active merchant is purchasable", () => {
    assert.equal(purchaseBlock(ok), null);
  });

  test("inactive merchants cannot sell", () => {
    assert.equal(purchaseBlock({ ...ok, merchant: { status: "SUSPENDED" } }), "MERCHANT_NOT_ACTIVE");
    assert.equal(purchaseBlock({ ...ok, merchant: { status: "TERMINATED" } }), "MERCHANT_NOT_ACTIVE");
  });

  test("archived products are not purchasable", () => {
    assert.equal(purchaseBlock({ ...ok, product: { status: "ARCHIVED" } }), "PRODUCT_NOT_PUBLISHED");
  });

  test("stock is respected", () => {
    assert.equal(purchaseBlock({ ...ok, variant: { isActive: true, stock: 0 } }), "OUT_OF_STOCK");
    assert.equal(purchaseBlock({ ...ok, quantity: 6 }), "INSUFFICIENT_STOCK");
    assert.equal(purchaseBlock({ ...ok, product: { status: "OUT_OF_STOCK" } }), "OUT_OF_STOCK");
    assert.equal(purchaseBlock({ ...ok, variant: { isActive: false, stock: 5 } }), "VARIANT_INACTIVE");
  });
});
