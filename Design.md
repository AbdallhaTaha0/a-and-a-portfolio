# Design System

## Purpose

This document is the visual source of truth for the Team Portfolio platform. It translates the existing `logo.png` into a coherent, accessible, and production-ready interface for:

- the public team website
- project and member portfolio pages
- the TEAM_ADMIN dashboard
- each MEMBER dashboard

The design should feel creative, energetic, and technically confident without sacrificing readability or dashboard usability.

## Brand concept

### Core idea: Dual Energy

The A&A logo is split between white and orange, held together by expressive black brushwork. The website extends that idea into a living visual system:

- **Orange** represents energy, ambition, action, and experimentation.
- **White** represents clarity, craft, focus, and openness.
- **Near-black** provides the canvas that allows both halves to remain visible and creates continuity with the logo's outline.

The public experience should feel like two energies moving through the same space. Motion follows the visitor's cursor as a soft orange field and a restrained white field. They may overlap, stretch, and lag slightly behind one another, but they must never distract from the content.

The style is not a generic orange gradient theme. It preserves the logo's hand-painted personality through controlled irregularity, bold scale, subtle texture, and confident contrast.

### Brand attributes

- bold
- collaborative
- modern
- energetic
- human
- technically precise

### Design principles

1. **Let the logo lead.** Orange, white, black, and brush-inspired details define the identity.
2. **Motion supports meaning.** Movement responds to interaction and guides attention; it is not decoration for its own sake.
3. **Content stays readable.** The animated background never compromises contrast or competes with text.
4. **Public pages may be expressive; dashboards must be calm.** Administration interfaces use the same brand language with much less ambient motion.
5. **Use asymmetry deliberately.** Offset layouts and split compositions should feel balanced, not random.
6. **Prefer a few strong moments.** Avoid filling every section with gradients, glow, glass, or animation.

## Logo usage

The canonical source asset is `logo.png` in the repository root.

### Placement

- Show the complete logo in the public header and footer.
- Use a compact derived mark only when space is constrained, such as a favicon or collapsed mobile header.
- Keep clear space around the logo equal to at least one quarter of the logo's displayed width.
- Do not place text, buttons, or animated particles over the logo.

### Background

The logo is strongest against a near-black or very dark charcoal surface because both its white and orange halves remain visible.

The current source image appears on a light canvas. During implementation, create an optimized transparent-background derivative for dark surfaces while preserving the original file. Do not destructively edit or replace `logo.png`.

### Restrictions

- do not recolor the orange or white halves
- do not remove the black brush outline
- do not stretch, skew, rotate, or apply heavy glow to the logo
- do not use the logo as a repeated background pattern
- do not animate the logo continuously

A short, one-time reveal animation is acceptable on the home hero if it respects reduced-motion preferences.

## Color system

The following values are the initial implementation tokens. The orange is chosen to closely match the provided logo and should be verified against the optimized production logo before launch.

```css
:root {
  --brand-orange: #ffb800;
  --brand-orange-bright: #ffc83d;
  --brand-orange-deep: #d97706;

  --brand-white: #ffffff;
  --brand-ink: #080808;
  --brand-black: #000000;

  --surface-0: #080808;
  --surface-1: #101010;
  --surface-2: #181818;
  --surface-3: #232323;

  --text-primary: #ffffff;
  --text-secondary: #c9c9c9;
  --text-muted: #929292;
  --border-subtle: rgba(255, 255, 255, 0.12);

  --success: #2fd181;
  --warning: #ffb800;
  --error: #ff5a5f;
  --info: #6ba8ff;
}
```

### Usage ratios

On public pages, use approximately:

- 65% near-black and charcoal surfaces
- 20% white text, space, and light fields
- 10% orange emphasis and motion
- 5% semantic or supporting colors

Orange is the primary action color. It should not be used for every icon, heading, and border. White remains the dominant text color on dark surfaces.

### Light surfaces

White sections may be used as deliberate pauses between dark sections. On a light surface:

- text uses `--brand-ink`
- orange remains the action and emphasis color
- black brush-like dividers may appear sparingly
- cursor lighting becomes subtler so the background does not wash out content

### Contrast

All text and interactive controls must meet WCAG 2.2 AA contrast requirements. Never place white text directly over the brightest white cursor field or orange text over the brightest orange field without an opaque or sufficiently dark content surface.

## Typography

### Font families

- **Display and headings:** Space Grotesk
- **Body and interface:** Inter
- **Code or technical labels:** JetBrains Mono, only where the content is genuinely technical

Load fonts through `next/font` where available to avoid layout shift and unnecessary third-party requests.

### Type scale

```text
Hero display:  clamp(3rem, 8vw, 7.5rem), 700, line-height 0.92
Display:       clamp(2.5rem, 6vw, 5rem), 700, line-height 1.0
Heading 1:     clamp(2rem, 4vw, 3.5rem), 650-700
Heading 2:     clamp(1.5rem, 3vw, 2.5rem), 650
Heading 3:     1.25rem-1.5rem, 600
Body large:    1.125rem, line-height 1.7
Body:          1rem, line-height 1.65
Label:         0.75rem-0.875rem, 600, slight letter spacing
```

Headlines may use short orange highlights, outlined words, or split white/orange treatment. Do not split long passages into multiple colors.

## Layout and spacing

### Grid

- maximum public-content width: `1280px`
- reading-content width: `720px`
- desktop grid: 12 columns
- tablet grid: 8 columns
- mobile grid: 4 columns
- desktop side padding: `32px-64px`
- mobile side padding: `20px`

### Spacing scale

Use a 4px base with an 8px primary rhythm:

```text
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

Public pages use generous vertical spacing. Dashboard pages use a denser rhythm while preserving touch targets and clear grouping.

### Shape language

- standard radius: `12px`
- cards and media: `20px`
- feature panels: `28px`
- pills and status chips: fully rounded
- brush-accent shapes: irregular, used only as decorative masks or separators

Avoid making every container a rounded card. Use open layouts, thin dividers, and spacing to group content before adding another surface.

## Cursor-reactive background

### Visual behavior

The signature background consists of two independently moving fields:

1. an orange radial glow close to the pointer
2. a softer white glow that follows with a small delay and wider radius

The two fields should feel connected but not perfectly synchronized. The orange field reacts slightly faster; the white field trails with gentle spring motion. A faint grain layer may add the tactile character seen in the logo's brush strokes.

Recommended dark-background composition:

```css
background:
  radial-gradient(
    circle 360px at var(--pointer-x) var(--pointer-y),
    rgba(255, 184, 0, 0.20),
    transparent 70%
  ),
  radial-gradient(
    circle 520px at var(--trail-x) var(--trail-y),
    rgba(255, 255, 255, 0.10),
    transparent 72%
  ),
  #080808;
```

These values are starting points, not permission to reduce text contrast. Final opacity must be tested behind real content.

### Implementation rules

- Store pointer coordinates in CSS custom properties.
- Update animation coordinates through one `requestAnimationFrame` loop.
- Smooth the trailing light using interpolation rather than starting a new CSS animation on every pointer event.
- Keep the animated layer fixed, non-interactive, and behind page content.
- Prefer CSS gradients over a large canvas or WebGL implementation unless testing proves CSS insufficient.
- Do not trigger React rendering on every pointer movement.
- Pause animation when the page is hidden.
- Never attach separate pointer listeners to every section.

### Touch, keyboard, and reduced motion

- On touch devices, replace pointer tracking with a slow, low-amplitude ambient drift or a static composition.
- For `prefers-reduced-motion: reduce`, disable tracking and render a static orange-and-white background.
- The design must remain complete when motion is disabled.
- Keyboard focus must not depend on the cursor lighting effect.

### Performance target

- maintain smooth interaction on a typical mid-range mobile device
- avoid layout and paint work caused by pointer movement where possible
- animate only transform, opacity, or CSS custom properties used by the isolated background layer
- stop nonessential animation outside the viewport

## Texture and graphic language

The logo has expressive brush edges. Extend this through subtle details rather than literal repetition:

- low-opacity monochrome grain
- short brush-stroke underlines beneath selected headings
- occasional rough-edged masks at major section transitions
- thin orange-to-white directional lines suggesting collaboration and movement

Do not use distressed textures behind body copy. Grain stays below 4% opacity and must not create visible flicker.

Use line icons with consistent stroke width. Icons are white or muted by default and orange in active or emphasized states.

## Components

### Navigation

- dark translucent header with a subtle blur after scrolling
- complete logo on desktop; compact mark on mobile
- white navigation text with orange active indication
- one primary orange call-to-action
- visible keyboard focus ring
- mobile navigation opens as an accessible dialog or sheet

### Buttons

**Primary**

- orange fill
- near-black text
- clear hover lift and brightness change
- minimum 44px target height

**Secondary**

- transparent or dark surface
- white text
- subtle white border
- orange border or glow on hover

**Ghost**

- no permanent container
- white or muted text
- orange directional icon or underline on hover

Destructive dashboard buttons use the semantic error color, not brand orange.

### Cards

- dark tonal surface rather than transparent glass over busy animation
- 1px subtle border or a restrained ambient shadow, not both at full strength
- optional orange edge accent for featured content
- hover motion limited to a 2-4px lift and small border/color transition
- entire card becomes a link only when semantics and keyboard behavior remain correct

### Forms

- persistent visible labels
- dark input surface with white text
- muted placeholder text that still meets contrast requirements
- orange focus ring supplemented by shape or outline, not color alone
- errors shown next to the affected field with actionable copy
- loading, success, error, and disabled states for every submission

### Tables and dashboard lists

- use calm solid surfaces without the cursor glow directly beneath dense data
- prioritize spacing and subtle row dividers over zebra striping
- convert complex mobile tables into labeled cards when horizontal scrolling would harm usability
- use semantic status colors; do not reuse orange for every state

### Tags and technology chips

- compact rounded shape
- charcoal base with white text
- orange accent only for selected or featured items
- preserve readable text instead of relying on technology logos alone

## Public-page direction

### Home

The home hero is the strongest expression of Dual Energy:

- large team statement with selective orange emphasis
- logo visible but not larger than the primary message
- cursor-reactive background active across the hero
- primary action to view projects
- secondary action to meet the team
- compact proof points or team statistics below the fold

The remaining sections follow the order in `Content.md`. Alternate between immersive dark sections and occasional light pauses. Featured work leads visually; decorative motion reduces as content density increases.

### Projects listing and detail

- editorial project grid with varied but controlled card spans
- prominent thumbnails with consistent aspect ratios
- clear status, technologies, and participating members
- project detail hero uses the thumbnail as a supporting element, not an illegible text background
- galleries support keyboard navigation and meaningful alt text
- GitHub and live-site links are clearly labeled external actions

### Members listing and profile

- member portraits are treated consistently and never color-shifted by the background glow
- cards show name, headline, and a restrained skill preview
- profile pages emphasize the individual while retaining the shared A&A system
- education, experience, skills, certifications, achievements, and projects use one coherent timeline/card language
- omit empty public sections

### Contact

- concise form on a calm dark surface
- clear team contact expectation and response messaging
- no distracting cursor effect directly beneath active form fields

## Dashboard direction

Dashboards share the brand but prioritize clarity and speed:

- persistent dark navigation
- mostly solid neutral surfaces
- orange reserved for primary actions, focus, and active navigation
- ambient background effect reduced to a faint static corner glow
- no continuous cursor-follow animation behind forms, tables, dialogs, or destructive confirmations
- role and publication state are always visible where relevant
- previews accurately represent the public design

TEAM_ADMIN and MEMBER dashboards may use the same shell, but navigation and actions reflect server-authorized permissions. Visual differences are not security boundaries.

## Motion system

### Timing

```text
Micro interaction: 120-180ms
Button/card transition: 180-240ms
Panel/dialog entrance: 240-320ms
Section reveal: 400-600ms
Ambient background: continuous, slow, and low amplitude
```

Use natural easing such as `cubic-bezier(0.22, 1, 0.36, 1)` for entrances. Avoid elastic or bouncy motion in administration workflows.

### Rules

- reveal content once; do not repeatedly animate it when scrolling back and forth
- use opacity and transform for entrances
- keep hover effects available to pointer users without hiding information from touch users
- do not animate large blur radii aggressively
- never animate form validation messages in a way that delays understanding
- disable or simplify nonessential motion under reduced-motion preferences

## Imagery

- use real team and project media managed through the dashboards
- use a consistent crop and aspect ratio per component type
- preserve natural skin tones and original project colors
- do not apply the orange overlay to every image
- use a subtle warm treatment only when it improves cohesion
- every informative image requires meaningful alt text

Decorative assets must not replace real content and should not be stored as hardcoded production content in components.

## Responsive behavior

### Mobile

- stack split layouts into a clear reading order
- keep the strongest message and one primary action visible early
- replace cursor tracking with static or ambient background light
- use edge-to-edge media selectively
- keep all touch targets at least 44px
- avoid horizontal page scrolling

### Tablet

- reduce grid complexity and large display sizes
- preserve asymmetric compositions only when they remain readable
- collapse dashboard navigation into an accessible drawer when necessary

### Desktop

- use the full 12-column system
- allow controlled overlap between media and decorative fields
- keep text columns within readable measures even when the canvas is wide

## Accessibility requirements

- meet WCAG 2.2 AA contrast for text and controls
- support keyboard navigation for every interactive element
- provide highly visible focus states
- preserve semantic heading order
- use semantic HTML before ARIA
- provide form labels and accessible error relationships
- never communicate status through color alone
- support zoom to 200% without loss of content or function
- honor reduced-motion and system color preferences where practical
- test the animated background for contrast throughout its full range of movement

## SEO and social presentation

Public member and project pages use the same visual identity in metadata images:

- near-black background
- logo or compact mark in a safe corner
- white primary title
- orange category or accent
- project/member image when available
- enough padding for social-platform cropping

Do not generate a single generic preview for every page when page-specific content is available.

## Implementation checklist

- [x] Implement component styling with Tailwind utility classes; keep `globals.css` limited to the Tailwind import
- [ ] Create optimized transparent and responsive derivatives from `logo.png` while preserving the source
- [ ] Define color, typography, spacing, radius, shadow, and motion tokens centrally
- [ ] Load fonts through `next/font`
- [ ] Build the static visual hierarchy before adding background motion
- [ ] Implement the cursor layer without pointer-driven React rerenders
- [ ] Add touch and reduced-motion fallbacks
- [ ] Verify contrast at the brightest animated-background positions
- [ ] Test public navigation, cards, forms, galleries, and focus order with keyboard only
- [ ] Test mobile layouts and mid-range-device animation performance
- [ ] Keep dashboard surfaces calm and data-focused
- [ ] Confirm every public section uses database-driven content
- [ ] Capture page-specific social preview images where supported

## Design acceptance criteria

The visual implementation is complete only when:

- the site is recognizably derived from the provided A&A logo
- orange and white are balanced rather than applied indiscriminately
- the cursor-reactive background is smooth, subtle, and optional
- content remains readable at every pointer position
- public pages feel expressive while dashboards remain efficient
- mobile, keyboard, touch, and reduced-motion experiences are complete
- no production member, project, skill, education, achievement, testimonial, or social-link content is hardcoded into the UI
