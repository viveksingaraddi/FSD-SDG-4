# Responsive Design Strategy, Breakpoint Hierarchy and Performance Budgets

This document establishes the responsive layout framework, mobile-first breakpoint rules, touch ergonomics, and low-bandwidth performance budgets for the **FSD-SDG-4 Quality Education SaaS** frontend.

---

## 1. Breakpoint Hierarchy and Viewport Targets

The responsive layout engine uses a strict **mobile-first** media query methodology. CSS styles are defined for mobile smartphones by default, and progressively enhanced at larger breakpoints:

| Breakpoint         | Viewport Width    | Target Hardware Profiles                                                                       | Navigation Behavior                                                                         | Data Display Strategy                                                                    |
| :----------------- | :---------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| **`sm` (Mobile)**  | `< 640px`         | Entry-level Android phones ($360 \times 640$), iPhones ($375 \times 667$ to $393 \times 852$). | Bottom Navigation Bar (4 items) + sliding hamburger drawer.                                 | Multi-column tables collapse into touch-friendly cards; sticky bottom submit containers. |
| **`md` (Tablet)**  | `640px - 1023px`  | Shared school Android tablets, iPads, netbooks ($768 \times 1024$, $800 \times 1280$).         | Compact icon rail ($64\text{px}$) with hover/focus tooltips; expandable drawer.             | Two-column dashboard cards; scrollable data tables with frozen identity columns.         |
| **`lg` (Desktop)** | `1024px - 1279px` | Staffroom PCs, teacher laptops, office workstations ($1024 \times 768$ to $1280 \times 800$).  | Fixed left sidebar ($240\text{px}$); visible section titles and status badges.              | Full dense data tables, side-by-side grading drawers, split-screen triage views.         |
| **`xl` (Wide)**    | `$\ge 1280px$`    | High-resolution desktop monitors, administrative displays ($1920 \times 1080$).                | Fixed left sidebar ($240\text{px}$) with centered maximum content canvas ($1440\text{px}$). | Multi-column metrics layout; wide gradebook matrix with zero truncation.                 |

---

## 2. Thumb Zone Ergonomics and Mobile Touch Targets

### 2.1 The Ergonomic Thumb Reach Arc

On smartphone screens, educators frequently operate devices with one hand while walking between classroom desks:

```text
┌──────────────────────────┐
│ [ Top App Header ]       │ ◄── Hard to reach (Secondary: School name, Menu)
│                          │
│                          │
│ [ Middle Content Canvas ]│ ◄── Neutral reach (Scrollable data cards)
│                          │
│                          │
│ ┌──────────────────────┐ │
│ │ Easy Thumb Reach Arc │ │ ◄── OPTIMAL TOUCH ZONE
│ │ [ Mark All Present ] │ │
│ └──────────────────────┘ │
│ [ Sticky Action Bar    ] │ ◄── High-urgency mutations: "Submit Roster (32)"
│ [ Bottom Navigation    ] │ ◄── Top 4 primary views (48px targets)
└──────────────────────────┘
```

### 2.2 Strict Touch Target Rules:

1. **Minimum Dimensions**: Every clickable button, icon link, status chip, and form checkbox enforces a bounding box of at least **$44 \times 44\text{ CSS pixels}$** on mobile viewports.
2. **Attendance Segmented Chips**: Individual chips for `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED` are sized at **$48\text{px}$ height** on mobile cards, with $8\text{px}$ touch target separation to eliminate accidental miss-taps.
3. **Sticky Action Dock**: Mutation submit buttons are pinned to the bottom of the viewport above the navigation bar, ensuring the thumb can submit attendance or coursework without scrolling back to the top of the page.

---

## 3. Low-Bandwidth Asset Budget & Performance Constraints

Schools in rural and developing regions frequently operate on metered 2G/3G cellular links with high latency ($> 300\text{ms}$ RTT) and packet loss. The frontend architecture enforces strict performance budgets:

### 3.1 Payload Budgets

| Metric / Asset Type              |            Strict Budget Cap            | Enforcement & Optimization Mechanism                                                                                                                   |
| :------------------------------- | :-------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Initial JS Bundle (Gzipped)**  |      $\le \mathbf{200\text{ KB}}$       | Route-based dynamic code splitting via `React.lazy()` and Vite chunks.                                                                                 |
| **Initial CSS Bundle (Gzipped)** |       $\le \mathbf{40\text{ KB}}$       | Utility-first CSS purged of unused rules; zero bloated styling libraries.                                                                              |
| **Web Typography**               | $\mathbf{0\text{ KB}}$ (Zero Web Fonts) | Uses system sans-serif font stack (`system-ui, -apple-system, Segoe UI, Roboto, sans-serif`), completely bypassing external Google Font HTTP requests. |
| **Iconography**                  |       $\le \mathbf{25\text{ KB}}$       | Inline tree-shaken SVG icons; zero heavy icon-font downloads.                                                                                          |
| **Total First Page Load**        |      $\le \mathbf{300\text{ KB}}$       | P95 initial load completed in $\le 2.0\text{s}$ over simulated 3G network.                                                                             |

### 3.2 Low-Power Hardware & DOM Node Budget:

- Many schools utilize legacy Android smartphones (e.g. 2GB RAM, quad-core processors).
- Excessive DOM elements cause mobile browser jank, memory crashes, and scroll stutter.
- **Maximum DOM Element Limit**: Views must not exceed **$1200\text{ DOM nodes}$**.
- For large section rosters ($> 50$ students) or multi-week gradebooks, virtualized rendering (`@tanstack/react-virtual`) is required to maintain a steady 60 FPS scrolling experience.
