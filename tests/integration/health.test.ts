import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import Fastify from "fastify";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/env.js";

describe("health endpoints", () => {
  let app: ReturnType<typeof Fastify>;
  const config = loadConfig();

  before(async () => {
    app = buildApp(config);
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it("returns only a live status", async () => {
    const response = await app.inject({ method: "GET", url: "/health/live" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
  });

  it("reports readiness without configuration or private data", async () => {
    const response = await app.inject({ method: "GET", url: "/health/ready" });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ready" });
    assert.equal(response.body.includes("supabase"), false);
  });

  it("returns not ready when an essential dependency is unavailable", async () => {
    const unavailable = buildApp(config, {
      readinessCheck: async () => false,
    });
    await unavailable.ready();

    try {
      const response = await unavailable.inject({
        method: "GET",
        url: "/health/ready",
      });

      assert.equal(response.statusCode, 503);
      assert.deepEqual(response.json(), { status: "not_ready" });
    } finally {
      await unavailable.close();
    }
  });
});
