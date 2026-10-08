# Data Model: Baseline da API de Notas

## User

Represents an already authenticated person who can use the notes API.

| Field | Meaning | Constraints |
|-------|---------|-------------|
| User identity | Stable identity established by the authentication context | Required; supplied by the trusted authentication mechanism, not by note request bodies |

## Note

Represents private text owned by one user.

| Field | Meaning | Constraints |
|-------|---------|-------------|
| Note identity | Identifier used to address one note | Required; unique within the API |
| Owner identity | User who owns the note | Required; exactly one owner; immutable through note operations |
| Title | Short user-provided note heading | Required; MUST NOT be empty or whitespace-only |
| Content | User-provided note text | Required; MUST NOT be empty or whitespace-only |
| Created at | Time the note was created | Required; stable after creation |
| Updated at | Time the note was last changed | Required; changes when title or content changes |

## Relationships

- A user may own zero or more notes.
- Each note belongs to exactly one user.
- Note operations are scoped to the authenticated user's identity. The owner identity
  is not accepted as a client-controlled field.

## Lifecycle

1. A valid create operation establishes a note and its owner.
2. A valid update changes the title and content together and advances the update time.
   Invalid input leaves all existing note fields unchanged.
3. A delete operation makes the note unavailable to normal reads and lists.
4. Missing, deleted, and non-owned note identifiers are unavailable to the caller.

## List Ordering

Notes in collection responses are ordered by creation time ascending, with note
identity ascending as the tie-breaker. This deterministic order is applied before
limit and offset so consecutive pages use a defined ordering.

## Validation Rules

- Title and content are required for creation and update.
- A value containing only whitespace is invalid.
- The contract does not set maximum lengths, identifier encoding, timestamp precision,
  or a retention period; these are left open for implementation design unless required
  to complete the API contract.
