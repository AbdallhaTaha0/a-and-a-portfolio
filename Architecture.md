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

## Rendering

Public content should favor server rendering/caching where practical.

Admin pages can use interactive client components for forms, dialogs, tables, uploads, and previews.

Do not make the entire application a client-side SPA merely because some dashboard components are interactive.

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

Use a dedicated image/object-storage provider.

Recommended abstraction:

```text
uploadImage()
deleteImage()
getPublicUrl()
```

Do not spread provider-specific logic throughout UI components.

## Serverless considerations

Code must tolerate:
- short-lived execution
- multiple concurrent invocations
- cold starts
- connection management
- retries

Use Prisma in a server-safe singleton pattern appropriate to the deployment environment.

Do not create uncontrolled database clients per request.

## Environment variables

Examples:

```text
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
STORAGE_*=
EMAIL_*=
```

Only variables explicitly intended for browser use may use the `NEXT_PUBLIC_` prefix.

Never expose:
- database URLs
- private storage credentials
- authentication secrets
- email API keys
