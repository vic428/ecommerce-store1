import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pgPoolConfig } from "./pg-config";

const remote = "postgresql://user:pass@db.example.supabase.co:5432/postgres?sslmode=require";
const CA = "-----BEGIN CERTIFICATE-----\\nTEST\\n-----END CERTIFICATE-----";

describe("pgPoolConfig", () => {
  test("local databases connect without TLS", () => {
    const cfg = pgPoolConfig({ DATABASE_URL: "postgres://postgres:postgres@localhost:51214/x" });
    assert.equal(cfg.ssl, false);
  });

  test("remote databases are encrypted; unverified without a CA in development", () => {
    const cfg = pgPoolConfig({ DATABASE_URL: remote });
    assert.deepEqual(cfg.ssl, { rejectUnauthorized: false });
    assert.ok(!String(cfg.connectionString).includes("sslmode"), "URL ssl params are removed");
  });

  test("a CA turns on certificate verification", () => {
    const cfg = pgPoolConfig({ DATABASE_URL: remote, DATABASE_SSL_CA: CA });
    assert.deepEqual(cfg.ssl, {
      ca: "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
    });
  });

  test("Netlify production refuses to connect without a CA", () => {
    assert.throws(
      () => pgPoolConfig({ DATABASE_URL: remote, NETLIFY: "true", CONTEXT: "production" }),
      /DATABASE_SSL_CA is required/,
    );
    // Netlify deploy previews and branch deploys are not production.
    assert.doesNotThrow(() =>
      pgPoolConfig({ DATABASE_URL: remote, NETLIFY: "true", CONTEXT: "deploy-preview" }),
    );
    assert.doesNotThrow(() =>
      pgPoolConfig({ DATABASE_URL: remote, NETLIFY: "true", CONTEXT: "production", DATABASE_SSL_CA: CA }),
    );
  });

  test("DATABASE_SSL_REQUIRE_CA=true enforces verification anywhere", () => {
    assert.throws(() => pgPoolConfig({ DATABASE_URL: remote, DATABASE_SSL_REQUIRE_CA: "true" }));
  });

  test("rejects a missing or non-URL DATABASE_URL", () => {
    assert.throws(() => pgPoolConfig({}), /DATABASE_URL is not set/);
    assert.throws(() => pgPoolConfig({ DATABASE_URL: "https://x.supabase.co" }), /hostname|valid/i);
  });
});
