# BIM Kintsugi — Production UI Platform Standards & Governance

This document defines the canonical global design tokens, CSS primitive classes (`bk-*`), TypeScript window/modal/dropdown factories (`src/ui/UiPlatform.ts`), and anti-drift enforcement strategy that keep every UI control uniform across the BIM Kintsugi platform.

---

## 1. Architecture Layers (Single Source of Truth)

```
src/styles/ui-primitives.css   ──► Global design tokens (--bk-*) & reusable CSS classes (.bk-*)
src/ui/UiPlatform.ts           ──► FloatingWindowManager, BkFloatingWindow, createBkModal,
                                   createBkDropdown, createBkButton, createBkSelect
src/responsive.css             ──► Coarse-pointer 44x44px touch rules, 100dvh, safe-area insets
src/ui/__tests__/UiPlatformStandards.test.ts ──► Automated CI design-system contract gate
```

**Core Rule:** Feature modules MUST NOT hand-roll raw inline `position: fixed; z-index: ...` modals, custom pointer-drag boilerplate, or ad-hoc button/dropdown dimensions. Always compose from `bk-*` classes and `UiPlatform.ts`.

---

## 2. Standardized Token Scales (`src/styles/ui-primitives.css`)

### A. Control Heights & Touch Targets
| Size Class / Token | Desktop Height | Coarse-Pointer / Touch Mode | Typical Usage |
|---|---|---|---|
| `--bk-h-xs` (`.bk-btn--xs`) | `24px` | `44px` | Window header actions, compact segmented toggles, preset chips |
| `--bk-h-sm` (`.bk-btn--sm`) | `28px` | `44px` | Secondary toolbars, header selects, compact badges |
| `--bk-h-md` (`.bk-btn--md`) | `32px` | `44px` | Default buttons, text inputs, selects, dropdown menu items |
| `--bk-h-lg` (`.bk-btn--lg`) | `38px` | `44px` | Primary modal CTAs, prominent upload/launch actions |

### B. Floating Window & Modal Size Tiers (`UI_WINDOW_SIZES`)
| Tier | Class | Default Width | Min / Max Width | Default Height | Intended Usage |
|---|---|---|---|---|---|
| `sm` | `.bk-window--sm` / `.bk-modal--sm` | `284px` (`440px` modal) | `240–420px` | `340px` (or `auto`) | Compact 3D transform HUDs (e.g. Tower Crane Transform), mini inspectors |
| `md` | `.bk-window--md` / `.bk-modal--md` | `440px` (`640px` modal) | `300–680px` | `300px` | Tool panels, What-If Sandbox, bSDD Lookup |
| `lg` | `.bk-window--lg` / `.bk-modal--lg` | `640px` (`740px` modal) | `300–1120px` | `244px` | Interactive charts & histograms (e.g. 4D Cash-Flow), Lookahead |
| `xl` | `.bk-window--xl` / `.bk-modal--xl` | `820px` | `320–1280px` | `460px` | Reconciliation tables, IDS QA audits, full data grids |

> Every floating window automatically clamps width to `calc(100vw - 16px)` and height to `calc(100dvh - var(--header-bottom) - 20px)` so even `320×568` and `568×320` phones never clip controls.

### C. Global Z-Index Elevation Ladder (`UI_Z_LAYERS`)
| Layer | Token | Value | Components |
|---|---|---|---|
| Canvas | `--bk-z-canvas` | `1` | 3D WebGL viewport |
| Viewport HUD | `--bk-z-hud` | `100` | ViewCube, Quick-Views, Breadcrumbs, Timeline |
| Sidebars | `--bk-z-sidebar` | `400` | Left & Right docked / bottom-sheet panels |
| Dock | `--bk-z-dock` | `500` | Bottom Magic Dock |
| Floating Windows | `--bk-z-floating` | `880–940` | Managed dynamically by `FloatingWindowManager.bringToFront()` |
| Dropdown Popovers | `--bk-z-dropdown` | `10020` | `createBkDropdown()` menus, Saved Views flyout |
| Dialog Modals | `--bk-z-modal` | `10060` | `createBkModal()` blocking workflows |
| Command Palette | `--bk-z-command` | `100000` | Global `Ctrl+K` Command Palette |
| Toasts | `--bk-z-toast` | `100020` | Ephemeral notifications |

---

## 3. Component Selection Matrix

| Need | Use This Primitive | Why |
|---|---|---|
| Live 3D tool that stays open while orbiting the model | `createFloatingWindow(...)` | Non-blocking, click-to-focus z-stacking, collision-free spawn, drag/resize/collapse, `localStorage` persistence |
| Focused multi-step decision, import, or confirmation | `createBkModal(...)` | `role="dialog"`, `aria-modal="true"`, backdrop click + `Escape` close, uniform header/body/footer |
| Contextual list of actions anchored to a button | `createBkDropdown(...)` | Fixed portal positioning (never clipped by `overflow` parents), auto-flips inside viewport, `Escape` + outside-click close |
| Mode or granularity switch (`Cash Flow` / `Resources`, `2W / 3W / 4W / 6W`) | `.bk-seg` + `.bk-seg__btn` | Recessed track + accent-tinted active state across all 5 themes |
| Action trigger | `.bk-btn` + variant (`--primary`, `--secondary`, `--ghost`, `--danger`) | Consistent height, focus-visible ring, disabled state, touch sizing |
| Wide tabular data | `.bk-table-wrap` + `.bk-table` | Sticky headers, tabular numerals, smooth touch horizontal scrolling |

---

## 4. Anti-Drift Governance & Enforcement Strategy

1. **Token-First Theming**: Never hardcode `#d4ff3f`, `#ffffff`, or `rgba(255,255,255,...)` ink colors in component templates. Always use `--bk-text`, `--bk-text-muted`, `--bk-accent`, `--bk-success`, `--bk-warning`, `--bk-danger`, and `--bk-border` so Obsidian, Light Studio, Zen, Cyberpunk, and Blueprint stay WCAG 2.2 AA/AAA compliant automatically.
2. **Typography Floor**: Never emit text smaller than `--bk-text-xs` (`11px`). All editable inputs & selects automatically upgrade to `16px` under `@media (pointer: coarse) and (max-width: 768px)` to prevent iOS Safari zoom.
3. **Zero Unmanaged Floating Windows**: All new floating panels MUST register through `FloatingWindowManager` via `createFloatingWindow()` so clicking brings them to front and resizing/rotating the viewport clamps every open panel in one place.
4. **CI Verification Gates**:
   - `src/ui/__tests__/UiPlatformStandards.test.ts` verifies `UI_WINDOW_SIZES`, `UI_Z_LAYERS`, floating window z-focus stacking, 320px clamping, modal ARIA + `Escape` close, dropdown viewport bounds, and button/select factories on every `npm test`.
   - `scripts/e2e-smoke.mjs` validates all 5 themes for WCAG contrast and multi-viewport responsiveness (`1440×900`, `768×1024`, `390×844`) on every build/deploy.
