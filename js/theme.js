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
