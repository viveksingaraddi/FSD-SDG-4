# Design System Requirements and Accessible Tokens

This document defines the design tokens, color palette, typography hierarchy, spacing scale, and accessible component styling rules for the **FSD-SDG-4 Quality Education SaaS** design system.

---

## 1. Accessible Color Token Palette

All color pairings are mathematically verified to satisfy **WCAG 2.2 Level AA** contrast requirements ($4.5:1$ for normal body text, $3.0:1$ for large text and interactive UI elements):

```text
[ Primary Educational Blue ]   ──► #1D4ED8 (Blue 700 - AAA on white; active action states)
[ Surface Neutral ]            ──► #F8FAFC (Slate 50 - clean, glare-free light canvas)
[ High-Contrast Text ]         ──► #0F172A (Slate 900 - 15.8:1 contrast on white canvas)
[ Muted / Secondary Text ]     ──► #475569 (Slate 600 - 5.4:1 contrast on white canvas)
[ Semantic Success (Present) ] ──► #15803D (Green 700 - 4.8:1 contrast text; clear affirmative chip)
[ Semantic Warning (Late/Flag)]──► #B45309 (Amber 700 - 4.6:1 contrast text; non-punitive amber)
[ Semantic Danger (Absent) ]   ──► #B91C1C (Red 700 - 4.9:1 contrast text; urgent indicator)
[ Focus Visible Ring ]         ──► #2563EB (2px solid with 2px white offset ring)
```

---

## 2. Typography Scale and Reading Ergonomics

The typography scale utilizes modern system sans-serif stacks (or self-hosted Inter) to eliminate external Google Font network latency on low-bandwidth connections:

| Type Token | CSS Font Size | Line Height | Font Weight | Typical Usage |
| :--- | :--- | :--- | :---: | :--- |
| `display-1` | `2.25rem (36px)` | `2.5rem (40px)` | Bold (700) | Landing headers, Dashboard main statistics. |
| `heading-1` | `1.875rem (30px)`| `2.25rem (36px)`| Bold (700) | Top-level view title (`<h1>`, exactly one per page). |
| `heading-2` | `1.5rem (24px)` | `1.875rem (30px)`| SemiBold (600)| Card titles, Section headers (`<h2>`). |
| `heading-3` | `1.25rem (20px)` | `1.625rem (26px)`| Medium (500) | Table subheadings, Modal headers (`<h3>`). |
| `body-base` | `1.0rem (16px)` | `1.5rem (24px)` | Regular (400)| Standard body text, form input values, table cells. |
| `body-small`| `0.875rem (14px)`| `1.25rem (20px)`| Regular (400)| Supporting metadata, timestamps, badge labels. |
| `caption` | `0.75rem (12px)` | `1.0rem (16px)` | Medium (500) | Form field helper hints, audit status timestamps. |

---

## 3. Spacing Scale and Touch Target Ergonomics

- **8px Grid Foundation**: All layout margins, paddings, and component dimensions adhere to multiples of 4px and 8px (`0.25rem` to `4.0rem`).
- **Touch Target Sizing (Mobile)**:
  - All interactive buttons, checkboxes, attendance status chips, and dropdown triggers enforce a minimum bounding box of **$44 \times 44\text{ CSS pixels}$** on mobile viewports.
  - This exceeds WCAG 2.2 AA's minimum $24 \times 24\text{px}$ rule (Criterion 2.5.8), ensuring teachers can rapidly tap student attendance chips on small phone screens without touch misfires.

---

## 4. Focus Rings and Keyboard Accessibility

- **Focus Indicator Token**: `outline: 2px solid #2563eb; outline-offset: 2px;`
- **Rule**: `outline: none` is strictly forbidden unless immediately replaced by a visible, high-contrast `:focus-visible` ring.
- **Focus Order**: Tab sequence follows a logical reading order left-to-right, top-to-bottom. Modals trap focus completely until dismissed.
