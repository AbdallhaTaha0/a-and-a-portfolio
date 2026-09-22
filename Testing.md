# Testing

## Test layers

### Unit tests

Cover:
- validation schemas
- slug generation
- permission helpers
- formatting/utilities
- domain rules

### Integration tests

Cover:
- database operations
- ownership checks
- member CRUD
- project/member relationships
- publication behavior

### End-to-end tests

Cover critical user journeys.

Playwright browser tests live in `e2e/`. Install the browser once. With the local site
running, the default command runs read-only visitor checks:

```text
node ./node_modules/@playwright/test/cli.js install --only-shell chromium
npm run test:e2e
```

`E2E_BASE_URL` can select a different running origin, but signed-in tests require it
to exactly match the application's configured authentication origin. Public tests cover visitor
navigation, invite-only login UI, anonymous dashboard exclusion, unavailable public
slugs, and mobile overflow.

For the complete fixture suite, set `E2E_EXPECTED_DATABASE_HOST` to the direct hostname
of the isolated Neon test branch (not a URL or credential), then run:

```text
npm run test:e2e:fixtures
```

The runner rejects mismatched pooled/direct hosts, a non-empty application database,
or an occupied test-server port. It builds the app, starts it on localhost:3100,
creates four disposable database-backed sessions, runs all 23 browser scenarios, and
removes its exact fixtures afterward. These scenarios include Member publication and
ownership isolation, all five Member-owned portfolio sections, project
draft/publication/relationships/deletion, rejected invalid uploads, both administrators
editing public home content, a Member invitation, and a forged attempt to deactivate
the final administrator. If a process is
forcibly killed, inspect the branch for `e2e-`/`@example.invalid` fixtures before
rerunning. Never point this runner at production.

The fixture sessions bypass the external Google/GitHub provider screens; they test the
app's authenticated role and mutation flows, not provider OAuth callbacks. For a manual
provider review, do not commit session files: `.auth/` is ignored and its JSON files are
credentials. With Chrome installed, open each disposable role's login in Playwright,
complete OAuth manually, and close the recorder to save its session:

```text
node ./node_modules/@playwright/test/cli.js codegen --channel=chrome --save-storage=.auth/member-a.json http://localhost:3000/login
```

Repeat for `member-b`, `admin-a`, and `admin-b`. Create the `.auth` directory first.
Set `E2E_ROLE_TESTS=1` to run their read-only access checks; optionally set
`E2E_OTHER_MEMBER_ID` to the disposable second member's database ID for a direct
cross-member editor check. Refresh session files after they expire and remove them
when testing is finished. Never use a real user's session.

Further browser coverage remains for real OAuth callbacks, successful Blob-backed uploads,
individual project-relationship removal, and complete CRUD/negative paths for each
member-owned portfolio model. Existing unit and action tests cover many of those
authorization paths, but they do not replace production-like browser verification.

## Required authorization scenarios

1. Team Admin can create a member.
2. Team Admin can edit a member.
3. Team Admin can delete/deactivate a member.
4. Member can edit their own profile.
5. Member cannot edit another member's profile.
6. Member cannot delete another member's education.
7. Member cannot modify team settings.
8. Unauthenticated users cannot access admin mutations.
9. Inactive users cannot mutate content.
10. Public users can see only published public content.
11. Visitor can navigate the landing page, member list, and published member profiles without a session.
12. Visitor cannot register or create an account through either OAuth provider.
13. Two active TEAM_ADMIN users can independently manage home-page content.
14. Removing, deactivating, or demoting the final active TEAM_ADMIN is rejected atomically.
15. Promoting or inviting another TEAM_ADMIN is audited and unauthorized MEMBER attempts are rejected.
16. Active MEMBER with a Member profile lands on and accesses only their personal dashboard.
17. Active TEAM_ADMIN without a Member profile accesses the team dashboard but has no personal workspace.
18. Active TEAM_ADMIN with a Member profile accesses both dashboards and may have a published profile.
19. Promoting a MEMBER preserves their Member profile, slug, and content while granting team-dashboard access.
20. Demoting a TEAM_ADMIN with a Member profile removes team access but preserves their personal dashboard and content.
21. Active MEMBER without a Member relation receives a safe setup error and no privileged access.
22. An already authenticated user visiting `/login` is redirected to the dashboard allowed by their current role and Member relation.
23. Administrator Member edits re-read the target, reject injected ownership/account fields, and revalidate old and new public slugs.
24. Member-profile deletion requires exact confirmation, preserves the User and audit history, and cannot create an active MEMBER without a profile.
25. Removing the final active TEAM_ADMIN's optional Member profile does not delete or deactivate that administrator account.
26. TEAM_ADMIN can create, edit, order, feature, publish, unpublish, and delete team projects while MEMBER and unauthenticated callers are rejected.
27. Project publication rejects incomplete records and invalid date ranges, and project deletion requires the current trusted slug.
28. TEAM_ADMIN can assign, edit, and remove project members only after both referenced records are re-read; relationship fields cannot alter ownership or publication.
29. TEAM_ADMIN can manage the Technology dictionary and project assignments; in-use technologies cannot be deleted and relationship input cannot alter either referenced record.
30. TEAM_ADMIN can create, edit, order, and explicitly delete TeamAchievement records while MEMBER and unauthenticated callers are rejected.
31. TEAM_ADMIN can create, edit, publish, unpublish, order, and explicitly delete testimonials; public reads exclude drafts.
32. Only TEAM_ADMIN can read contact messages or change their status, and audit/log output excludes message bodies and contact details.
33. Only TEAM_ADMIN can view the read-only audit history, and metadata rendering ignores nested values that could contain unexpected private structures.
34. MEMBER can create, edit, and delete their own skills, certifications, achievements, personal projects, and social links.
35. Portfolio creates derive `memberId` from the authenticated session and ignore submitted ownership fields.
36. Portfolio updates and deletes constrain every target by both its record identifier and the authenticated Member identifier.
37. Personal-project publication rejects incomplete descriptions, invalid date ranges, and insecure external URLs.
38. Published Member profiles exclude draft personal projects and team contributions attached to unpublished Projects.
39. TEAM_ADMIN with a linked Member profile uses the same ownership-safe personal portfolio editors without gaining cross-member mutation access through them.
40. An authenticated member can preview their saved draft profile without publishing it or supplying a member identifier.
41. Member preview preserves nested publication rules for personal and team projects.
42. Account settings permit only the authenticated user's local display name to change; submitted email, role, status, and ownership fields are ignored.
43. Account settings return provider names only and never expose OAuth tokens, session tokens, or provider account identifiers.
44. The public contact form validates and length-limits input, silently absorbs honeypot submissions, rate-limits by client signal, and creates only team-directed messages.
45. TEAM_ADMIN can preview a saved draft Project by ID; MEMBER and unauthenticated users cannot access the preview, and the public slug remains unavailable until publication.
46. Repeated administrator invitations, role/status changes, and destructive removals share a per-administrator database-backed limit; over-limit or limiter-unavailable actions fail before mutation.

## Public-page tests

Verify:
- team page renders
- member page renders by slug
- project page renders by slug
- unpublished member is handled according to publication policy
- missing slug returns 404
- metadata is generated correctly
- public routes do not redirect visitors to login or create authentication sessions
- project lists and details exclude unpublished Projects
- unpublished and missing project slugs return the same not-found experience
- project metadata, contributors, technologies, external links, and related work contain only public fields
- landing-page member highlights include only published Members
- landing-page technologies come only from published Projects
- landing-page testimonials include only published records
- empty landing-page highlight collections omit their sections instead of rendering empty shells
- member portfolio pages hide empty sections and exclude draft personal projects
- member team-project cards include only published Projects and link to their public detail routes
- invalid or insecure member external links never become clickable public links
- draft-profile preview is protected and cannot be selected by a submitted member slug or ID

## Form tests

Every important admin form should test:
- required fields
- invalid URLs
- invalid email
- excessive length
- duplicate slug
- server-side validation
- successful mutation
- server error

## Upload tests

Test:
- valid image
- unsupported type
- oversized file
- MIME/extension mismatch
- spoofed file contents with a valid image extension
- unsafe image dimensions or decompression size
- unauthorized upload
- failed storage operation
- failed database attachment removes the just-uploaded object
- replaced or deleted media is removed only after all database references are gone

## Regression rule

Every security bug must receive a regression test before the fix is considered complete.
