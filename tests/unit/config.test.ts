import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadConfig } from "../../src/config/env.js";

describe("application configuration", () => {
  it("accepts local Supabase settings and derives the token issuer", () => {
    const config = loadConfig({
      HOST: "127.0.0.1",
      PORT: "4310",
      SUPABASE_URL: "http://127.0.0.1:54321/",
      SUPABASE_ANON_KEY: "local-public-key",
    });

    assert.deepEqual(config, {
      host: "127.0.0.1",
      port: 4310,
      supabaseUrl: "http://127.0.0.1:54321",
      supabaseAnonKey: "local-public-key",
      supabaseIssuer: "http://127.0.0.1:54321/auth/v1",
    });
  });

  it("reports missing configuration names without including supplied values", () => {
    const suppliedUrl = "https://private-project.example";
    assert.throws(
      () =>
        loadConfig({
          SUPABASE_URL: suppliedUrl,
          SUPABASE_ANON_KEY: "",
        }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /SUPABASE_ANON_KEY/);
        assert.doesNotMatch(error.message, /private-project/);
        return true;
      },
    );
  });

  it("rejects invalid ports, URLs, and insecure remote endpoints", () => {
    const base = {
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_ANON_KEY: "local-public-key",
    };

    assert.throws(
      () => loadConfig({ ...base, PORT: "70000" }),
      /PORT must be an integer/,
    );
    assert.throws(
      () => loadConfig({ ...base, SUPABASE_URL: "not a URL" }),
      /SUPABASE_URL must be a valid URL/,
    );
    assert.throws(
      () =>
        loadConfig({
          ...base,
          SUPABASE_URL: "http://remote.example",
        }),
      /SUPABASE_URL must use HTTPS/,
    );
  });
});
