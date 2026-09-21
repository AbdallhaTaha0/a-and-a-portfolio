# Architecture Decisions

## ADR-001 — Serverless deployment

Decision:
Deploy the application on Vercel using Next.js server-side capabilities rather than maintaining a separate always-running Node.js server.

Reason:
The project is primarily CRUD/content management and does not require a permanently running process.

## ADR-002 — PostgreSQL

Decision:
Use PostgreSQL as the source of truth.

Reason:
The data is relational:
- users -> members
- members -> education/experience
- projects <-> members
- projects <-> technologies

## ADR-003 — Prisma

Decision:
Use Prisma as the database ORM.

Reason:
Typed database access, migrations, relations, and good TypeScript integration.

## ADR-004 — Single authentication system

Decision:
Use one authentication system with role-based authorization.

Reason:
TEAM_ADMIN and MEMBER share identity/session infrastructure while having different permissions.

## ADR-005 — Server-side authorization

Decision:
Authorization is enforced on the server.

Reason:
Client-side role checks can be bypassed.

## ADR-006 — Database-driven content

Decision:
Production content is stored in PostgreSQL.

Reason:
The Team Admin and Member Admin must be able to modify content without code deployments.

## ADR-007 — External object storage

Decision:
Store images/files outside PostgreSQL.

Reason:
Better storage semantics, CDN delivery, image optimization, and database efficiency.

## ADR-008 — Slug-based public URLs

Decision:
Use readable slugs for members and projects.

Reason:
Human-friendly URLs and better SEO.

## ADR-009 — One team initially

Decision:
Model one logical team now rather than building multi-tenancy.

Reason:
The current requirement is a single team. The domain should not be unnecessarily complicated.

If multi-team support becomes a real requirement, revisit this decision before implementation.

## ADR-010 — Avoid premature CMS abstraction

Decision:
Model real domain entities instead of creating a generic block-based CMS initially.

Reason:
A generic page builder would add substantial complexity without being required by the current product.

## ADR-011 — Member profile deletion is not account deletion

Decision:
Administrator Member CRUD deletes only the Member profile and its owned content. It
retains the owning User, provider identities, and audit history. An active MEMBER account
must be deactivated before its required profile can be deleted; a TEAM_ADMIN may retain
administrator access without a profile.

Reason:
Role, account access, and public-profile ownership are separate capabilities. Keeping
their destructive operations separate prevents an editorial action from unexpectedly
removing login access or the final active administrator, while retaining the audit trail
needed to explain the deletion.
