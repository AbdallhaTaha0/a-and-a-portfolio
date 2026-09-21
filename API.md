# API

## General conventions

The implementation may use Next.js Route Handlers, Server Actions, or a combination.

Regardless of transport, all protected mutations follow:

```text
Authenticate
→ Authorize
→ Validate
→ Mutate
→ Revalidate
→ Return safe result
```

## Public reads

Examples:

```text
GET /api/public/team
GET /api/public/projects
GET /api/public/projects/:slug
GET /api/public/members
GET /api/public/members/:slug
```

These endpoints must return only public fields.

## Authentication

Examples:

```text
GET|POST /api/auth/*
```

Auth.js owns the OAuth callback, sign-in, session, and logout routes. There is no public
registration, password login, forgot-password, or reset-password endpoint.

## Team Admin operations

Conceptual operations:

```text
POST   /api/admin/members
GET    /api/admin/members
GET    /api/admin/members/:id
PATCH  /api/admin/members/:id
DELETE /api/admin/members/:id

POST   /api/admin/projects
GET    /api/admin/projects
GET    /api/admin/projects/:id
PATCH  /api/admin/projects/:id
DELETE /api/admin/projects/:id

PATCH  /api/admin/team
```

Only TEAM_ADMIN can perform these.

Project mutations use allowlisted fields and server-side publication/date validation.
Updates and deletes re-read the target by ID inside the transaction. Deletion requires
the current project slug as explicit confirmation, cascades only the relationships owned
by the Project according to `Schema.md`, appends an AuditLog record, and preserves prior
audit history.

In the current server-action implementation, deleting `/admin/members/:id` means deleting
the Member profile and its owned content after exact-slug confirmation. It does not delete
the owning User. Active MEMBER accounts must be deactivated through the separate account
status operation first; TEAM_ADMIN accounts retain their role and access when an optional
profile is removed. The destructive transaction retains and appends audit history.

## Member operations

Conceptual operations:

```text
GET   /api/member/profile
PATCH /api/member/profile

GET   /api/member/education
POST /api/member/education
PATCH /api/member/education/:id
DELETE /api/member/education/:id

GET   /api/member/experience
POST /api/member/experience
PATCH /api/member/experience/:id
DELETE /api/member/experience/:id

GET   /api/member/projects
POST /api/member/projects
PATCH /api/member/projects/:id
DELETE /api/member/projects/:id
```

The server derives the current member from the authenticated session.

These operations are available to an active MEMBER and to an active TEAM_ADMIN whose
User is linked to a Member record. In both cases, the resolved Member record—not the
role alone—defines which personal records are owned.

Do not require the browser to submit `memberId` for ownership.

## Response conventions

Successful mutation:

```json
{
  "success": true,
  "data": {}
}
```

Validation failure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {}
  }
}
```

Authorization failure:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Do not expose internal exception messages.

## Pagination

Admin collection endpoints should support pagination.

Prefer cursor pagination for large collections; offset pagination is acceptable for small admin datasets if documented.

## Filtering/search

When added, validate:
- query length
- allowed sort fields
- allowed sort direction
- page size

Never concatenate untrusted strings into SQL.
