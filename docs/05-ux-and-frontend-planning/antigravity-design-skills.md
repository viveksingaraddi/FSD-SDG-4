# Antigravity Frontend Design Skills & Integration Setup — FSD-SDG-4

**Date**: 2026-11-12  
**Status**: Evaluated & Documented (Zero Backend/Auth/Portal Code Modified)  
**Target Stack**: React, TypeScript (strict), Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod

> [!IMPORTANT]
> **Figma remains the approved design source of truth.** Design skills and MCP integrations assist with implementation fidelity, accessibility auditing, framework documentation lookup, and browser verification — they must never replace approved Phase 3 Figma specifications or invent unapproved screen layouts.

---

## 1. Skills and Integrations Evaluated

| Priority | Candidate                                               | Type                             | Status                                    |
| :------- | :------------------------------------------------------ | :------------------------------- | :---------------------------------------- |
| P1       | **UI UX Pro Max**                                       | Third-party Agent Skill (GitHub) | Evaluated — Not Installed                 |
| P2       | **Frontend Design** (`anthropics/skills`)               | Third-party Agent Skill (GitHub) | Evaluated — Not Installed                 |
| P3       | **Context7** (`upstash/context7`)                       | Antigravity Partner Plugin (MCP) | Available in Marketplace (Ready to Add)   |
| P4       | **Emil Kowalski Design Engineering**                    | Third-party Agent Skill (GitHub) | Evaluated — Not Installed                 |
| P5       | **Google Stitch MCP Server**                            | External Design Service + MCP    | Evaluated — Not Installed (Auth Required) |
| P6       | **Chrome Browser / Visual Agent Skills**                | Antigravity Plugin + Subagent    | **Installed & Active**                    |
| P6+      | **Modern Web Guidance**                                 | Antigravity Plugin (Skill)       | **Installed & Active**                    |
| P6+      | **Figma** (`antigravity-plugins-partners/plugin/figma`) | Antigravity Partner Plugin (MCP) | Available in Marketplace (Recommended)    |
| —        | **MagicPath** (`magicpath.ai`)                          | External Web Canvas Platform     | Unavailable as Antigravity Plugin/MCP     |
| Opt 1    | **Spline** (`@splinetool/react-spline` / MCP)           | 3D Design Service + MCP          | Evaluated — Not Installed (Out of Scope)  |
| Opt 2    | **Taste by LearnInk**                                   | Unverified / Conflated Reference | Unavailable / Incompatible                |
| Opt 3    | **Banana Claude**                                       | Third-party Image Gen Skill/MCP  | Evaluated — Not Installed (Duplicate)     |

---

## 2. Official Sources

- **Context7**:
  - Antigravity Marketplace ID: `antigravity-plugins-partners/plugin/context7`
  - Official Repository: [https://github.com/upstash/context7](https://github.com/upstash/context7)
- **Chrome Browser / Visual Agent Skills (`chrome-devtools-plugin`)**:
  - Installed locally at `~/.gemini/config/plugins/chrome-devtools-plugin`
  - Built-in `browser` subagent + skills: `chrome-devtools`, `a11y-debugging`, `debug-optimize-lcp`, `cookie-debugging`, `memory-leak-debugging`, `troubleshooting`
- **Modern Web Guidance (`modern-web-guidance-plugin`)**:
  - Installed locally at `~/.gemini/config/plugins/modern-web-guidance-plugin`
  - Skills: `modern-web-guidance`, `chrome-extensions`
- **Figma (Marketplace Partner Plugin)**:
  - Antigravity Marketplace ID: `antigravity-plugins-partners/plugin/figma`
- **Frontend Design**:
  - Official Anthropic Repository: [https://github.com/anthropics/skills/tree/main/skills/frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- **UI UX Pro Max**:
  - Official Repository: [https://github.com/nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- **Emil Kowalski Design Engineering**:
  - Official Repository: [https://github.com/emilkowalski/skills](https://github.com/emilkowalski/skills) (companion site: [https://animations.dev](https://animations.dev))
- **Google Stitch MCP Server**:
  - Official Documentation: [https://stitch.withgoogle.com/docs/mcp/setup](https://stitch.withgoogle.com/docs/mcp/setup)
- **MagicPath**:
  - Platform Website: [https://magicpath.ai](https://magicpath.ai)
- **Spline (Optional)**:
  - Official MCP Docs: [https://docs.spline.design/generate/spline-mcp-server](https://docs.spline.design/generate/spline-mcp-server) (`https://mcp.spline.design/mcp`)
  - Official React Package: [https://github.com/splinetool/react-spline](https://github.com/splinetool/react-spline) (`@splinetool/react-spline`)
- **Taste / Banana Claude (Optional)**:
  - Community Taste Skill: [https://github.com/Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
  - Banana Claude: [https://github.com/AgriciDaniel/banana-claude](https://github.com/AgriciDaniel/banana-claude)

---

## 3. Installation Instructions

### 3.1 Antigravity Marketplace Plugins (Recommended Path)

Antigravity manages Marketplace plugins through its Plugins Manager UI (using `<plugin-card>` prompts):

- **Context7**: Install `antigravity-plugins-partners/plugin/context7` from the Agent Marketplace card. No repository files need to be modified.
- **Figma** (optional/recommended for Phase 13): Install `antigravity-plugins-partners/plugin/figma` from the Agent Marketplace card to connect directly to approved Figma designs.

### 3.2 Workspace Agent Skills (`.agents/skills/`)

Per [`agy-customizations`](file:///Users/viveksantoshkumarsingaraddi/.gemini/antigravity/builtin/skills/agy-customizations/SKILL.md), Antigravity discovers workspace-scoped skills placed under `.agents/skills/<skill-name>/SKILL.md`.
If the team chooses to adopt third-party markdown skills after security review:

1. Inspect the upstream `SKILL.md` in the trusted repository (`anthropics/skills`, `emilkowalski/skills`, or `nextlevelbuilder/ui-ux-pro-max-skill`).
2. Copy only the reviewed `SKILL.md` (and any audited reference files) into `.agents/skills/<skill-name>/` rather than running blind `npx` installers against workspace configs.

### 3.3 External MCP Servers (User-Authenticated)

- **Google Stitch MCP**: Requires signing in at [stitch.withgoogle.com](https://stitch.withgoogle.com), generating an API key or OAuth credentials, and configuring the MCP server in `~/.gemini/config/mcp_config.json` per [stitch.withgoogle.com/docs/mcp/setup](https://stitch.withgoogle.com/docs/mcp/setup).

---

## 4. Compatibility Results

| Integration                                     | Antigravity Compatibility                     | Stack Compatibility (React/Vite/Tailwind)           | Alignment with FSD-SDG-4 Rules                                          |
| :---------------------------------------------- | :-------------------------------------------- | :-------------------------------------------------- | :---------------------------------------------------------------------- |
| **Chrome DevTools Plugin + `browser` subagent** | Native (Installed)                            | Full — inspects live Vite dev server & DOM          | Full — verifies WCAG 2.2 AA & LCP                                       |
| **Modern Web Guidance**                         | Native (Installed)                            | Full — covers modern HTML/CSS/DOM/ARIA              | Full — prevents obsolete web patterns                                   |
| **Context7**                                    | Native Marketplace Partner Plugin             | Full — React 19, Tailwind, TanStack Query, RHF, Zod | Full — prevents hallucinated APIs                                       |
| **Figma Plugin**                                | Native Marketplace Partner Plugin             | Full — maps Figma tokens/components                 | Full — reinforces Figma as source of truth                              |
| **Frontend Design**                             | Compatible via `.agents/skills/` (`SKILL.md`) | Full — framework-agnostic UI rules                  | Partial — must defer to Phase 3 Figma tokens                            |
| **UI UX Pro Max**                               | Compatible via `.agents/skills/`              | Full — Tailwind/React rules                         | Partial — palette/font suggestions must NOT override Phase 3 tokens     |
| **Emil Kowalski Skills**                        | Compatible via `.agents/skills/`              | Full — CSS/React micro-interactions                 | High — enforces subtle, purposeful motion                               |
| **Google Stitch MCP**                           | Compatible via external MCP config            | Outputs HTML/CSS                                    | Low — useful only for early exploration, not replacing Figma            |
| **MagicPath**                                   | No Antigravity Marketplace plugin/MCP         | Exports React/Tailwind                              | Low — separate collaborative web canvas                                 |
| **Spline**                                      | External hosted MCP + npm runtime             | `@splinetool/react-spline`                          | Low — 3D scenes conflict with low-bandwidth & clean SaaS rules          |
| **Banana Claude**                               | Third-party Claude Code skill/MCP             | Image generation only                               | Redundant — Antigravity already has `image-generator` & `generative_ui` |

---

## 5. Successfully Configured Integrations

The following integrations are **already installed and verified** in the active Antigravity environment:

1. **`chrome-devtools-plugin`** (`~/.gemini/config/plugins/chrome-devtools-plugin`):
   - `browser` subagent for live Chrome DevTools navigation, clicking, form testing, and visual inspection.
   - `a11y-debugging` skill for semantic HTML, ARIA labels, focus rings, keyboard navigation, tap targets, and contrast auditing.
   - `debug-optimize-lcp` skill for Largest Contentful Paint and Core Web Vitals optimization.
   - `chrome-devtools`, `cookie-debugging`, `memory-leak-debugging`, and `troubleshooting` skills.
2. **`modern-web-guidance-plugin`** (`~/.gemini/config/plugins/modern-web-guidance-plugin`):
   - `modern-web-guidance` skill for modern HTML/CSS/DOM, dialogs/popovers, forms, validation, autofill, and accessibility.
3. **Built-in Visual & Asset Capabilities**:
   - `generative_ui` skill and `image-generator` subagent.

---

## 6. Unavailable, Deferred, or Out-of-Scope Integrations

### Available in Marketplace (Awaiting User One-Click Add)

- **Context7** (`antigravity-plugins-partners/plugin/context7`): Official Marketplace plugin; Antigravity policy requires the user to add Marketplace plugins directly via the plugin card.
- **Figma** (`antigravity-plugins-partners/plugin/figma`): Official Marketplace plugin; recommended when starting Phase 13 UI implementation.

### Evaluated but Not Installed

- **Frontend Design** (`anthropics/skills`), **UI UX Pro Max** (`nextlevelbuilder/ui-ux-pro-max-skill`), **Emil Kowalski Design Engineering** (`emilkowalski/skills`): Third-party GitHub skill repositories were not cloned into `.agents/skills/` automatically to avoid introducing unreviewed external prompts or overriding Phase 3 Figma tokens. Selected principles are codified directly in [`frontend-design-standards.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/frontend-design-standards.md).
- **Google Stitch MCP**: Not configured because it requires personal Google Stitch authentication/API keys and is intended for prompt-based screen generation rather than implementing approved Phase 3 Figma screens.
- **Spline**: Not installed; 3D WebGL scenes add bundle weight and conflict with our low-bandwidth (≤ 250KB) and clean SaaS aesthetic rules.
- **Banana Claude**: Not installed; duplicates Antigravity's built-in `image-generator` subagent and requires external Gemini image API setup.

### Unavailable or Incompatible

- **MagicPath**: Operates as a standalone collaborative web canvas (`magicpath.ai`) without an official Antigravity Marketplace plugin or standalone MCP server package for local installation.
- **Taste by LearnInk**: No official "Taste by LearnInk" Antigravity skill or MCP exists; the name conflates community `Leonxlnx/taste-skill` prompts with an unrelated ed-tech company (LearnInk).

---

## 7. Security and Permission Considerations

- **No Unverified `npx` Execution**: Do not run third-party `npx skills add ...` scripts blindly; inspect `SKILL.md` contents before placing any external skill in `.agents/skills/`.
- **Credential Hygiene**: Any future external MCP (e.g., Figma, Google Stitch) must authenticate via Antigravity's plugin account manager or local environment variables — never commit API keys or OAuth tokens to the repository.
- **Zero PII in Prompts or Browser Tests**: Never send real student, teacher, or parent PII to external design/MCP services or Playwright/Chrome DevTools test fixtures.
- **Minimal Dependencies**: Do not add runtime npm packages (such as 3D runtimes or heavy animation libraries) to `apps/web/package.json` without architectural justification.

---

## 8. Recommended Workflow

1. **Design Truth First**: Reference Phase 3 [`01-design-tokens.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/01-design-tokens.md), [`02-component-specifications.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/02-component-specifications.md), [`03-wireframe-specifications.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/design-system/03-wireframe-specifications.md), and the Figma plugin (once added).
2. **Accurate Library Usage**: Query **Context7** before writing React Router, TanStack Query, React Hook Form, Zod, or Tailwind v4 code to avoid deprecated APIs.
3. **Standards-Compliant Markup**: Consult **`modern-web-guidance`** before building modals/dialogs, tables, forms, or custom controls.
4. **Build & Unit Test**: Implement components in `apps/web` adhering to [`frontend-design-standards.md`](file:///Users/viveksantoshkumarsingaraddi/FSD-SDG-4/docs/05-ux-and-frontend-planning/frontend-design-standards.md) and test with Vitest + React Testing Library.
5. **Live Browser & A11y Verification**: Use the **`browser` subagent** + **`a11y-debugging`** + **`debug-optimize-lcp`** + Playwright (`apps/web/e2e/`) to verify rendered layouts, keyboard navigation, contrast, touch targets, and Core Web Vitals.

---

## 9. How Each Skill Should Be Used During Frontend Development

- **`modern-web-guidance`**: Trigger before implementing any HTML/CSS/DOM pattern (dialogs, popovers, forms, autofill, tables, responsive containers).
- **`Context7`** (once added): Query version-specific documentation for React, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, and Zod.
- **`Figma`** (once added): Inspect approved Figma frames, token mappings, and component variants during Phase 13–14 portal implementation.
- **`chrome-devtools` & `browser` subagent**: Render `localhost` pages during UI development to inspect visual hierarchy, responsive breakpoints (mobile, tablet, desktop), and console/network errors.
- **`a11y-debugging`**: Audit every role portal (Super Admin, School Admin, Teacher, Student, Parent) for WCAG 2.2 AA compliance (ARIA roles, focus rings, `44×44px` mobile touch targets, contrast).
- **`debug-optimize-lcp`**: Verify that role dashboards meet low-bandwidth and LCP performance budgets.
