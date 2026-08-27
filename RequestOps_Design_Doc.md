# RequestOps — Design Doc (Student-Facing Portal)

**Inspiration:** Halo Lab's "Lingoro" education platform dashboard (dribbble.com/halolab)
**Scope:** The student-facing trigger only — intake form, submission confirmation, status lookup.
**Explicitly out of scope:** The coordinator's approval interface. That lives inside Notion by design — the track's rules forbid a parallel dashboard from becoming the real human interface (it would fail the delete-the-repo and backend-off tests). This doc only covers the *front door* students walk through before their request reaches Notion.

---

## 1. Design Rationale

Halo Lab's education-dashboard work reads as: calm, spacious, confident. Soft lavender neutrals instead of stark white, one strong violet accent doing all the emphasis work, big rounded cards, and typography that's friendly without being childish. That tone fits RequestOps well — this is a form students fill out somewhat anxiously (asking permission for something), so the interface should feel reassuring and effortless, not bureaucratic.

We're borrowing the **visual language** (palette, type, spacing, card treatment), not the literal dashboard layout — our actual product surface is a short form and two result states, not a multi-panel analytics screen.

---

## 2. Visual Identity

### 2.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `bg-canvas` | `#F6F4FC` | Page background — soft lavender-white, not stark white |
| `surface-card` | `#FFFFFF` | Card backgrounds |
| `accent-primary` | `#6C4DF6` | Primary buttons, active states, links |
| `accent-primary-hover` | `#5A3CE0` | Hover/pressed state |
| `accent-soft` | `#EDE8FD` | Tinted backgrounds for icons, badges, subtle highlights |
| `text-heading` | `#1B1730` | Headings — near-black with a violet undertone, not pure black |
| `text-body` | `#5B5770` | Body copy, secondary text |
| `text-muted` | `#9793AC` | Placeholder text, captions, timestamps |
| `success` | `#2FBF71` | Approved state |
| `success-soft` | `#E6F9EF` | Approved badge background |
| `warning` | `#F5A524` | Pending state |
| `warning-soft` | `#FEF3E0` | Pending badge background |
| `danger` | `#EF4444` | Rejected state, validation errors |
| `danger-soft` | `#FDEAEA` | Rejected badge background |
| `border-subtle` | `#E7E4F3` | Card borders, dividers |

### 2.2 Typography

- **Typeface:** Manrope or Plus Jakarta Sans (either reads as "friendly SaaS," matching Halo Lab's type choices). Fallback stack: `'Manrope', 'Inter', system-ui, sans-serif`.
- **Scale:**

| Role | Size | Weight | Line height |
|---|---|---|---|
| Page title (H1) | 32px | 700 | 1.2 |
| Section heading (H2) | 20px | 700 | 1.3 |
| Card title | 16px | 600 | 1.4 |
| Body | 14px | 400 | 1.6 |
| Caption / meta | 12px | 500 | 1.5 |
| Button label | 14px | 600 | 1 |

### 2.3 Spacing Scale
`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64` (px). Card internal padding: 24px. Section gaps: 32–48px.

### 2.4 Corner Radius
- Cards: `20px`
- Buttons / inputs: `12px`
- Badges / pills: `999px` (fully rounded)
- Small icon containers: `14px`

### 2.5 Elevation
- `shadow-card`: `0 4px 24px rgba(27, 23, 48, 0.06)` — soft, diffuse, no hard edges. This is the single most recognizable Halo Lab signature: shadows are barely-there, used for depth rather than drama.
- `shadow-button-hover`: `0 6px 16px rgba(108, 77, 246, 0.28)` — a tinted shadow matching the accent color, used only on the primary button's hover state.

---

## 3. Components

### 3.1 Buttons
- **Primary**: solid `accent-primary` fill, white text, 12px radius, 12px vertical / 24px horizontal padding. On hover: darken to `accent-primary-hover` + `shadow-button-hover`.
- **Secondary**: white fill, 1.5px `border-subtle` border, `text-heading` label. Used for "back" / "edit" actions.
- **Disabled**: `accent-soft` fill, `text-muted` label, no shadow, `not-allowed` cursor.

### 3.2 Inputs
- White background, 1.5px `border-subtle`, 12px radius, 12px padding.
- Focus state: border becomes `accent-primary`, plus a 3px `accent-soft` outer glow (no harsh blue browser default).
- Label sits above the field, 12px, `text-muted`, medium weight, 6px gap before the input.
- Error state: border becomes `danger`, helper text below in `danger`, 12px.

### 3.3 Cards
- White surface, `shadow-card`, 20px radius, 24px padding, 1px `border-subtle` (very light, mostly for definition on white-on-lavender).

### 3.4 Status Badge (mirrors the three Notion states)
Pill-shaped, 12px text, medium weight, 6px vertical / 12px horizontal padding, small dot indicator to the left.

| State | Background | Text | Dot |
|---|---|---|---|
| Pending | `warning-soft` | `warning` (darkened for contrast) | `warning` |
| Approved | `success-soft` | `success` (darkened) | `success` |
| Rejected | `danger-soft` | `danger` (darkened) | `danger` |

### 3.5 Icon Treatment
Icons sit inside a soft tinted rounded-square container (`accent-soft` background, 14px radius, icon itself in `accent-primary`), never floating bare on the page — this is a consistent Halo Lab move that makes even a simple line icon feel designed.

---

## 4. Page Specs

### 4.1 Intake Form (the Trigger)
**Layout:** Centered single card, max-width 520px, vertically centered on the `bg-canvas` background. No sidebar, no nav — this is a single-purpose page, not a dashboard.

- Small eyebrow label above the title: "EVENT PERMISSION REQUEST" — 12px, uppercase, `accent-primary`, letter-spacing 0.05em.
- H1: "Request permission for your event" — 32px, `text-heading`.
- One-line subtext in `text-body`: "Fill this in once — you'll get an email the moment it's decided."
- Form fields, in order: Student Name, Email, Club/Department, Event Name, Event Date (native date picker styled to match), Venue, Details (textarea, 4 rows, placeholder: "Optional — write freely if the fields above don't capture everything").
- Primary button, full width: "Submit request" with a small paper-plane icon.
- Footer microcopy, `text-muted`, 12px: "Powered by RequestOps · Candor Compiler"

### 4.2 Submission Confirmation (post-submit state)
Same centered-card layout, content swaps to:
- Large icon: checkmark inside an `accent-soft` circle, 64px.
- H2: "Request submitted"
- Body: "We'll email **{email}** as soon as a decision is made. Your reference ID is **{requestId}**."
- Status badge: Pending (see 3.4), shown centered below the text.
- Secondary button: "Submit another request" (resets the form).

### 4.3 Status Lookup Page (optional, v1.1)
A simple `/status/:requestId` page a student can bookmark:
- Same card shell.
- Shows event name, submission date, and the current status badge.
- If Rejected: shows the coordinator's reason in a `danger-soft` callout box below the badge.
- If Approved: shows a small success callout with the event date/venue restated for confirmation.

---

## 5. Keeping Notion Visually Consistent

Even though Notion is the operational hub and isn't restyled, a few lightweight touches make it feel like part of the same product rather than a bolted-on spreadsheet:

- **Page cover** on the "Requests" and "Run Log" databases: a simple flat-color banner in `accent-primary` (Notion supports solid-color covers natively — no image asset needed).
- **Icons**: use Notion's built-in emoji icons consistently — 📥 for Requests, 📗 for Run Log — matching the icons already used in the pitch deck's pipeline diagram.
- **Select field colors**: map Notion's built-in select colors to the same semantic meaning as the web badges — `Pending` → yellow, `Approved` → green, `Rejected` → red. Notion's color picker won't hit your exact hex values, but keeping the same hue mapping keeps the mental model consistent for the coordinator.

---

## 6. Responsive Behavior

- **Breakpoint:** single column at all sizes — this form never needs a multi-column layout.
- **Mobile (< 480px):** card goes full-width with 16px side margins instead of a fixed max-width; font sizes drop one step (H1 → 26px).
- **Touch targets:** all buttons and inputs maintain a minimum 44px tap height on mobile.

---

## 7. Accessibility Notes

- Text-on-background contrast: `text-heading` on `bg-canvas` and `text-body` on white both exceed WCAG AA (4.5:1).
- Status badges carry both color **and** a text label (never color alone) — already satisfied by the design in 3.4.
- All form fields have real `<label>` elements (not just placeholder text) so screen readers announce them correctly.
- Focus states are visible (the `accent-soft` glow in 3.2) for keyboard-only navigation.

---

## 8. Asset Checklist for Implementation

- [ ] Import Manrope or Plus Jakarta Sans via Google Fonts (`<link>` in `public/index.html`)
- [ ] Define the palette as CSS custom properties (`:root { --accent-primary: #6C4DF6; ... }`)
- [ ] Build the three states (form / confirmation / status) as one small React or vanilla-JS view, swapping content in the same card shell
- [ ] Replace the current plain HTML form (`public/index.html` in the backend scaffold) with this styled version — no backend logic changes needed, only presentation
