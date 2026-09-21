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

## Public-page tests

Verify:
- team page renders
- member page renders by slug
- project page renders by slug
- unpublished member is handled according to publication policy
- missing slug returns 404
- metadata is generated correctly
- public routes do not redirect visitors to login or create authentication sessions

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
- unauthorized upload
- failed storage operation

## Regression rule

Every security bug must receive a regression test before the fix is considered complete.
