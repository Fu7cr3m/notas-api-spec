import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/env.js";
import {
  cleanupTestIdentities,
  createTestIdentities,
  type TestIdentity,
} from "./helpers/supabase.js";

describe("request log privacy", () => {
  const config = loadConfig();
  const chunks: string[] = [];
  let identities: [TestIdentity, TestIdentity];
  let app: ReturnType<typeof buildApp>;

  before(async () => {
    identities = await createTestIdentities(config);
    const stream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });
    app = buildApp(config, { logger: { stream } });
    await app.ready();
  });

  after(async () => {
    await app.close();
    await cleanupTestIdentities(config, identities);
  });

  it("does not log credentials, note titles, or note content", async () => {
    const title = "private-title-must-not-appear";
    const content = "private-content-must-not-appear";
    const response = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
        "content-type": "application/json",
      },
      payload: { title, content },
    });

    assert.equal(response.statusCode, 201);
    const logs = chunks.join("");
    assert.ok(logs.length > 0);
    assert.equal(logs.includes(identities[0].accessToken), false);
    assert.equal(logs.includes(title), false);
    assert.equal(logs.includes(content), false);
  });
});
