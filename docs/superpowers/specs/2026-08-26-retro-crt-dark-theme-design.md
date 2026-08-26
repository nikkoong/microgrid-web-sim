# Retro CRT Dark Theme — Design Spec

## Overview

Consistent dark pixel-art theme for the Solar Microgrid Management Game. A centralized Theme module provides retro-color CRT-green styling for all UI (menus, buttons, popups, colors, text). Pure visual redesign — all gameplay functionality preserved.

## Goals

- Consistent style guide with consistent, centralized coloring
- Dark theme with retro-terminal / CRT-green identity
- Pixel-art aesthetic (scanlines, bevels, phosphor glow, monospace pixel text)
- Consistent menus, buttons, popups, colors, text — visually pleasing
- Maintain 100% of existing functionality (visual-only change)
- No build tools/frameworks; dependency-free verification

## Approach

Centralized `window.Theme` module + CRT texture. All ~40 scattered hardcoded hex literals are replaced with Theme lookups. CRT treatment (offset bevels, scanlines, phosphor glow) applied via Theme helper functions. World sprites intentionally NOT retinted to preserve functional tier/severity color-coding.

---

## 1. Theme Module (`js/theme.js`)

Single source of truth, exported as `window.Theme`. Loaded first so helpers are available to all files.

### Palette

**Backgrounds:**
| Role | Hex |
|------|-----|
| bgBase | `#0d0f0a` (near-black, green tint) |
| panelBg | `#101710` (replaces `#f5f5dc`) |
| panelBgAlt | `#0b0f0a` (nested/alt panels) |
| backdrops | `rgba(0,0,0,0.85)` |

**Phosphor greens (primary):**
| Role | Hex |
|------|-----|
| green | `#33ff66` (primary) |
| greenDark | `#1fbf40` (hover/pressed) |
| greenDim | `#2e8b57` (secondary text) |
| greenFaint | `#1a3d24` (borders/disabled outlines) |

**Functional accents (severity + special states):**
| Role | Hex |
|------|-----|
| gold | `#ffd700` |
| amber | `#ffb000` (warnings) |
| red | `#ff3b30` (errors/delete) |
| cyan | `#00e5ff` (info) |
| purple | `#b57bff` (special/help) |

**Text:**
| Role | Hex |
|------|-----|
| text | `#b8ffc4` (main) |
| textBright | `#eaffe8` (highlighted) |
| textDim | `#5f7a68` (muted/disabled) |

**World (keep-listed, unchanged):**
| Role | Hex |
|------|-----|
| tier1 | `#2ecc71` |
| tier2 | `#74b9ff` |
| tier3 | `#a55eea` |
| tier4 | `#f1c40f` |
| (sprite colors preserved) | existing values |

### API

```js
window.Theme = {
  colors: { ...palette above... },
  fonts: { mono: "'Press Start 2P', monospace", ui: 'monospace' },
  panel(x, y, w, h, opts),     // CRT bevel panel + scanlines
  button(x, y, w, h, opts),    // CRT button with glow + bevel
  font(size),                  // "bold Npx monospace" string
  glow(ctx, color, blur),      // set shadow for phosphor glow
  severityColor(sev)           // high/medium/low/gold/info → accent
};
```

---

## 2. CRT Visual Treatment

All canvas-drawn, via Theme helpers for consistency.

### Panel treatment (`Theme.panel`)
Drawn in layered order on every panel (stats, goal, shop, selection, dialogs, help):
1. Dark fill (`panelBg`)
2. Offset bevel: 2px lighter top/left, 2px darker bottom/right (raised depth)
3. Scanlines: horizontal dark stripes every ~3px at ~8% opacity, clipped to panel
4. Thin border in `greenFaint`

### Button treatment (`Theme.button`)
- Dark fill, bevel (raised)
- Phosphor glow on border/text (`shadowColor: green`, `shadowBlur: 8`) when hovered/active
- Pressed: inverted bevel (sunken) + brighter green text
- Disabled: dim fill, no glow, `textDim`

### Text
- All UI text monospace, pixel-crisp (no anti-alias)
- `textBright` headings, `text` body, `textDim` disabled/muted
- Severity/affordability color-coding preserved

### Overlays (victory, help, notifications)
- Dark backdrops (existing), restyled to green palette
- Notifications keep color-coded stripe (error→red, warning→amber, success→green, info→cyan) on dark panel fill

### World sprites — NOT retinted
Buildings, solar panels, batteries keep tier colors. Gold/red/amber/status dots keep meaning. Preserves gameplay readability.

---

## 3. Files Changed

**New:**
- `js/theme.js` — `window.Theme` (loaded first)

**Modified (swap literals → Theme lookups):**
| File | Changes |
|------|---------|
| `index.html` | Add `<script src="js/theme.js">` as first script |
| `styles/main.css` | Body bg→dark, container gradient→dark CRT, canvas border/glow→green, remove dead `.pokemon-*` classes |
| `js/uiFramework.js` | Button, Panel, Dialog, EnergyBar, NotificationSystem, MobileDrawer, MobileBottomSheet, MobileShopContent, MobileSelectionContent → Theme |
| `js/main.js` | HUD buttons, stats/goal panels, selection panel, upgrade/sell buttons, victory overlay, help panel → Theme |
| `js/visualRenderer.js` | UI-label backgrounds, status dots, gold borders, drawLabelWithBackground → Theme (world sprite colors preserved) |

**Deliberately untouched (guarantee functionality):**
- `gameState.js`, `eventSystem.js`, `economicSystem.js`, `camera.js`
- All game-logic math, placement/selection/buy/sell/upgrade logic, save/load

---

## 4. Verification (dependency-free)

Manual DevTools console checks using existing quick-test commands:
- `Game.gameState` — inspect state; confirm panels/batteries/households load
- `Game.gameState.triggerWeatherChange()` — force weather; confirm rendering doesn't crash
- `Game.gameState.eventSystem.triggerRandomEvent()` — force crisis; confirm notification renders
- `Game.activateCheat()` — cheat state; confirm HUD updates
- Buy → place → sell flow still works
- `window.Theme` defined; canvas rendering non-blank

Diagnostics assert on DOMContentLoaded after `Game.init()`:
- canvas exists and has non-zero dimensions
- `window.Theme.colors.panelBg` is defined
- gameState has initial entities

---

## Critical Constraints

- No external dependencies — everything hand-rolled
- No build step — plain HTML/CSS/JS
- Script load order: `theme.js` FIRST → gameState → eventSystem → uiFramework → camera → visualRenderer → economicSystem → main
- All cross-file access via `window.ClassName`
- Time system: 1 real second = 1 game hour (unchanged)
- localStorage save/load via `StorageManager` (unchanged)
- Verify via browser DevTools console (no test suite)

## File map for reference

| File | Role |
|------|------|
| `js/theme.js` | NEW — palette + render helpers |
| `js/gameState.js` | GameState + StorageManager (untouched) |
| `js/eventSystem.js` | EventSystem (untouched) |
| `js/uiFramework.js` | UIElement, Button, Panel, Dialog, EnergyBar, NotificationSystem, MobileDrawer, MobileBottomSheet, MobileShopContent, MobileSelectionContent |
| `js/camera.js` | Camera + TouchHandler (untouched) |
| `js/visualRenderer.js` | SpriteManager, ParticleSystem, WorldRenderer |
| `js/economicSystem.js` | EquipmentCatalog, PurchaseManager, ShopMenu (untouched) |
| `js/main.js` | Game singleton — HUD, selection UI, victory, help |
