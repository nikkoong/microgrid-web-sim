# Retro CRT Dark Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a consistent dark retro-CRT-green theme across the entire UI via a centralized `window.Theme` module, without changing any gameplay behavior.

**Architecture:** A single `js/theme.js` module exports `window.Theme` with a color palette and render helper functions (`panel`, `button`, `font`, `glow`, `severityColor`). Every hardcoded hex literal in `uiFramework.js`, `visualRenderer.js`, and `main.js` is replaced with a `Theme` lookup. CRT texture (offset bevels, scanlines, phosphor glow) is applied through the helpers. World sprite colors are preserved.

**Tech Stack:** Vanilla HTML5 Canvas + JavaScript. No frameworks, no build tools, no npm.

**Spec:** `docs/superpowers/specs/2026-08-26-retro-crt-dark-theme-design.md`

## Global Constraints

- No external dependencies — everything hand-rolled
- No build step — plain HTML/CSS/JS
- Script load order: `theme.js` FIRST → gameState → eventSystem → uiFramework → camera → visualRenderer → economicSystem → main
- All cross-file access via `window.ClassName`
- Verify via browser DevTools console (no test suite)
- World sprite colors (tier1-4, buildings, status dots) remain unchanged
- `theme.js` must be geometry-agnostic: it takes explicit x/y/w/h and never assumes component internals

---

## File Structure

### Files to Create
| File | Responsibility |
|------|---------------|
| `js/theme.js` | `window.Theme` — palette + render helpers (panel, button, font, glow, severityColor) |

### Files to Modify
| File | Change |
|------|--------|
| `index.html` | Add `<script src="js/theme.js">` as first script |
| `styles/main.css` | Dark CRT background + canvas glow; remove dead `.pokemon-*` classes |
| `js/uiFramework.js` | Button, Panel, Dialog, EnergyBar, NotificationSystem, MobileDrawer, MobileBottomSheet, MobileShopContent, MobileSelectionContent → Theme |
| `js/visualRenderer.js` | UI-label backgrounds, status dots, gold borders, drawLabelWithBackground → Theme (world sprite colors preserved) |
| `js/main.js` | HUD buttons, stats/goal panels, selection panel, upgrade/sell buttons, victory overlay, help panel → Theme |

---

### Task 1: Create Theme Module

**Files:**
- Create: `js/theme.js`

**Interfaces:**
- Produces: `window.Theme` — object with `fonts`, `colors`, and methods `font(size)`, `glow(ctx,color,blur)`, `panel(ctx,x,y,w,h,opts)`, `button(ctx,x,y,w,h,opts)`, `severityColor(sev)`

- [ ] **Step 1: Write the Theme module**

Create `js/theme.js`:

```javascript
// Theme Module — centralized palette + CRT render helpers

window.Theme = {
    fonts: {
        mono: "'Press Start 2P', monospace",
        ui: 'monospace'
    },

    colors: {
        // Backgrounds
        bgBase: '#0d0f0a',
        panelBg: '#101710',
        panelBgAlt: '#0b0f0a',
        backdrops: 'rgba(0,0,0,0.85)',

        // Phosphor greens
        green: '#33ff66',
        greenDark: '#1fbf40',
        greenDim: '#2e8b57',
        greenFaint: '#1a3d24',

        // Functional accents
        gold: '#ffd700',
        amber: '#ffb000',
        red: '#ff3b30',
        cyan: '#00e5ff',
        purple: '#b57bff',

        // Text
        text: '#b8ffc4',
        textBright: '#eaffe8',
        textDim: '#5f7a68',

        // World (keep-listed, unchanged)
        world: {
            tier1: '#2ecc71',
            tier2: '#74b9ff',
            tier3: '#a55eea',
            tier4: '#f1c40f'
        }
    },

    // Returns a styled font string
    font(size, family) {
        const fam = family || this.fonts.ui;
        return `bold ${size}px ${fam}`;
    },

    // Set phosphor glow shadow; call ctx.shadowBlur=0 afterward to reset
    glow(ctx, color, blur) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur || 8;
    },

    // Draw a CRT panel: fill + bevel + scanlines + border
    panel(ctx, x, y, w, h, opts = {}) {
        const bg = opts.bgColor || this.colors.panelBg;
        const border = opts.borderColor || this.colors.greenFaint;
        const borderWidth = opts.borderWidth || 2;
        const bevel = opts.bevel !== undefined ? opts.bevel : this.colors.bgBase;

        // Fill
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, w, h);

        // Bevel: lighter top/left, darker bottom/right
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, y, w, 2);
        ctx.fillRect(x, y, 2, h);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x, y + h - 2, w, 2);
        ctx.fillRect(x + w - 2, y, 2, h);

        // Scanlines
        if (opts.scanlines !== false) {
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            for (let sy = y + 3; sy < y + h; sy += 3) {
                ctx.fillRect(x, sy, w, 1);
            }
        }

        // Border
        ctx.strokeStyle = border;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(x, y, w, h);
    },

    // Draw a CRT button: fill + bevel + optional glow + border
    // Returns nothing; caller sets text separately
    button(ctx, x, y, w, h, opts = {}) {
        const pressed = opts.pressed;
        const hover = opts.hover;
        const disabled = opts.disabled;
        const enabled = !disabled;

        let bg = opts.bgColor || this.colors.panelBgAlt;
        let border = opts.borderColor || this.colors.greenFaint;
        let glow = null;

        if (!disabled) {
            if (pressed) { bg = this.colors.greenDark; border = this.colors.green; glow = this.colors.green; }
            else if (hover) { bg = this.colors.panelBg; border = this.colors.greenDim; glow = this.colors.greenDim; }
        }

        // Bevel (inverted when pressed = sunken)
        if (pressed) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x, y, w, 2);
            ctx.fillRect(x, y, 2, h);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y + h - 2, w, 2);
            ctx.fillRect(x + w - 2, y, 2, h);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y, w, 2);
            ctx.fillRect(x, y, 2, h);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x, y + h - 2, w, 2);
            ctx.fillRect(x + w - 2, y, 2, h);
        }

        // Fill
        ctx.fillStyle = bg;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

        // Glow on border
        if (glow) {
            ctx.save();
            this.glow(ctx, glow, 8);
        }
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        if (glow) ctx.restore();
    },

    // Map severity -> accent color
    severityColor(sev) {
        switch (sev) {
            case 'error': return this.colors.red;
            case 'warning': return this.colors.amber;
            case 'success': return this.colors.green;
            case 'gold': return this.colors.gold;
            default: return this.colors.cyan;
        }
    }
};
```

- [ ] **Step 2: Verify Theme loads**

Open `http://localhost:8000`, DevTools console: `window.Theme.colors.panelBg` → returns `'#101710'`, `window.Theme.font('14')` → returns bold string.

- [ ] **Step 3: Commit**

```bash
git add js/theme.js
git commit -m "feat: add centralized CRT theme module (window.Theme)"
```

---

### Task 2: Wire theme.js into index.html + CSS dark background

**Files:**
- Modify: `index.html`
- Modify: `styles/main.css`

**Interfaces:**
- Consumes: `window.Theme` from Task 1

- [ ] **Step 1: Add theme.js as first script in index.html**

In `index.html`, add the theme script line BEFORE `js/gameState.js`:

```html
    <script src="js/theme.js"></script>
    <script src="js/gameState.js"></script>
```

- [ ] **Step 2: Update main.css for dark CRT background**

Replace the bright palette at the top of `styles/main.css`. Change `body` background-color to `#0d0f0a`, `#gameContainer` gradient to a dark CRT radial/linear, and `#gameCanvas` border/glow to green. Also remove the dead `.pokemon-*` classes (the `.pokemon-dialog` and `.pokemon-button` rules).

Specifically apply these edits:

```css
/* body: dark CRT base */
body {
    font-family: 'Press Start 2P', monospace;
    background-color: #0d0f0a;
    ...
}

/* container: subtle dark radial glow background */
#gameContainer {
    ...
    background: radial-gradient(circle at center, #101710 0%, #0d0f0a 100%);
    ...
}

/* canvas: green phosphor border + glow */
#gameCanvas {
    border: 4px solid #33ff66;
    border-radius: 8px;
    box-shadow:
        0 0 16px rgba(51, 255, 102, 0.4),
        0 0 32px rgba(51, 255, 102, 0.1),
        inset 0 0 8px rgba(0, 0, 0, 0.5);
    background-color: #101710;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
}
```

- [ ] **Step 3: Remove dead .pokemon-* CSS classes**

Delete the `.pokemon-dialog` and `.pokemon-button` rule blocks (they are unused by JS). Verify no other references.

- [ ] **Step 4: Manual check**

Open `http://localhost:8000`. Confirm: page background dark, canvas has green glow border. Console shows no errors; `window.Theme` defined.

- [ ] **Step 5: Commit**

```bash
git add index.html styles/main.css
git commit -m "feat: wire theme.js first and apply dark CRT CSS background"
```

---

### Task 3: Theme the Button and Panel classes (uiFramework.js)

**Files:**
- Modify: `js/uiFramework.js` (Button class lines 49-147, Panel class lines 149-199)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: `Button` and `Panel` classes use `Theme` for defaults

- [ ] **Step 1: Redefine Button defaults to use Theme**

In the `Button` constructor, change default style values from hardcoded hex to `Theme.colors`:

```javascript
this.style = {
    bgColor: style.bgColor || Theme.colors.red,
    hoverBgColor: style.hoverBgColor || Theme.colors.red,
    activeBgColor: style.activeBgColor || Theme.colors.greenDark,
    borderColor: style.borderColor || Theme.colors.red,
    textColor: style.textColor || Theme.colors.textBright,
    disabledBgColor: style.disabledBgColor || Theme.colors.panelBgAlt,
    disabledTextColor: style.disabledTextColor || Theme.colors.textDim,
    disabledBorderColor: style.disabledBorderColor || Theme.colors.greenFaint,
    fontSize: style.fontSize || '16px',
    fontFamily: style.fontFamily || Theme.fonts.ui
};
```

- [ ] **Step 2: Update Button.render to use Theme.button + Theme.font**

Replace the render draw section (the `ctx.fillStyle` through the border stroke) so it calls `Theme.button` and uses `Theme.font`. Change the font line to `ctx.font = Theme.font(this.style.fontSize);`. Keep the press-offset and multi-line text logic.

```javascript
// Replace the fill + border drawing block:
const pressOffset = this.clicked ? 2 : 0;
Theme.button(ctx, this.x + pressOffset, this.y + pressOffset, this.width, this.height, {
    bgColor, borderColor, hover, pressed: this.clicked, disabled: this.disabled
});
```

Note: `bgColor`, `borderColor` are already computed by the existing disabled/clicked/hovered branches. Pass those computed values plus the state flags.

- [ ] **Step 3: Update Panel defaults to use Theme**

In the `Panel` constructor:

```javascript
this.style = {
    bgColor: style.bgColor || Theme.colors.panelBg,
    borderColor: style.borderColor || Theme.colors.greenFaint,
    borderWidth: style.borderWidth || 3,
    textColor: style.textColor || Theme.colors.text,
    fontSize: style.fontSize || '14px',
    fontFamily: style.fontFamily || Theme.fonts.ui,
    borderRadius: style.borderRadius || 4
};
```

- [ ] **Step 4: Update Panel.render to use Theme.panel**

Replace the fill+stroke block in `Panel.render` with `Theme.panel(ctx, this.x, this.y, this.width, this.height, { bgColor: this.style.bgColor, borderColor: this.style.borderColor, borderWidth: this.style.borderWidth })`. Keep the title text rendering but change `ctx.font` to `Theme.font(this.style.fontSize)` and `ctx.fillStyle` to `this.style.textColor`.

- [ ] **Step 5: Manual check**

DevTools console: `JSON.stringify(Object.keys(Theme))` includes `panel`, `button`. Create a test button and render — call `new Button(0,0,100,40,'TEST',()=>{}).render(ctx)`; confirm no runtime errors and text/green colors appear.

- [ ] **Step 6: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: theme Button and Panel classes with CRT styles"
```

---

### Task 4: Theme Dialog and EnergyBar (uiFramework.js)

**Files:**
- Modify: `js/uiFramework.js` (Dialog lines 201-297, EnergyBar lines 299-336)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: `Dialog` and `EnergyBar` use `Theme`

- [ ] **Step 1: Update Dialog text rendering colors**

In `Dialog.render`, the text fill is already `this.style.textColor` (inherited from themed Panel). Change `ctx.font` from `this.style.fontSize + this.style.fontFamily` to `Theme.font(this.style.fontSize)`. The selected-option `►` prefix and options render unchanged. Border-radius default is already updated via Panel.

- [ ] **Step 2: Update EnergyBar colors + font**

In `EnergyBar.render`, change:

```javascript
ctx.fillStyle = '#333333';                    // → Theme.colors.panelBgAlt
ctx.fillRect(this.x, this.y, this.width, this.height);
ctx.fillStyle = this.color;                    // keep (accent passed in; may stay)
ctx.fillRect(this.x, this.y, fillWidth, this.height);
ctx.strokeStyle = '#000000';                   // → Theme.colors.greenFaint
ctx.lineWidth = 2;
ctx.strokeRect(this.x, this.y, this.width, this.height);
ctx.fillStyle = '#ffffff';                     // → Theme.colors.textBright
ctx.font = Theme.font(12);                     // replace '12px monospace'
```

- [ ] **Step 3: Manual check**

Load page. Confirm dialogs (trigger an event) render with dark panel + green text. Energy bars show on HUD with dark background + green label text.

- [ ] **Step 4: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: theme Dialog and EnergyBar with CRT styles"
```

---

### Task 5: Theme NotificationSystem (uiFramework.js)

**Files:**
- Modify: `js/uiFramework.js` (NotificationSystem lines 338-459)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: `NotificationSystem` uses `Theme.severityColor` and dark panel fill

- [ ] **Step 1: Replace severity color map with Theme.severityColor**

In `getSeverityColor()`, replace the hardcoded map so it calls `Theme.severityColor(sev)`. Keep the switch semantics but simplify:

```javascript
getSeverityColor(severity) {
    return Theme.severityColor(severity);
}
```

- [ ] **Step 2: Update standard notification render**

In the standard render branch, replace `#2d3436` background with `Theme.colors.panelBgAlt`, and text `#ffffff` with `Theme.colors.textBright`. Keep the colored left stripe. In the gold branch, keep gold bg/border but change text to `Theme.colors.bgBase` (dark for contrast).

- [ ] **Step 3: Manual check**

DevTools console: `Game.gameState.eventSystem.triggerRandomEvent()` → notification appears with dark panel + colored stripe + readable text. No errors.

- [ ] **Step 4: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: theme NotificationSystem severity colors and fills"
```

---

### Task 6: Theme MobileDrawer and MobileBottomSheet (uiFramework.js)

**Files:**
- Modify: `js/uiFramework.js` (MobileDrawer lines 462-637, MobileBottomSheet lines 640-751)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: mobile drawer/sheet use `Theme` colors

- [ ] **Step 1: Update MobileDrawer style**

Replace drawer `bgColor` `rgba(45,52,54,0.95)` → `Theme.colors.bgBase` (with 0.95 alpha), `borderColor` `#4a4a4a` → `Theme.colors.greenFaint`, `titleColor` `#ffffff`→`Theme.colors.textBright`, `handleColor` `#6c5ce7` → keep purple accent `Theme.colors.purple`. Update the close button `#ff6b6b` → `Theme.colors.red` and white `×` → `Theme.colors.textBright`. Update `ctx.font` strings to use `Theme.font(n)`.

- [ ] **Step 2: Update MobileBottomSheet style**

Replace sheet `bgColor` `rgba(45,52,54,0.98)` → `Theme.colors.bgBase` (0.98 alpha), `borderColor` → `Theme.colors.greenFaint`, `titleColor` → `Theme.colors.textBright`, `handleColor` → `Theme.colors.greenDim`. Update fonts to `Theme.font(n)`.

- [ ] **Step 3: Manual check**

On mobile viewport (DevTools device emulation), open the shop drawer and bottom sheet. Confirm dark theme + green title/handle + red close.

- [ ] **Step 4: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: theme MobileDrawer and MobileBottomSheet"
```

---

### Task 7: Theme MobileShopContent and MobileSelectionContent (uiFramework.js)

**Files:**
- Modify: `js/uiFramework.js` (MobileShopContent lines 754-923, MobileSelectionContent lines 926-1092)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: mobile shop/selection content uses `Theme`

- [ ] **Step 1: Update MobileShopContent category buttons**

Replace selected color `#6c5ce7` → `Theme.colors.greenDark`, unselected `#4a4a4a` → `Theme.colors.panelBgAlt`, borders → `Theme.colors.greenDim`/`Theme.colors.greenFaint`. Keep text `#ffffff` → `Theme.colors.textBright`. Update font size strings to `Theme.font(n)`.

- [ ] **Step 2: Update MobileShopContent equipment buttons**

Replace normal bg `#2d3436` → `Theme.colors.panelBg`, special bg `#3d3d6b` → `Theme.colors.panelBgAlt` (keep gold border `Theme.colors.gold`), disabled bg `#1a1a1a` → `Theme.colors.bgBase`. Money text `#00b894` → `Theme.colors.green`. Update fonts to `Theme.font(n)`.

- [ ] **Step 3: Update MobileSelectionContent**

Replace entity text `#ffffff` → `Theme.colors.textBright`, tier label `#ffd700`→`Theme.colors.gold`, satisfaction colors `#00b894`/`#fdcb6e`/`#d63031` → `Theme.colors.green`/`Theme.colors.amber`/`Theme.colors.red`. Upgrade button `#00b894`→`Theme.colors.green`, Sell `#d63031`→`Theme.colors.red`. Update fonts.

- [ ] **Step 4: Manual check**

Mobile viewport: shop items render in dark green theme; selecting an entity shows upgrade/sell button colors.

- [ ] **Step 5: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: theme MobileShopContent and MobileSelectionContent"
```

---

### Task 8: Theme visualRenderer.js UI layers

**Files:**
- Modify: `js/visualRenderer.js` (WorldRenderer UI-label/status/gold-border methods)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: WorldRenderer UI overlays use `Theme` (world sprites unchanged)

- [ ] **Step 1: Update drawStatusDot severity colors**

In `drawStatusDot`, replace `high #d63031`, `medium #fdcb6e`, `low #74b9ff` with `Theme.severityColor` lookups or `Theme.colors.red`/`Theme.colors.amber`/`Theme.colors.cyan`. Keep the white border. (World sprite drawing untouched.)

- [ ] **Step 2: Update drawLabelWithBackground + entity label colors**

In `drawLabelWithBackground`, replace bg `rgba(255,255,255,0.8)` → `Theme.colors.panelBgAlt` (with 0.85 alpha), border `rgba(0,0,0,0.3)` → `Theme.colors.greenFaint`. In `drawEntityLabels`, replace solar/battery label `#000000` → `Theme.colors.textBright`, household satisfaction `#00aa00`/`#cc9900`/`#cc0000` → `Theme.colors.green`/`Theme.colors.amber`/`Theme.colors.red`. Change `ctx.font` to `Theme.font(10)`.

- [ ] **Step 3: Update gold border for tier4/corporate**

In `drawGoldBorder`, keep `#ffd700`? No — replace with `Theme.colors.gold`. (Value identical but now themed.)

- [ ] **Step 4: Manual check**

Load page. Confirm world sprites keep their colors (green/blue/purple/gold tiers), labels are dark-backed green text, status dots color-coded correctly.

- [ ] **Step 5: Commit**

```bash
git add js/visualRenderer.js
git commit -m "feat: theme visualRenderer UI labels, status dots, gold borders"
```

---

### Task 9: Theme main.js HUD (createHUD)

**Files:**
- Modify: `js/main.js` (createHUD lines 271-397)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: HUD buttons use `Theme` colors

- [ ] **Step 1: Update HUD button colors**

In `createHUD`, replace button `style` colors:
- Money/Shop button: `#00b894`→`Theme.colors.green`, hover `#00cec9`→`Theme.colors.greenDark`, active `#00a884`→`Theme.colors.greenDark`, border `#00cec9`→`Theme.colors.greenDim`, text `#ffffff`→`Theme.colors.textBright`.
- Pause button: `#74b9ff`→`Theme.colors.cyan`, hover `#0984e3`→`Theme.colors.cyan`, active `#0652dd`→`Theme.colors.cyan`, font.
- Weather/Time buttons: keep transparent, but text `#000000`→`Theme.colors.textBright`.
- Start New Game: `#e17055`→`Theme.colors.amber`, hover `#d63031`→`Theme.colors.red`, active `#c0392b`→`Theme.colors.red`.
- Help (?): `#6c5ce7`→`Theme.colors.purple`, hover/active → purple variants.
- Cancel (mobile placement): `#d63031`→`Theme.colors.red`, hover → `Theme.colors.red`, etc.
- Gen/Stor/Use bars: keep fill accents (they carry meaning), but the EnergyBar background/border/text are already themed by Task 4.

- [ ] **Step 2: Manual check**

Load page. Confirm HUD buttons render in green/cyan/purple/red theme, bars show green text.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: theme main.js HUD buttons and bars"
```

---

### Task 10: Theme main.js stats/goal/selection panels

**Files:**
- Modify: `js/main.js` (renderGameState lines 1281-1416, renderSelectionUI lines 1461-1670)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: stats/goal/selection panels themed

- [ ] **Step 1: Update stat/goal text and bar colors**

In `renderGameState`, stat text `#2b2b2b` → `Theme.colors.text`, goal text `#2b2b2b`→`Theme.colors.textBright`, goal progress bar bg `#cccccc` → `Theme.colors.panelBgAlt`, fill `#00b894` → `Theme.colors.green`, all-goals text `#00b894`→`Theme.colors.green`. Update `ctx.font` to `Theme.font(n)`.

- [ ] **Step 2: Update selection panel colors**

In `renderSelectionUI`, event status tags `#d63031`/`#fdcb6e`/`#74b9ff` → `Theme.colors.red`/`Theme.colors.amber`/`Theme.colors.cyan`, affected stat `#d63031`→`Theme.colors.red`. Upgrade button affordable `#00b894`→`Theme.colors.green`, cant-afford `#a0a0a0`→`Theme.colors.panelBgAlt`, max-tier `#888888`→`Theme.colors.textDim`. Delete button `#ff6b6b`→`Theme.colors.red` variants. Panel bg already themed via Panel class.

- [ ] **Step 3: Manual check**

Select an entity (click on world). Confirm selection panel dark + green text, upgrade/sell buttons colored correctly.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: theme stats, goal, and selection panels"
```

---

### Task 11: Theme main.js victory overlay + help panel

**Files:**
- Modify: `js/main.js` (renderVictoryOverlay lines 1672-1738, renderHelpPanel lines 1740-1989)

**Interfaces:**
- Consumes: `window.Theme` (Task 1)
- Produces: victory/help overlays themed

- [ ] **Step 1: Update victory overlay**

Backdrop `rgba(0,0,0,0.85)` → `Theme.colors.backdrops`. Banner bg `#2d3436`→`Theme.colors.panelBg`, border `#ffd700`→`Theme.colors.gold`. Title `#ffd700`→`Theme.colors.gold`. Subtitle `#ffffff`→`Theme.colors.textBright`. "Did You Know?" `#00b894`→`Theme.colors.green`. Fun fact `#ffffff`→`Theme.colors.text`. Button `#00b894`→`Theme.colors.green`, hover `#00cec9`→`Theme.colors.greenDark`, border `#00a884`→`Theme.colors.greenDim`, text `#ffffff`→`Theme.colors.textBright`. Update fonts to `Theme.font(n)`.

- [ ] **Step 2: Update help panel**

Panel bg `#f5f5dc`→`Theme.colors.panelBg`. Border `#6c5ce7`→`Theme.colors.purple`. Title/section headers `#6c5ce7`→`Theme.colors.purple`, body text `#2b2b2b`→`Theme.colors.text`. Section accents `#00b894`→`Theme.colors.green`. Event list headers use `Theme.severityColor`. Close button `#ff6b6b`→`Theme.colors.red` variants. Update fonts.

- [ ] **Step 3: Manual check**

Trigger victory (or call `renderVictoryOverlay` with a state) and open help (?). Confirm dark green CRT styling, readable text.

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: theme victory overlay and help panel"
```

---

### Task 12: Final smoke test + verification

**Files:**
- Modify: none (verification only; fix any bugs found in prior tasks)

**Interfaces:**
- Consumes: all prior tasks

- [ ] **Step 1: Start server and open the game**

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

- [ ] **Step 2: Run DevTools smoke checks**

In console, run each and confirm no errors + expected value:
```javascript
window.Theme && window.Theme.colors.panelBg === '#101710'  // Theme loaded
Game.gameState.solarPanels.length > 0                       // entities load
Game.gameState.batteries.length > 0
Game.gameState.households.length > 0
```
Then exercise functionality:
```javascript
Game.gameState.triggerWeatherChange()   // weather event, no crash
Game.gameState.eventSystem.triggerRandomEvent()  // crisis + notification, no crash
Game.activateCheat()                    // cheat state, HUD updates
```

- [ ] **Step 3: Confirm buy → place → sell flow**

Use DevTools to simulate: open shop, buy a solar panel, place it on the world, select it, sell it. Confirm money changes correctly and placement/selection UI renders.

- [ ] **Step 4: Fix any defects found**

If any console error or broken UI, fix inline in the relevant file and re-run Step 2.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: verify retro CRT theme preserves functionality"
```

---

## Completion Checklist

- [ ] `js/theme.js` created with full palette + helpers
- [ ] `window.Theme` loaded first in index.html
- [ ] main.css dark CRT background + canvas glow; dead `.pokemon-*` removed
- [ ] Button, Panel, Dialog, EnergyBar, NotificationSystem themed
- [ ] MobileDrawer, MobileBottomSheet, MobileShopContent, MobileSelectionContent themed
- [ ] visualRenderer UI labels, status dots, gold borders themed (world sprites unchanged)
- [ ] main.js HUD, stats/goal/selection panels, victory overlay, help panel themed
- [ ] Buy → place → sell flow still works
- [ ] Weather + crisis events render without errors
- [ ] No console errors on load
