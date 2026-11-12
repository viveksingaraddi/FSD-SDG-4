# Frontend Accessibility Verification Checklist (WCAG 2.2 AA)

This checklist serves as the mandatory pre-flight accessibility verification protocol that every frontend component, screen, and user flow must pass before merging into the codebase.

The target standard is **W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA**.

---

## 1. Perceivable Verification Protocol

- [ ] **Color Contrast — Normal Text (SC 1.4.3)**: Body text, table cells, form labels, and button labels achieve at least **$4.5:1$** contrast against adjacent backgrounds.
- [ ] **Color Contrast — Large Text (SC 1.4.3)**: Headers and large text ($\ge 24\text{px}$ or $\ge 18.5\text{px}$ bold) achieve at least **$3.0:1$** contrast.
- [ ] **Color Contrast — UI Components & Borders (SC 1.4.11)**: Button borders, form input outlines, and active tab indicators achieve at least **$3.0:1$** contrast against background surfaces.
- [ ] **Non-Color Distinction (SC 1.4.1)**: Color is never used as the sole visual means of conveying information. Attendance chips, support tiers, and form validation errors pair distinct iconography and text labels alongside color.
- [ ] **Text Resizing to 200% (SC 1.4.4)**: Interface scales cleanly up to **$200\%$ browser zoom** without horizontal clipping, truncated text, or overlapping buttons.
- [ ] **Reflow (SC 1.4.10)**: Content reflows seamlessly at $320\text{px}$ viewport width without requiring two-dimensional scrolling.
- [ ] **Semantic Document Structure (SC 1.3.1)**: Exactly one `<h1>` per view; logical, unskipped heading progression (`<h1>` $\to$ `<h2>` $\to$ `<h3>`).
- [ ] **Form Label Association (SC 1.3.1)**: Every input, textarea, and select element has a programmatically linked `<label for="id">` or `aria-label`.

---

## 2. Operable Verification Protocol

- [ ] **Keyboard Navigability (SC 2.1.1)**: All interactive controls (buttons, links, attendance chips, modal triggers) can be reached and activated using standard keyboard keys (`Tab`, `Shift+Tab`, `Enter`, `Space`).
- [ ] **No Keyboard Trap (SC 2.1.2)**: Focus never becomes locked in any component. Pressing `Escape` reliably dismisses all open modals, drawers, and menus, returning focus to the triggering element.
- [ ] **Focus Visible (SC 2.4.7 & 2.4.11)**: High-contrast focus indicator (**2px solid #2563eb with 2px white offset**) is clearly visible on every focused interactive element.
- [ ] **Logical Focus Order (SC 2.4.3)**: Tab order follows the natural, intuitive reading sequence of the page.
- [ ] **Bypass Blocks / Skip Link (SC 2.4.1)**: A visible "Skip to Main Content" link is the first focusable element on every view.
- [ ] **Touch Target Size (SC 2.5.8 & Mobile Standard)**: Every interactive touch target on mobile viewports enforces a minimum bounding box of **$44 \times 44\text{ CSS pixels}$** (exceeding WCAG 2.2 AA's minimum $24 \times 24\text{px}$ rule).
- [ ] **Modal Focus Trapping (WAI-ARIA Pattern)**: When a modal dialog opens, keyboard focus is trapped strictly within the dialog; underlying canvas elements are inert and marked `aria-hidden="true"`.
- [ ] **Dragging Movements (SC 2.5.7)**: Any drag-and-drop interaction (e.g. file upload dropzone) provides an accessible single-pointer alternative (file browse button).

---

## 3. Understandable Verification Protocol

- [ ] **Language of Page (SC 3.1.1)**: The root `<html>` element specifies a valid language attribute (`<html lang="en">`).
- [ ] **Consistent Navigation (SC 3.2.3)**: Global navigation headers, sidebars, and bottom tab bars maintain consistent placement across all application views.
- [ ] **Predictable Focus Transitions (SC 3.2.1 & 3.2.2)**: Receiving focus or changing an input value does not automatically trigger an unexpected context change or page navigation.
- [ ] **Descriptive Error Identification (SC 3.3.1)**: Form validation errors explicitly describe the error in plain language, highlight the affected input, and announce to assistive technology via `aria-describedby`.
- [ ] **Error Suggestion & Correction Guidance (SC 3.3.3)**: Error messages state actionable steps to fix the issue (e.g. _"Enter a positive score between 0 and 50"_).
- [ ] **Reversible Submissions / Confirmation (SC 3.3.4)**: Destructive actions (archiving terms, dismissing flags, deleting coursework) require explicit confirmation dialogs before executing.
- [ ] **Reading Level & Non-Punitive Tone (Educational Standard)**: Student support flags and learner-facing text use clear language ($\le$ 8th-grade readability) avoiding stigmatizing labels.

---

## 4. Robust Verification Protocol

- [ ] **W3C Valid Markup (SC 4.1.1)**: HTML elements possess valid start and end tags, correct nesting, and unique `id` attributes.
- [ ] **Accurate ARIA Roles & States (SC 4.1.2)**: WAI-ARIA roles (`dialog`, `radiogroup`, `status`, `alert`) and states (`aria-expanded`, `aria-busy`, `aria-selected`, `aria-invalid`) mirror actual component state.
- [ ] **Live Region Announcements (SC 4.1.3)**: Status changes, toast notifications, and queue updates announce politely via `<div role="status" aria-live="polite">`.
- [ ] **Automated CI Accessibility Audit**: Automated test suites execute `@axe-core/playwright` across all screens, reporting **zero Level A or Level AA violations**.
