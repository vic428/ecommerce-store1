import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  assertCan,
  assertMerchantAccess,
  can,
  canAccessMerchant,
  canReadOrder,
  ForbiddenError,
  isStaff,
  PERMISSIONS,
  type Principal,
} from "./permissions";

const p = (over: Partial<Principal>): Principal => ({ profileId: "u1", roles: [], merchantIds: [], ...over });

describe("role permissions", () => {
  test("super admin has every permission", () => {
    const admin = p({ roles: ["SUPER_ADMIN"] });
    for (const perm of PERMISSIONS) assert.ok(can(admin, perm), perm);
  });

  test("operations cannot touch money movements or staff", () => {
    const ops = p({ roles: ["OPERATIONS"] });
    assert.ok(can(ops, "products:write"));
    assert.ok(can(ops, "orders:update"));
    for (const perm of [
      "settlements:mark-paid",
      "settlements:approve",
      "refunds:approve",
      "merchant-bank:read",
      "staff:manage",
      "finance:read",
    ] as const) {
      assert.equal(can(ops, perm), false, perm);
    }
  });

  test("finance cannot edit catalogue or merchants", () => {
    const fin = p({ roles: ["FINANCE"] });
    assert.ok(can(fin, "settlements:mark-paid"));
    for (const perm of ["products:write", "merchants:write", "categories:write", "settings:write"] as const) {
      assert.equal(can(fin, perm), false, perm);
    }
  });

  test("customers and anonymous users have no admin access", () => {
    assert.equal(can(p({ roles: ["CUSTOMER"] }), "admin:access"), false);
    assert.equal(can(null, "admin:access"), false);
    assert.equal(isStaff(p({ roles: ["CUSTOMER"] })), false);
    assert.throws(() => assertCan(p({ roles: ["CUSTOMER"] }), "orders:read"), ForbiddenError);
  });

  test("roles combine", () => {
    const both = p({ roles: ["OPERATIONS", "FINANCE"] });
    assert.ok(can(both, "products:write") && can(both, "settlements:mark-paid"));
    assert.equal(can(both, "staff:manage"), false);
  });
});

describe("merchant isolation", () => {
  test("merchant user A cannot access merchant B", () => {
    const merchantUserA = p({ roles: [], merchantIds: ["m_a"] });
    assert.ok(canAccessMerchant(merchantUserA, "m_a"));
    assert.equal(canAccessMerchant(merchantUserA, "m_b"), false);
    assert.throws(() => assertMerchantAccess(merchantUserA, "m_b"), ForbiddenError);
  });

  test("staff with merchants:read can access any merchant", () => {
    assert.ok(canAccessMerchant(p({ roles: ["FINANCE"] }), "m_b"));
  });

  test("anonymous users cannot access any merchant", () => {
    assert.equal(canAccessMerchant(null, "m_a"), false);
  });
});

describe("order access", () => {
  test("customers only read their own orders", () => {
    const alice = p({ profileId: "alice", roles: ["CUSTOMER"] });
    assert.ok(canReadOrder(alice, { customerProfileId: "alice" }));
    assert.equal(canReadOrder(alice, { customerProfileId: "bob" }), false);
    assert.equal(canReadOrder(alice, { customerProfileId: null }), false);
  });

  test("staff with orders:read can read any order", () => {
    assert.ok(canReadOrder(p({ roles: ["OPERATIONS"] }), { customerProfileId: "bob" }));
  });
});
