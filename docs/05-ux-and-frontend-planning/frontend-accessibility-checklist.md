# Frontend Accessibility Verification Checklist (WCAG 2.2 AA)

This checklist serves as the mandatory pre-flight accessibility verification protocol that every frontend component, screen, and user flow must pass before merging into the main branch.

---

## 1. Perceivable Verification Checklist

- [ ] **Color Contrast (Text)**: Normal text ($\le 18\text{pt}$) achieves at least **$4.5:1$** contrast against adjacent backgrounds. Large text ($\ge 18\text{pt}$ or $14\text{pt}$ bold) achieves at least **$3.0:1$**.
- [ ] **Color Contrast (UI Elements)**: Button borders, input outlines, and active tab indicators maintain at least **$3.0:1$** contrast against background surfaces.
- [ ] **No Color-Only Information**: Status indicators (such as attendance chips or support badges) use distinct iconography and text labels alongside color.
- [ ] **Text Scaling & Zoom**: Interface scales cleanly up to **$200\%$ text size** in browser settings without text overlapping, clipping, or loss of functionality.
- [ ] **Semantic Structure**: Exactly one `<h1>` per view; logical heading hierarchy (`<h2>` $\to$ `<h3>` without skipping levels).

---

## 2. Operable Verification Checklist

- [ ] **Skip to Content Link**: A visible "Skip to Main Content" link is the first focusable element on every view.
- [ ] **Full Keyboard Navigability**: Every interactive element (buttons, links, inputs, dropdowns, table rows) can be reached and activated using `Tab`, `Shift+Tab`, `Enter`, and `Space`.
- [ ] **Zero Keyboard Traps**: Focus can move into and out of all dialogs, drawers, and menus using standard keyboard navigation. Pressing `Escape` closes any open modal or drawer.
- [ ] **Focus Visible**: A high-contrast focus indicator (minimum 2px solid ring with 2px offset) is visible on all keyboard-focused elements.
- [ ] **Minimum Touch Targets**: All interactive touch targets on mobile viewports enforce at least **$44 \times 44\text{ CSS pixels}$**.
- [ ] **Modal Focus Trapping**: When a modal is open, keyboard focus is trapped strictly within the modal; background page content is marked `aria-hidden="true"`.

---

## 3. Understandable Verification Checklist

- [ ] **Explicit Form Labels**: Every input, select, and textarea has a programmatically associated `<label for="inputId">` or `aria-label`.
- [ ] **Descriptive Error Messages**: Form validation failures highlight the invalid field and provide clear, plain-language corrective text announced via `aria-describedby`.
- [ ] **Consistent Navigation**: Primary navigation bars, header icons, and action button styles maintain identical placement across all views.
- [ ] **Reading Level**: Educational support flags and system error messages use clear language ($\le$ 8th-grade readability).

---

## 4. Robust Verification Checklist

- [ ] **Valid ARIA Implementation**: ARIA roles, states, and properties (`aria-expanded`, `aria-selected`, `aria-busy`) are used strictly according to W3C ARIA Authoring Practices.
- [ ] **Live Region Announcements**: Asynchronous mutations (toast confirmations, support flag updates) announce to screen readers via `aria-live="polite"`.
- [ ] **Automated `axe-core` Scan**: Automated CI tests execute `axe-core` audits on the view, reporting **zero Level A or Level AA violations**.
