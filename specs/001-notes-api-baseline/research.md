# Research: Baseline da API de Notas

## Decisions

### API description format

- **Decision**: Define the external contract using OpenAPI 3.1.1.
- **Rationale**: OpenAPI is appropriate for the synchronous HTTP interface. Version
  3.1.1 retains the 3.1 schema model and is a tooling-conservative default; the
  contract needs no 3.2-specific feature.
- **Alternatives considered**: OpenAPI 3.2.0 is newer, but its additional capabilities
  are unnecessary for this CRUD baseline. OpenAPI 3.0.3 may have broader legacy
  support, but lacks the full JSON Schema alignment available in 3.1.
- **Sources**: [OpenAPI 3.1.1 Specification](https://spec.openapis.org/oas/v3.1.1.html);
  [OpenAPI 3.2 announcement](https://www.openapis.org/blog/2025/09/23/announcing-openapi-v3-2).

### Authentication and ownership isolation

- **Decision**: Require HTTP bearer authentication on all operations. Treat the
  credential as externally issued; the contract does not prescribe JWT versus opaque
  tokens or define login and token issuance.
- **Rationale**: OpenAPI defines a standard HTTP bearer security scheme, while
  RFC 6750 describes the bearer authorization header and challenge. Return 404 rather
  than 403 for notes not owned by the caller, so an unauthorized caller cannot infer
  whether another user's note exists.
- **Alternatives considered**: Defining authentication issuance here would expand the
  scope beyond note management. Returning 403 for another user's note would reveal
  that the identifier exists.
- **Sources**: [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750);
  [OpenAPI Security Scheme Object](https://spec.openapis.org/oas/v3.1.1.html#security-scheme-object);
  [RFC 9110, sections 15.5.4-15.5.5](https://www.rfc-editor.org/rfc/rfc9110.html).

### Errors and validation

- **Decision**: Use RFC 9457 Problem Details with media type
  `application/problem+json`. Use 400 for malformed or semantically invalid request
  data, with field-specific details where applicable.
- **Rationale**: Problem Details standardizes an extensible error representation.
  Using one status for request validation keeps the initial contract simple and
  consistent; the RFC does not require one particular validation status.
- **Alternatives considered**: 422 could distinguish semantically invalid content
  from malformed syntax, but is not necessary for the initial baseline.
- **Sources**: [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457);
  [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html).

### Timestamps

- **Decision**: Represent creation and update times as OpenAPI `string` values with
  `format: date-time`, using RFC 3339 and UTC `Z` values in examples.
- **Rationale**: OpenAPI maps `date-time` to RFC 3339; UTC examples avoid ambiguity
  across clients.
- **Alternatives considered**: Other RFC 3339 offsets are valid, but one canonical
  output timezone makes examples consistent.
- **Sources**: [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339);
  [OpenAPI 3.1.1 Data Types](https://spec.openapis.org/oas/v3.1.1.html#data-types).

### Note list pagination

- **Decision**: Support `limit` and `offset` query parameters with a response envelope
  containing `data`, `total`, `limit`, and `offset`. Sort by creation time ascending,
  with note identity ascending as a deterministic tie-breaker before pagination.
- **Rationale**: No IETF or OpenAPI standard prescribes REST collection pagination.
  Offset pagination is a straightforward initial convention for this project's
  unspecified scale and avoids cursor lifecycle complexity. A fixed order defines
  which records belong on each page for an unchanged collection.
- **Alternatives considered**: Cursor pagination can behave better for changing or
  append-heavy collections but adds opaque cursor behavior not required by this
  baseline. RFC 8288 standardizes link relations, not a pagination strategy.
- **Sources**: [RFC 8288, Web Linking](https://www.rfc-editor.org/rfc/rfc8288).

### Contract validation tooling

- **Decision**: Use Redocly CLI 2.57.0 with `npx --yes
  @redocly/cli@2.57.0 lint --skip-rule=info-license
  specs/001-notes-api-baseline/contracts/openapi.yaml`.
- **Rationale**: Pinning the command-line package version makes the documented
  OpenAPI lint check reproducible without adding a runtime dependency to the
  contract-only project. The license rule is skipped because no API license has
  been selected; the server uses the reserved `.invalid` domain to avoid advertising
  an actual deployment host.
- **Alternatives considered**: Unpinned `npx` execution would allow validator
  behavior to change over time; adding a package manifest is unnecessary for this
  documentation-only feature.
- **Source**: [Redocly CLI on npm](https://www.npmjs.com/package/@redocly/cli).

### Deletion and unavailable notes

- **Decision**: Successful deletion returns 204 without a response body. Missing,
  deleted, and non-owned notes return the same 404 Problem Details shape.
- **Rationale**: RFC 9110 defines 204 as a successful DELETE response and permits 404
  when the server has no current representation or does not wish to disclose why.
  Using 404 for repeat deletion matches the feature's acceptance scenario.
- **Alternatives considered**: Returning 200 with a body or 202 for queued deletion
  is permitted by HTTP semantics but unnecessary for this synchronous baseline.
- **Sources**: [RFC 9110, DELETE and status codes](https://www.rfc-editor.org/rfc/rfc9110.html).

## Repository Findings

- The repository currently contains Spec Kit configuration and feature documents,
  but no application source, runtime, persistence layer, authentication service,
  validator, or test runner.
- Runtime, persistence, deployment platform, token issuance, and API test tooling
  remain implementation decisions; this feature creates the contract, not those
  systems.
