import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { loadConfig } from "../../src/config/env.js";
import {
  cleanupTestIdentities,
  createTestIdentities,
  type TestIdentity,
} from "./helpers/supabase.js";

describe("private note pagination", () => {
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

  async function createNote(identity: TestIdentity, index: number) {
    const response = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identity.accessToken}`,
        "content-type": "application/json",
      },
      payload: { title: `Nota ${index}`, content: `Conteúdo ${index}` },
    });
    assert.equal(response.statusCode, 201);
    return response.json();
  }

  async function listNotes(
    identity: TestIdentity,
    query = "",
  ) {
    return app.inject({
      method: "GET",
      url: `/notes${query}`,
      headers: { authorization: `Bearer ${identity.accessToken}` },
    });
  }

  it("returns an empty collection and the default page size for a new user", async () => {
    const response = await listNotes(identities[1]);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
    });
  });

  it("applies owner-scoped totals, bounds, stable order, and consecutive pages", async () => {
    await Promise.all(
      [0, 1, 2].map((index) => createNote(identities[0], index)),
    );

    const firstPage = await listNotes(identities[0], "?limit=2&offset=0");
    const secondPage = await listNotes(identities[0], "?limit=2&offset=2");
    const otherUserPage = await listNotes(identities[1]);
    const maximumPage = await listNotes(identities[0], "?limit=100");

    assert.equal(firstPage.statusCode, 200);
    assert.equal(secondPage.statusCode, 200);
    assert.equal(otherUserPage.statusCode, 200);
    assert.equal(maximumPage.statusCode, 200);

    const first = firstPage.json();
    const second = secondPage.json();
    const maximum = maximumPage.json();
    assert.equal(first.total, 3);
    assert.equal(first.limit, 2);
    assert.equal(first.offset, 0);
    assert.equal(second.total, 3);
    assert.equal(second.offset, 2);
    assert.equal(otherUserPage.json().total, 0);
    assert.equal(maximum.limit, 100);
    assert.equal(maximum.total, 3);
    assert.equal(maximum.data.length, 3);

    const ordered = [...maximum.data].sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id),
    );
    assert.deepEqual(maximum.data, ordered);
    assert.deepEqual(
      [...first.data, ...second.data],
      maximum.data,
    );
  });

  it("rejects limits outside 1 through 100 and negative offsets", async () => {
    for (const query of ["?limit=0", "?limit=101", "?offset=-1"]) {
      const response = await listNotes(identities[0], query);

      assert.equal(response.statusCode, 400, query);
      assert.match(
        response.headers["content-type"] ?? "",
        /^application\/problem\+json(?:;|$)/,
      );
    }
  });
});
