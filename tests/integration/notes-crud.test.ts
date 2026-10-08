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

describe("note creation and request validation", () => {
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

  it("creates a note matching the contract and returns its Location", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
        "content-type": "application/json",
      },
      payload: { title: "Primeira nota", content: "Conteúdo persistido." },
    });

    assert.equal(response.statusCode, 201);
    assert.match(response.headers.location ?? "", /^\/notes\/[^/]+$/);
    assert.match(
      response.headers["content-type"] ?? "",
      /^application\/json(?:;|$)/,
    );
    const note = response.json();
    assert.deepEqual(Object.keys(note).sort(), [
      "content",
      "createdAt",
      "id",
      "title",
      "updatedAt",
    ]);
    assert.equal(note.title, "Primeira nota");
    assert.equal(note.content, "Conteúdo persistido.");
    assert.equal(note.createdAt, note.updatedAt);
    assert.equal(typeof note.id, "string");
  });

  it("rejects missing, empty, whitespace-only, and extra input properties", async () => {
    const invalidInputs: unknown[] = [
      { content: "Conteúdo sem título" },
      { title: "Título sem conteúdo" },
      { title: "", content: "Texto" },
      { title: "   ", content: "Texto" },
      { title: "Título", content: "" },
      { title: "Título", content: "\t \n" },
      { title: "Título", content: "Texto", owner_id: identities[1].id },
    ];

    for (const [index, payload] of invalidInputs.entries()) {
      const response = await app.inject({
        method: "POST",
        url: "/notes",
        headers: {
          authorization: `Bearer ${identities[0].accessToken}`,
          "content-type": "application/json",
        },
        payload: JSON.stringify(payload) ?? "null",
      });

      assert.equal(response.statusCode, 400);
      assert.match(
        response.headers["content-type"] ?? "",
        /^application\/problem\+json(?:;|$)/,
      );
      const problem = response.json();
      assert.equal(problem.type, "about:blank");
      assert.equal(problem.status, 400);
      assert.equal(Array.isArray(problem.errors), true);
      assert.ok(problem.errors.length > 0);
      assert.ok(
        problem.errors.every(
          (fieldError: { pointer: string; detail: string }) =>
            fieldError.pointer.startsWith("#"),
        ),
      );
      if (index === 0) {
        assert.ok(
          problem.errors.some(
            (fieldError: { pointer: string }) => fieldError.pointer === "#/title",
          ),
        );
      }
      if (index === invalidInputs.length - 1) {
        assert.ok(
          problem.errors.some(
            (fieldError: { pointer: string }) =>
              fieldError.pointer === "#/owner_id",
          ),
        );
      }
      assert.equal(JSON.stringify(problem).includes(identities[0].accessToken), false);
    }
  });
});

describe("individual note lifecycle", () => {
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

  async function createNote() {
    const response = await app.inject({
      method: "POST",
      url: "/notes",
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
        "content-type": "application/json",
      },
      payload: { title: "Antes", content: "Conteúdo inicial." },
    });
    assert.equal(response.statusCode, 201);
    return response.json();
  }

  it("reads, replaces atomically, and deletes its own note", async () => {
    const created = await createNote();
    const headers = {
      authorization: `Bearer ${identities[0].accessToken}`,
      "content-type": "application/json",
    };
    const read = await app.inject({
      method: "GET",
      url: `/notes/${created.id}`,
      headers,
    });

    assert.equal(read.statusCode, 200);
    assert.deepEqual(read.json(), created);

    const updated = await app.inject({
      method: "PUT",
      url: `/notes/${created.id}`,
      headers,
      payload: { title: "Depois", content: "Conteúdo substituído." },
    });
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.json().title, "Depois");
    assert.equal(updated.json().content, "Conteúdo substituído.");
    assert.equal(updated.json().id, created.id);
    assert.equal(updated.json().createdAt, created.createdAt);
    assert.notEqual(updated.json().updatedAt, created.updatedAt);

    const invalidUpdate = await app.inject({
      method: "PUT",
      url: `/notes/${created.id}`,
      headers,
      payload: { title: "Não aplicar", content: " \t\n" },
    });
    assert.equal(invalidUpdate.statusCode, 400);

    const unchanged = await app.inject({
      method: "GET",
      url: `/notes/${created.id}`,
      headers,
    });
    assert.deepEqual(unchanged.json(), updated.json());

    const deleted = await app.inject({
      method: "DELETE",
      url: `/notes/${created.id}`,
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
      },
    });
    assert.equal(deleted.statusCode, 204);
    assert.equal(deleted.body, "");

    const missingAfterDelete = await app.inject({
      method: "GET",
      url: `/notes/${created.id}`,
      headers,
    });
    assert.equal(missingAfterDelete.statusCode, 404);
    assert.equal(missingAfterDelete.json().title, "Nota não encontrada");

    const deleteAfterDelete = await app.inject({
      method: "DELETE",
      url: `/notes/${created.id}`,
      headers: {
        authorization: `Bearer ${identities[0].accessToken}`,
      },
    });
    assert.equal(deleteAfterDelete.statusCode, 404);
    assert.deepEqual(deleteAfterDelete.json(), missingAfterDelete.json());
  });

  it("returns the same not-found response for an unknown note", async () => {
    const headers = {
      authorization: `Bearer ${identities[0].accessToken}`,
      "content-type": "application/json",
    };
    const unknownIds = [randomUUID(), "not-a-uuid"];

    for (const id of unknownIds) {
      for (const [method, payload] of [
        ["GET", undefined],
        ["PUT", { title: "Replacement", content: "Not found." }],
        ["DELETE", undefined],
      ] as const) {
        const response = await app.inject({
          method,
          url: `/notes/${id}`,
          headers:
            method === "DELETE"
              ? { authorization: headers.authorization }
              : headers,
          ...(payload ? { payload } : {}),
        });

        assert.equal(response.statusCode, 404);
        assert.equal(response.json().title, "Nota não encontrada");
      }
    }
  });
});
