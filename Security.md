# Security

## Scope

This document defines the production security requirements for the Team Portfolio platform described in `Rules.md`, `Architecture.md`, `Schema.md`, `Content.md`, `API.md`, and `Testing.md`.

The application has three security surfaces:

1. public team, project, and member pages
2. a TEAM_ADMIN dashboard
3. a MEMBER dashboard where each member manages only their own portfolio content

The application is a single-team, serverless Next.js application deployed on Vercel. PostgreSQL is the source of truth, Prisma is the ORM, and uploaded media is stored in external object storage.

The most important security rule is:

> A MEMBER must never be able to read, create, update, publish, unpublish, or delete another member's private or member-owned content.

Security controls must be enforced on the server. Hiding a button or route in the browser is not authorization.

## Security principles

- deny access when authentication, account state, role, or ownership is uncertain
- authenticate, authorize, and validate every protected operation on the server
- derive identity and ownership from the authenticated session and database
- expose only the minimum data required by each page or operation
- keep secrets, database access, and privileged integrations out of client bundles
- use maintained libraries for authentication and cryptography
- record important administrative and security-sensitive actions
- require explicit confirmation before destructive actions

## Roles and permissions

### TEAM_ADMIN

A TEAM_ADMIN can:

- manage the single team's settings and public content
- create, edit, publish, unpublish, deactivate, and remove members
- manage member accounts and account status
- manage team projects, technologies, project members, roles, and contributions
- manage team achievements and testimonials
- view and manage team contact messages
- view appropriate audit information
- invite and manage additional TEAM_ADMIN accounts according to the administrative account policy
- manage their own personal profile when their User is linked to a Member record

The application supports multiple TEAM_ADMIN users. `AUTH_ADMIN_EMAIL` is used only to
bootstrap the first administrator. It does not grant special permanent privileges after
bootstrap, and authorization must never compare the current email to that environment
variable. A transaction must reject any action that would leave the system with zero
active TEAM_ADMIN accounts. Role and account-status changes revoke affected sessions and
create an AuditLog entry.

A TEAM_ADMIN operation must still pass authentication, active-account, validation, and resource-existence checks. Administrator access is not a reason to skip validation or auditing.

### MEMBER

A MEMBER can:

- view their own private dashboard
- edit their own Member profile
- manage their own Education, Experience, MemberSkill, Certification, Achievement, SocialLink, and PersonalProject records
- publish or unpublish their own profile and personal projects only when the final publication policy allows it
- manage permitted account settings

A MEMBER cannot:

- access another member's private dashboard data
- modify another Member or any content owned by another member
- change `userId`, `memberId`, role, or ownership fields
- activate or deactivate accounts
- create or delete TEAM_ADMIN accounts
- modify team settings or team-level achievements
- create or modify team Project records
- assign themselves or another member to a team Project
- manage team ContactMessage records
- alter AuditLog records

Role and profile ownership are separate capabilities. `role = TEAM_ADMIN` grants team
administration. A linked `Member.userId` grants ownership of that personal profile. An
administrator with a Member record has both capabilities; an administrator without one
has only team administration. A normal MEMBER never gains team-dashboard access merely
because their account is active.

Promotion from MEMBER to TEAM_ADMIN and demotion back to MEMBER must preserve the linked
Member record and owned content. Role changes require fresh server-side authorization,
session revocation, and audit logging. Removing a public/personal profile is a separate
destructive operation and must never be an automatic side effect of changing roles.

Account invitations are database pre-authorization records, not public registration.
Only an authenticated active TEAM_ADMIN may create them. The server controls the new
role, normalizes the invited email, validates any public slug, creates related records
atomically, and writes an audit record. Invitation forms cannot supply ownership IDs.

### Account status

Every protected request must confirm that the current `User` exists and `isActive` is true. A deactivated account must be rejected even if its cookie has not yet expired.

Deactivation, password reset, and role changes must revoke existing sessions as soon as the selected authentication system permits. These actions must be written to the audit log.

## Authentication

Use one maintained authentication system for TEAM_ADMIN and MEMBER accounts. It must support the deployed Next.js and Vercel runtime. Do not create custom session signing, encryption, or password comparison code when the authentication framework already provides it.

The selected implementation is Auth.js with its Prisma adapter, database sessions,
and Google and GitHub OAuth. Public registration is disabled. Existing active users
may sign in, while the normalized `AUTH_ADMIN_EMAIL` value may bootstrap only the
first TEAM_ADMIN account. OAuth accounts sharing an allowlisted email may be linked
across the configured providers; no uninvited email may create an account.

Visitors never receive a User record or visitor session. Public pages must remain usable
without authentication. Displaying a team sign-in link does not create a public login
entitlement; an OAuth identity without an existing active account is denied.

For every protected request, the server must:

1. read and verify the authenticated session
2. resolve the current `User` from trusted session data
3. confirm that the account is active
4. resolve the role and related `Member` record from the database
5. continue to authorization only after those checks succeed

Post-login routing must follow the resolved capabilities: TEAM_ADMIN routes to the team
dashboard; MEMBER routes to their own profile dashboard; TEAM_ADMIN with a Member link
may navigate to both. MEMBER without a Member link is denied with an account-setup error.

Client-provided role, email, `userId`, or `memberId` values are never proof of identity.

### Session cookies and tokens

Browser sessions must use cookies set by the server. Authentication session tokens, access tokens, refresh tokens, password-reset tokens, and email-verification tokens must never be stored in:

- `localStorage`
- `sessionStorage`
- IndexedDB
- JavaScript-readable cookies
- React state or another client-side store
- URL query parameters or fragments, except a short-lived one-time token in an emailed reset link
- analytics, browser logs, or error-reporting metadata

Production session cookies must be configured with:

- `HttpOnly`
- `Secure`
- `SameSite=Lax` by default, or `SameSite=Strict` when compatible with the login flow
- the narrowest practical `Path`
- no broad `Domain` attribute unless a documented cross-subdomain requirement is introduced
- an explicit lifetime that matches server-side session expiry
- the `__Host-` prefix when supported by the authentication framework

`SameSite=None` is prohibited unless a documented cross-site authentication flow requires it. If used, it must include `Secure` and explicit CSRF protection.

Sessions must:

- use cryptographically secure, unpredictable identifiers or framework-issued encrypted/signed values
- expire on the server, not only in the browser
- rotate after login, password changes, password resets, and role changes
- be invalidated on logout
- support revoking all sessions after account compromise or an administrator action
- avoid exposing tokens to Client Components

### Passwords and account recovery

Local password authentication and password recovery are not part of the selected
OAuth-only implementation. The requirements below apply only if local passwords are
introduced later.

If this project uses local passwords:

- hash passwords with Argon2id using reviewed production parameters; bcrypt is acceptable only when required by the selected authentication framework and configured with an appropriate work factor
- let the password library generate a unique salt for every password
- never store encrypted or plaintext passwords
- never log passwords or include password hashes in normal user queries
- allow long passphrases and never silently truncate them
- rate-limit login and recovery attempts
- use generic recovery responses that do not reveal whether an email exists

Password-reset tokens must be cryptographically random, short-lived, single-use, and stored only as hashes when persisted. Token consumption must be atomic. A successful password reset must invalidate existing sessions.

Reset links must be built from the configured `NEXT_PUBLIC_APP_URL`, never from an untrusted request `Host` header. In production, `NEXT_PUBLIC_APP_URL` must use the canonical HTTPS origin.

TEAM_ADMIN multi-factor authentication should be enabled when the chosen authentication provider supports it. It becomes a release requirement before the dashboard manages high-value credentials or sensitive integrations.

## Authorization and ownership

Every protected read and mutation must follow this order:

```text
Authenticate
-> confirm active account
-> check role
-> load the target resource
-> verify ownership from the database
-> validate allowed input
-> mutate
-> audit when required
-> revalidate affected pages
```

For MEMBER operations, derive the current member through `User -> Member`. Do not ask the browser to submit a `memberId` for ownership.

When loading an owned record, prefer a query constrained by both its ID and the authenticated member's ID. For example, an Education update must locate a record belonging to the current member, not load any Education record and trust a hidden field.

Never trust:

- route parameters
- slugs or database IDs
- hidden form fields
- client-side role checks
- client-provided ownership claims
- the fact that an admin control is not visible

Use `401 Unauthorized` when authentication is missing or invalid and `403 Forbidden` when an authenticated user lacks permission. Public lookups and cross-owner resource lookups may return `404 Not Found` when that avoids disclosing whether a private resource exists.

### Ownership map

The following records are member-owned through `memberId`:

- Education
- Experience
- MemberSkill
- Certification
- Achievement
- SocialLink
- PersonalProject

The Member profile is owned through `Member.userId`.

The following are team-controlled and cannot be modified by a MEMBER:

- Team
- Project
- ProjectMember
- Technology and ProjectTechnology
- ProjectImage for team projects
- TeamAchievement
- Testimonial
- team-directed ContactMessage records
- AuditLog

Project participation is not ownership. Being listed in `ProjectMember` does not grant a MEMBER permission to edit the team Project.

Only TEAM_ADMIN may create, update, or remove ProjectMember relationships. Assignment
mutations must re-read both the Project and Member from the database, allowlist only role
and contribution metadata, and audit the composite relationship. A Member's assignment
never expands their authorization beyond their existing personal-profile ownership.

### Mass-assignment protection

Use explicit allowlists when creating Prisma `data` objects. Never spread a raw request body into a Prisma create or update call.

MEMBER input schemas must reject or discard protected fields, including:

- `id`
- `userId`
- `memberId`
- `role`
- `isActive`
- team project membership fields
- audit fields
- fields reserved for TEAM_ADMIN publication policy

TEAM_ADMIN input must also use an allowlist. Administrative permission does not make arbitrary database fields safe to update.

## Public content and data exposure

Public pages and public API responses must return only published content and public fields.

At minimum:

- `/members` and `/members/[slug]` show only members allowed by publication rules
- `/projects` and `/projects/[slug]` show only published projects
- unpublished PersonalProject records never appear publicly
- empty member sections are hidden rather than populated with private or placeholder database data
- public responses do not expose `passwordHash`, account status details, private email, phone, internal IDs, audit metadata, or other admin-only fields
- contact messages are never public

Use narrow Prisma `select` objects for public queries. Do not fetch a broad administrative object and remove sensitive properties afterward.

Stable slugs must be normalized and validated. Database uniqueness constraints remain the final collision protection. If slug history or redirects are later introduced, they require their own authorization and validation design.

## Validation and safe output

Validate every external input on the server with typed schemas such as Zod. Client-side validation may repeat these rules for usability but cannot replace server validation.

Validate:

- required and optional strings, including maximum lengths
- emails
- absolute URLs and allowed protocols
- dates and valid date ranges
- IDs and slugs
- enum values such as roles, project status, and contact status
- pagination, sorting, and filters
- uploaded files and upload metadata
- publication-state transitions

Reject unexpected fields for protected operations. Apply request-size limits before expensive parsing.

Use Prisma parameterization. If raw SQL is ever necessary, it must be parameterized and reviewed. Never concatenate untrusted input into SQL.

React's escaped rendering is the default for all member, project, testimonial, and contact content. Do not use `dangerouslySetInnerHTML` for user-generated content. If rich text is added later, update the content model and sanitize it server-side using a strict allowlist before rendering.

Redirect targets must be relative application paths or match an explicit origin allowlist. Never redirect to an arbitrary user-provided URL.

## CSRF and cross-origin requests

All state-changing requests, including Server Actions and Route Handlers, must use the selected authentication framework's recommended CSRF protection.

In addition:

- use SameSite session cookies as defense in depth
- never mutate state through `GET`
- verify `Origin` against `NEXT_PUBLIC_APP_URL` for sensitive custom Route Handlers where the framework does not already provide equivalent protection
- use an unpredictable CSRF token when required by the framework or transport
- do not rely on CORS as CSRF protection

The application does not currently require a public cross-origin API. Credentialed CORS should therefore remain disabled. If this requirement changes, document and allowlist exact trusted origins; never use a wildcard with credentials.

## Browser and transport protection

Production traffic must use HTTPS. Vercel and the canonical domain must redirect HTTP to HTTPS.

Configure security headers centrally in the Next.js application:

- `Strict-Transport-Security` after HTTPS works on every intended hostname
- `Content-Security-Policy` restricted to this application and explicitly required services
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin` or stricter
- `Permissions-Policy` disabling capabilities the portfolio does not use
- CSP `frame-ancestors 'none'` unless embedding becomes an explicit requirement

Avoid CSP `unsafe-eval`. Avoid `unsafe-inline` by using the supported Next.js nonce or hash approach where required. Add storage, analytics, or image-provider origins individually rather than using broad wildcards.

Verify headers on deployed public pages, admin pages, redirects, 404 pages, and error responses. Production must not expose development overlays, stack traces, internal filesystem paths, SQL errors, or sensitive source maps.

## Rate limiting and abuse prevention

Vercel functions may run on multiple instances, so rate limits must use a shared serverless-compatible store rather than process memory.

Rate-limit at minimum:

- login
- forgot-password and reset-password
- contact form submission
- file upload initiation and completion
- expensive public search if search is later implemented
- repeated destructive or bulk administrative operations

Use a combination of route, account or normalized email where appropriate, and IP-derived signal. Do not permanently block legitimate users using only an IP address. Authentication failures should use progressive delay or temporary lockout and generic messages.

The contact form should use validation, rate limiting, and a honeypot. Add a CAPTCHA-like challenge only if actual abuse warrants the usability and privacy tradeoff.

## File uploads and object storage

Profile images, project images, achievement images, and other media must use external object storage. PostgreSQL stores only metadata and URLs.

Before issuing upload credentials or accepting upload metadata, the server must authenticate the user and verify that they can modify the destination entity.

Validate:

- allowed extension
- actual file signature/content type, not only browser-provided MIME type
- maximum file size
- image dimensions and decompression limits
- destination and ownership

Upload requirements:

- generate storage keys and safe filenames on the server
- never use the original filename as a trusted path
- prevent path traversal and accidental overwrite
- use short-lived, narrowly scoped signed upload URLs for direct uploads
- verify the stored object before publishing its URL
- remove privacy-sensitive metadata such as EXIF when appropriate
- serve content with the correct type and `nosniff`
- reject executable and active-content formats
- reject SVG and HTML unless a documented sanitizer and isolated delivery policy are introduced
- delete replaced or abandoned objects without allowing one user to delete another user's media

Media deletion must consider all database references before deleting the underlying object.

## Contact messages

Contact form input is untrusted and must be length-limited, validated, escaped on output, and rate-limited.

Team-directed messages (`memberId = null`) are visible only to TEAM_ADMIN. If member-directed contact is implemented, the authorization policy must be documented before exposing messages to a MEMBER. Until then, MEMBER accounts must not read ContactMessage records.

Do not place contact-message bodies in routine logs, analytics, notification subjects, or URLs. Email notifications must escape untrusted content and link back to an authenticated dashboard rather than containing unnecessary private content.

## Database and Prisma

- PostgreSQL connections must use TLS in production
- development, preview, and production must use separate databases and credentials
- the application database user receives only required privileges
- all schema changes use reviewed Prisma migrations
- destructive development migration commands must never target production
- unique constraints, foreign keys, and ownership relationships must be enforced in the database
- multi-record changes that must succeed together use transactions
- owned-child cascade behavior must match `Schema.md` and be reviewed before migration
- shared dictionary records such as Skill and Technology must not be accidentally cascade-deleted with one member or project
- audit records must follow a deliberate retention policy
- backups must be encrypted and restoration must be tested

Production data must not be copied into development or preview environments unless access is authorized and personal data is anonymized.

## Secrets and environments

Use the variables described by `.env.example`:

- `DATABASE_URL` is server-only
- `AUTH_SECRET` is server-only and must be long, random, and unique per environment
- `AUTH_GOOGLE_SECRET` and `AUTH_GITHUB_SECRET` are server-only
- `AUTH_ADMIN_EMAIL` is server-side bootstrap configuration and must not be client-controlled
- `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` are server-only
- `EMAIL_API_KEY` is server-only
- `NEXT_PUBLIC_APP_URL` is intentionally public and must contain only the canonical application origin

Only deliberately public configuration may use the `NEXT_PUBLIC_` prefix. Any value with this prefix must be assumed visible to every visitor.

Real secrets must be stored in Vercel environment settings or another managed secret store, never committed to the repository. Use separate values for local development, preview deployments, and production. Preview deployments must not use production data or storage by default.

Rotate an affected secret immediately after suspected exposure. Rotation procedures must state which sessions, API credentials, or deployments must also be revoked or restarted.

## Logging, auditing, and errors

Use structured server logs with a request ID or correlation ID.

Operational logs may include:

- request ID
- route template
- status code
- duration
- internal error code
- authenticated user ID when needed for investigation

Never log:

- passwords or password hashes
- session, access, refresh, reset, or verification tokens
- cookies or raw authorization headers
- database URLs or API keys
- full request bodies by default
- contact-message content or other private content unless explicitly required and access-controlled

Create AuditLog records for:

- member creation, deactivation, reactivation, and removal
- role changes
- team-setting changes
- team project creation, publication changes, and deletion
- member or project ownership-related changes
- destructive administrative actions
- important authentication, upload, and integration security events

Audit metadata must not contain secrets. MEMBER accounts cannot edit or delete audit records.

User-facing errors must be actionable but must not reveal stack traces, SQL errors, storage keys, provider responses, or resource existence across an authorization boundary. Unexpected errors should receive a safe internal reference ID that can be matched to restricted server logs.

## Destructive actions

Deleting or deactivating a member, deleting a project, removing media, and other destructive operations require explicit user confirmation.

The confirmation UI is a safety control, not authorization. The server must repeat authentication, role, ownership, and validation checks when the confirmed request is submitted.

Before deleting a member or project, resolve affected relations and media. Do not silently delete shared Skill or Technology records. Preserve AuditLog records according to retention policy.

Administrator Member deletion means profile deletion, not User-account deletion. The
server requires the current public slug as confirmation, re-reads the Member and owning
User inside the transaction, and deletes only the Member after authorization. An active
MEMBER must first be deactivated through the separate account-status action. The User,
provider identities, and AuditLog history remain, and deleting an optional TEAM_ADMIN
profile must never remove or deactivate that administrator.

## Dependency, CI, and deployment security

- commit and use the package-manager lockfile
- pin supported Node.js and package-manager versions where practical
- review every new dependency and avoid unnecessary packages
- scan dependencies in CI and address applicable vulnerabilities
- use automated dependency updates with code review and tests
- run lint, strict TypeScript checks, tests, and a production build before deployment
- ensure server-only modules cannot enter Client Component bundles
- scan build output and CI logs for leaked secrets
- grant CI and Vercel integrations the minimum required permissions
- require review for changes to authentication, permissions, schema, migrations, uploads, and deployment configuration

Preview deployments must be treated as externally reachable. They require authentication for private areas, non-production secrets, and non-production data.

## Required security tests

The automated suite must include all scenarios required by `Testing.md` plus the following security cases:

1. unauthenticated users cannot access any admin mutation
2. inactive users cannot access protected reads or mutations
3. TEAM_ADMIN can perform documented team and member operations
4. MEMBER can read and modify their own profile and owned records
5. MEMBER cannot read or modify a second member's profile or records, even by changing IDs or slugs
6. MEMBER cannot modify Team, Project, ProjectMember, role, account status, or ownership fields
7. mass-assignment attempts are rejected or safely ignored according to the input schema
8. public users see only published members, projects, and personal projects
9. public responses exclude private and administrative fields
10. CSRF protection rejects invalid state-changing requests where applicable
11. login, recovery, contact, and upload limits work across application instances
12. reset tokens expire, are single-use, and cannot be replayed concurrently
13. upload validation rejects unsupported, oversized, mismatched, and unauthorized files
14. stored and reflected XSS payloads render as inert text
15. deactivation, password reset, and role changes invalidate existing access as designed
16. missing slugs and unauthorized cross-owner lookups do not leak private resource existence

Every security bug must receive a regression test before the fix is complete.

Before production release, manually test with five identities:

- unauthenticated visitor
- MEMBER A
- MEMBER B
- TEAM_ADMIN A
- TEAM_ADMIN B

Attempt cross-member access by changing actual IDs and slugs, not only by checking whether dashboard buttons are hidden.

## Production release checklist

### Authentication and sessions

- [ ] A maintained authentication system is configured for the production Next.js runtime
- [ ] Authentication credentials are stored only in secure, HTTP-only cookies
- [ ] No bearer, session, or reset token is stored in browser storage
- [ ] Production cookies use `HttpOnly`, `Secure`, and an appropriate `SameSite` value
- [ ] Session expiry, rotation, logout, and revocation are tested
- [ ] Password hashing and reset-token handling meet this document
- [ ] Login and recovery responses do not reveal whether an account exists
- [ ] Deactivated accounts lose protected access

### Authorization and content

- [ ] TEAM_ADMIN permissions match this document
- [ ] MEMBER ownership is derived from the authenticated User and database
- [ ] Cross-member read and mutation tests pass for every member-owned model
- [ ] Project participation does not grant team-project editing permission
- [ ] Mass-assignment cannot change ownership, role, or account state
- [ ] Public queries return only published content and public fields
- [ ] Contact messages and audit records are not exposed publicly or to MEMBER accounts
- [ ] Destructive actions require confirmation and repeat server authorization

### Application protection

- [ ] Server-side Zod validation covers every external input
- [ ] CSRF protection is enabled and tested
- [ ] Credentialed CORS is disabled unless exact origins are documented
- [ ] HTTPS and the required security headers are verified on the deployed site
- [ ] User content cannot execute as HTML or script
- [ ] Redirects accept only trusted destinations
- [ ] Production errors do not expose internals

### Data, uploads, and infrastructure

- [ ] Production, preview, and development use separate databases and secrets
- [ ] PostgreSQL uses TLS, least-privilege credentials, constraints, and reviewed migrations
- [ ] Backups are encrypted and a restore has been tested
- [ ] Uploads enforce ownership, file signature, extension, size, dimensions, and safe storage keys
- [ ] Direct-upload URLs are short-lived and narrowly scoped
- [ ] Shared serverless rate limiting protects login, recovery, contact, and uploads
- [ ] Retention and deletion rules exist for contact messages, audit logs, accounts, and media

### Operations

- [ ] Required administrative actions create safe AuditLog records
- [ ] Logs and analytics contain no credentials, tokens, or unnecessary private content
- [ ] Alerts exist for repeated authentication failures, privilege changes, elevated authorization failures, and critical integration failures
- [ ] Dependency scanning, tests, type checking, linting, and the production build pass
- [ ] Credential-rotation, incident-response, database-restore, and deployment-rollback procedures are documented
- [ ] The four-identity manual authorization review passes on a production-like deployment

Production release is blocked when an applicable checklist item is incomplete unless the project owner explicitly documents and accepts the risk.
