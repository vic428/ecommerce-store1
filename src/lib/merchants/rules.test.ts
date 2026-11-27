import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  AgreementConflictError,
  agreementPhase,
  canChangeStatus,
  formatBps,
  needsConfirmation,
  percentToBps,
  planAgreementActivation,
  slugify,
} from "./rules";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("percentToBps / formatBps", () => {
  test("converts percentages to basis points exactly", () => {
    assert.equal(percentToBps("10"), 1000);
    assert.equal(percentToBps("12.5"), 1250);
    assert.equal(percentToBps("12.55"), 1255);
    assert.equal(percentToBps(" 7.05 % "), 705);
    assert.equal(percentToBps("0"), 0);
    assert.equal(percentToBps("100"), 10_000);
  });

  test("rejects invalid or out-of-range values", () => {
    for (const bad of ["", "abc", "-5", "100.01", "101", "12.555", "1e2", "12,5"]) {
      assert.equal(percentToBps(bad), null, bad);
    }
  });

  test("formats basis points for display", () => {
    assert.equal(formatBps(1000), "10%");
    assert.equal(formatBps(1250), "12.5%");
    assert.equal(formatBps(1255), "12.55%");
    assert.equal(formatBps(705), "7.05%");
  });
});

describe("status changes", () => {
  test("terminated is final", () => {
    assert.equal(canChangeStatus("TERMINATED", "ACTIVE"), false);
    assert.equal(canChangeStatus("ACTIVE", "TERMINATED"), true);
    assert.equal(canChangeStatus("ACTIVE", "ACTIVE"), false);
  });

  test("hiding live listings or terminating needs confirmation", () => {
    assert.ok(needsConfirmation("ACTIVE", "SUSPENDED"));
    assert.ok(needsConfirmation("ACTIVE", "INACTIVE"));
    assert.ok(needsConfirmation("LEAD", "TERMINATED"));
    assert.equal(needsConfirmation("LEAD", "ONBOARDING"), false);
    assert.equal(needsConfirmation("PENDING_APPROVAL", "ACTIVE"), false);
  });
});

describe("slugify", () => {
  test("builds URL-safe slugs", () => {
    assert.equal(slugify("Eka's Leather Collection"), "ekas-leather-collection");
    assert.equal(slugify("  Urban Nest & Home  "), "urban-nest-and-home");
    assert.equal(slugify("Café Délice"), "cafe-delice");
  });
});

describe("agreements", () => {
  const now = d("2026-06-01");

  test("phases", () => {
    const base = { id: "a", effectiveTo: null as Date | null };
    assert.equal(agreementPhase({ ...base, status: "DRAFT", effectiveFrom: d("2026-01-01") }, now), "Draft");
    assert.equal(
      agreementPhase({ ...base, status: "ACTIVE", effectiveFrom: d("2026-01-01") }, now),
      "In force",
    );
    assert.equal(
      agreementPhase({ ...base, status: "ACTIVE", effectiveFrom: d("2026-07-01") }, now),
      "Scheduled",
    );
    assert.equal(
      agreementPhase(
        { ...base, status: "ACTIVE", effectiveFrom: d("2026-01-01"), effectiveTo: d("2026-05-01") },
        now,
      ),
      "Ended",
    );
    assert.equal(
      agreementPhase({ ...base, status: "TERMINATED", effectiveFrom: d("2026-01-01") }, now),
      "Terminated",
    );
  });

  test("activating a new agreement ends the running one at the switch-over date", () => {
    const plan = planAgreementActivation(
      [
        { id: "old", status: "ACTIVE", effectiveFrom: d("2026-01-01"), effectiveTo: null },
        { id: "ended", status: "ACTIVE", effectiveFrom: d("2025-01-01"), effectiveTo: d("2026-01-01") },
        { id: "draft", status: "DRAFT", effectiveFrom: d("2026-02-01"), effectiveTo: null },
      ],
      d("2026-07-01"),
    );
    assert.deepEqual(plan, [{ id: "old", effectiveTo: d("2026-07-01") }]);
  });

  test("an active agreement starting on/after the new date is a conflict", () => {
    assert.throws(
      () =>
        planAgreementActivation(
          [{ id: "future", status: "ACTIVE", effectiveFrom: d("2026-08-01"), effectiveTo: null }],
          d("2026-07-01"),
        ),
      AgreementConflictError,
    );
  });
});
