# Content

## Public team landing page

Recommended sections:

1. Navigation
2. Hero
3. About team
4. Team statistics
5. Featured projects
6. All/selected projects
7. Team members
8. Technologies
9. Achievements
10. Testimonials (optional)
11. Contact
12. Footer

The exact visual design is not prescribed by this document.

## Public project page

A project page can contain:
- title
- short description
- full description
- thumbnail
- gallery
- technologies
- team members
- member roles/contributions
- GitHub URL
- live URL
- project status
- dates
- features
- challenges
- solutions

If `features`, `challenges`, and `solutions` become structured content, model them explicitly rather than storing arbitrary JSON without a reason.

## Public member page

Recommended order:

1. Profile hero
2. About
3. Skills/technologies
4. Experience
5. Education
6. Certifications
7. Achievements
8. Personal projects
9. Team projects/contributions
10. Social links
11. Contact
12. Footer

Not every member needs every section. Empty sections should be hidden publicly.

## Member profile ownership

A member controls:
- basic profile content
- education
- experience
- skills
- certifications
- achievements
- personal projects
- social links

The Team Admin controls:
- whether the member exists
- account activation
- member placement/order on the team page
- team-level role/title if this is considered team metadata
- publication policy where defined

A TEAM_ADMIN may also be a member. When the same User has a linked Member record, they
retain the same personal-profile ownership capabilities as any other member and may have
a published `/members/[slug]` page. Team administration and personal profile ownership
remain separate concerns in the UI and authorization layer.

## Team/member distinction

A member's:
- team role
- participation in team projects
- visibility on the team page

are team-level concerns.

A member's:
- personal project
- personal education
- personal experience
- personal links

are member-level concerns.

## Content ordering

For manually ordered sections, use `sortOrder`.

Do not use creation date as the only ordering mechanism when the admin needs editorial control.

## Publication

Where supported, use:
- Draft
- Published
- Unpublished/Archived

Public pages must only show content allowed by publication rules.

For the initial member-profile workflow, publication requires a non-empty full name,
professional headline, and biography. Location, public contact email, and portrait are
optional. A member may save an incomplete draft at any time. The stable member slug is
not automatically changed when the display name changes.

For the initial team-project workflow, publication requires a title, short description,
full description, and secure HTTPS thumbnail URL. GitHub/live URLs and dates are optional.
Drafts may remain incomplete, and the stable project slug changes only through an
explicit administrator edit.

## Accessibility

Images require meaningful alt text when informative.

Decorative images should use appropriate decorative semantics.

Forms require:
- labels
- keyboard access
- visible focus
- useful validation
- accessible error messages
