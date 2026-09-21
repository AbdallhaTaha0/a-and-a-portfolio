# Agents.md

## Mission

Build and maintain a production-quality team portfolio platform according to the requirements in this repository.

The agent must behave like a careful senior full-stack engineer: understand the existing architecture before modifying it, preserve data integrity, and verify security boundaries.

## Source of truth

Read these files before substantial implementation:

1. `Rules.md`
2. `Architecture.md`
3. `Schema.md`
4. `Plan.md`
5. `Security.md`
6. `Content.md`
7. `Design.md`
8. `API.md`
9. `Testing.md`

If repository code contradicts these documents, do not blindly overwrite either side. Determine whether the docs or implementation are stale and update the appropriate source deliberately.

## Before coding

1. Inspect the repository structure.
2. Inspect package manager and scripts.
3. Inspect existing dependencies.
4. Inspect environment-variable usage.
5. Inspect Prisma schema/migrations if present.
6. Inspect existing auth implementation.
7. Inspect shared UI/components.
8. Identify whether the requested feature already partially exists.
9. Make the smallest coherent change.

Do not create a second implementation of an existing capability.

## Implementation workflow

For each feature:

1. Understand the user-facing requirement.
2. Identify affected domain models.
3. Check authorization requirements.
4. Design validation.
5. Implement server-side logic.
6. Implement UI.
7. Add loading/error/empty states.
8. Add tests.
9. Run lint/typecheck/tests/build as applicable.
10. Update docs if architecture or schema changed.

## Server/client boundary

Default assumption:
- Database code is server-only.
- Secrets are server-only.
- Authorization is server-side.
- Client components receive only the minimum required data.

Do not import Prisma or secret-bearing modules into browser/client bundles.

## Authorization workflow

For every protected mutation:

1. Resolve authenticated user on the server.
2. Check account status.
3. Check role.
4. For member-owned resources, resolve ownership from the database rather than trusting request data.
5. Reject unauthorized access.
6. Validate input.
7. Perform mutation.
8. Revalidate/invalidate affected public/admin views.

## Database workflow

Use Prisma migrations.

Never:
- manually edit production database tables without a corresponding migration
- reset a shared/production database to solve a development problem
- delete migrations to fix a schema mismatch
- use destructive migration commands against production

Seed data must be deterministic and safe to rerun where practical.

## Content workflow

Content should be editable through dashboards.

Do not hardcode:
- team members
- project lists
- member skills
- education
- social links
- achievements
- testimonials

Static UI labels and default empty-state copy may be hardcoded.

## File uploads

Validate:
- MIME type
- extension
- size
- ownership/permission
- destination

Never trust the filename or MIME type alone.

Use object/media storage and save metadata in PostgreSQL.

## Error handling

User-facing errors should be actionable but not reveal internals.

Use structured server logs for:
- unexpected exceptions
- authorization failures where useful
- important administrative actions
- integration failures

Do not log:
- passwords
- session tokens
- raw authorization headers
- database URLs
- API keys

## Performance

Prefer:
- server-side data fetching for public pages where appropriate
- indexed slugs
- selective Prisma `select`
- pagination for admin lists
- optimized images
- caching/revalidation where safe

Avoid:
- fetching an entire database table for a small page
- N+1 queries
- sending admin-only fields to public clients
- unnecessary client-side state for server data

## Definition of done

A feature is not complete until:
- it works for the intended role
- unauthorized roles are rejected
- validation works
- loading/error/empty states exist
- tests cover important behavior
- TypeScript passes
- lint passes
- production build passes when relevant
- docs are updated if needed

## Codex-specific preference

When a task is broad, break it into verifiable milestones instead of generating the entire application blindly.

Do not invent product features unless they are clearly marked as optional.

When a technical choice has meaningful tradeoffs, prefer the simplest solution compatible with the requirements and document the decision.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
