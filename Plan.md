# Implementation Plan

## Required access flows

These product flows are locked requirements for every implementation phase:

1. An unauthenticated visitor can view the database-backed landing page, member list,
   published member profiles, published projects, and other public content. Visitors do
   not register and cannot obtain a visitor account. `/login` is only for invited team
   administrators and members.
2. The system supports multiple active TEAM_ADMIN accounts. Every active TEAM_ADMIN can
   manage home-page and team-level content. `AUTH_ADMIN_EMAIL` only creates the first
   administrator. The final active administrator cannot be demoted, deactivated, or
   removed.
3. An authenticated MEMBER can edit their own profile and owned portfolio records. The
   server derives ownership from the session and database; changing an ID or slug must
   never permit editing another member's data.
4. TEAM_ADMIN and Member-profile ownership are independent capabilities. An administrator
   may optionally have a public Member profile and personal workspace. Promoting a MEMBER
   grants the team dashboard while preserving their personal dashboard and content.

## Phase 0 — Project foundation

Goal: establish a clean deployable application.

Tasks:
- [x] Initialize Next.js + TypeScript
- [x] Configure strict TypeScript
- [x] Configure Tailwind/design system
- [x] Add ESLint/formatting
- [x] Configure environment variables
- [x] Create PostgreSQL database
- [x] Configure Prisma
- [x] Add initial migration
- [x] Create seed strategy
- [x] Verify local development
- [ ] Verify Vercel deployment pipeline

Deliverable:
A blank application that builds and deploys.

## Phase 1 — Database/domain foundation

Tasks:
- [x] Implement User
- [x] Implement Member
- [x] Implement Team
- [x] Implement Project
- [x] Implement ProjectMember
- [x] Implement skills/technologies
- [x] Implement education/experience
- [x] Implement certifications/achievements
- [x] Implement social links
- [x] Implement personal projects
- [x] Implement contact messages
- [x] Implement audit logs
- [x] Add indexes/constraints
- [x] Create seed data

Deliverable:
Complete relational foundation with migration and seed.

## Phase 2 — Authentication

Tasks:
- [x] Choose Auth.js with Google and GitHub OAuth
- [x] Login
- [x] Logout
- [x] Database-backed session handling
- [x] Password hashing not applicable — OAuth-only
- [x] Password reset not applicable — OAuth-only
- [x] Account activation/deactivation
- [x] Post-login routing for MEMBER, TEAM_ADMIN, and TEAM_ADMIN-with-profile
- [x] Role resolution
- [x] Server-side authorization helper foundation
- [x] Authentication policy tests
- [x] Dashboard access-matrix tests
- [x] No public registration or visitor-account flow
- [x] Invite-only OAuth gate for existing active accounts

Deliverable:
Secure TEAM_ADMIN and MEMBER authentication.

## Phase 3 — Public team website

Tasks:
- [ ] Global layout
- [x] Public landing page and navigation work without authentication
- [x] Landing-page content is database-backed and limited to public Team fields
- [x] Navigation
- [x] Hero
- [x] About
- [ ] Featured projects
- [ ] Projects listing
- [ ] Team members
- [ ] Technologies
- [ ] Achievements
- [x] Contact
- [x] Footer
- [ ] Responsive states
- [ ] SEO metadata
- [ ] sitemap
- [ ] robots
- [ ] 404

Deliverable:
Production-quality public team website.

## Phase 4 — Public projects

Tasks:
- [ ] Project detail page
- [ ] Project gallery
- [ ] Technologies
- [ ] Team members
- [ ] Roles/contributions
- [ ] GitHub/live links
- [ ] Status
- [ ] SEO/social metadata
- [ ] Related projects

Deliverable:
Complete public project experience.

## Phase 5 — Public member portfolios

Tasks:
- [x] Member listing
- [x] Member profile page
- [x] Published member list and profiles are navigable without authentication
- [x] Education
- [x] Experience
- [ ] Skills
- [ ] Certifications
- [ ] Achievements
- [ ] Personal projects
- [ ] Team projects/contributions
- [ ] Social links
- [x] Member SEO metadata
- [ ] Member contact

Deliverable:
Every published member has a complete public portfolio.

## Phase 6 — Team Admin dashboard

Tasks:
- [x] Dashboard overview
- [x] Team content editor
- [x] Member CRUD
- [x] Complete administrator Member editor with ordering and publication controls
- [x] Explicitly confirmed Member-profile deletion that retains the User and audit history
- [x] Member account management
- [x] Create/invite additional TEAM_ADMIN accounts
- [x] Promote, demote, activate, and deactivate administrators with audit logging
- [x] Prevent demotion or deactivation of the final active TEAM_ADMIN
- [ ] Prevent removal of the final active TEAM_ADMIN when account deletion is implemented
- [x] Allow an administrator to create or link their own Member profile
- [x] Preserve Member profile and content across promotion or demotion
- [x] Project CRUD
- [x] Project-member assignment
- [x] Technology management
- [x] Achievements
- [x] Testimonials
- [x] Contact messages
- [ ] Audit log view
- [ ] Preview
- [ ] Publication controls

Deliverable:
Multiple Team Admins can operate the platform without editing code.

## Phase 7 — Member dashboard

Tasks:
- [ ] Dashboard overview
- [x] Profile editor
- [x] Resolve the editable Member from the authenticated session, never request ownership
- [x] Education CRUD
- [x] Experience CRUD
- [ ] Skills CRUD
- [ ] Certifications CRUD
- [ ] Achievements CRUD
- [ ] Personal project CRUD
- [ ] Social links CRUD
- [ ] Preview
- [x] Publish/unpublish
- [ ] Account settings
- [ ] Reject cross-member reads and mutations after server-side ownership checks
- [x] Allow TEAM_ADMIN with a linked Member record to use their own personal workspace

Deliverable:
Each member can fully maintain their own public portfolio.

## Phase 8 — Media

Tasks:
- [ ] Select storage provider
- [ ] Upload abstraction
- [ ] Image validation
- [ ] Image optimization
- [ ] Profile image upload
- [ ] Project image upload
- [ ] Delete unused media safely

Deliverable:
Reliable image/file management.

## Phase 9 — Quality/security

Tasks:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E critical flows
- [ ] Authorization tests
- [ ] Rate limiting
- [ ] Security headers
- [ ] Error handling
- [ ] Accessibility review
- [ ] Mobile review
- [ ] Performance review

Deliverable:
Release candidate.

## Phase 10 — Deployment

Tasks:
- [ ] Production PostgreSQL
- [ ] Production environment variables
- [ ] Vercel project
- [ ] Domain
- [ ] Database migrations
- [ ] Storage configuration
- [ ] Email configuration
- [ ] Monitoring/logging
- [ ] Production smoke tests

Deliverable:
Production deployment.

## Phase 11 — Optional enhancements

Only after MVP is stable:
- [ ] Analytics
- [ ] Search
- [ ] Draft/version history
- [ ] Advanced audit UI
- [ ] Notifications
- [ ] Testimonials
- [ ] Advanced media library
- [ ] Multiple teams
- [ ] Custom member sections
- [ ] Internationalization
