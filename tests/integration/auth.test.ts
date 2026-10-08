import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import Fastify, { type FastifyRequest } from "fastify";
import { loadConfig } from "../../src/config/env.js";
import {
  createAuthenticationGuard,
  type VerifiedClaims,
} from "../../src/plugins/authentication.js";
import { registerProblemHandler } from "../../src/schemas/problem.js";
import {
  cleanupTestIdentities,
  createTestIdentities,
  type TestIdentity,
} from "./helpers/supabase.js";

describe("bearer authentication", () => {
  const config = loadConfig();
  let identities: [TestIdentity, TestIdentity];
  let app: ReturnType<typeof Fastify>;

  before(async () => {
    identities = await createTestIdentities(config);
    app = Fastify();
    app.decorateRequest("user", null);
    app.decorateRequest("accessToken", null);
    registerProblemHandler(app);
    app.get(
      "/auth-probe",
      { preHandler: createAuthenticationGuard(config) },
      async (request: FastifyRequest) => ({ subject: request.user?.id }),
    );
    await app.ready();
  });

  after(async () => {
    await app.close();
    await cleanupTestIdentities(config, identities);
  });

  it("associates a valid Supabase token with its verified subject", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth-probe",
      headers: { authorization: `Bearer ${identities[0].accessToken}` },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { subject: identities[0].id });
  });

  it("rejects missing, malformed, and expired credentials", async () => {
    const responses = await Promise.all([
      app.inject({ method: "GET", url: "/auth-probe" }),
      app.inject({
        method: "GET",
        url: "/auth-probe",
        headers: { authorization: "Bearer not-a-token" },
      }),
      app.inject({
        method: "GET",
        url: "/auth-probe",
        headers: { authorization: "Bearer expired-test-token" },
      }),
    ]);

    assert.deepEqual(
      responses.map((response) => response.statusCode),
      [401, 401, 401],
    );
    for (const response of responses) {
      assert.equal(
        response.headers["content-type"]?.split(";")[0],
        "application/problem+json",
      );
      assert.equal(response.json().status, 401);
      assert.equal(response.headers["www-authenticate"], "Bearer");
    }
  });

  it("rejects a token verified with an issuer from another project", async () => {
    const verifiedClaims: VerifiedClaims = {
      sub: identities[0].id,
      iss: "https://other-project.supabase.co/auth/v1",
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    const appWithWrongIssuer = Fastify();
    appWithWrongIssuer.decorateRequest("user", null);
    appWithWrongIssuer.decorateRequest("accessToken", null);
    registerProblemHandler(appWithWrongIssuer);
    appWithWrongIssuer.get(
      "/auth-probe",
      {
        preHandler: createAuthenticationGuard(config, async () => verifiedClaims),
      },
      async (request: FastifyRequest) => ({ subject: request.user?.id }),
    );
    await appWithWrongIssuer.ready();

    try {
      const response = await appWithWrongIssuer.inject({
        method: "GET",
        url: "/auth-probe",
        headers: { authorization: "Bearer validly-signed-wrong-issuer" },
      });

      assert.equal(response.statusCode, 401);
      assert.equal(response.json().status, 401);
    } finally {
      await appWithWrongIssuer.close();
    }
  });

  it("rejects claims that are expired even after signature verification", async () => {
    const expiredClaims: VerifiedClaims = {
      sub: identities[0].id,
      iss: config.supabaseIssuer,
      exp: 1,
    };
    const expiredApp = Fastify();
    expiredApp.decorateRequest("user", null);
    expiredApp.decorateRequest("accessToken", null);
    registerProblemHandler(expiredApp);
    expiredApp.get(
      "/auth-probe",
      {
        preHandler: createAuthenticationGuard(config, async () => expiredClaims),
      },
      async (request: FastifyRequest) => ({ subject: request.user?.id }),
    );
    await expiredApp.ready();

    try {
      const response = await expiredApp.inject({
        method: "GET",
        url: "/auth-probe",
        headers: { authorization: "Bearer signed-expired-token" },
      });

      assert.equal(response.statusCode, 401);
    } finally {
      await expiredApp.close();
    }
  });
});
