# Privacy and Accessibility Test Plan

This document establishes the test scenarios, verification procedures, and compliance standards for **Student Data Privacy** and **WCAG 2.2 Level AA Accessibility** on the **FSD-SDG-4 Quality Education SaaS** platform.

---

## 1. Student Data Privacy Test Plan

### TC-PRIV-01: Synthetic Fixture Audit (Zero Real PII)
- **Procedure**: Automated static analysis script scans all seed scripts, test fixtures, and mock files for patterns matching real telephone numbers, real tax IDs, or non-mock email domains (`@gmail.com`, `@yahoo.com`).
- **Pass Criteria**: Zero non-synthetic data occurrences detected across the codebase.

### TC-PRIV-02: Structured Log Sanitization Verification
- **Procedure**: Integration test triggers authentication failures, password changes, and student profile updates while capturing raw Pino JSON logs from `stdout`.
- **Pass Criteria**: Assert that fields matching `password`, `sessionToken`, and `student_id_number` are redacted to `[REDACTED]` in log outputs.

### TC-PRIV-03: Shared-Device Session Purge on Logout
- **Procedure**: Playwright test signs in as a teacher, visits student profiles and attendance ledgers, clicks *"Sign Out"*, and inspects client browser state:
  1. Verifies that `document.cookie` no longer contains the `sid` session cookie.
  2. Asserts that TanStack Query cache is purged (`queryClient.getQueryCache().clear()`).
  3. Clicks browser "Back" button; asserts that the browser displays the public login view instead of cached student records.
- **Pass Criteria**: Zero confidential student or teacher data accessible in history or memory after logout.

---

## 2. Accessibility Verification Test Plan (WCAG 2.2 Level AA)

### TC-A11Y-01: Automated `axe-core` Scan on Core Views
- **Procedure**: Automated Playwright test navigates to each registered screen in the screen inventory (`SCR-TCH-01` through `SCR-STU-05`), injects `@axe-core/playwright`, and executes `axe.run()`.
- **Pass Criteria**: Zero violations reported for rules tagged `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.

### TC-A11Y-02: Complete Keyboard Tab-Order and Focus Ring Test
- **Procedure**: Automated test navigates the morning attendance view (`SCR-TCH-02`) exclusively using `Tab`, `Shift+Tab`, and `Enter`:
  1. Asserts focus moves through skip link $\to$ navigation items $\to$ section selector $\to$ attendance status chips $\to$ submit button.
  2. Verifies that the focused element possesses `outline-style: solid` and a contrast ratio $\ge 3.0:1$ against adjacent pixels.
  3. Asserts zero keyboard traps anywhere in the tab order.
- **Pass Criteria**: Entire 32-student attendance roster can be marked and submitted without mouse/pointer interaction.

### TC-A11Y-03: Mobile Touch Target Size Verification
- **Procedure**: Visual regression and DOM inspection script calculates bounding boxes of all interactive controls on simulated mobile viewports ($375 \times 667\text{px}$).
- **Pass Criteria**: 100% of interactive targets maintain minimum dimensions $\ge 44 \times 44\text{ CSS pixels}$.
