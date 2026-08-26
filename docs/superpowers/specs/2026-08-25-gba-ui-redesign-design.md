# Stage 1 Design: GBA-Style UI Redesign

**Date:** 2026-08-25
**Status:** Approved design, pending implementation plan
**Scope:** Stage 1 of a 3-stage redesign (this document covers Stage 1 only)

## Roadmap Context

The overall redesign has three sequential stages, each independently shippable:

1. **Stage 1 (this doc):** Authentic GBA (Gen 3) skin — theme module, pixel fonts, reskinned chrome, pixel-art entity sprites, icon set. No functional changes.
2. **Stage 2:** Landscape-first mobile experience — touch targets, camera auto-fit, perf caps, portrait prompt.
3. **Stage 3:** UX bug sweep — save/load wiring, named UI refs, refund consistency, systematic sweep.

## Goals

- Reskin all UI chrome to an authentic Game Boy Advance look: double-border frames, typewriter dialogs, ► cursor menus, chunky pixel typography.
- Redraw entity sprites (solar panels, batteries, houses) as outlined pixel art consistent with the new chrome.
- Replace every emoji on canvas with procedural pixel icons.
- Centralize all visual constants into one theme module so Stages 2–3 and future palette tweaks are single-file edits.
- Zero behavioral/gameplay changes. Desktop and mobile code paths both keep working throughout.

## Non-Goals

- No DOM/CSS layout changes (only `@font-face` additions to `main.css`).
- No responsive redesign (Stage 2).
- No gameplay, economy, or event changes.
- No UI framework rewrite — existing classes keep their APIs (`Button`, `Panel`, etc.).

## Decisions Made (with user)

| Decision | Choice |
|----------|--------|
| Depth | Authentic GBA skin; keep today's layout & interactions |
| Visual scope | UI chrome **and** entity sprites |
| Fonts | Two local OFL fonts: Press Start 2P (headings/buttons) + VT323 (body/stats) |
| Palette lean | Emerald-leaning (green accents); gold reserved for tier4/elite |

---

## 1. Theme Module (`js/theme.js`)

New file, loaded **first** in `index.html` script order:

```
theme.js → gameState.js → eventSystem.js → uiFramework.js → camera.js → visualRenderer.js → economicSystem.js → main.js
```

Exports `window.Theme`. All other files read visual constants from `Theme`; no new hardcoded hex values elsewhere after migration.

### Palette tokens (initial values — tunable during visual QA)

```javascript
Theme.palette = {
    // Frames & panels
    outline:        '#1a2028',   // outermost dark stroke
    frameBorder:    '#3a7a5a',   // main frame color (emerald-slate)
    frameHighlight: '#ffffff',   // inner light line of double border
    panelBg:        '#f8f4dc',   // cream fill
    panelBgTan:     '#e8dcc0',   // tan variant (shop buttons keep tan identity)
    panelShadow:    'rgba(0, 0, 0, 0.25)',

    // Text
    textDark:       '#282828',
    textLight:      '#f8f8f8',
    textDisabled:   '#888888',

    // Semantic (normalized from current values; meaning unchanged)
    success:  '#48a868',
    warning:  '#f0b040',
    danger:   '#e04838',
    info:     '#58a8d8',
    gold:     '#f8c830',   // tier4 / elite / goal-complete only
    money:    '#00b894',

    // Tier cell colors (solar panels / batteries, unchanged identities)
    tier1: '#2ecc71', tier2: '#74b9ff', tier3: '#a55eea', tier4: '#f1c40f',

    // World
    gridLine: 'rgba(0, 0, 0, 0.1)',
    grassBg:  '#90ee90',
};
```

### Font helpers

```javascript
Theme.font.heading(px)  // `${px}px "Press Start 2P", monospace`
Theme.font.body(px)     // `${px}px "VT323", monospace`
```

Integer sizes only (crisp rendering). Starting scale: headings 20–24px, buttons 14–16px PS2P; body/stats/dialog 16–18px VT323; small labels ≥14px VT323.

### Drawing primitives

| Primitive | Signature | Purpose |
|-----------|-----------|---------|
| `drawFrame` | `(ctx, x, y, w, h, opts={radius,fill,border,shadow})` | Classic double-border rounded frame: dark outer stroke → colored border band → white inner line → fill |
| `drawCursor` | `(ctx, x, y, size=10)` | Filled ► triangle for menus/options |
| `shadowText` | `(ctx, text, x, y, {font,color,align,baseline})` | Text with 1px dark drop shadow (GBA style) |
| `drawIcon` | `(ctx, name, x, y, size)` | Dispatches to icon painter registry (see §5) |

### Migration rule

Existing classes reference `Theme.palette.*` instead of literal hex. Semantic mappings preserved (notification severity colors, affordability graying, satisfaction color thresholds). One-off decorative literals may remain inside `theme.js` itself.

---

## 2. Fonts

- Files: `assets/fonts/press-start-2p.woff2`, `assets/fonts/vt323.woff2`, plus `assets/fonts/OFL-LICENSE.txt`.
- `@font-face` declarations added to `styles/main.css` (the only CSS change).
- `Game.init()` awaits `Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px VT323')])` before starting the render loop. Monospace fallback stacks mean a failed load degrades gracefully (usable, just less authentic).

---

## 3. Component Reskins

All changes are render-only. APIs, click handling, animation mechanics, and desktop/mobile branching stay as-is.

| Component | Change |
|-----------|--------|
| `Button` | GBA menu item: cream/tan fill, `drawFrame` border; hover = highlight tint; **pressed = inverted colors** (dark bg, light text — Gen 3 style); disabled = grayed, same border |
| `Panel` | Uses `drawFrame`; optional title rendered in PS2P on a small header notch |
| `NotificationSystem` | Same slide-in/5s/max-6 mechanics; mini GBA frame with severity-colored stripe |
| `Dialog` | Restyled frame; ► cursor drawn next to selected option; typewriter behavior unchanged |
| `EnergyBar` | Segmented fill (~10 segments, HP-bar feel); color by ratio: >50% green, 20–50% yellow, <20% red |
| `ShopMenu` / `MobileShopContent` | Category tabs as framed GBA tabs (active tab raised); equipment rows as framed list items; special-item gold label kept; affordability graying kept |
| HUD (time/weather/money) | Framed panels, VT323 text, pixel sun/moon icons replacing ☀️🌙 |
| Stats & Goal panels | `drawFrame` + VT323; goal progress bar segmented like energy bars |
| Selection UI (desktop inline + `MobileSelectionContent`) | Framed panel; UPGRADE/SELL as GBA menu-item buttons |
| Help panel / Victory overlay | Full-screen GBA dialog treatment, ► options, framed close button |
| Placement preview | Ghost sprite + green/red `drawFrame` validity indicator |

**Known risk:** Press Start 2P is wide; long button labels (e.g., "SHOP - $1234") may overflow current widths. Mitigation: measure text at draw time, fall back to smaller size or VT323 for strings that don't fit, widening specific buttons where needed.

---

## 4. Entity Sprite Redraws (`SpriteManager`)

All sprites redrawn against `Theme.palette`: dark outline pass, flat 2–3 tone shading, integer coordinates.

- **Solar panel** (60×40): metallic frame, tier-colored cell grid (tier colors above).
- **Battery** (40×60): casing + charge window that reflects actual charge. **Fixes latent bug:** `drawProceduralSprite('battery', …)` currently hardcodes charge at 70% because charge is never passed (`visualRenderer.js` `drawEquipment`). Change: pass charge ratio (from `WorldRenderer.drawEquipment`) into the battery painter.
- **Houses** (50×40): four distinct outlined silhouettes — cabin (brown, triangular roof) / family cottage (blue, sloped roof) / business block (gray, flat roof) / corporate tower (dark + gold). Color identities preserved.
- **Tier4 treatment**: existing gold border becomes a GBA-style sparkle/glint accent.

---

## 5. Pixel Icon Set

Procedural painters registered under `Theme.icons`, rendered via `Theme.drawIcon`: `sun`, `moon`, `panel`, `battery`, `house`, `coin`.

Replaces all canvas emoji: category tabs (`☀️🔋🏠`), time-of-day indicator, money display prefix. After Stage 1 there are zero emoji drawn on canvas.

---

## 6. Verification Plan

No test framework exists; verification is manual in-browser per repo convention.

1. Serve locally (`python -m http.server 8000`).
2. Desktop playthrough smoke test: buy → place → select → upgrade → sell; force weather/event via console; help panel open/close; victory overlay; gold goal-completion notification.
3. Emulated mobile (DevTools, iPhone landscape dims): drawer open/close, bottom sheet, drag-placement, long-press select.
4. Console free of errors; fonts confirmed loaded (no fallback flash after init).
5. Screenshot captures of key screens (HUD, shop, dialog/notification, victory) for user review before closing the stage.
6. Update `AGENTS.md`: new script order (`theme.js` first), file map entry for `theme.js` and `assets/fonts/`.

## Risks

| Risk | Mitigation |
|------|------------|
| PS2P overflow on long labels | Measure-and-fallback sizing; selective button widening |
| Font load failure | Monospace fallback stack; game remains fully usable |
| Pixel fonts illegible at small sizes | Minimum sizes specified (≥14px VT323, ≥12px PS2P only for short labels); verified in QA |
| Mobile regression while reskinning both paths | Verification step 3 runs every stage, not once |
