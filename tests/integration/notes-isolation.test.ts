import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/env.js";
import {
  cleanupTestIdentities,
  createTestIdentities,
  type TestIdentity,
} from "./helpers/supabase.js";

describe("cross-user note isolation", () => {
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

  it("hides another user's note identically to a nonexistent note", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
        "content-type": "application/json",
      },
      payload: { title: "Privada", content: "Não revelar a outro usuário." },
    });
    assert.equal(created.statusCode, 201);
    const note = created.json();
    const headers = {
      authorization: `Bearer ${identities[1].accessToken}`,
      "content-type": "application/json",
    };
    const nonexistentId = randomUUID();

    const requests = [
      ["GET", `/notes/${note.id}`],
      [
        "PUT",
        `/notes/${note.id}`,
        { title: "Alteração cruzada", content: "Não aplicar." },
      ],
      ["DELETE", `/notes/${note.id}`],
    ] as const;

    for (const [method, path, payload] of requests) {
      const requestHeaders =
        method === "DELETE"
          ? { authorization: headers.authorization }
          : headers;
      const foreign = await app.inject({
        method,
        url: path,
        headers: requestHeaders,
        ...(payload ? { payload } : {}),
      });
      const missing = await app.inject({
        method,
        url: `/notes/${nonexistentId}`,
        headers: requestHeaders,
        ...(payload ? { payload } : {}),
      });

      assert.equal(foreign.statusCode, 404);
      assert.deepEqual(foreign.json(), missing.json());
      assert.equal(foreign.body.includes(note.title), false);
      assert.equal(foreign.body.includes(note.content), false);
    }

    const unchanged = await app.inject({
      method: "GET",
      url: `/notes/${note.id}`,
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
      },
    });
    const otherUsersList = await app.inject({
      method: "GET",
      url: "/notes",
      headers,
    });

    assert.equal(unchanged.statusCode, 200);
    assert.deepEqual(unchanged.json(), note);
    assert.equal(otherUsersList.json().total, 0);
  });
});
