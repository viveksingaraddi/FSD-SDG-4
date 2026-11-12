# Accessibility and Inclusion (WCAG 2.2 Level AA)

This document establishes the accessibility and inclusion mandates for the **FSD-SDG-4 Quality Education SaaS** platform. Adherence to W3C Web Content Accessibility Guidelines (WCAG) 2.2 Level AA is a primary architectural requirement to ensure equitable access across diverse socioeconomic contexts and physical capabilities.

---

## 1. Core Principles of Inclusive Design

1. **Equitable Access (SDG-4 Mandate)**: Students, educators, and administrators with visual, auditory, motor, or cognitive disabilities must be able to independently perform all core tasks.
2. **Device Independence**: Every interactive workflow must be operable via keyboard, pointer, touchscreen, or assistive switch technology.
3. **Resilience in Low-Resource Contexts**: Inclusion encompasses students operating on low-cost smartphones, slow 3G cellular connections, and shared public terminals.

---

## 2. WCAG 2.2 Level AA Technical Conformance Standards

### 2.1 Perceivable (Information & User Interface)

- **Contrast (Minimum) (WCAG 1.4.3)**: Text and images of text must have a contrast ratio of at least **$4.5:1$**, except for large text (at least $18\text{pt}$ or $14\text{pt}$ bold) which must have at least **$3.0:1$**.
- **Non-Text Contrast (WCAG 1.4.11)**: Visual presentation of user interface components (input borders, active tab indicators, focus rings) and graphical objects must maintain at least **$3.0:1$** against adjacent colors.
- **Use of Color (WCAG 1.4.1)**: Color is never used as the sole visual means of conveying information. For example:
  - Attendance chips: `PRESENT` uses both green color AND a checkmark icon + text label.
  - `ABSENT` uses both red color AND an 'X' icon + text label.
  - Support flags: Amber badge is accompanied by text label and an alert icon.
- **Text Resizing & Reflow (WCAG 1.4.4 & 1.4.10)**: Content must reflow without loss of information or functionality down to a width of $320\text{ CSS pixels}$ without requiring two-dimensional scrolling.

### 2.2 Operable (User Interface & Navigation)

- **Keyboard Operability (WCAG 2.1.1 & 2.1.2)**: All functionality must be operable through a keyboard interface without requiring specific timings for individual keystrokes. No keyboard traps are permitted anywhere in the application.
- **Focus Visible & Focus Appearance (WCAG 2.4.7 & 2.4.13 - Enhanced in 2.2)**: Any keyboard-operable interface element must have an obvious, high-contrast visual focus indicator (minimum 2px solid ring with a contrast ratio $\ge 3.0:1$ against adjacent backgrounds).
- **Target Size (Minimum) (WCAG 2.5.8 - New in 2.2)**: The size of touch/pointer targets for interactive controls must be at least **$24 \times 24\text{ CSS pixels}$**, or provide sufficient spacing so that a 24px diameter circle centered on the target does not intersect another target.
- **Bypass Blocks (WCAG 2.4.1)**: A visible "Skip to Main Content" link must be the first focusable element on every page.

### 2.3 Understandable (Information & Operation)

- **Semantic HTML & Form Labels (WCAG 3.3.2)**: Every input, select, textarea, and toggle button must have a programmatically associated `<label>` or `aria-label`.
- **Error Identification & Suggestion (WCAG 3.3.1 & 3.3.3)**: Form errors must be described in text, identify the specific field, and provide clear corrective guidance.
- **Predictable Navigation (WCAG 3.2.3 & 3.2.4)**: Navigation menus, search bars, and action hierarchies must maintain consistent placement and iconography across all views.
- **Non-Stigmatizing Plain Language**: Error messages, support flag explanations, and grading criteria must use clear, non-punitive language ($\le$ 8th-grade reading level).

### 2.4 Robust (Compatibility with Assistive Technologies)

- **ARIA Live Regions (WCAG 4.1.3)**: Status messages, dynamic table sorting, and toast notifications must be announced to screen readers via `aria-live="polite"` or `role="status"` without stealing user focus.
- **Semantic Structure**: Proper heading hierarchy (`<h1>` through `<h6>`) with exactly one `<h1>` per view describing the primary purpose.

---

## 3. Low-Bandwidth and Shared-Device Inclusivity

- **Defensive Data Payloads**: Initial client bundles are strictly budgeted $\le 250\text{ KB}$ gzipped. Heavy image assets and uncompressed fonts are prohibited.
- **Shared-Terminal Session Shield**:
  - Logout clears all memory state, session cookies, and DOM caches.
  - Prominent "Sign Out" button visible on all views.
  - Automatic session timeout dialog on inactive shared terminals after 60 minutes.
