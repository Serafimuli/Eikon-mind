# Eikon Mind Design and UI Guide

This guide documents the visual system implemented in frontend/src/app/globals.css and the shared React components. It describes the current Eikon Mind website and account experience; it is not a generic marketing template.

## Design principles

- Use a warm, calm editorial presentation appropriate to a psychotherapy practice.
- Keep the public experience approachable while making account, staff, and security actions unambiguous.
- Preserve Romanian and English parity: locale changes text and date presentation, not information architecture or access control.
- Favor clear hierarchy, generous whitespace, high-contrast controls, and visible focus behavior over decoration.
- Treat motion and media as optional enhancements. Theme and music preferences require user action and remain client-side preferences.

## Tokens

The CSS custom properties in globals.css are the source of truth. Use them rather than introducing one-off colors or fonts.

| Role | Light value | Dark behavior |
| --- | --- | --- |
| Primary action | #9f4d32 | Changes to #e6a086 |
| Primary action, active | #7f3a27 | Changes to #f2b49e |
| Canvas | #faf9f5 | Changes to #181715 |
| Soft/card surfaces | #f5f0e8 and #efe9de | Change to dark surface variants |
| Ink/body text | #141413 and #3d3d3a | Change to warm light text |
| Dark surface | #181715 | Remains the deepest interface surface |
| Borders | #e6dfd8 and #ebe6df | Change to dark border variants |
| Semantic states | success #2f6f3e, warning #7a5b00, error #a52a2a | Use the corresponding dark-theme values |

The light theme is the initial presentation. Adding the dark class to the root element switches the token set and color-scheme. Do not hard-code a light color where a token has a dark-mode equivalent.

## Typography, spacing, and imagery

- Display type uses Cormorant Garamond, with EB Garamond and Georgia fallbacks.
- Interface and body type use Inter with system sans-serif fallbacks.
- Technical or machine-readable content uses JetBrains Mono.
- All fonts are bundled under frontend/public/assets/fonts; do not add a remote font dependency for existing roles.
- The shared content width is 1200px. Section spacing is 96px on desktop, 64px at tablet widths, and 48px on mobile.
- The public site uses practice photographs and brand assets from frontend/public/assets. Reuse the optimized public assets and provide meaningful image alternatives through the content model.

## Responsive behavior

| Viewport | Implemented behavior |
| --- | --- |
| Above 1024px | Full navigation and multi-column public layouts. |
| 768px to 1024px | Reduced section spacing and layouts that contract before stacking. |
| Below 768px | Mobile navigation, stacked sections, and a focus-contained menu that makes background content inert while open. |
| Below 460px | Additional wordmark, control, and layout adjustments for narrow phones. |

Use the existing mobile-first component classes and media queries. Do not make desktop controls smaller to fit a mobile layout; stack or reflow them instead. Respect the reduced-motion media preference.

## Shared interface patterns

### Navigation

Public pages use SiteHeader and PublicFooter. The header provides:

- the Eikon Mind mark and wordmark;
- public navigation with an accessible services submenu;
- locale switching between Romanian and English;
- account access, a booking call to action, and theme toggle;
- a responsive menu with Escape handling, focus containment, inert background content, and focus restoration.

PrivateHeader uses the same shell for authenticated areas. Its navigation changes by role: clients see booking and appointments, staff see the Calendar-oriented appointment area, and administrators also see staff management.

### Actions, forms, and feedback

Use the established button, input, form-card, status, and error patterns. Primary actions use the primary token; destructive account actions use the dedicated danger treatment. Form labels, validation feedback, keyboard focus, and status messages must remain explicit in both locales.

Authentication, profile, booking, TOTP, Calendar, and account-deletion components are security-sensitive. Prefer existing shared components and server actions over new client-side state machines.

### Public content

Public page copy is owned by frontend/src/lib/site-content.ts and rendered by PublicContent. It supplies home content, services, practitioner information, contact details, legal pages, and static route parameters for both locales. Protected interface copy belongs in frontend/src/lib/protected-content.ts.

Keep public content, image selection, image alternatives, canonical metadata, and locale pairs synchronized. The site intentionally has no public therapy-testimonial section.

## Preferences and accessibility

- The theme toggle stores eikon-theme in local storage only after a user choice.
- Background music is off by default. Its opt-in preference is stored as eikon-music-enabled and playback is controlled by a visible, labeled floating button.
- Back-to-top, music, locale, navigation, and theme controls must retain keyboard operation and useful accessible names.
- Client, staff, and API access checks are server-side. UI visibility is never the authorization boundary.
- Private responses use no-store behavior; avoid adding browser caches or analytics that expose account or appointment state.

## Change checklist

Before changing UI code, confirm that the work:

1. Uses existing tokens, fonts, component patterns, and content ownership.
2. Works in both locales and at the implemented breakpoints.
3. Retains keyboard navigation, focus visibility, mobile-menu behavior, and reduced-motion support.
4. Does not expose appointment, authentication, or personal data in client-only state, images, analytics, or logs.
5. Is covered by the relevant unit or Playwright accessibility and responsive tests.
