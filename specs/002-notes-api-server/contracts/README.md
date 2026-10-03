# Interface Contract

The authoritative notes API contract is
[`001-notes-api-baseline/contracts/openapi.yaml`](../../001-notes-api-baseline/contracts/openapi.yaml).
This feature implements it; it does not copy or fork the OpenAPI document.

## Compatibility

- Preserve the five note operations, schemas, status codes, Problem Details errors,
  bearer authentication, ownership privacy, and pagination order defined by the
  baseline contract.
- Changes to externally observable behavior require a documented compatibility
  analysis and maintainer approval before modifying the baseline contract.
- `GET /health/live` and `GET /health/ready` are additive operational endpoints. They
  return only health status and do not expose notes, credentials, or configuration.

## Error Mapping

Expected request and resource errors use the baseline `application/problem+json`
schema. Invalid request schemas map to 400, missing/invalid credentials to 401, and
missing, deleted, or non-owned notes to the same 404 response. Unexpected dependency
failures return the documented generic server-error shape without internal details.
