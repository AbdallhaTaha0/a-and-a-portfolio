# Rules

These are non-negotiable rules for the Team Portfolio project.

## Product rules

1. The public team website represents the team and is accessible without authentication.
2. Every published member has a public profile page that visitors can navigate without authentication.
3. Visitors do not register, receive accounts, or become authenticated users; login is only for invited TEAM_ADMIN and MEMBER accounts.
4. Every member has an authenticated private dashboard.
5. The platform supports multiple TEAM_ADMIN users with the same documented team-management permissions.
6. A TEAM_ADMIN can create, edit, publish/unpublish, and remove members.
7. A TEAM_ADMIN can manage team-level content, including the home page, and team projects.
8. A MEMBER can create, edit, publish/unpublish, and remove only their own personal content.
9. A member must never be able to modify another member's data.
10. Public URLs use stable human-readable slugs.
11. Content must be database-driven; do not hardcode production content in React components.
12. Destructive actions require explicit confirmation.
13. Published and draft content must be treated separately where the feature requires it.
14. TEAM_ADMIN is a permission role, not a replacement for a Member profile. A TEAM_ADMIN may also own one Member profile and have a public member page.
15. An active MEMBER can access only their personal dashboard. An active TEAM_ADMIN can access the team dashboard and, when linked to a Member profile, their own personal dashboard.
16. Promoting a MEMBER to TEAM_ADMIN must preserve their Member profile and personal content unless a separate, explicitly confirmed action removes it.

## Authorization rules

Authorization is enforced on the server, never only in the UI.

Never trust:
- route parameters
- hidden form fields
- client-side role checks
- client-provided member IDs
- client-provided ownership claims

For a member-owned resource:
- TEAM_ADMIN may manage it according to the admin permissions.
- MEMBER may manage it only when the authenticated user's member ID owns the resource.
- Otherwise return a proper authorization error.

A hidden dashboard button is not security.

## Data rules

1. Use PostgreSQL.
2. Use Prisma as the ORM unless a documented decision changes this.
3. Use foreign keys and database constraints for relationships.
4. Use unique constraints for emails and public slugs where appropriate.
5. Never store plaintext passwords.
6. Never store image binaries in PostgreSQL.
7. Store uploaded-file metadata/URLs and use dedicated object/media storage.
8. Use timestamps consistently.
9. Prefer normalized relational data over JSON blobs for frequently queried entities.
10. Do not use comma-separated strings for skills, technologies, links, or relationships.
11. Use junction tables for many-to-many relationships.

## API/server rules

1. Validate all external input on the server.
2. Prefer typed schemas with Zod.
3. Never trust client-side validation.
4. Never expose database credentials to the browser.
5. Never use a privileged database credential in client-side code.
6. Return safe errors to users and detailed errors to server logs.
7. Do not leak stack traces, SQL errors, tokens, password hashes, or secrets.
8. Keep server-only modules clearly separated from client components.

## UI rules

1. Responsive design is required.
2. Admin dashboards must also work on mobile.
3. Every async operation needs loading, success, and error states.
4. Every collection needs an empty state.
5. Destructive actions need confirmation.
6. Forms need accessible labels and useful validation messages.
7. Do not expose admin controls on public pages.
8. Reuse shared components instead of duplicating UI.
9. Keep public profile URLs stable even when the display name changes.
10. Use semantic HTML and keyboard-accessible controls.

## SEO rules

Public member and project pages must have:
- unique title
- meta description
- canonical URL where appropriate
- Open Graph metadata
- useful social preview image where available

The site should provide:
- sitemap
- robots rules
- proper 404 handling

## Coding rules

1. TypeScript strict mode.
2. Avoid `any`; use explicit types.
3. Keep business logic out of presentational components.
4. Keep database access in server-only modules.
5. Prefer small, composable functions.
6. Do not duplicate authorization logic across random files; centralize it.
7. Do not add dependencies without a reason.
8. Do not rewrite working architecture just for style.
9. Update documentation when architecture or schema changes.
10. Never silently change requirements.

## Git rules

Use focused commits:
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

Never commit:
- `.env`
- credentials
- API keys
- production database URLs
- private uploaded assets that should be external storage

## Change discipline

Before changing the schema:
1. Check `Schema.md`.
2. Check affected application flows.
3. Decide whether the change is additive, breaking, or migration-only.
4. Update `Schema.md`.
5. Add/update migrations.
6. Update tests.

Before changing authentication/authorization:
1. Check `Security.md`.
2. Check `Agents.md`.
3. Add authorization tests.

If requirements are ambiguous, preserve existing behavior and ask only when the ambiguity can materially affect data integrity or security.
