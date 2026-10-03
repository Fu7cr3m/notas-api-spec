import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/env.js";
import {
  cleanupTestIdentities,
  createTestIdentities,
  type TestIdentity,
} from "./helpers/supabase.js";

describe("note persistence", () => {
  const config = loadConfig();
  let identities: [TestIdentity, TestIdentity];
  let app: ReturnType<typeof buildApp>;

  before(async () => {
    identities = await createTestIdentities(config);
    app = buildApp(config);
    await app.ready();
  });

  after(async () => {
    await app.close();
    await cleanupTestIdentities(config, identities);
  });

  it("keeps a note available to its owner after rebuilding the application", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
        "content-type": "application/json",
      },
      payload: { title: "Persistente", content: "Após reiniciar o servidor." },
    });
    assert.equal(created.statusCode, 201);
    const note = created.json();

    await app.close();
    app = buildApp(config);
    await app.ready();

    const ownNotes = await app.inject({
      method: "GET",
      url: "/notes",
      headers: { authorization: `Bearer ${identities[0].accessToken}` },
    });
    const otherUserList = await app.inject({
      method: "GET",
      url: "/notes",
      headers: { authorization: `Bearer ${identities[1].accessToken}` },
    });

    assert.equal(ownNotes.statusCode, 200);
    assert.deepEqual(ownNotes.json().data, [note]);
    assert.equal(otherUserList.statusCode, 200);
    assert.equal(otherUserList.json().total, 0);
  });
});
