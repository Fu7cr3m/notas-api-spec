import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { parse } from "yaml";

const contractPath = resolve(
  process.cwd(),
  "specs/001-notes-api-baseline/contracts/openapi.yaml",
);

describe("canonical OpenAPI contract compatibility", () => {
  it("retains the five operations, success responses, schemas, and error media type", () => {
    const contract = parse(readFileSync(contractPath, "utf8"));
    const expectedOperations = [
      ["/notes", "get", "listNotes", "200"],
      ["/notes", "post", "createNote", "201"],
      ["/notes/{noteId}", "get", "getNote", "200"],
      ["/notes/{noteId}", "put", "replaceNote", "200"],
      ["/notes/{noteId}", "delete", "deleteNote", "204"],
    ] as const;

    for (const [path, method, operationId, successStatus] of expectedOperations) {
      const operation = contract.paths[path][method];
      assert.equal(operation.operationId, operationId);
      assert.ok(operation.responses[successStatus]);
      assert.ok(operation.responses["401"]);
    }

    assert.ok(contract.paths["/notes"].get.responses["400"]);
    for (const method of ["get", "put", "delete"]) {
      assert.ok(contract.paths["/notes/{noteId}"][method].responses["404"]);
    }

    const schemas = contract.components.schemas;
    assert.ok(schemas.NoteInput);
    assert.ok(schemas.Note);
    assert.ok(schemas.NotePage);
    assert.ok(schemas.Problem);

    for (const response of Object.values(contract.components.responses) as Array<{
      content?: Record<string, unknown>;
    }>) {
      if (response.content) {
        assert.ok(response.content["application/problem+json"]);
      }
    }
  });
});
