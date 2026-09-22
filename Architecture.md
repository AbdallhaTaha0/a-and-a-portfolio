# Architecture

## Goal

Deploy the entire web application without a traditional always-running backend server.

Target:

`Next.js + TypeScript + PostgreSQL + Prisma + Vercel`

## Runtime model

Browser:
- renders public/admin UI
- submits forms
- never receives database credentials

Vercel:
- serves Next.js pages
- executes server-side route handlers/server actions
- performs authorization
- talks to PostgreSQL
- talks to object storage/email/other integrations

PostgreSQL:
- persistent source of truth

Object storage:
- images and uploaded files

## Recommended application layers

```text
src/
  app/
    (public)/
    (auth)/
    admin/
    api/
  components/
  features/
    team/
    members/
    projects/
    auth/
    contact/
  server/
    auth/
    db/
    permissions/
    services/
  lib/
    validation/
    utils/
  types/
```

Exact folder structure can adapt to the chosen Next.js conventions.

## Domain separation

Keep these concerns separate:

- UI components
- form schemas
- server actions/route handlers
- domain services
- Prisma/database access
- authorization
- external integrations

Example flow:

```text
Form
 ↓
Zod validation
 ↓
Server action / route handler
 ↓
Authentication
 ↓
Authorization
 ↓
Domain service
 ↓
Prisma
 ↓
PostgreSQL
```

## Public pages

Primary routes:

```text
/
 /projects
 /projects/[slug]
 /members
 /members/[slug]
 /contact
```

Optional nested personal-project URL:

`/members/[memberSlug]/projects/[projectSlug]`

Prefer global project URLs if projects can be promoted from personal to team projects later.

## Authentication

Authentication uses Auth.js with its Prisma adapter, database-backed sessions, and
Google and GitHub OAuth providers. There is no public registration. Existing active
users may sign in, and `AUTH_ADMIN_EMAIL` may bootstrap the first TEAM_ADMIN account.
Provider credentials and session secrets remain server-only.

`AUTH_ADMIN_EMAIL` is bootstrap configuration only; it does not designate a permanent
singleton administrator. The database may contain multiple active TEAM_ADMIN users.
Every active TEAM_ADMIN has access to the same documented team and home-page management
operations. Administrative account management must prevent removal, deactivation, or
demotion of the final active TEAM_ADMIN.

Routes may include:

```text
/login
```

Admin:

```text
/admin
/admin/team
/admin/projects
/admin/members
/admin/messages
/admin/settings
```

Member:

```text
/admin/profile
/admin/profile/education
/admin/profile/experience
/admin/profile/skills
/admin/profile/projects
/admin/profile/links
/admin/settings
```

A single authenticated application can render different navigation based on role.
Public routes do not read or require a session. `/login` is an invite-only team access
route, not visitor registration, and there is no public sign-up route.

Dashboard access is derived from both `User.role` and the optional `User.member` relation:

| Account state | Team dashboard | Personal dashboard | Public profile |
| --- | --- | --- | --- |
| Active MEMBER with Member profile | No | Own profile only | When published |
| Active TEAM_ADMIN without Member profile | Yes | No | None |
| Active TEAM_ADMIN with Member profile | Yes | Own profile | When published |
| Inactive User | No | No | Publication policy decides whether an existing profile remains visible |

After OAuth login, the server reloads the User and Member relation. TEAM_ADMIN lands on
`/admin`; MEMBER with a valid Member relation lands on `/admin/profile`. A MEMBER without
a Member relation receives a safe account-setup error rather than an empty or privileged
dashboard. Promotion from MEMBER to TEAM_ADMIN keeps the Member relation, so that user
gains team administration without losing their personal workspace or public profile.
An already authenticated active user who visits `/login` is routed through the same
capability resolution instead of being shown provider sign-in controls again.

`/admin/profile` is the member's personal workspace. Education and experience have
dedicated timeline editors; `/admin/profile/[section]` provides the shared editor for
skills, certifications, personal achievements, personal projects, and social links.
Every read starts with the Member resolved from the authenticated server session. Every
create writes that trusted `memberId`, while updates and deletes use a compound
`recordId + memberId` filter so submitted IDs cannot cross ownership boundaries. Inputs
are allowlisted and validated, URLs must use HTTPS, mutations are audited, and the
affected public profile is revalidated. Personal projects have independent draft and
published states and must contain both summary and full descriptions before publication.

Published member pages select only public profile fields. They hide empty sections,
exclude draft personal projects, sanitize external links, and include team-project roles
and contributions only when the related team Project is published. Team-project
participation remains controlled by TEAM_ADMIN; the member portfolio editor cannot
create or alter those relationships.

`/admin/profile/preview` is an authenticated, non-public rendering of the current
Member profile. It can render a draft Member, but applies the same nested publication
filters as the visitor page: draft PersonalProjects and contributions to unpublished
team Projects remain excluded. The preview route derives the Member ID from the session
and never accepts a member slug or ID from the browser.

`/admin/settings` is shared by active MEMBER and TEAM_ADMIN accounts. OAuth providers
remain authoritative for verified email and provider identity; role and active status
remain administrator-controlled. The user may change only the local dashboard display
name. The server action allowlists that field, constrains the update to the authenticated
active User, writes an audit event in the same transaction, and never returns Account
tokens or Session records to the page.

`/admin/members` is the protected account-entry point. A TEAM_ADMIN can pre-authorize
an exact email address as either MEMBER or TEAM_ADMIN. Creating a MEMBER also creates
its linked draft Member profile; creating a TEAM_ADMIN leaves the Member relation
optional. These operations do not send email—the invited person signs in through Google
or GitHub using the exact pre-authorized address. A TEAM_ADMIN without a Member relation
can create their own linked draft profile from the same page without changing roles.
The same page supports promotion, demotion, activation, and deactivation. Every change
revalidates the target from the database, revokes that account's sessions, and is
audited. A serializable transaction prevents concurrent changes from removing the final
active TEAM_ADMIN. Demotion never removes a Member profile or its owned content, and an
administrator without a Member profile cannot be demoted to an active MEMBER state.

The same protected area lists Member profiles in `teamOrder` and links to
`/admin/members/[memberId]`, where a TEAM_ADMIN can view and edit the complete Member
record, including publication state and editorial position. Updates re-read the target
inside the transaction, use an explicit field allowlist, audit the change, and revalidate
the public member list plus the old and new slug routes. Profile deletion requires the
current slug as explicit confirmation. It deletes only the Member and its owned child
content; the User account and AuditLog history remain. An active MEMBER account must be
deactivated before its required profile can be deleted. A TEAM_ADMIN profile remains an
optional capability, so deleting that profile never deletes or deactivates the
administrator account, including the final active administrator.

`/admin/team` is the protected editor for the single logical Team record identified by
the stable `a-and-a` slug. The server action re-authorizes TEAM_ADMIN access, allowlists
and validates editable fields, updates or creates that record atomically with an audit
log, and revalidates both the editor and public home page. The public home page selects
only the Team identity, description, contact, location, and social-link fields it renders;
it does not expose administrative or audit data. Optional empty fields are omitted from
the public interface.

`/projects` and `/projects/[slug]` are public, request-rendered views backed only by
Projects with `isPublished = true`. Public project reads use explicit field selections
and include ordered technologies, published Member contributors, roles, contributions,
gallery metadata, safe external links, and related published projects. Unpublished or
unknown slugs return the same not-found experience. Featured published projects also
appear on the home page. Existing administrator project mutations revalidate the home,
listing, old-slug, and new-slug routes as appropriate.

The public home page also composes bounded highlight queries for published Members,
Technologies attached to published Projects, ordered TeamAchievements, and published
Testimonials. Each query uses an explicit public-field selection and the page omits an
entire section when no eligible records exist. This keeps draft member and testimonial
content, technologies used only by draft projects, and administrative data out of the
visitor response while allowing dashboard-managed content to appear without code edits.

`/admin/projects` and `/admin/projects/[projectId]` provide TEAM_ADMIN Project CRUD.
Administrators can create drafts, edit the complete Project record, control project
status, featured/publication state, and editorial order, and explicitly confirm deletion
with the current slug. Mutations re-read existing targets inside the transaction, audit
the change atomically, and revalidate the project administration routes plus affected
public list, detail, and landing-page paths. Contributor assignment, technology
management, and gallery/media workflows remain separate concerns. Contributor
assignment is implemented on the project detail editor: administrators may add a Member,
edit their project role and contribution, or explicitly remove the relationship. The
server re-reads both referenced records, never treats participation as ownership, audits
every relationship change, and revalidates the affected administrative and public paths.

`/admin/projects/[projectId]/preview` is a TEAM_ADMIN-only rendering of saved Project
content, including drafts. It reuses the public project presentation, keeps the public
Member publication filter and related published-project rules, and never makes the
previewed Project available through `/projects/[slug]` unless it is independently
published.

`/admin/technologies` manages the reusable Technology dictionary, while project detail
editors manage ProjectTechnology assignments. Technology creation and editing allowlist
name, category, and an optional secure icon URL. Deletion requires exact-name
confirmation and is rejected while any ProjectTechnology relation exists, preserving the
restrictive shared-dictionary semantics in the database. Assignment and removal re-read
both sides of the relationship, are audited, and do not change project ownership.

`/admin/achievements` provides ordered TeamAchievement CRUD. These records are
team-controlled and remain separate from member-owned Achievement content. Administrators
may manage titles, descriptions, issuer/date metadata, secure reference and image URLs,
and editorial order. Updates and exact-title confirmed deletes re-read the target inside
the audited transaction and revalidate the dashboard and landing page.

`/admin/testimonials` provides draft/published Testimonial CRUD with editorial ordering.
Administrators manage attribution, content, optional secure avatar URLs, and publication
state. Updates and exact-name confirmed deletes re-read the target, audit atomically, and
revalidate the landing page so unpublished content remains outside public queries.

`/admin/messages` is a TEAM_ADMIN-only inbox for the latest contact submissions. It
selects message content only for the protected server-rendered view and supports
UNREAD/READ/ARCHIVED status transitions. Status mutations re-read the message and audit
only IDs and status metadata; private message bodies and contact details are never copied
into audit or operational logs.

The public landing-page contact form creates team-directed ContactMessage records. It
uses strict server-side validation, a visually hidden honeypot, and the shared
PostgreSQL-backed client-address rate limit. Failures return generic actionable copy and
operational logs never include the submitted name, email, subject, or message body.

`/admin/audit` is a read-only TEAM_ADMIN view of the latest 100 AuditLog records. It
selects only actor identity, action/entity references, timestamps, and recorded metadata.
The UI displays only scalar metadata values in a stable order and exposes no mutation or
deletion action.

## Rendering

Public content should favor server rendering/caching where practical.

Admin pages can use interactive client components for forms, dialogs, tables, uploads, and previews.

Do not make the entire application a client-side SPA merely because some dashboard components are interactive.

Public and dashboard route trees have branded error boundaries with retry actions and
safe copy. Public errors may display only Next.js's opaque digest as a support reference;
raw exception messages, database details, and integration responses remain server-side.

## Data fetching

Use server-side data access for database-backed content.

Use client-side state for:
- form state
- dialogs
- temporary UI state
- optimistic interactions where safe

Avoid duplicating server state into global client stores without a clear reason.

## Caching/revalidation

When published content changes:
- invalidate/revalidate the affected public page
- invalidate affected lists
- avoid globally clearing the cache for a small content update

## Images

Vercel Blob is the selected public image/object-storage provider. The server-side
abstraction owns upload, optimization, metadata persistence, and deletion; UI and domain
actions do not call the provider SDK directly.

Implemented abstraction:

```text
uploadImage()
deleteUploadedBlob()
deleteMediaIfUnreferenced()
```

Uploads are capped at 5 MB and accept JPEG, PNG, and WebP only. The server verifies MIME,
extension, and binary signature, then decodes with a 40-megapixel safety limit, enforces
dimensions between 32 and 12,000 pixels per side, rotates from orientation metadata,
strips source metadata, resizes without enlargement, and stores an immutable WebP object.
The 6 MB Server Action limit leaves room for multipart overhead.

Every upload is authorized against its destination before storage. The database then
attaches the Blob URL and creates the Media record in one transaction. A failed database
attachment deletes the newly uploaded object. Replacements, gallery deletions, project
deletions, personal-project deletions, and Member-profile deletions invoke reference-aware
cleanup; a Blob is deleted only when no supported content field still references its URL.
Original filenames are retained only as untrusted metadata and are never used as paths.

## Serverless considerations

Code must tolerate:
- short-lived execution
- multiple concurrent invocations
- cold starts
- connection management
- retries

Use Prisma in a server-safe singleton pattern appropriate to the deployment environment.

Do not create uncontrolled database clients per request.

Abuse-sensitive operations use PostgreSQL-backed fixed-window counters rather than
process memory. Counter keys contain a scope and an HMAC digest derived with
`AUTH_SECRET`, so raw client IP addresses are not persisted. OAuth initiation is limited
per provider and client address; media upload is limited per authenticated User.

## Environment variables

Examples:

```text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
BLOB_READ_WRITE_TOKEN=
EMAIL_*=
```

Only variables explicitly intended for browser use may use the `NEXT_PUBLIC_` prefix.

Never expose:
- database URLs
- private storage credentials
- authentication secrets
- email API keys

## Continuous integration

GitHub Actions installs from the lockfile, generates and validates Prisma, runs ESLint,
strict TypeScript, the automated suite, a high-severity production dependency audit, and
the production Next.js build. CI uses syntactically valid non-production placeholders;
it never receives production database, OAuth, storage, or authentication credentials.
Dependabot proposes reviewed npm and GitHub Actions updates on a bounded schedule.
