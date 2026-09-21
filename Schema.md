# Schema

## Database

Primary database: PostgreSQL.

ORM: Prisma.

The schema below describes the intended domain. Exact Prisma syntax can evolve during implementation, but relationships and ownership semantics must remain consistent.

## Implementation decisions

The initial Prisma implementation makes these deliberate refinements:

- Draft content fields that may be incomplete before publication, such as biography, descriptions, thumbnails, and team contact details, are nullable. Publication validation must reject incomplete public content.
- Manually ordered public collections use `sortOrder`.
- `Member.teamOrder` controls placement on the public team page.
- `Media.uploadedByUserId` is nullable so audit-friendly media metadata can remain after an uploader account is removed; the relation uses `SET NULL`.
- Member-owned child records cascade when their owning Member is deliberately removed. Shared Skill and Technology dictionaries use restrictive deletion behavior.
- Application traffic uses the pooled `DATABASE_URL`; Prisma migrations use the direct `DIRECT_URL`.
- Authentication uses Auth.js with Google and GitHub OAuth. `Account` stores provider links,
  and `Session` stores revocable server-side sessions; browser access uses Auth.js HTTP-only cookies.

## Identity and authorization

### User

Fields:
- `id`
- `email` — unique
- `name` nullable
- `emailVerified` nullable
- `image` nullable
- `role` — `TEAM_ADMIN | MEMBER`
- `isActive`
- `createdAt`
- `updatedAt`
- `lastLoginAt` nullable

Relationship:
- an active MEMBER user must have one Member profile before using the personal dashboard
- a TEAM_ADMIN may optionally have one Member profile and therefore a public member page
- any number of Users may hold TEAM_ADMIN; `role` is not unique
- one User may link multiple OAuth Accounts and hold multiple revocable Sessions

There is no Visitor user model. Public visitors remain unauthenticated. `AUTH_ADMIN_EMAIL`
only bootstraps the first TEAM_ADMIN and is not a uniqueness or single-admin constraint.

### Account

Auth.js provider identity record. A provider account is unique by:
`provider + providerAccountId`.

OAuth access, refresh, and ID tokens are server-only database fields and must never be
returned to browser components or logs.

### Session

Database-backed Auth.js session with a unique `sessionToken`, `userId`, and server-side
expiry. Deleting a User cascades to their sessions and provider accounts.

### VerificationToken

Auth.js-compatible one-time token record retained for adapter compatibility. OAuth is
the selected login method; local passwords and password reset are not implemented.

### Member

Fields:
- `id`
- `userId` — unique
- `slug` — unique
- `fullName`
- `headline`
- `bio`
- `profileImageUrl`
- `location` nullable
- `phone` nullable
- `publicEmail` nullable
- `isPublished`
- `teamOrder`
- `createdAt`
- `updatedAt`

Draft profile fields may remain nullable until publication validation succeeds.

Public route:
`/members/[slug]`

Ownership:
`Member.userId` identifies the member's authenticated owner.

Role changes do not change this ownership relation. Promoting a User from MEMBER to
TEAM_ADMIN preserves the Member record, public slug, and owned content. Demotion back to
MEMBER also preserves them. Profile deletion is a separate destructive operation.

## Member content

### Education

- `id`
- `memberId`
- `institution`
- `degree`
- `fieldOfStudy`
- `description`
- `startDate`
- `endDate` nullable
- `isCurrent`
- `createdAt`
- `updatedAt`
- `sortOrder`

One Member -> many Education records.

### Experience

- `id`
- `memberId`
- `company`
- `position`
- `description`
- `startDate`
- `endDate` nullable
- `isCurrent`
- `createdAt`
- `updatedAt`
- `sortOrder`

### Skill

Reusable skill dictionary:
- `id`
- `name`
- `category` nullable
- `createdAt`
- `updatedAt`

### MemberSkill

- `memberId`
- `skillId`
- `proficiency` nullable
- `sortOrder`

Composite uniqueness:
`memberId + skillId`

### Certification

- `id`
- `memberId`
- `name`
- `issuer`
- `description`
- `issueDate`
- `expirationDate` nullable
- `credentialUrl` nullable
- `createdAt`
- `updatedAt`
- `sortOrder`

### Achievement

- `id`
- `memberId`
- `title`
- `description`
- `issuer` nullable
- `date` nullable
- `url` nullable
- `imageUrl` nullable
- `createdAt`
- `updatedAt`
- `sortOrder`

### SocialLink

- `id`
- `memberId`
- `platform`
- `url`
- `sortOrder`
- `createdAt`
- `updatedAt`

### PersonalProject

- `id`
- `memberId`
- `title`
- `slug`
- `shortDescription`
- `description`
- `thumbnailUrl`
- `githubUrl` nullable
- `liveUrl` nullable
- `startDate` nullable
- `endDate` nullable
- `isFeatured`
- `isPublished`
- `sortOrder`
- `createdAt`
- `updatedAt`

Recommended uniqueness:
`memberId + slug`

## Team

### Team

There is one logical team for this application.

Fields:
- `id`
- `name`
- `slug`
- `logoUrl`
- `description`
- `shortDescription`
- `contactEmail`
- `location`
- `githubUrl` nullable
- `linkedinUrl` nullable
- `createdAt`
- `updatedAt`

### Project

Team project:
- `id`
- `title`
- `slug`
- `shortDescription`
- `description`
- `thumbnailUrl`
- `githubUrl` nullable
- `liveUrl` nullable
- `status` — `PLANNING | IN_PROGRESS | COMPLETED | ARCHIVED`
- `startDate` nullable
- `endDate` nullable
- `isFeatured`
- `isPublished`
- `createdAt`
- `updatedAt`
- `sortOrder`

`slug` unique globally.

### ProjectMember

Many-to-many:
- `projectId`
- `memberId`
- `role` nullable
- `contribution` nullable

Composite primary/unique key:
`projectId + memberId`

### Technology

Reusable technology dictionary:
- `id`
- `name`
- `iconUrl` nullable
- `category` nullable

### ProjectTechnology

- `projectId`
- `technologyId`

Composite unique:
`projectId + technologyId`

### ProjectImage

- `id`
- `projectId`
- `url`
- `altText`
- `sortOrder`
- `createdAt`

### TeamAchievement

- `id`
- `title`
- `description`
- `issuer` nullable
- `date` nullable
- `imageUrl` nullable
- `url` nullable
- `createdAt`
- `updatedAt`
- `sortOrder`

### Testimonial

- `id`
- `name`
- `role` nullable
- `company` nullable
- `content`
- `avatarUrl` nullable
- `isPublished`
- `createdAt`
- `updatedAt`
- `sortOrder`

## Communication

### ContactMessage

- `id`
- `name`
- `email`
- `subject`
- `message`
- `memberId` nullable
- `status` — `UNREAD | READ | ARCHIVED`
- `createdAt`

`memberId = null` means the message is for the team.

## Auditing

### AuditLog

- `id`
- `userId` nullable
- `action`
- `entityType`
- `entityId` nullable
- `metadata` JSON nullable
- `createdAt`

Do not use audit logs as the source of truth for current application state.

## Media

If external object storage is used:

### Media

- `id`
- `uploadedByUserId` nullable
- `url`
- `storageKey`
- `filename`
- `mimeType`
- `size`
- `createdAt`

The database stores metadata, not binary file contents.

## Indexing

At minimum index:
- `User.email`
- `Member.slug`
- `Member.userId`
- `Education.memberId`
- `Experience.memberId`
- `MemberSkill.memberId`
- `SocialLink.memberId`
- `PersonalProject.memberId`
- `PersonalProject.slug` as appropriate
- `Project.slug`
- `ProjectMember.memberId`
- `ProjectMember.projectId`
- `ContactMessage.memberId`
- `ContactMessage.status`
- `AuditLog.userId`
- `AuditLog.entityType + entityId`

## Delete behavior

Default preference:
- Use cascading deletes for truly owned child content when deletion is intentional and safe.
- Avoid cascading deletion across important shared entities.
- Do not physically delete audit records merely because the source entity was removed unless there is a deliberate retention policy.

Before implementing deletion semantics, verify the exact Prisma relation configuration.
