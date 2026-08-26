// Visual Rendering System - World rendering and particle effects

class SpriteManager {
    constructor() {
        this.sprites = {};
        this.animations = {};
    }

    loadSprite(name, image) {
        this.sprites[name] = image;
    }

    getSprite(name) {
        return this.sprites[name];
    }

    drawProceduralSprite(ctx, type, x, y, width, height, tier) {
        switch (type) {
            case 'cabin':
                this.drawCabin(ctx, x, y, width, height, tier);
                break;
            case 'solar_panel':
                this.drawSolarPanel(ctx, x, y, width, height, tier);
                break;
            case 'battery':
                this.drawBattery(ctx, x, y, width, height, tier);
                break;
            case 'power_line':
                this.drawPowerLine(ctx, x, y, width, height);
                break;
        }
    }

    drawCabin(ctx, x, y, width, height, tier) {
        // Different colors and shapes for different building tiers
        // Cabin (tier1): Small brown house with triangular roof
        // Cottage/Family (tier2): Medium blue house with wider design
        // House/Business (tier3): Large modern gray building with flat roof
        // Corporate (tier4): Premium gold-accented skyscraper
        
        if (tier === 'cabin' || !tier) {
            // CABIN: Small brown wooden cabin with triangular roof
            const bodyColor = '#8B4513'; // Brown
            const roofColor = '#654321'; // Dark brown
            
            // Cabin body
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x, y, width, height);
            
            // Triangular roof
            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(x - 5, y);
            ctx.lineTo(x + width / 2, y - height / 3);
            ctx.lineTo(x + width + 5, y);
            ctx.closePath();
            ctx.fill();
            
            // Door
            ctx.fillStyle = '#4a2c20';
            ctx.fillRect(x + width / 2 - 8, y + height / 2, 16, height / 2);
            
            // Small window
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(x + 8, y + height / 3, 12, 12);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8, y + height / 3, 12, 12);
            
        } else if (tier === 'cottage' || tier === 'family') {
            // COTTAGE: Medium-sized blue house with sloped roof
            const bodyColor = '#5D8AA8'; // Steel blue
            const roofColor = '#4682B4'; // Darker steel blue
            
            // House body (wider)
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x - 5, y + 5, width + 10, height - 5);
            
            // Sloped roof (wider, shallower angle)
            ctx.fillStyle = roofColor;
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 5);
            ctx.lineTo(x + width / 2, y - height / 4);
            ctx.lineTo(x + width + 10, y + 5);
            ctx.closePath();
            ctx.fill();
            
            // Door (centered, larger)
            ctx.fillStyle = '#2F4F4F';
            ctx.fillRect(x + width / 2 - 10, y + height / 2 + 5, 20, height / 2 - 5);
            
            // Two windows
            ctx.fillStyle = '#E0FFFF';
            ctx.fillRect(x + 5, y + height / 3 + 5, 14, 14);
            ctx.fillRect(x + width - 15, y + height / 3 + 5, 14, 14);
            ctx.strokeStyle = '#2F4F4F';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 5, y + height / 3 + 5, 14, 14);
            ctx.strokeRect(x + width - 15, y + height / 3 + 5, 14, 14);
            
            // Chimney
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(x + width - 15, y - height / 5, 8, height / 4);
            
        } else if (tier === 'house' || tier === 'business') {
            // HOUSE/BUSINESS: Modern gray/white building with flat roof
            const bodyColor = '#D3D3D3'; // Light gray
            const accentColor = '#708090'; // Slate gray
            
            // Building body (taller, more rectangular)
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x - 5, y - 10, width + 10, height + 10);
            
            // Flat roof with accent
            ctx.fillStyle = accentColor;
            ctx.fillRect(x - 8, y - 15, width + 16, 8);
            
            // Modern door (glass style)
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(x + width / 2 - 12, y + height / 3, 24, height * 2/3);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y + height / 3);
            ctx.lineTo(x + width / 2, y + height);
            ctx.stroke();
            
            // Large windows (3 across top)
            ctx.fillStyle = '#87CEEB';
            const windowWidth = 12;
            const windowHeight = 10;
            const windowY = y + 5;
            ctx.fillRect(x, windowY, windowWidth, windowHeight);
            ctx.fillRect(x + width / 2 - windowWidth / 2, windowY, windowWidth, windowHeight);
            ctx.fillRect(x + width - windowWidth, windowY, windowWidth, windowHeight);
            
            // Window frames
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, windowY, windowWidth, windowHeight);
            ctx.strokeRect(x + width / 2 - windowWidth / 2, windowY, windowWidth, windowHeight);
            ctx.strokeRect(x + width - windowWidth, windowY, windowWidth, windowHeight);
        } else if (tier === 'corporate') {
            // CORPORATE HQ: Premium gold-accented skyscraper
            const bodyColor = '#2C3E50'; // Dark blue-gray
            const accentColor = '#F1C40F'; // Gold accent
            
            // Tall building body
            ctx.fillStyle = bodyColor;
            ctx.fillRect(x - 5, y - 15, width + 10, height + 15);
            
            // Gold accent stripe at top
            ctx.fillStyle = accentColor;
            ctx.fillRect(x - 8, y - 20, width + 16, 8);
            
            // Gold logo/emblem on building
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(x + width / 2, y + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Glass entrance (blue reflective)
            ctx.fillStyle = '#3498DB';
            ctx.fillRect(x + width / 2 - 14, y + height / 2 - 5, 28, height / 2 + 5);
            
            // Revolving door effect
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y + height / 2 - 5);
            ctx.lineTo(x + width / 2, y + height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + width / 2 - 14, y + height / 2 + 10);
            ctx.lineTo(x + width / 2 + 14, y + height / 2 + 10);
            ctx.stroke();
            
            // Multiple floor windows (4 rows)
            ctx.fillStyle = '#87CEEB';
            const corpWindowW = 8;
            const corpWindowH = 6;
            for (let row = 0; row < 3; row++) {
                const winY = y + 20 + row * 12;
                ctx.fillRect(x, winY, corpWindowW, corpWindowH);
                ctx.fillRect(x + width - corpWindowW, winY, corpWindowW, corpWindowH);
            }
        }
    }

    drawSolarPanel(ctx, x, y, width, height, tier) {
        // Panel frame
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x, y, width, height);
        
        // Color based on tier: green (tier1), baby blue (tier2), purple (tier3), gold (tier4)
        let cellColor = '#2ecc71'; // tier1 - green
        if (tier === 'tier2') {
            cellColor = '#74b9ff'; // tier2 - baby blue
        } else if (tier === 'tier3') {
            cellColor = '#a55eea'; // tier3 - purple
        } else if (tier === 'tier4') {
            cellColor = '#f1c40f'; // tier4 - gold (Elite Solar Array)
        }
        
        // Cells
        ctx.fillStyle = cellColor;
        const cellWidth = (width - 10) / 3;
        const cellHeight = (height - 10) / 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(x + 5 + i * cellWidth, y + 5 + j * cellHeight, cellWidth - 2, cellHeight - 2);
            }
        }
        
        // Grid lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 5 + i * cellWidth, y + 5);
            ctx.lineTo(x + 5 + i * cellWidth, y + height - 5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5 + i * cellHeight);
            ctx.lineTo(x + width - 5, y + 5 + i * cellHeight);
            ctx.stroke();
        }
    }

    drawBattery(ctx, x, y, width, height, tier) {
        // Battery body
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(x + 10, y, width - 20, height);
        
        // Battery top
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + width / 2 - 10, y - 5, 20, 5);
        
        // Color based on tier: green (tier1), baby blue (tier2), purple (tier3), gold (tier4)
        let chargeColor = '#2ecc71'; // tier1 - green
        if (tier === 'tier2') {
            chargeColor = '#74b9ff'; // tier2 - baby blue
        } else if (tier === 'tier3') {
            chargeColor = '#a55eea'; // tier3 - purple
        } else if (tier === 'tier4') {
            chargeColor = '#f1c40f'; // tier4 - gold (Elite Power Core)
        }
        
        // Charge indicator (this will be dynamic based on actual charge)
        const chargePercentage = 0.7; // Will be overridden when rendering
        ctx.fillStyle = chargePercentage > 0.3 ? chargeColor : '#ff0000';
        ctx.fillRect(x + 15, y + 10, (width - 30) * chargePercentage, height - 20);
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 10, y, width - 20, height);
    }

    drawPowerLine(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
window.SpriteManager = SpriteManager;

class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
        return this.age < this.lifetime;
    }

    render(ctx) {
        const alpha = 1 - (this.age / this.lifetime);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count, spread = 50) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 10 + Math.random() * 20;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 3;
            const lifetime = 0.5 + Math.random() * 0.5;
            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    emitFlow(x1, y1, x2, y2, color, count) {
        for (let i = 0; i < count; i++) {
            const t = Math.random();
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            const size = 2 + Math.random() * 2;
            const lifetime = 0.3 + Math.random() * 0.3;
            
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const speed = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(p => p.update(deltaTime));
    }

    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
    }

    clear() {
        this.particles = [];
    }
}
window.ParticleSystem = ParticleSystem;

class WorldRenderer {
    constructor(ctx, gameState, spriteManager, particleSystem) {
        this.ctx = ctx;
        this.gameState = gameState;
        this.spriteManager = spriteManager;
        this.particleSystem = particleSystem;
        this.gridSize = 40;
        this.offsetX = 50;
        this.offsetY = 100;
        // Playable canvas area — stretches across the width of the screen,
        // leaves ~5% right margin for floating alerts.
        this.playWidth = 1060;
        this.playHeight = 560;
        this.playRight = this.offsetX + this.playWidth;   // 1110
        this.playBottom = this.offsetY + this.playHeight; // 660
    }

    render(isPaused = false) {
        this.drawSky();
        this.drawGrid();
        this.drawPlayAreaBorder();
        this.drawWeather(isPaused);
        // Draw connections and particles BEFORE entities (behind in z-order)
        this.drawConnections(isPaused);
        this.particleSystem.render(this.ctx);
        // Draw entities on top of particles
        this.drawEquipment();
        // Draw labels with backgrounds on top of everything
        this.drawEntityLabels();
    }

    // Green CRT border around the playable canvas area
    drawPlayAreaBorder() {
        const ctx = this.ctx;
        ctx.strokeStyle = Theme.colors.greenDim;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.offsetX, this.offsetY, this.playWidth, this.playHeight);
    }

    // Dark green CRT sky gradient + glowing sun/moon based on time of day
    drawSky() {
        const ctx = this.ctx;
        const time = this.gameState.time % 24;
        const x = this.offsetX;
        const y = this.offsetY;
        const w = this.playWidth;
        const h = this.playHeight;

        // Dark green CRT sky gradient (subtle vertical shift by time of day)
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#101c12');
        grad.addColorStop(1, '#0b120c');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Sun (daytime) or Moon (night) — moves across the sky with a phosphor glow
        // Sun: 06:00 to 18:00, Moon: 18:00 to 06:00
        this.drawSunMoon(ctx, time, x, y, w, h);
    }

    // Draw a glowing sun (day) or moon (night) that arcs across the sky
    drawSunMoon(ctx, time, x, y, w, h) {
        const isDay = time >= 6 && time < 18;
        // Normalize sun path: progress 0..1 across the day (6→18) or night (18→6 next day)
        let progress;
        if (isDay) {
            progress = (time - 6) / 12;                  // 0 (sunrise) → 1 (sunset)
        } else {
            // Night: moves from 18:00 → 24:00 and 0:00 → 6:00
            progress = time >= 18 ? (time - 18) / 12 : (time + 6) / 12;
        }

        // Arc across the sky: left (rise) to right (set), arcing upward in middle
        const cx = x + (w * 0.1) + progress * (w * 0.8);
        const arcBase = y + h * 0.45;
        const arcH = h * 0.42;
        const cy = arcBase - Math.sin(progress * Math.PI) * arcH;
        const radius = 24;

        if (isDay) {
            // Glowing sun
            ctx.save();
            ctx.fillStyle = '#f5e04a';
            ctx.shadowColor = Theme.colors.gold;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Sun rays
            ctx.strokeStyle = 'rgba(245, 224, 74, 0.4)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (radius + 8), cy + Math.sin(a) * (radius + 8));
                ctx.lineTo(cx + Math.cos(a) * (radius + 18), cy + Math.sin(a) * (radius + 18));
                ctx.stroke();
            }
        } else {
            // Glowing moon (crescent)
            ctx.save();
            ctx.fillStyle = '#d8e8d0';
            ctx.shadowColor = Theme.colors.green;
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Crescent cutout
            ctx.fillStyle = '#101c12';
            ctx.beginPath();
            ctx.arc(cx + radius * 0.5, cy - radius * 0.2, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Stars
            ctx.fillStyle = 'rgba(216, 232, 208, 0.7)';
            for (let i = 0; i < 20; i++) {
                const sx = x + ((i * 53) % w);
                const sy = y + ((i * 37) % (h * 0.4));
                ctx.fillRect(sx, sy, 2, 2);
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;

        const width = this.playWidth;
        const height = this.playHeight;

        for (let x = this.offsetX; x < this.offsetX + width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.offsetY);
            this.ctx.lineTo(x, this.offsetY + height);
            this.ctx.stroke();
        }

        for (let y = this.offsetY; y < this.offsetY + height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, y);
            this.ctx.lineTo(this.offsetX + width, y);
            this.ctx.stroke();
        }
    }

    drawWeather(isPaused = false) {
        if (!this.gameState || !this.gameState.weather) return;

        const time = this.gameState.time % 24;
        const width = this.playWidth;
        const height = this.playHeight;

        // Draw Night Overlay (dark green CRT tint at night)
        if (time < 6 || time > 18) {
             let darkness = 0.5; // Base darkness
             
             // Transition periods (dawn/dusk)
             if (time > 18 && time < 19) darkness = 0.5 * (time - 18);
             if (time > 5 && time < 6) darkness = 0.5 * (6 - time);
             if (time >= 19 || time <= 5) darkness = 0.7; // Full night

             this.ctx.fillStyle = Theme.rgba(Theme.colors.bgBase, darkness);
             this.ctx.fillRect(this.offsetX, this.offsetY, width, height);
        }

        const cloudCover = this.gameState.weather.cloudCover;

        if (cloudCover > 0.3) {
            this.ctx.globalAlpha = cloudCover * 0.5;
            this.ctx.fillStyle = '#808080';
            
            for (let i = 0; i < 10; i++) {
                const cloudX = this.offsetX + (i * 60) % width;
                const cloudY = this.offsetY + 20 + Math.sin(i) * 30;
                this.drawCloud(cloudX, cloudY, 30);
            }
            this.ctx.globalAlpha = 1;
        }

        // Animated rain particles during storms (only when not paused)
        // Rain covers the ENTIRE canvas, not just the game area
        if (cloudCover > 0.7 && !isPaused) {
            const canvasWidth = this.ctx.canvas.width;
            const canvasHeight = this.ctx.canvas.height;
            
            // More rain particles across the full canvas
            const rainIntensity = Math.floor((cloudCover - 0.7) * 50) + 10; // 10-25 drops per frame
            
            for (let i = 0; i < rainIntensity; i++) {
                // Rain across entire canvas
                const rainX = Math.random() * canvasWidth;
                const rainY = Math.random() * 80; // Start near top of canvas
                
                // Rain falls downward with slight angle (wind effect)
                this.particleSystem.particles.push(
                    new Particle(
                        rainX, 
                        rainY, 
                        -30 - Math.random() * 20, // slight leftward drift (wind)
                        250 + Math.random() * 150, // fast downward
                        'rgba(100, 150, 255, 0.5)', // light blue rain
                        2 + Math.random(), // small varied size
                        1.2 + Math.random() * 0.6 // 1.2-1.8 second lifetime to reach bottom
                    )
                );
            }
            
            // Add some splashes at the bottom occasionally
            if (Math.random() < 0.3) {
                const splashX = Math.random() * canvasWidth;
                const splashY = canvasHeight - 20 - Math.random() * 30;
                
                // Small splash particles
                for (let j = 0; j < 3; j++) {
                    this.particleSystem.particles.push(
                        new Particle(
                            splashX + (Math.random() - 0.5) * 10,
                            splashY,
                            (Math.random() - 0.5) * 30, // random horizontal
                            -20 - Math.random() * 20, // upward splash
                            'rgba(150, 180, 255, 0.4)',
                            1.5,
                            0.2 + Math.random() * 0.2
                        )
                    );
                }
            }
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEquipment() {
        if (!this.gameState) return;

        // Get active events to check for status indicators
        const activeEvents = this.gameState.eventSystem ? this.gameState.eventSystem.activeEvents : [];

        // Draw solar panels (no labels - handled by drawEntityLabels)
        this.gameState.solarPanels.forEach(panel => {
            const x = this.offsetX + panel.x;
            const y = this.offsetY + panel.y;
            this.spriteManager.drawProceduralSprite(this.ctx, 'solar_panel', x, y, 60, 40, panel.tier);
            
            // Draw gold border for tier4 (Elite) equipment
            if (panel.tier === 'tier4') {
                this.drawGoldBorder(x, y, 60, 40);
            }
            
            // Check for events affecting this panel
            const affectingEvent = activeEvents.find(e => 
                e.affectedEquipment === panel.id || 
                e.targetId === panel.id
            );
            if (affectingEvent) {
                this.drawStatusDot(x + 55, y + 5, affectingEvent.severity);
            }
        });

        // Draw batteries (no labels - handled by drawEntityLabels)
        this.gameState.batteries.forEach(battery => {
            const x = this.offsetX + battery.x;
            const y = this.offsetY + battery.y;
            this.spriteManager.drawProceduralSprite(this.ctx, 'battery', x, y, 40, 60, battery.tier);
            
            // Draw gold border for tier4 (Elite) equipment
            if (battery.tier === 'tier4') {
                this.drawGoldBorder(x, y, 40, 60);
            }
            
            // Check for events affecting this battery
            const affectingEvent = activeEvents.find(e => 
                e.affectedEquipment === battery.id || 
                e.targetId === battery.id
            );
            if (affectingEvent) {
                this.drawStatusDot(x + 35, y + 5, affectingEvent.severity);
            }
        });

        // Draw households (no labels - handled by drawEntityLabels)
        this.gameState.households.forEach(household => {
            const x = this.offsetX + household.x;
            const y = this.offsetY + household.y;
            this.spriteManager.drawProceduralSprite(this.ctx, 'cabin', x, y, 50, 40, household.tier);
            
            // Draw gold border for corporate (tier4 equivalent) households
            if (household.tier === 'corporate') {
                this.drawGoldBorder(x, y, 50, 40);
            }
            
            // Check for events affecting this household
            const affectingEvent = activeEvents.find(e => 
                e.affectedHousehold === household.id || 
                e.targetId === household.id
            );
            if (affectingEvent) {
                this.drawStatusDot(x + 45, y + 5, affectingEvent.severity);
            }
        });
    }
    
    // Draw a gold border around tier4/elite equipment
    drawGoldBorder(x, y, width, height) {
        this.ctx.save();
        this.ctx.strokeStyle = Theme.colors.gold;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = Theme.colors.gold;
        this.ctx.shadowBlur = 8;
        this.ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
        this.ctx.restore();
    }

    // Draw a colored status indicator dot
    drawStatusDot(x, y, severity) {
        const colors = {
            high: Theme.colors.red,
            medium: Theme.colors.amber,
            low: Theme.colors.cyan,
            info: Theme.colors.cyan
        };
        const color = colors[severity] || colors.info;
        
        // Draw outer glow
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.3;
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Draw inner dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    drawEntityLabels() {
        if (!this.gameState) return;

        this.ctx.font = Theme.font(10);
        this.ctx.textAlign = 'center';

        // Solar panel labels
        this.gameState.solarPanels.forEach(panel => {
            const x = this.offsetX + panel.x + 30;
            const y = this.offsetY + panel.y + 55;
            const text = `${panel.capacity}kW`;
            this.drawLabelWithBackground(x, y, text, Theme.colors.textBright);
        });

        // Battery labels
        this.gameState.batteries.forEach(battery => {
            const x = this.offsetX + battery.x + 20;
            const y = this.offsetY + battery.y + 75;
            const chargePercent = (battery.charge / battery.capacity * 100).toFixed(0);
            const text = `${chargePercent}%`;
            this.drawLabelWithBackground(x, y, text, Theme.colors.textBright);
        });

        // Household labels
        this.gameState.households.forEach(household => {
            const x = this.offsetX + household.x + 25;
            const y = this.offsetY + household.y + 55;
            const satisfaction = household.satisfaction * 100;
            const satisfactionColor = satisfaction > 70 ? Theme.colors.green : satisfaction > 40 ? Theme.colors.amber : Theme.colors.red;
            const text = `${satisfaction.toFixed(0)}%`;
            this.drawLabelWithBackground(x, y, text, satisfactionColor);
        });
    }

    drawLabelWithBackground(x, y, text, textColor) {
        // Measure text width
        const metrics = this.ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 10; // Approximate height for 10px font
        const padding = 3;

        // Draw semi-transparent background
        this.ctx.fillStyle = Theme.rgba(Theme.colors.panelBgAlt, 0.85);
        this.ctx.fillRect(
            x - textWidth / 2 - padding,
            y - textHeight - padding + 2,
            textWidth + padding * 2,
            textHeight + padding * 2
        );

        // Draw border
        this.ctx.strokeStyle = Theme.colors.greenFaint;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            x - textWidth / 2 - padding,
            y - textHeight - padding + 2,
            textWidth + padding * 2,
            textHeight + padding * 2
        );

        // Draw text
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(text, x, y-5);
    }

    drawConnections(isPaused = false) {
        if (!this.gameState) return;

        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;

        this.gameState.solarPanels.forEach(panel => {
            this.gameState.batteries.forEach(battery => {
                const x1 = this.offsetX + panel.x + 30;
                const y1 = this.offsetY + panel.y + 20;
                const x2 = this.offsetX + battery.x + 20;
                const y2 = this.offsetY + battery.y + 30;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();

                // Only emit particles when NOT paused
                if (!isPaused && this.gameState.energy.generation > 0) {
                    this.particleSystem.emitFlow(x1, y1, x2, y2, '#ffff00', 2);
                }
            });
        });

        this.gameState.batteries.forEach(battery => {
            this.gameState.households.forEach(household => {
                const x1 = this.offsetX + battery.x + 20;
                const y1 = this.offsetY + battery.y + 30;
                const x2 = this.offsetX + household.x + 25;
                const y2 = this.offsetY + household.y + 20;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();

                // Only emit particles when NOT paused - check battery charge for flow effect
                if (!isPaused && battery.charge > 0) {
                    this.particleSystem.emitFlow(x1, y1, x2, y2, '#00ff00', 2);
                }
            });
        });
        
        // Render preview connections if in placement mode
        if (window.Game && window.Game.placementMode && window.Game.placementItem) {
             const px = window.Game.placementX;
             const py = window.Game.placementY;
             const centerX = px + 20; // Approx center
             const centerY = py + 20;
             
             this.ctx.save();
             this.ctx.setLineDash([5, 5]);
             this.ctx.strokeStyle = '#aaaaaa';
             this.ctx.lineWidth = 2;
             
             const itemType = window.Game.placementItem.type;

             // If placing solar, connect to batteries
             if (itemType === 'solar_panel') {
                 this.gameState.batteries.forEach(battery => {
                    const bx = this.offsetX + battery.x + 20;
                    const by = this.offsetY + battery.y + 30;
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, centerY);
                    this.ctx.lineTo(bx, by);
                    this.ctx.stroke();
                 });
             }
             // If placing battery, connect to solar and households
             else if (itemType === 'battery') {
                  this.gameState.solarPanels.forEach(panel => {
                    const sx = this.offsetX + panel.x + 30;
                    const sy = this.offsetY + panel.y + 20;
                    this.ctx.beginPath();
                    this.ctx.moveTo(sx, sy);
                    this.ctx.lineTo(centerX, centerY);
                    this.ctx.stroke();
                 });
                 this.gameState.households.forEach(house => {
                    const hx = this.offsetX + house.x + 25;
                    const hy = this.offsetY + house.y + 20;
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, centerY);
                    this.ctx.lineTo(hx, hy);
                    this.ctx.stroke();
                 });
             }
             // If placing household, connect to batteries
             else if (itemType === 'household') {
                 this.gameState.batteries.forEach(battery => {
                    const bx = this.offsetX + battery.x + 20;
                    const by = this.offsetY + battery.y + 30;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bx, by);
                    this.ctx.lineTo(centerX, centerY);
                    this.ctx.stroke();
                 });
             }
             
             this.ctx.restore();
        }
    }
}
window.WorldRenderer = WorldRenderer;

// Export Particle too, just in case
window.Particle = Particle;
