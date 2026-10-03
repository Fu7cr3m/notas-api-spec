# Data Model: Servidor Executável da API de Notas

## Authenticated User

An identity authenticated by Supabase Auth and represented by a verified access token.
The verified token subject scopes all note operations.

| Attribute | Meaning | Constraints |
|-----------|---------|-------------|
| Subject (`sub`) | Stable Supabase Auth user identity | Required; extracted only from verified token claims |
| Access token | Bearer credential for the current request | Required for every notes operation; never persisted or logged by the API |

## Note

A private text note owned by exactly one authenticated user.

| Attribute | API representation | Database representation | Constraints |
|-----------|-------------------|-------------------------|-------------|
| Identifier | `id` | `id` | Required UUID; opaque to API clients and unique |
| Owner | Not returned to clients | `owner_id` | Required reference to `auth.users.id`; derived from verified identity; immutable through API |
| Title | `title` | `title` | Required text; must not be empty or whitespace-only |
| Content | `content` | `content` | Required text; must not be empty or whitespace-only |
| Creation time | `createdAt` | `created_at` | Required UTC timestamp; stable after creation |
| Last update time | `updatedAt` | `updated_at` | Required UTC timestamp; updated whenever title or content changes |

## Relationships

- One authenticated user may own zero or more notes.
- Each note has exactly one owner.
- An owner can select, insert, update, or delete only rows for which the database
  authenticated subject equals `owner_id`.
- Client request bodies never set or override `owner_id`.

## Lifecycle and State Changes

1. **Create**: assign a new identifier, verified owner, title, content, and equal
   initial creation/update timestamps.
2. **Read/list**: expose only records authorized by the authenticated user's database
   claims; list order is `created_at` ascending, then `id` ascending.
3. **Update**: replace title and content together after both are valid; preserve the
   identifier, owner, and creation time; update `updated_at` on successful changes.
4. **Delete**: remove the note from normal reads and lists.
5. **Unavailable**: missing, deleted, and non-owned identifiers map to the same
   not-found response.

## Database Integrity and Authorization

- Enable RLS for `public.notes`.
- Grant only required note operations to the `authenticated` database role; do not
  grant anonymous access.
- Define select/delete policies using `auth.uid() = owner_id`; define insert policy
  with `WITH CHECK (auth.uid() = owner_id)`; define update policy with both `USING`
  and `WITH CHECK` matching the authenticated owner.
- Use database constraints to reject blank/whitespace-only title or content even when
  application validation is bypassed.
- Use a database trigger to update `updated_at` for any successful update.
- The API process uses the caller's bearer token for database access and does not use
  the Supabase service-role key.

## Pagination

Apply the owner scope first, then order by `created_at ASC, id ASC`, then apply the
requested limit and offset. The reported total counts only rows visible to the
authenticated owner.
