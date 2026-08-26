# GBA UI Redesign — Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the game's entire UI chrome and entity sprites into an authentic Game Boy Advance (Gen 3) style with zero gameplay changes.

**Architecture:** A new `js/theme.js` module becomes the single source of truth for palette, fonts, and canvas drawing primitives. All UI classes in `uiFramework.js`, `economicSystem.js`, and `main.js` consume it render-only. `SpriteManager` redraws entities as outlined pixel art. Two local OFL fonts are shipped under `assets/fonts/` and loaded before the render loop starts.

**Tech Stack:** Vanilla JS (ES6+) + HTML5 Canvas. No frameworks, no build tools, no npm, no runtime CDN. Two local font files (Press Start 2P, VT323).

**Spec:** `docs/superpowers/specs/2026-08-25-gba-ui-redesign-design.md`

## Global Constraints

- Vanilla JS, no frameworks, no build step, no npm, no runtime CDN. Fonts are local files under `assets/fonts/`.
- No gameplay, economy, event, entity-ID, or layout/coordinate changes. Skin-only.
- Desktop AND emulated-mobile (iPhone landscape) code paths must both remain functional after every task.
- No test framework exists. Per `AGENTS.md`, verification is manual: serve locally, open DevTools, run console checks + visual checks listed per task.
- All drawing reads from `window.Theme`; no new hardcoded hex/font literals outside `theme.js`.
- Font sizes are integers. Heading (Press Start 2P): 14–24px. Body (VT323): 16–18px.
- Script order: `theme.js` first, then the existing order (`gameState.js → eventSystem.js → uiFramework.js → camera.js → visualRenderer.js → economicSystem.js → main.js`).
- Commit after each task.

---

### Task 1: Theme module, fonts, script order

**Files:**
- Create: `js/theme.js`
- Create: `assets/fonts/PressStart2P-Regular.ttf`, `assets/fonts/VT323-Regular.ttf`, `assets/fonts/OFL-PressStart2P.txt`, `assets/fonts/OFL-VT323.txt`
- Modify: `styles/main.css` (append `@font-face` rules)
- Modify: `index.html:19` (insert `<script src="js/theme.js"></script>` before `gameState.js`)
- Modify: `js/main.js` `init()` (await fonts before starting loop, around `main.js:109`)

**Interfaces:**
- Consumes: nothing (first module loaded)
- Produces: `window.Theme` with
  - `Theme.palette` (object of hex/rgba tokens — see code below)
  - `Theme.font.heading(px)` → `'<px>px "Press Start 2P", monospace'`
  - `Theme.font.body(px)` → `'<px>px "VT323", monospace'`
  - `Theme.drawFrame(ctx, x, y, w, h, opts)` where `opts = { radius, fill, border, shadow }`
  - `Theme.roundRect(ctx, x, y, w, h, r)` (path helper)
  - `Theme.drawCursor(ctx, x, y, size)`
  - `Theme.shadowText(ctx, text, x, y, { font, color, align, baseline, shadowColor })`
  - `Theme.drawSegments(ctx, x, y, w, h, ratio, color, segments=10)`

- [ ] **Step 1: Download font assets**

Run:
```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/PressStart2P-Regular.ttf https://github.com/google/fonts/raw/main/ofl/pressstart2p/PressStart2P-Regular.ttf
curl -L -o assets/fonts/VT323-Regular.ttf https://github.com/google/fonts/raw/main/ofl/vt323/VT323-Regular.ttf
curl -L -o assets/fonts/OFL-PressStart2P.txt https://github.com/google/fonts/raw/main/ofl/pressstart2p/OFL.txt
curl -L -o assets/fonts/OFL-VT323.txt https://github.com/google/fonts/raw/main/ofl/vt323/OFL.txt
```
Expected: four files exist (`ls -la assets/fonts`), each non-empty.

- [ ] **Step 2: Add @font-face to styles/main.css**

Append:
```css
@font-face {
    font-family: 'Press Start 2P';
    src: url('../assets/fonts/PressStart2P-Regular.ttf') format('truetype');
    font-display: block;
}

@font-face {
    font-family: 'VT323';
    src: url('../assets/fonts/VT323-Regular.ttf') format('truetype');
    font-display: block;
}
```

- [ ] **Step 3: Create js/theme.js**

```javascript
// GBA visual theme: palette, fonts, and canvas drawing primitives.
// Single source of truth for all UI/visual constants. No hardcoded hex outside this file.

const Theme = {
    palette: {
        outline: '#1a2028',
        frameBorder: '#3a7a5a',
        frameHighlight: '#ffffff',
        panelBg: '#f8f4dc',
        panelBgTan: '#e8dcc0',
        panelShadow: 'rgba(0, 0, 0, 0.25)',
        textDark: '#282828',
        textLight: '#f8f8f8',
        textDisabled: '#888888',
        success: '#48a868',
        warning: '#f0b040',
        danger: '#e04838',
        info: '#58a8d8',
        gold: '#f8c830',
        money: '#00b894',
        tier1: '#2ecc71',
        tier2: '#74b9ff',
        tier3: '#a55eea',
        tier4: '#f1c40f',
        gridLine: 'rgba(0, 0, 0, 0.1)',
        grassBg: '#90ee90',
    },

    font: {
        heading(px) { return `${px}px "Press Start 2P", monospace`; },
        body(px) { return `${px}px "VT323", monospace`; },
    },

    roundRect(ctx, x, y, w, h, r) {
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // Classic double-border GBA frame: dark outer stroke, colored band,
    // white inner line, fill. Optional soft drop shadow.
    drawFrame(ctx, x, y, w, h, opts = {}) {
        const radius = opts.radius ?? 8;
        const fill = opts.fill ?? this.palette.panelBg;
        const border = opts.border ?? this.palette.frameBorder;
        ctx.save();
        if (opts.shadow !== false) {
            ctx.fillStyle = this.palette.panelShadow;
            this.roundRect(ctx, x + 3, y + 4, w, h, radius);
            ctx.fill();
        }
        ctx.fillStyle = this.palette.outline;
        this.roundRect(ctx, x, y, w, h, radius);
        ctx.fill();
        ctx.fillStyle = border;
        this.roundRect(ctx, x + 2, y + 2, w - 4, h - 4, Math.max(2, radius - 2));
        ctx.fill();
        ctx.fillStyle = this.palette.frameHighlight;
        this.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(2, radius - 4));
        ctx.fill();
        ctx.fillStyle = fill;
        this.roundRect(ctx, x + 6, y + 6, w - 12, h - 12, Math.max(2, radius - 5));
        ctx.fill();
        ctx.restore();
    },

    drawCursor(ctx, x, y, size = 10) {
        ctx.save();
        ctx.fillStyle = this.palette.textDark;
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    shadowText(ctx, text, x, y, opts = {}) {
        ctx.save();
        ctx.font = opts.font || this.font.body(18);
        ctx.textAlign = opts.align || 'left';
        ctx.textBaseline = opts.baseline || 'alphabetic';
        ctx.fillStyle = opts.shadowColor || 'rgba(26, 32, 40, 0.5)';
        ctx.fillText(text, x + 1, y + 2);
        ctx.fillStyle = opts.color ?? this.palette.textDark;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    // Segmented GBA HP-bar style fill. ratio in [0,1]; color is the fill color.
    drawSegments(ctx, x, y, w, h, ratio, color, segments = 10) {
        ratio = Math.max(0, Math.min(1, ratio));
        const gap = Math.max(1, Math.floor(h * 0.12));
        const segW = (w - gap * (segments - 1)) / segments;
        const filled = Math.round(ratio * segments);
        for (let i = 0; i < segments; i++) {
            ctx.fillStyle = i < filled ? color : 'rgba(26, 32, 40, 0.35)';
            ctx.fillRect(Math.round(x + i * (segW + gap)), Math.round(y), Math.floor(segW), Math.round(h));
        }
    },
};

window.Theme = Theme;
```

- [ ] **Step 4: Load theme.js first in index.html**

Change the first script tag block so `theme.js` precedes `gameState.js`:
```html
<script src="js/theme.js"></script>
<script src="js/gameState.js"></script>
```

- [ ] **Step 5: Await fonts before render loop in main.js**

In `Game.init()` (currently `main.js:109` `this.startGameLoop();`), replace:
```javascript
this.startGameLoop();
```
with:
```javascript
Promise.all([
    document.fonts.load('16px "Press Start 2P"'),
    document.fonts.load('16px VT323'),
]).catch(() => {}).finally(() => {
    this.startGameLoop();
});
```

- [ ] **Step 6: Verify**

Run: `python -m http.server 8000`, open `http://localhost:8000`.
Expected:
- No console errors.
- `Theme` is defined: `typeof window.Theme === 'object'` → `"object"`.
- Fonts loaded: `document.fonts.check('16px "Press Start 2P"')` → `true` and `document.fonts.check('16px VT323')` → `true`.
- Game still fully playable (game loop runs; panels/batteries/houses render).

- [ ] **Step 7: Commit**

```bash
git add js/theme.js index.html styles/main.css assets/fonts/
git commit -m "feat: add GBA theme module, local pixel fonts, script order"
```

---

### Task 2: Pixel icon painters

**Files:**
- Modify: `js/theme.js` (append `icons` registry + `drawIcon`)

**Interfaces:**
- Consumes: `Theme.palette`
- Produces:
  - `Theme.icons = { sun, moon, panel, battery, house, coin }` — each `(ctx, x, y, s)` paints an `s×s` blocky pixel icon at `(x, y)`
  - `Theme.drawIcon(ctx, name, x, y, s)` dispatches to the registry

- [ ] **Step 1: Append icon painters to js/theme.js**

Add inside the `Theme` object (before `window.Theme = Theme;`):
```javascript
    icons: {
        sun(ctx, x, y, s) {
            const c = '#f8c830', o = '#1a2028';
            ctx.fillStyle = o;
            ctx.fillRect(x, y + s * 0.4, s, s * 0.2);
            ctx.fillRect(x + s * 0.4, y, s * 0.2, s);
            ctx.fillStyle = c;
            ctx.fillRect(x + s * 0.25, y + s * 0.25, s * 0.5, s * 0.5);
            ctx.fillStyle = o;
            ctx.fillRect(x + s * 0.35, y + s * 0.35, s * 0.3, s * 0.3);
        },
        moon(ctx, x, y, s) {
            ctx.fillStyle = '#f8f8e0';
            ctx.fillRect(x + s * 0.2, y, s * 0.6, s);
            ctx.fillRect(x, y + s * 0.15, s, s * 0.7);
            ctx.fillStyle = '#2b3a5a';
            ctx.fillRect(x + s * 0.05, y + s * 0.15, s * 0.55, s * 0.7);
            ctx.fillStyle = '#f8f8e0';
            ctx.fillRect(x + s * 0.65, y + s * 0.3, s * 0.15, s * 0.15);
        },
        panel(ctx, x, y, s) {
            const t = '#2ecc71';
            ctx.fillStyle = '#9aa4b0';
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = t;
            ctx.fillRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.7);
            ctx.fillStyle = '#1a2028';
            ctx.fillRect(x + s * 0.15, y + s * 0.35, s * 0.7, s * 0.1);
            ctx.fillRect(x + s * 0.35, y + s * 0.15, s * 0.1, s * 0.7);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.08);
        },
        battery(ctx, x, y, s) {
            ctx.fillStyle = '#1a2028';
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = '#3a7a5a';
            ctx.fillRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9);
            ctx.fillStyle = '#f8f4dc';
            ctx.fillRect(x + s * 0.35, y - s * 0.1, s * 0.3, s * 0.1);
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.55, s * 0.6);
            ctx.fillStyle = '#f8f4dc';
            ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.55, s * 0.08);
        },
        house(ctx, x, y, s) {
            ctx.fillStyle = '#1a2028';
            ctx.fillRect(x, y + s * 0.2, s, s * 0.8);
            ctx.fillRect(x, y + s * 0.2, s, s * 0.12);
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + s * 0.08, y + s * 0.35, s * 0.84, s * 0.6);
            ctx.fillStyle = '#e8dcc0';
            ctx.fillRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.12);
            ctx.fillStyle = '#654321';
            ctx.fillRect(x + s * 0.4, y + s * 0.6, s * 0.2, s * 0.35);
        },
        coin(ctx, x, y, s) {
            ctx.fillStyle = '#1a2028';
            ctx.fillRect(x, y + s * 0.1, s, s * 0.8);
            ctx.fillRect(x + s * 0.1, y, s * 0.8, s);
            ctx.fillStyle = '#f8c830';
            ctx.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8);
            ctx.fillStyle = '#1a2028';
            ctx.fillRect(x + s * 0.3, y + s * 0.1, s * 0.4, s * 0.8);
            ctx.fillStyle = '#f8c830';
            ctx.fillRect(x + s * 0.38, y + s * 0.1, s * 0.24, s * 0.8);
        },
    },

    drawIcon(ctx, name, x, y, s) {
        const painter = this.icons[name];
        if (painter) painter(ctx, Math.round(x), Math.round(y), Math.round(s));
    },
```

- [ ] **Step 2: Verify**

Serve and open DevTools. Run this snippet (draws all icons in a loop so the render loop doesn't wipe them):
```javascript
let n = 0;
const iv = setInterval(() => {
    if (n++ > 90) { clearInterval(iv); return; }
    Object.keys(Theme.icons).forEach((k, i) => Theme.drawIcon(Game.ctx, k, 120 + i * 90, 400, 40));
}, 50);
```
Expected: six recognizable blocky icons (sun, moon, panel, battery, house, coin) across the canvas at y≈400. No console errors.

- [ ] **Step 3: Commit**

```bash
git add js/theme.js
git commit -m "feat: add pixel icon painters to theme"
```

---

### Task 3: Button + Panel restyle

**Files:**
- Modify: `js/uiFramework.js` — `Button` constructor defaults (`:54-65`), `Button.render` (`:75-125`); `Panel.render` (`:164-184`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.font.heading/body`, `Theme.shadowText`, `Theme.palette`
- Produces: `Button` style option `font` (`'heading' | 'body'`, default `'heading'`). `Panel` renders framed with a Press Start 2P title tab. No API changes.

- [ ] **Step 1: Update Button constructor defaults**

Replace the style defaults block (currently `uiFramework.js:54-65`) so unstyled buttons match the GBA look:
```javascript
        this.style = {
            bgColor: style.bgColor || '#e8dcc0',
            hoverBgColor: style.hoverBgColor || '#d4c4a8',
            activeBgColor: style.activeBgColor || '#1a2028',
            borderColor: style.borderColor || '#1a2028',
            textColor: style.textColor || '#282828',
            disabledBgColor: style.disabledBgColor || '#c8c8b0',
            disabledTextColor: style.disabledTextColor || '#888888',
            disabledBorderColor: style.disabledBorderColor || '#888888',
            fontSize: style.fontSize || '16px',
            fontFamily: style.fontFamily || 'monospace',
            font: style.font || 'heading'
        };
```

- [ ] **Step 2: Rewrite Button.render**

Replace the body of `Button.render` (between `render(ctx) {` and the closing `super.render(ctx); }` of the method, currently `uiFramework.js:75-125`) with:
```javascript
    render(ctx) {
        if (!this.visible) return;

        const pressOffset = this.clicked ? 2 : 0;
        const x = this.x + pressOffset;
        const y = this.y + pressOffset;

        let fill, textColor, border;
        if (this.disabled) {
            fill = this.style.disabledBgColor;
            textColor = this.style.disabledTextColor;
            border = this.style.disabledBorderColor;
        } else if (this.clicked) {
            fill = Theme.palette.outline;
            textColor = Theme.palette.panelBg;
            border = Theme.palette.outline;
        } else if (this.hovered) {
            fill = this.style.hoverBgColor;
            textColor = this.style.textColor;
            border = this.style.borderColor;
        } else {
            fill = this.style.bgColor;
            textColor = this.style.textColor;
            border = this.style.borderColor;
        }

        if (this.style.bgColor !== 'transparent') {
            Theme.drawFrame(ctx, x, y, this.width, this.height, {
                radius: 6,
                fill,
                border,
                shadow: false
            });
        }

        const font = this.style.font === 'body'
            ? Theme.font.body(parseInt(this.style.fontSize, 10))
            : Theme.font.heading(parseInt(this.style.fontSize, 10));

        const lines = this.text.split('\n');
        const lineHeight = parseInt(this.style.fontSize, 10) + 6;
        const totalHeight = lines.length * lineHeight;
        const startY = y + (this.height - totalHeight) / 2 + lineHeight / 2;
        lines.forEach((line, index) => {
            Theme.shadowText(ctx, line, x + this.width / 2, startY + index * lineHeight, {
                font,
                color: textColor,
                align: 'center',
                baseline: 'middle',
                shadowColor: 'rgba(26, 32, 40, 0.35)'
            });
        });

        super.render(ctx);
    }
```

Note: transparent-bg Buttons (time/weather display rows) skip the frame and draw text only — existing behavior preserved.

- [ ] **Step 3: Rewrite Panel.render**

Replace the body of `Panel.render` (currently `uiFramework.js:164-184`) with:
```javascript
    render(ctx) {
        if (!this.visible) return;

        Theme.drawFrame(ctx, this.x, this.y, this.width, this.height, {
            radius: this.style.borderRadius,
            fill: this.style.bgColor,
            border: this.style.borderColor
        });

        if (this.title) {
            // Title tab (small raised notch, Press Start 2P)
            const tabW = Math.min(this.title.length * 12 + 16, this.width - 20);
            ctx.fillStyle = this.style.borderColor;
            ctx.fillRect(this.x + 8, this.y - 8, tabW, 12);
            ctx.fillStyle = Theme.palette.frameHighlight;
            ctx.fillRect(this.x + 8, this.y - 8, tabW, 2);
            Theme.shadowText(ctx, this.title, this.x + 16, this.y - 0, {
                font: Theme.font.heading(12),
                color: Theme.palette.textLight,
                align: 'left',
                baseline: 'middle',
                shadowColor: 'rgba(0, 0, 0, 0.6)'
            });
        }

        super.render(ctx);
    }
```

- [ ] **Step 4: Verify**

Serve and open. Expected:
- Top-right `SHOP - $1000` button: tan fill, double-border frame, white inner line; hover lightens; **click inverts** to dark bg + light text.
- Goal/stats panels: framed, cream fill, dark title tab on top edge reading the panel title in a chunky pixel font.
- Pause, `?`, New Game buttons framed and themed.
- Clicking any button still fires its action (verify: pause toggles label, SHOP opens menu).
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: GBA frame styling for Button and Panel"
```

---

### Task 4: EnergyBar segmented fill

**Files:**
- Modify: `js/uiFramework.js` — `EnergyBar.render` (`:312-335`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.drawSegments`, `Theme.font.body`, `Theme.shadowText`, `Theme.palette`
- Produces: unchanged `EnergyBar` API

- [ ] **Step 1: Rewrite EnergyBar.render**

Replace the body of `EnergyBar.render` (currently `uiFramework.js:312-335`) with:
```javascript
    render(ctx) {
        if (!this.visible) return;

        const ratio = this.maxValue > 0 ? Math.min(this.currentValue / this.maxValue, 1) : 0;
        const color = ratio > 0.5 ? Theme.palette.success : ratio > 0.2 ? Theme.palette.warning : Theme.palette.danger;

        Theme.drawFrame(ctx, this.x - 2, this.y - 2, this.width + 4, this.height + 4, {
            radius: 5,
            fill: '#333333',
            border: Theme.palette.outline,
            shadow: false
        });
        Theme.drawSegments(ctx, this.x, this.y, this.width, this.height, ratio, color, 10);

        Theme.shadowText(ctx, `${this.label}: ${this.currentValue.toFixed(1)}/${this.maxValue.toFixed(1)}`,
            this.x + this.width / 2, this.y + this.height / 2 + 1, {
                font: Theme.font.body(16),
                color: '#ffffff',
                align: 'center',
                baseline: 'middle',
                shadowColor: 'rgba(0, 0, 0, 0.6)'
            });
    }
```

- [ ] **Step 2: Verify**

Serve and open. Expected:
- Gen/Stor/Use bars now render as ~10 segmented blocks (filled blocks in color, empty blocks dark), framed, with label text overlaid.
- Bars update live with generation/storage/consumption.
- Create a deficit (delete batteries or add households via shop) — the bar color shifts toward yellow/red as ratio drops below 50%/20%.

- [ ] **Step 3: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: segmented GBA-style energy bars"
```

---

### Task 5: NotificationSystem restyle

**Files:**
- Modify: `js/uiFramework.js` — `NotificationSystem.getSeverityColor` (`:364-373`), `NotificationSystem.render` (`:397-457`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.font.body`, `Theme.shadowText`, `Theme.palette`
- Produces: unchanged API; severity → palette color mapping (error→danger, warning→warning, success→success, gold→gold, info→info)

- [ ] **Step 1: Map severity colors to palette**

Replace `getSeverityColor` body (currently `uiFramework.js:364-373`) with:
```javascript
    getSeverityColor(severity) {
        switch (severity) {
            case 'error': return Theme.palette.danger;
            case 'warning': return Theme.palette.warning;
            case 'success': return Theme.palette.success;
            case 'gold': return Theme.palette.gold;
            default: return Theme.palette.info;
        }
    }
```

- [ ] **Step 2: Rewrite NotificationSystem.render**

Replace the body of `render` (currently `uiFramework.js:397-457`) with:
```javascript
    render(ctx, x, y) {
        const notifWidth = 350;
        const notifHeight = 45;
        const stripeWidth = 6;

        this.notifications.forEach((notif, index) => {
            const notifY = y + notif.currentY;

            const fill = notif.severity === 'gold' ? '#1a2028' : '#2d3436';
            const border = notif.severity === 'gold' ? Theme.palette.gold : notif.color;
            const textColor = notif.severity === 'gold' ? Theme.palette.gold : '#ffffff';

            Theme.drawFrame(ctx, x, notifY, notifWidth, notifHeight, {
                radius: 6,
                fill,
                border,
                shadow: false
            });
            ctx.fillStyle = notif.color;
            ctx.fillRect(x + 2, notifY + 4, stripeWidth, notifHeight - 8);

            const textStartX = x + stripeWidth + 12;
            const maxWidth = notifWidth - stripeWidth - 24;
            const words = notif.message.split(' ');
            let line = '';
            let yOffset = notifY + 10;
            for (let word of words) {
                const testLine = line + word + ' ';
                ctx.font = Theme.font.body(16);
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    Theme.shadowText(ctx, line.trim(), textStartX, yOffset, {
                        font: Theme.font.body(16),
                        color: textColor,
                        align: 'left',
                        baseline: 'top',
                        shadowColor: 'rgba(0, 0, 0, 0.6)'
                    });
                    line = word + ' ';
                    yOffset += 18;
                } else {
                    line = testLine;
                }
            }
            Theme.shadowText(ctx, line.trim(), textStartX, yOffset, {
                font: Theme.font.body(16),
                color: textColor,
                align: 'left',
                baseline: 'top',
                shadowColor: 'rgba(0, 0, 0, 0.6)'
            });
        });
    }
```

- [ ] **Step 3: Verify**

Serve and open. Trigger a few notifications:
```javascript
Game.notificationSystem.addNotification('Hello GBA world', 'info');
Game.notificationSystem.addNotification('Gold achievement!', 'gold');
Game.gameState.eventSystem.triggerRandomEvent();
```
Expected: toasts render as framed mini-boxes with severity stripe; gold one has gold border + gold text; text is VT323; slide-in/expiry animation unchanged.

- [ ] **Step 4: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: GBA frame styling for notifications"
```

---

### Task 6: Dialog restyle + cursor

**Files:**
- Modify: `js/uiFramework.js` — `Dialog.render` (`:233-254`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.drawCursor`, `Theme.font.body`, `Theme.shadowText`
- Produces: unchanged `Dialog` API; options list shows a ► cursor on `selectedOption`

- [ ] **Step 1: Rewrite Dialog.render**

Replace the body of `Dialog.render` (currently `uiFramework.js:233-254`) with:
```javascript
    render(ctx) {
        Theme.drawFrame(ctx, this.x, this.y, this.width, this.height, {
            radius: 10,
            fill: Theme.palette.panelBg,
            border: Theme.palette.frameBorder
        });

        const padding = 14;
        const textWidth = this.width - padding * 2;
        this.wrapText(ctx, this.displayedText, this.x + padding, this.y + padding, textWidth, 22);

        if (this.options.length > 0) {
            const startY = this.y + this.height - this.options.length * 32 - 12;
            this.options.forEach((option, index) => {
                const rowY = startY + index * 32;
                if (index === this.selectedOption) {
                    Theme.drawCursor(ctx, this.x + 24, rowY + 9, 10);
                }
                Theme.shadowText(ctx, option.text, this.x + 42, rowY, {
                    font: Theme.font.body(18),
                    color: Theme.palette.textDark,
                    align: 'left',
                    baseline: 'top'
                });
            });
        }

        super.render(ctx);
    }
```

Note: `wrapText` is a class method (kept) — but its text calls currently use `this.style` fonts and plain `fillText`. Update `wrapText` (currently `uiFramework.js:256-275`) to use `Theme.font.body(18)` and `Theme.shadowText`:
```javascript
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            ctx.font = Theme.font.body(18);
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && n > 0) {
                Theme.shadowText(ctx, line, x, currentY, { font: Theme.font.body(18), color: Theme.palette.textDark });
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        Theme.shadowText(ctx, line, x, currentY, { font: Theme.font.body(18), color: Theme.palette.textDark });
    }
```

- [ ] **Step 2: Verify**

Serve and open. Trigger a dialog (the tutorial now shows only a notification, so force one via console):
```javascript
Game.dialog = new Dialog(300, 300, 600, 200, 'This is a GBA style dialog box with options.', [
    { text: 'Option A', onClick: () => console.log('A') },
    { text: 'Option B', onClick: () => console.log('B') }
]);
Game.dialog.visible = true;
```
Expected: framed dialog, typewriter text in VT323, ► pointing at the selected option, clicking an option fires its callback and selects it.

- [ ] **Step 3: Commit**

```bash
git add js/uiFramework.js
git commit -m "feat: GBA dialog styling with cursor"
```

---

### Task 7: HUD migration (time/weather/money/stats/goal)

**Files:**
- Modify: `js/main.js` — `createHUD` button style tweaks (`:276-375`), `renderGameState` (`:1281-1414`)

**Interfaces:**
- Consumes: `Theme.font.*`, `Theme.shadowText`, `Theme.drawSegments`, `Theme.drawIcon`, `Theme.palette`
- Produces: no API changes; the money/time/weather display rows now use body font + pixel icons; stats/goal panels use body text; goal bar segmented.

- [ ] **Step 1: Give display-row Buttons body font + transparent bg**

In `createHUD`, the three display-row buttons (moneyButton, timeButton, weatherButton) already pass `bgColor: 'transparent'` for time/weather. Add `font: 'body'` to their style objects so they use VT323:
- moneyButton (green bg — keep green, add `font: 'body'`)
- timeButton: add `font: 'body'`
- weatherButton: add `font: 'body'`

Specifically, change timeButton's style object (currently `main.js:311`) to:
```javascript
const timeButton = new Button(20, 10, 200, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: '#000000', font: 'body' });
```
and weatherButton (currently `main.js:328`) to:
```javascript
const weatherButton = new Button(20, 50, 300, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: '#000000', font: 'body' });
```
and moneyButton (currently `main.js:276-293`) add `font: 'body'` inside its style object.

- [ ] **Step 2: Replace emoji with pixel icons + body font in renderGameState**

In `renderGameState` (currently `main.js:1293-1308`), replace the time and weather update blocks:
```javascript
        // Update time button with day/night indicator
        const timeButton = this.uiElements[4];
        if (timeButton) {
            const hour = Math.floor(gs.time % 24);
            const day = Math.floor(gs.time / 24);
            const isDaytime = (hour >= 6 && hour <= 18);
            Theme.drawIcon(this.ctx, isDaytime ? 'sun' : 'moon', timeButton.x + 6, timeButton.y + 5, 20);
            timeButton.text = `${isDaytime ? 'DAY' : 'NIGHT'} ${day} - ${hour.toString().padStart(2, '0')}:00`;
        }

        // Update weather button
        const weatherButton = this.uiElements[6];
        if (weatherButton) {
            const cloudPercent = (gs.weather.cloudCover * 100).toFixed(0);
            const intensityPercent = (gs.getSolarIntensity() * 100).toFixed(0);
            weatherButton.text = `${cloudPercent}% clouds, ${intensityPercent}% sun`;
        }
```

Note: `timeButton` is currently centered text; the icon is drawn at the button's left edge. The default body font path (Task 3) centers text — with the icon at `timeButton.x + 6` and text centered, no collision for typical strings. Keep textAlign behavior as Button now draws centered.

- [ ] **Step 3: Restyle stats text in renderGameState**

In `renderGameState` stats block (currently `main.js:1358-1363`), replace the font/text setup:
```javascript
            this.ctx.font = Theme.font.body(16);
            this.ctx.fillStyle = Theme.palette.textDark;
            this.ctx.textAlign = 'left';
            statsText.forEach((text, index) => {
                Theme.shadowText(this.ctx, text, statsPanel.x + 10, statsPanel.y + 40 + index * 20, {
                    font: Theme.font.body(16),
                    color: Theme.palette.textDark,
                    align: 'left',
                    baseline: 'top'
                });
            });
```

- [ ] **Step 4: Restyle goal panel text + segmented bar**

Replace the goal panel body in `renderGameState` (currently `main.js:1373-1412`):
```javascript
            if (currentGoal) {
                Theme.shadowText(this.ctx, currentGoal.description, goalPanel.x + 10, goalPanel.y + 35, {
                    font: Theme.font.body(18),
                    color: Theme.palette.textDark,
                    align: 'left',
                    baseline: 'top'
                });

                if (progress.detailed) {
                    const d = progress.detailed;
                    let detailText;
                    if (d.corporate && d.business) {
                        detailText = `Corporate: ${d.corporate.current}/${d.corporate.target}  |  Business: ${d.business.current}/${d.business.target}`;
                    } else {
                        detailText = `Cabins: ${d.cabin.current}/${d.cabin.target}  |  Families: ${d.family.current}/${d.family.target}  |  Business: ${d.business.current}/${d.business.target}`;
                    }
                    Theme.shadowText(this.ctx, detailText, goalPanel.x + 10, goalPanel.y + 55, {
                        font: Theme.font.body(16),
                        color: Theme.palette.textDark,
                        align: 'left',
                        baseline: 'top'
                    });
                } else {
                    const progressText = `Progress: ${progress.current}/${progress.target} (${progress.percentage.toFixed(0)}%)`;
                    Theme.shadowText(this.ctx, progressText, goalPanel.x + 10, goalPanel.y + 55, {
                        font: Theme.font.body(16),
                        color: Theme.palette.textDark,
                        align: 'left',
                        baseline: 'top'
                    });
                }

                const barX = goalPanel.x + 10;
                const barY = goalPanel.y + 70;
                const barWidth = goalPanel.width - 20;
                const barHeight = 6;
                Theme.drawSegments(this.ctx, barX, barY, barWidth, barHeight,
                    Math.min(progress.percentage, 100) / 100, Theme.palette.success, 20);
            } else if (gs.gameWon) {
                Theme.shadowText(this.ctx, 'ALL GOALS COMPLETED!', goalPanel.x + goalPanel.width / 2, goalPanel.y + 45, {
                    font: Theme.font.heading(18),
                    color: Theme.palette.success,
                    align: 'center',
                    baseline: 'middle'
                });
            }
```

- [ ] **Step 5: Verify**

Serve and open. Expected:
- Top-left shows a pixel sun/moon icon next to "DAY 0 - HH:00"-style time in VT323.
- Weather row reads e.g. "0% clouds, 100% sun".
- Stats panel text is VT323, framed by the panel from Task 3.
- Goal panel: VT323 description, segmented progress bar (20 segments), fine-grained.
- Money button text updates live in VT323.
- No console errors. (`Theme` referenced inside `renderGameState` — fine, `theme.js` loads first.)

- [ ] **Step 6: Commit**

```bash
git add js/main.js
git commit -m "feat: GBA HUD text and icons"
```

---

### Task 8: Shop restyle (desktop + mobile)

**Files:**
- Modify: `js/economicSystem.js` — `ShopMenu.setupUI` (`:350-380`), `ShopMenu.render` (`:389-466`), `renderTooltip` (`:468-529`), `renderEquipmentButtons` (`:552-619`)
- Modify: `js/uiFramework.js` — `MobileShopContent.setupUI` (`:769-806`), `renderEquipmentButtons` (`:821-881`), `render` (`:897-922`)

**Interfaces:**
- Consumes: `Theme.palette`, `Theme.font.*`, `Theme.shadowText`, `Theme.drawFrame`
- Produces: unchanged APIs; selected category tab raised/framed; equipment rows framed; special gold labels use `Theme.palette.gold`.

- [ ] **Step 1: Category tabs — desktop (ShopMenu.setupUI)**

Replace the category button style object (currently `economicSystem.js:366-372`) with:
```javascript
                {
                    bgColor: Theme.palette.panelBgTan,
                    hoverBgColor: '#d4c4a8',
                    activeBgColor: Theme.palette.frameBorder,
                    borderColor: Theme.palette.outline,
                    textColor: Theme.palette.textDark,
                    fontSize: '12px',
                    font: 'heading'
                }
```
And in the selected-tab shadow redraw (currently `economicSystem.js:396-424`), the selected color `'#c4b498'` and shadow `'#2b2b2b'` become `Theme.palette.frameBorder` highlight band + `Theme.palette.outline` text; simplest: replace `ctx.fillStyle = '#c4b498';` (line ~409) with `Theme.palette.panelBgTan` and `ctx.fillStyle = '#2b2b2b'` (line ~400 and ~419) with `Theme.palette.textDark`. Keep the redraw logic identical otherwise.

- [ ] **Step 2: Equipment rows — desktop (renderEquipmentButtons)**

Replace the button style object (currently `economicSystem.js:597-607`) with:
```javascript
                {
                    bgColor: eq.special ? '#e8dcc8' : Theme.palette.panelBgTan,
                    hoverBgColor: '#d4c4a8',
                    activeBgColor: Theme.palette.frameBorder,
                    borderColor: eq.special ? Theme.palette.gold : Theme.palette.outline,
                    textColor: Theme.palette.textDark,
                    disabledBgColor: '#c0c0c0',
                    disabledTextColor: Theme.palette.textDisabled,
                    disabledBorderColor: '#999999',
                    fontSize: '12px',
                    font: 'heading'
                }
```

- [ ] **Step 3: Special labels + tooltip — desktop (render + renderTooltip)**

- In `ShopMenu.render` special-label block (currently `economicSystem.js:429-460`): replace `'#ffd700'` → `Theme.palette.gold`, `'#b8860b'` → `Theme.palette.outline`, and the label font `bold 9px monospace` → `Theme.font.body(16)` with gold text on dark.
- In `renderTooltip` (currently `economicSystem.js:468-529`): replace `'rgba(45, 52, 54, 0.95)'` bg with `'rgba(26, 32, 40, 0.95)'`, `'#ffd700'` border → `Theme.palette.gold`, text font `10px monospace` → `Theme.font.body(16)`, lineHeight 14 → 18, and `ctx.fillText` → `Theme.shadowText` for tooltip lines. Keep wrap-tooltip logic.

- [ ] **Step 4: Mobile shop content — category tabs + rows + money (MobileShopContent)**

- Category buttons (currently `uiFramework.js:783-798`): replace `'#6c5ce7'` selected / `'#4a4a4a'` unselected with `Theme.palette.frameBorder` selected / `Theme.palette.textDark` unselected, `'#a55eea'` border → `Theme.palette.gold`, text `#ffffff`, fontSize `'11px'`, `font: 'heading'`.
- `setCategory` restyle block (currently `uiFramework.js:812-818`): `'#6c5ce7'` → `Theme.palette.frameBorder`, `'#4a4a4a'` → `Theme.palette.textDark`, `'#a55eea'` → `Theme.palette.gold`.
- Equipment rows (currently `uiFramework.js:860-871`): special `'#3d3d6b'` → `'#1a2028'`, default `'#2d3436'` → `Theme.palette.textDark`, hover `'#4a4a4a'` → `'#2f3a44'`, active `'#1e272e'` → `'#101418'`, special border `'#ffd700'` → `Theme.palette.gold`, disabled colors `Theme.palette.textDisabled` / `'#333333'` → `Theme.palette.outline`, textColor white, `font: 'heading'`, fontSize `'12px'`.
- Money display (currently `uiFramework.js:901-905`): `ctx.fillStyle = '#00b894'` → `Theme.palette.money`, font `bold 14px monospace` → `Theme.font.body(18)`, `ctx.fillText` → `Theme.shadowText` (right-aligned).
- Special label drawing (currently `uiFramework.js:915-920`): `'#ffd700'` → `Theme.palette.gold`, font → `Theme.font.body(16)`.

- [ ] **Step 5: Verify**

Serve and open, desktop:
- SHOP menu: tan framed category tabs with dark text; active tab shows raised highlight; equipment rows framed with gold-bordered special rows; tooltips on special labels render as dark boxes with gold border + VT323 text; affordability graying still works (rows gray when money < cost).
Emulated mobile (DevTools iPhone landscape):
- Drawer SHOP: emoji tab icons replaced by pixel icons (`☀️`→panel, `🔋`→battery, `🏠`→house) — pass `Theme.drawIcon` where `MobileShopContent.setupUI` currently sets category button text. Change each category button label to use the icon then a space then name: draw the icon inside the category button render path. Simplest: keep text but prefix with a space and draw icon at button.x+4. Implementation: in `setupUI`, after creating each category button, store `btn.iconName = cat.icon` and override nothing; instead in `MobileShopContent.render` draw `Theme.drawIcon(ctx, btn.iconName, btn.x + 6, btn.y + 10, 20)` for each category button, and set button text without emoji (`' Solar'`, `' Battery'`, `' Home'`). Add `icon` field to each category object: `{ text: 'Solar', icon: 'panel', ... }`, etc.
- Money readout right-aligned VT323 in money green.

- [ ] **Step 6: Commit**

```bash
git add js/economicSystem.js js/uiFramework.js
git commit -m "feat: GBA shop styling desktop and mobile"
```

---

### Task 9: Entity sprite redraws + battery charge fix

**Files:**
- Modify: `js/visualRenderer.js` — `SpriteManager.drawSolarPanel` (`:190-230`), `drawBattery` (`:232-260`), `drawCabin` (`:34-187`), `drawProceduralSprite` signature (`:17-32`), `drawGoldBorder` (`:560-568`); `WorldRenderer.drawEquipment` battery call (`:517-520`)

**Interfaces:**
- Consumes: `Theme.palette.tier1..tier4`, `Theme.palette.outline`, `Theme.palette.gold`
- Produces: `drawProceduralSprite(ctx, type, x, y, width, height, tier, data)` — `data` optional; batteries read `data.charge` (ratio 0..1, default `0.5`). Fixes the hardcoded-70% battery indicator.

- [ ] **Step 1: Thread charge ratio for batteries in WorldRenderer.drawEquipment**

Replace the battery sprite call (currently `visualRenderer.js:517-520`):
```javascript
        this.gameState.batteries.forEach(battery => {
            const x = this.offsetX + battery.x;
            const y = this.offsetY + battery.y;
            this.spriteManager.drawProceduralSprite(this.ctx, 'battery', x, y, 40, 60, battery.tier, { charge: battery.charge / battery.capacity });
```
(Keep the following `if (battery.tier === 'tier4')` block unchanged.)

- [ ] **Step 2: Update drawProceduralSprite signature**

Change `drawProceduralSprite(ctx, type, x, y, width, height, tier)` (currently `visualRenderer.js:17`) to `drawProceduralSprite(ctx, type, x, y, width, height, tier, data)` and pass `data` through to `drawBattery`:
```javascript
            case 'battery':
                this.drawBattery(ctx, x, y, width, height, tier, data);
                break;
```

- [ ] **Step 3: Rewrite drawSolarPanel with outline + shading**

Replace the body of `drawSolarPanel` (currently `visualRenderer.js:190-230`) with:
```javascript
    drawSolarPanel(ctx, x, y, width, height, tier) {
        const o = Theme.palette.outline;
        let cellColor = Theme.palette.tier1;
        if (tier === 'tier2') cellColor = Theme.palette.tier2;
        else if (tier === 'tier3') cellColor = Theme.palette.tier3;
        else if (tier === 'tier4') cellColor = Theme.palette.tier4;

        // metallic frame with top highlight
        ctx.fillStyle = '#9aa4b0';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, width, 3);
        ctx.fillStyle = '#6a7480';
        ctx.fillRect(x, y + height - 3, width, 3);

        // cells
        const cellWidth = (width - 12) / 3;
        const cellHeight = (height - 12) / 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cx = x + 4 + i * (cellWidth + 1);
                const cy = y + 4 + j * (cellHeight + 1);
                ctx.fillStyle = cellColor;
                ctx.fillRect(cx, cy, cellWidth, cellHeight);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fillRect(cx, cy, cellWidth, 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.fillRect(cx, cy + cellHeight - 2, cellWidth, 2);
            }
        }

        // outline
        ctx.strokeStyle = o;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
```

- [ ] **Step 4: Rewrite drawBattery with real charge window**

Replace the body of `drawBattery` (currently `visualRenderer.js:232-260`) with:
```javascript
    drawBattery(ctx, x, y, width, height, tier, data) {
        const o = Theme.palette.outline;
        const charge = Math.max(0, Math.min(1, (data && data.charge !== undefined) ? data.charge : 0.5));
        let chargeColor = Theme.palette.tier1;
        if (tier === 'tier2') chargeColor = Theme.palette.tier2;
        else if (tier === 'tier3') chargeColor = Theme.palette.tier3;
        else if (tier === 'tier4') chargeColor = Theme.palette.tier4;

        // casing
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(x + 8, y, width - 16, height);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + width / 2 - 10, y - 5, 20, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 8, y, width - 16, 3);

        // charge window (h = charge ratio)
        const wx = x + 14;
        const wy = y + 8;
        const ww = width - 28;
        const wh = height - 16;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = chargeColor;
        ctx.fillRect(wx, wy + wh * (1 - charge), ww, wh * charge);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(wx, wy + wh * (1 - charge), ww, 2);

        // outline
        ctx.strokeStyle = o;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 8, y, width - 16, height);
    }
```

- [ ] **Step 5: Add outlines/shading to drawCabin silhouettes**

In each of the four tier branches of `drawCabin` (currently `visualRenderer.js:34-187`), append before the end of each branch:
```javascript
            ctx.strokeStyle = Theme.palette.outline;
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 5, y, width + 10, height);
```
(For `cottage`/`family` and `business` branches the body offsets differ; use the same stroke box as the branch's own `fillRect` bounds — match each branch's body rectangle: cabin `(x, y, width, height)`; cottage `(x - 5, y + 5, width + 10, height - 5)`; business `(x - 5, y - 10, width + 10, height + 10)`; corporate `(x - 5, y - 15, width + 10, height + 15)`.) Add a 2px darker bottom shade band inside each body: `ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(bodyRect) 2px at bottom`. Keep existing colors/shapes.

- [ ] **Step 6: Tier4 gold sparkle accent**

Replace `drawGoldBorder` (currently `visualRenderer.js:560-568`) with a glint accent:
```javascript
    drawGoldBorder(x, y, width, height) {
        const g = Theme.palette.gold;
        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        // corner sparkles
        ctx.fillStyle = g;
        const spark = 4;
        ctx.fillRect(x - 2, y - 2, spark, 2);
        ctx.fillRect(x - 2, y - 2, 2, spark);
        ctx.fillRect(x + width - 2, y - 2, spark, 2);
        ctx.fillRect(x + width, y - 2, 2, spark);
        ctx.fillRect(x - 2, y + height, spark, 2);
        ctx.fillRect(x - 2, y + height - 2, 2, spark);
        ctx.fillRect(x + width - 2, y + height, spark, 2);
        ctx.fillRect(x + width, y + height - 2, 2, spark);
        ctx.restore();
    }
```

- [ ] **Step 7: Verify**

Serve and open. Expected:
- Solar panels: metallic frame + tier-colored 3×3 cells with highlight/shade, dark outline.
- Batteries: casing + charge window reflecting actual charge — **empty at 0% (dark window), full at 100%**; check `Game.gameState.energy.storage`/battery charges change over time and the window follows.
- Houses: outlined silhouettes with bottom shade band, gold sparkles on corporate and on tier4 solar/battery.
- No console errors; placement preview still renders (passes no `data` → battery preview shows 50% — fine).

- [ ] **Step 8: Commit**

```bash
git add js/visualRenderer.js
git commit -m "feat: outlined pixel-art sprites and battery charge fix"
```

---

### Task 10: Selection UI + placement preview

**Files:**
- Modify: `js/main.js` — `renderSelectionUI` (`:1461-1670`), `renderPlacementPreview` (`:1425-1459`)
- Modify: `js/uiFramework.js` — `MobileSelectionContent.render` (`:947-1067`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.font.*`, `Theme.shadowText`, `Theme.palette`
- Produces: unchanged APIs; upgrade/delete buttons render as GBA menu items with hover inversion.

- [ ] **Step 1: Desktop selection panel — framed + themed**

In `renderSelectionUI`:
- Replace the panel background block (currently `main.js:1468-1473`) with:
```javascript
        Theme.drawFrame(this.ctx, panelX, panelY, panelWidth, panelHeight, {
            radius: 8,
            fill: Theme.palette.panelBg,
            border: Theme.palette.frameBorder
        });
```
- Replace the title draw (currently `main.js:1476-1480`) with `Theme.shadowText(this.ctx, `Selected: ${this.selectedEntity.id}`, panelX + 10, panelY + 20, { font: Theme.font.heading(14), color: Theme.palette.textDark, align: 'left', baseline: 'top' })`.
- Event tags (currently `main.js:1497-1508`): tag colors → `Theme.palette` (high→danger, medium→warning, default→info); text via `Theme.shadowText` body(16) white.
- Tier/info lines (currently `main.js:1517-1575`): `this.ctx.fillText` → `Theme.shadowText(..., Theme.font.body(16), align 'left')`; keep affected-stat red (`Theme.palette.danger`).
- Upgrade button (currently `main.js:1618-1635`): fill logic → when afford+not max use `Theme.drawFrame(..., { fill: hovered ? '#2f3a44' : Theme.palette.frameBorder, border: Theme.palette.outline, radius: 6, shadow: false })` with white PS2P label; disabled/max → `Theme.drawFrame` fill `#a0a0a0` border `#666666`; text via `Theme.shadowText` PS2P 11px white / `#cccccc` when disabled.
- Delete button (currently `main.js:1651-1663`): `Theme.drawFrame` fill `Theme.palette.danger` (hover `#b8382c`), border `Theme.palette.outline`, white PS2P label "Refund 50%".

- [ ] **Step 2: Placement preview validity frame**

In `renderPlacementPreview`, replace the validity `strokeRect` block (currently `main.js:1448-1451`) with:
```javascript
        Theme.drawFrame(this.ctx, x - 3, y - 3, w + 6, h + 6, {
            radius: 4,
            fill: 'transparent',
            border: this.placementValid ? Theme.palette.success : Theme.palette.danger,
            shadow: false
        });
```
And the cost label (currently `main.js:1453-1456`) → `Theme.shadowText(this.ctx, `-$${this.placementItem.cost}`, x + w / 2, y - 10, { font: Theme.font.body(16), color: this.placementValid ? Theme.palette.textDark : Theme.palette.danger, align: 'center', baseline: 'bottom' })`.

Note: `drawFrame` with `fill: 'transparent'` still fills `outline` + border bands over the ghost — acceptable as a valid/invalid ring; to avoid a solid ring, keep the fill pass but the preview is translucent ghost so a colored frame reads clearly. If it renders too heavy, set `radius: 4` and rely on border color; this is acceptable.

- [ ] **Step 3: Mobile selection sheet content — framed + themed**

In `MobileSelectionContent.render`:
- Replace `ctx.fillStyle = '#ffffff'` / `'#aaaaaa'` / `'#ffd700'` info text draws (currently `uiFramework.js:953-990`) with `Theme.shadowText(..., Theme.font.body(16), align 'left')` using `Theme.palette.textLight`, tier gold for tier4/corporate.
- Upgrade button block (currently `uiFramework.js:1026-1049`): use `Theme.drawFrame` with fill `Theme.palette.success` when enabled / `'#666666'` when disabled, border `Theme.palette.outline`, PS2P label via `Theme.shadowText` white / `#999999`; keep `upgradeBounds` storage.
- Delete/SELL button (currently `uiFramework.js:1055-1066`): `Theme.drawFrame` fill `Theme.palette.danger`, border `Theme.palette.outline`, white PS2P "SELL (50%)"; keep `deleteBounds`.

- [ ] **Step 4: Verify**

Serve and open, desktop:
- Select a solar panel/battery/household: framed panel, PS2P title with ID, VT323 stats, event tag if any, UPGRADE and Refund 50% buttons as framed menu items (upgrade grays when unaffordable or max tier; delete stays red).
- Placement: ghost + colored ring (green valid / red invalid); cost label in VT323.
Emulated mobile:
- Long-press an entity: bottom sheet content themed, SELL button red framed, upgrade green framed.

- [ ] **Step 5: Commit**

```bash
git add js/main.js js/uiFramework.js
git commit -m "feat: GBA styling for selection UI and placement preview"
```

---

### Task 11: Help panel + victory overlay

**Files:**
- Modify: `js/main.js` — `renderVictoryOverlay` (`:1672-1738`), `renderHelpPanel` (`:1740-1989`)

**Interfaces:**
- Consumes: `Theme.drawFrame`, `Theme.font.*`, `Theme.shadowText`, `Theme.palette`
- Produces: unchanged APIs and button hit regions (`this.victoryButton`, `this.helpCloseButton` stored as before).

- [ ] **Step 1: Victory overlay — gold double-frame banner**

Replace the banner background/border block (currently `main.js:1685-1692`) with:
```javascript
        Theme.drawFrame(this.ctx, bannerX - 6, bannerY - 6, bannerW + 12, bannerH + 12, {
            radius: 14,
            fill: Theme.palette.frameBorder,
            border: Theme.palette.gold,
            shadow: false
        });
        Theme.drawFrame(this.ctx, bannerX, bannerY, bannerW, bannerH, {
            radius: 12,
            fill: '#2d3436',
            border: Theme.palette.outline,
            shadow: false
        });
```
Replace header draws (currently `main.js:1694-1712`) with `Theme.shadowText`:
- "CONGRATULATIONS!" → `Theme.font.heading(36)`, color `Theme.palette.gold`, centered.
- Subtitle → `Theme.font.body(24)`, color `Theme.palette.textLight`, centered.
- "Did You Know?" → `Theme.font.heading(18)`, `Theme.palette.success`.
- Fun fact → `Theme.font.body(20)`, `Theme.palette.textLight` (keep `this.wrapText` but switch its font: set `this.ctx.font = Theme.font.body(20)` before calling and update `wrapText` fill calls to `Theme.shadowText` — see Step 3).
- Start New Game button (currently `main.js:1728-1737`): `Theme.drawFrame(..., { fill: hovered ? '#2f3a44' : Theme.palette.frameBorder, border: Theme.palette.outline, radius: 6, shadow: false })`, label `Theme.font.heading(16)` white via `Theme.shadowText`.

- [ ] **Step 2: Help panel — framed columns**

In `renderHelpPanel`:
- Replace the panel bg/border (currently `main.js:1753-1758`) with:
```javascript
        Theme.drawFrame(this.ctx, panelX, panelY, panelW, panelH, {
            radius: 14,
            fill: Theme.palette.panelBg,
            border: Theme.palette.frameBorder
        });
```
- Title (currently `main.js:1764`): `Theme.shadowText(..., Theme.font.heading(24), Theme.palette.textDark, center)`.
- Section headers (GAME OBJECTIVE, CONTROLS, ENERGY SYSTEM, BUILDINGS AND INCOME, CRISIS EVENTS, STRATEGY TIPS): currently `bold 13px monospace` with `#6c5ce7` → `Theme.font.heading(13)` + `Theme.palette.frameBorder`.
- Body text: `11px monospace` `#2b2b2b` → `Theme.font.body(16)` `Theme.palette.textDark` via `Theme.shadowText`.
- Sub-headers (`#00b894`, `#d63031`, `#fdcb6e`, `#74b9ff` lists): map to `Theme.palette.success/danger/warning/info`; font `bold 11px monospace` → `Theme.font.heading(12)`.
- Close X (currently `main.js:1980-1988`): `Theme.drawFrame(..., { fill: hovered ? '#b8382c' : Theme.palette.danger, border: Theme.palette.outline, radius: 6, shadow: false })`; keep `this.helpCloseButton` assignment at `main.js:1973`.

- [ ] **Step 3: Update main.js wrapText to theme fonts**

Replace `wrapText` (currently `main.js:1992-2013`) so its fill calls use `Theme.shadowText` and a caller-provided font:
```javascript
    wrapText(text, x, y, maxWidth, lineHeight, font, color) {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        this.ctx.font = font || Theme.font.body(20);
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                Theme.shadowText(this.ctx, line.trim(), x, currentY, { font: font || Theme.font.body(20), color: color || Theme.palette.textLight, align: 'center', baseline: 'top' });
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        Theme.shadowText(this.ctx, line.trim(), x, currentY, { font: font || Theme.font.body(20), color: color || Theme.palette.textLight, align: 'center', baseline: 'top' });
    }
```
Update the fun-fact call in `renderVictoryOverlay` (currently `main.js:1713`) to:
```javascript
        this.wrapText(this.selectedFunFact, this.width / 2, bannerY + 240, bannerW - 80, 26, Theme.font.body(20), Theme.palette.textLight);
```

- [ ] **Step 4: Verify**

Serve and open:
- Click `?`: framed help panel, dark-green section headers, VT323 body, colored lists, red framed close X. All clicks blocked while open except close (behavior unchanged).
- Win the game (console): `Game.gameState.goals.forEach(g => g.completed = true); Game.gameState.currentGoalIndex = Game.gameState.goals.length - 1; Game.gameState.updateGoalProgress(); Game.gameState.gameWon = true;` — or complete goals naturally. Expected: gold double-frame banner, PS2P gold header, VT323 subtitle/fun fact, framed Start New Game button that inverts on hover and resets the game.

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat: GBA styling for help panel and victory overlay"
```

---

### Task 12: AGENTS.md update + final QA sweep

**Files:**
- Modify: `AGENTS.md` (script load order line; add `theme.js` + `assets/fonts/` to file map)

**Interfaces:**
- Consumes: everything from Tasks 1–11

- [ ] **Step 1: Update AGENTS.md**

- In "Script load order" section, prepend `theme.js`:
  `theme.js → gameState.js → eventSystem.js → uiFramework.js → camera.js → visualRenderer.js → economicSystem.js → main.js`
- In the File map table, add rows:
  | `js/theme.js` | `Theme` — GBA palette, font helpers, frame/cursor/segment/icon drawing primitives |
  | `assets/fonts/` | Local OFL pixel fonts (Press Start 2P, VT323) + licenses |
- Add a "Theme" note under Critical quirks: all UI colors/fonts come from `window.Theme`; no hardcoded hex outside `theme.js`.

- [ ] **Step 2: Full desktop playthrough smoke test**

Serve and run through: buy solar/battery/household → place (green/red ring) → select → upgrade (tier colors/outlines update) → sell (refund toast) → pause/resume → help panel → force weather & event via console → goal completion (gold toast) → victory overlay. Expected: no console errors, all themed elements present, zero emoji on canvas (search rendered screen).

- [ ] **Step 3: Emulated-mobile smoke test**

DevTools, iPhone landscape (e.g., 844×390 CSS at DPR 3). Verify: shop drawer opens/closes with themed tabs + pixel icons, equipment rows framed + affordability gray, drag-placement works, long-press opens themed bottom sheet, upgrade/sell buttons respond. No console errors.

- [ ] **Step 4: Screenshot captures**

Capture key screens for user review: HUD, shop open (desktop), drawer open (mobile emulation), a dialog/notification, victory overlay. Save under a scratch folder (e.g., `tmp_stage1_shots/` or use browser capture to a path the user can view). Do not commit screenshots unless asked.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for theme module and fonts"
```

---

## Self-Review Notes

- **Spec coverage:** Theme module (§1) → Task 1. Fonts (§2) → Task 1. Button/Panel (§3) → Task 3. NotificationSystem/Dialog/EnergyBar → Tasks 4–6. HUD (§3) → Task 7. Shops → Task 8. Sprites + battery bug (§4) → Task 9. Icons (§5) → Tasks 2 + 8 (category tabs). Selection/placement/help/victory (§3) → Tasks 10–11. Verification (§6) → each task's verify step + Task 12. AGENTS.md update (§6.6) → Task 12.
- **Placeholder scan:** all steps contain concrete code or exact replace targets with line refs. Palette values are literal, not TBD. The Task 8 category-tab emoji→icon swap is fully specified (add `icon` field, draw in `MobileShopContent.render`).
- **Type consistency:** `Theme.drawFrame`/`drawCursor`/`shadowText`/`drawSegments`/`drawIcon` signatures consistent across all consumers. `drawProceduralSprite` gains optional `data` once (Task 9) and only battery reads it. `wrapText` signature extended once (Task 11) and its single call site updated in the same task.
