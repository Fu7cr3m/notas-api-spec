# Quickstart: Validate the Notes API Baseline

This guide defines a consumer-oriented acceptance walkthrough for the planned contract.
The repository currently has no running API implementation or contract validation
tooling, so these scenarios become executable after an implementation and validator
are selected.

## Prerequisites

- A deployed environment implementing the contract in `contracts/openapi.yaml`.
- Two valid user identities and their authentication credentials.
- `curl.exe` or an equivalent means to send HTTP requests and inspect status codes and
  response bodies.

## Setup

Set the deployed base URL and obtain access tokens for two different users:

```powershell
$BaseUrl = "https://api.notas.invalid/v1"
$UserAToken = "<access token for User A>"
$UserBToken = "<access token for User B>"
```

The `.invalid` host is reserved as a placeholder; substitute the deployed environment
URL.

## Acceptance Walkthrough

1. As User A, create a note with a nonblank title and content:

   ```powershell
   curl.exe -i -H "Authorization: Bearer $UserAToken" -H "Content-Type: application/json" --data-binary '{"title":"Baseline","content":"Validar a API de notas."}' "$BaseUrl/notes"
   ```

   Expect `201 Created`, a note identity, title, content, and creation and update
   timestamps. Save the returned identity as `$NoteId`.
2. List User A's notes and retrieve the new note. Lists are ordered by creation time
   ascending, then note identity ascending, before `limit` and `offset` are applied:

   ```powershell
   curl.exe -i -H "Authorization: Bearer $UserAToken" "$BaseUrl/notes?limit=50&offset=0"
   curl.exe -i -H "Authorization: Bearer $UserAToken" "$BaseUrl/notes/$NoteId"
   ```

   Expect the note in `data`, the total count, limit, and offset, and the matching
   individual representation.
3. List as User B. Expect User A's note not to appear:

   ```powershell
   curl.exe -i -H "Authorization: Bearer $UserBToken" "$BaseUrl/notes?limit=50&offset=0"
   ```

4. As User B, attempt to retrieve, update, and delete User A's note. Expect each
   operation to return 404 without disclosing note content; confirm User A can still
   retrieve the note unchanged.
5. As User A, update the title and content. Expect both values to change together and
   the update timestamp to advance:

   ```powershell
   curl.exe -i -X PUT -H "Authorization: Bearer $UserAToken" -H "Content-Type: application/json" --data-binary '{"title":"Baseline revisada","content":"Requisitos e exemplos validados."}' "$BaseUrl/notes/$NoteId"
   ```

6. Attempt creation and update with a missing, empty, or whitespace-only title or
   content. Expect 400 validation errors; for update, verify that the prior note
   remains unchanged.
7. As User A, delete the note and then attempt to retrieve and delete it again:

   ```powershell
   curl.exe -i -X DELETE -H "Authorization: Bearer $UserAToken" "$BaseUrl/notes/$NoteId"
   curl.exe -i -H "Authorization: Bearer $UserAToken" "$BaseUrl/notes/$NoteId"
   ```

   Expect `204 No Content` for deletion, followed by `404 Not Found`, and confirm the
   note is absent from the normal list.
8. Attempt a note operation without a valid authorization header. Expect
   `401 Unauthorized` and no note data.

## Contract Validation

Run the pinned OpenAPI linter from the repository root:

```powershell
npx --yes @redocly/cli@2.57.0 lint --skip-rule=info-license specs/001-notes-api-baseline/contracts/openapi.yaml
```

The license rule is skipped because the project has not specified a license; do not
infer one for the API contract. The command must exit successfully without other
errors or warnings.

**Validation result (2026-10-01)**: Passed with Redocly CLI 2.57.0. No OpenAPI errors
or warnings were reported with the documented license-rule exception.

Then verify the functional coverage and examples:

1. Confirm all local schema and response references resolve.
2. Validate request and response examples against their declared schemas.
3. Confirm the documented operations cover all acceptance scenarios in
   `spec.md` and the data constraints in `data-model.md`.

Expected outcome: all contract checks pass, and every walkthrough outcome is expressed
by a documented operation, schema, and response.
