// UI Framework - Pokemon-style UI elements and interaction system

class UIElement {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.visible = true;
        this.enabled = true;
        this.children = [];
    }

    addChild(child) {
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

    render(ctx) {
        if (!this.visible) return;
        this.children.forEach(child => child.render(ctx));
    }

    handleClick(x, y) {
        if (!this.visible || !this.enabled) return false;
        
        // Check if any child handles the click (in reverse order to handle z-index)
        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i].handleClick(x, y)) {
                return true;
            }
        }
        return false;
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

class Button extends UIElement {
    constructor(x, y, width, height, text, onClick, style = {}) {
        super(x, y, width, height);
        this.text = text;
        this.onClick = onClick;
        this.style = {
            bgColor: style.bgColor || '#ff6b6b', // Default red
            hoverBgColor: style.hoverBgColor || '#ee5a52',
            activeBgColor: style.activeBgColor || '#d63031',
            borderColor: style.borderColor || '#d63031',
            textColor: style.textColor || '#ffffff',
            disabledBgColor: style.disabledBgColor || '#a0a0a0',
            disabledTextColor: style.disabledTextColor || '#666666',
            disabledBorderColor: style.disabledBorderColor || '#888888',
            fontSize: style.fontSize || '16px',
            fontFamily: style.fontFamily || 'monospace'
        };
        this.hovered = false;
        this.clicked = false;
        this.disabled = false;  // New disabled state
    }

    setDisabled(disabled) {
        this.disabled = disabled;
    }

    render(ctx) {
        if (!this.visible) return;

        let bgColor, textColor, borderColor;
        
        if (this.disabled) {
            bgColor = this.style.disabledBgColor;
            textColor = this.style.disabledTextColor;
            borderColor = this.style.disabledBorderColor;
        } else if (this.clicked) {
            // More prominent pressed state for touch
            bgColor = this.style.activeBgColor;
            textColor = this.style.textColor;
            borderColor = this.style.borderColor;
        } else if (this.hovered) {
            bgColor = this.style.hoverBgColor;
            textColor = this.style.textColor;
            borderColor = this.style.borderColor;
        } else {
            bgColor = this.style.bgColor;
            textColor = this.style.textColor;
            borderColor = this.style.borderColor;
        }

        // Draw button with slight offset when pressed (touch feedback)
        const pressOffset = this.clicked ? 2 : 0;
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(this.x + pressOffset, this.y + pressOffset, this.width, this.height);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = this.clicked ? 3 : 2; // Thicker border when pressed
        ctx.strokeRect(this.x + pressOffset, this.y + pressOffset, this.width, this.height);

        ctx.fillStyle = textColor;
        ctx.font = `bold ${this.style.fontSize} ${this.style.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Handle multi-line text
        const lines = this.text.split('\n');
        const lineHeight = parseInt(this.style.fontSize) + 4;
        const totalHeight = lines.length * lineHeight;
        const startY = (this.y + pressOffset) + (this.height - totalHeight) / 2 + lineHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, (this.x + pressOffset) + this.width / 2, startY + index * lineHeight);
        });

        super.render(ctx);
    }

    handleClick(x, y) {
        if (!this.visible || !this.enabled || this.disabled) return false;
        if (this.contains(x, y) && this.onClick) {
            this.onClick();
            return true;
        }
        return false;
    }

    handleMouseMove(x, y) {
        this.hovered = this.contains(x, y) && !this.disabled;
    }

    handleMouseDown(x, y) {
        this.clicked = this.contains(x, y) && !this.disabled;
    }

    handleMouseUp(x, y) {
        this.clicked = false;
    }
}

class Panel extends UIElement {
    constructor(x, y, width, height, title, style = {}) {
        super(x, y, width, height);
        this.title = title;
        this.style = {
            bgColor: style.bgColor || '#f5f5dc',
            borderColor: style.borderColor || '#4a4a4a',
            borderWidth: style.borderWidth || 3,
            textColor: style.textColor || '#2b2b2b',
            fontSize: style.fontSize || '14px',
            fontFamily: style.fontFamily || 'monospace',
            borderRadius: style.borderRadius || 8
        };
    }

    render(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = this.style.bgColor;
        ctx.strokeStyle = this.style.borderColor;
        ctx.lineWidth = this.style.borderWidth;

        this.roundRect(ctx, this.x, this.y, this.width, this.height, this.style.borderRadius);
        ctx.fill();
        ctx.stroke();

        if (this.title) {
            ctx.fillStyle = this.style.textColor;
            ctx.font = `bold ${this.style.fontSize} ${this.style.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(this.title, this.x + 10, this.y + 10);
        }

        super.render(ctx);
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class Dialog extends Panel {
    constructor(x, y, width, height, text, options = []) {
        super(x, y, width, height, null);
        this.text = text;
        this.displayedText = '';
        this.typewriterIndex = 0;
        this.typewriterSpeed = 30; // ms per character
        this.lastTypeTime = 0;
        this.typewriterComplete = false;
        this.options = options;
        this.selectedOption = 0;
        this.autoAdvance = options.length === 0;
        this.onComplete = null;
    }

    update(currentTime) {
        if (!this.typewriterComplete) {
            if (currentTime - this.lastTypeTime > this.typewriterSpeed) {
                if (this.typewriterIndex < this.text.length) {
                    this.displayedText += this.text[this.typewriterIndex];
                    this.typewriterIndex++;
                    this.lastTypeTime = currentTime;
                } else {
                    this.typewriterComplete = true;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }
        }
    }

    render(ctx) {
        super.render(ctx);

        ctx.fillStyle = this.style.textColor;
        ctx.font = `${this.style.fontSize} ${this.style.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const padding = 10;
        const textWidth = this.width - padding * 2;
        this.wrapText(ctx, this.displayedText, this.x + padding, this.y + padding, textWidth, 20);

        if (this.options.length > 0) {
            const startY = this.y + this.height - this.options.length * 30 - 10;
            this.options.forEach((option, index) => {
                const prefix = index === this.selectedOption ? '► ' : '  ';
                ctx.fillText(prefix + option.text, this.x + 20, startY + index * 30);
            });
        }

        super.render(ctx);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    handleClick(x, y) {
        if (this.typewriterComplete && this.options.length > 0) {
            const startY = this.y + this.height - this.options.length * 30 - 10;
            for (let i = 0; i < this.options.length; i++) {
                const optionY = startY + i * 30;
                if (y >= optionY && y <= optionY + 20 && x >= this.x + 20 && x <= this.x + this.width - 20) {
                    this.selectedOption = i;
                    if (this.options[i].onClick) {
                        this.options[i].onClick();
                    }
                    return true;
                }
            }
        } else if (this.autoAdvance && this.typewriterComplete) {
            if (this.onComplete) {
                this.onComplete();
            }
        }
        return false;
    }
}

class EnergyBar extends UIElement {
    constructor(x, y, width, height, maxValue, currentValue, color, label) {
        super(x, y, width, height);
        this.maxValue = maxValue;
        this.currentValue = currentValue;
        this.color = color;
        this.label = label;
    }

    setValue(value) {
        this.currentValue = value;
    }

    render(ctx) {
        if (!this.visible) return;

        const fillWidth = Math.min((this.currentValue / this.maxValue) * this.width, this.width);

        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, fillWidth, this.height);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = `${this.label}: ${this.currentValue.toFixed(1)}/${this.maxValue.toFixed(1)}`;
        ctx.fillText(label, this.x + this.width / 2, this.y + this.height / 2);

        super.render(ctx);
    }
}

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 6; // Show up to 6 notifications
        this.notificationDuration = 5000;
    }

    addNotification(message, severity = 'info') {
        const notification = {
            message,
            severity,
            timestamp: Date.now(),
            color: this.getSeverityColor(severity),
            targetY: 0,  // Will be calculated during render
            currentY: -60  // Start above viewport for slide-in animation
        };
        
        // Add new notification at the beginning (newest first)
        this.notifications.unshift(notification);
        
        // Keep only the most recent maxNotifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
    }

    getSeverityColor(severity) {
        // Returns stripe color for left edge
        switch (severity) {
            case 'error': return '#d63031';    // Red
            case 'warning': return '#fdcb6e';  // Yellow/Orange
            case 'success': return '#00b894';  // Green
            case 'gold': return '#ffd700';     // Gold for special achievements
            default: return '#74b9ff';         // Light blue for info
        }
    }

    update(currentTime) {
        // Remove expired notifications
        this.notifications = this.notifications.filter(n => {
            return currentTime - n.timestamp < this.notificationDuration;
        });
        
        // Animate notifications sliding to their target positions
        this.notifications.forEach((notif, index) => {
            // Target Y is based on index (0 = top/newest, higher index = further down)
            const targetY = index * 55;  // 55px spacing between notifications
            
            // Smooth slide animation
            if (notif.currentY === undefined) {
                notif.currentY = -60;  // Start above for slide-in
            }
            
            // Lerp towards target position
            const lerpSpeed = 0.15;
            notif.currentY += (targetY - notif.currentY) * lerpSpeed;
        });
    }

    render(ctx, x, y) {
        const notifWidth = 350;
        const notifHeight = 45;
        const stripeWidth = 6;
        
        this.notifications.forEach((notif, index) => {
            // Calculate actual Y position (y is the base, notifications stack downward)
            const notifY = y + notif.currentY;
            
            // Special gold styling for achievement notifications
            if (notif.severity === 'gold') {
                // Gold background for achievements
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x, notifY, notifWidth, notifHeight);
                
                // Dark border for contrast
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, notifY, notifWidth, notifHeight);
                
                // Black bold text for gold notifications
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 12px monospace';
            } else {
                // Standard dark background
                ctx.fillStyle = '#2d3436';
                ctx.fillRect(x, notifY, notifWidth, notifHeight);
                
                // Colored stripe on left edge based on severity
                ctx.fillStyle = notif.color;
                ctx.fillRect(x, notifY, stripeWidth, notifHeight);
                
                // White text for standard notifications
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
            }
            
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            
            // Word wrap for long messages
            const textStartX = notif.severity === 'gold' ? x + 10 : x + stripeWidth + 10;
            const maxWidth = notif.severity === 'gold' ? notifWidth - 20 : notifWidth - stripeWidth - 20;
            const words = notif.message.split(' ');
            let line = '';
            let yOffset = 8;
            
            for (let word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line, textStartX, notifY + yOffset);
                    line = word + ' ';
                    yOffset += 14;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, textStartX, notifY + yOffset);
        });
    }
}

// Mobile Drawer - Slides in from edge of screen
class MobileDrawer extends UIElement {
    constructor(width, height, edge = 'right', title = '') {
        // Position based on edge
        const x = edge === 'right' ? 1200 : -width;  // Start offscreen
        const y = 0;
        super(x, y, width, height);
        
        this.edge = edge;
        this.title = title;
        this.isOpen = false;
        this.targetX = x;
        this.animationSpeed = 0.2;
        
        // Closed position (offscreen)
        this.closedX = edge === 'right' ? 1200 : -width;
        // Open position
        this.openX = edge === 'right' ? 1200 - width : 0;
        
        this.style = {
            bgColor: 'rgba(45, 52, 54, 0.95)',
            borderColor: '#4a4a4a',
            titleColor: '#ffffff',
            handleColor: '#6c5ce7'
        };
        
        // Content area (scrollable in future)
        this.contentY = 50;
        this.contentPadding = 10;
    }
    
    open() {
        this.isOpen = true;
        this.targetX = this.openX;
        this.visible = true;
    }
    
    close() {
        this.isOpen = false;
        this.targetX = this.closedX;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    update() {
        // Animate slide
        const diff = this.targetX - this.x;
        if (Math.abs(diff) > 1) {
            this.x += diff * this.animationSpeed;
        } else {
            this.x = this.targetX;
        }
        
        // Update children's X position to match drawer position
        this.children.forEach(child => {
            if (child.baseX === undefined) {
                child.baseX = child.x - this.openX;  // Store offset from open position
            }
            child.x = this.x + child.baseX;
            
            // Also update any nested buttons inside shop content
            if (child.buttons) {
                child.buttons.forEach(btn => {
                    if (btn.baseX === undefined) {
                        btn.baseX = btn.x - this.openX;
                    }
                    btn.x = this.x + btn.baseX;
                });
            }
        });
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        this.update();
        
        // Draw backdrop when open (semi-transparent)
        if (this.isOpen) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, 1200, 800);
        }
        
        // Draw drawer
        ctx.fillStyle = this.style.bgColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = this.style.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw handle/tab on the edge
        const handleWidth = 30;
        const handleHeight = 80;
        const handleY = this.height / 2 - handleHeight / 2;
        
        if (this.edge === 'right') {
            ctx.fillStyle = this.style.handleColor;
            ctx.fillRect(this.x - handleWidth, handleY, handleWidth, handleHeight);
            
            // Draw arrow on handle
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.isOpen ? '›' : '‹', this.x - handleWidth / 2, handleY + handleHeight / 2);
        }
        
        // Draw title
        if (this.title) {
            ctx.fillStyle = this.style.titleColor;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(this.title, this.x + 15, this.y + 15);
        }
        
        // Draw close X button
        const closeX = this.x + this.width - 35;
        const closeY = this.y + 10;
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(closeX, closeY, 25, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeX + 12.5, closeY + 12.5);
        
        // Store close button bounds
        this.closeButtonBounds = { x: closeX, y: closeY, width: 25, height: 25 };
        
        // Render children
        super.render(ctx);
    }
    
    handleClick(x, y) {
        if (!this.visible) return false;
        
        // Check handle click (to open)
        const handleWidth = 30;
        const handleHeight = 80;
        const handleY = this.height / 2 - handleHeight / 2;
        const handleX = this.edge === 'right' ? this.x - handleWidth : this.x + this.width;
        
        if (x >= handleX && x <= handleX + handleWidth &&
            y >= handleY && y <= handleY + handleHeight) {
            this.toggle();
            return true;
        }
        
        // Check close button
        if (this.isOpen && this.closeButtonBounds) {
            const cb = this.closeButtonBounds;
            if (x >= cb.x && x <= cb.x + cb.width &&
                y >= cb.y && y <= cb.y + cb.height) {
                this.close();
                return true;
            }
        }
        
        // Check backdrop click (to close)
        if (this.isOpen && this.edge === 'right' && x < this.x) {
            this.close();
            return true;
        }
        
        // Let children handle click
        return super.handleClick(x, y);
    }
}

// Mobile Bottom Sheet - Slides up from bottom
class MobileBottomSheet extends UIElement {
    constructor(width, height, title = '') {
        const x = (1200 - width) / 2;  // Centered
        const y = 800;  // Start offscreen (bottom)
        super(x, y, width, height);
        
        this.title = title;
        this.isOpen = false;
        this.targetY = y;
        this.animationSpeed = 0.2;
        
        // Closed position (offscreen)
        this.closedY = 800;
        // Open position
        this.openY = 800 - height;
        
        this.style = {
            bgColor: 'rgba(45, 52, 54, 0.98)',
            borderColor: '#4a4a4a',
            titleColor: '#ffffff',
            handleColor: '#666666'
        };
    }
    
    open() {
        this.isOpen = true;
        this.targetY = this.openY;
        this.visible = true;
    }
    
    close() {
        this.isOpen = false;
        this.targetY = this.closedY;
    }
    
    update() {
        // Animate slide
        const diff = this.targetY - this.y;
        if (Math.abs(diff) > 1) {
            this.y += diff * this.animationSpeed;
        } else {
            this.y = this.targetY;
        }
        
        // Update children's Y position to match sheet position
        this.children.forEach(child => {
            if (child.baseY === undefined) {
                child.baseY = child.y - this.openY;  // Store offset from open position
            }
            child.y = this.y + child.baseY;
        });
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        this.update();
        
        // Draw backdrop when open
        if (this.isOpen && this.y < this.closedY - 10) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, 1200, 800);
        }
        
        // Draw rounded top corners
        const radius = 15;
        ctx.fillStyle = this.style.bgColor;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.fill();
        
        // Draw handle bar at top
        ctx.fillStyle = this.style.handleColor;
        ctx.fillRect(this.x + this.width / 2 - 30, this.y + 8, 60, 5);
        
        // Draw title
        if (this.title) {
            ctx.fillStyle = this.style.titleColor;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(this.title, this.x + this.width / 2, this.y + 25);
        }
        
        // Render children
        super.render(ctx);
    }
    
    handleClick(x, y) {
        if (!this.visible) return false;
        
        // Check backdrop click (to close)
        if (this.isOpen && y < this.y) {
            this.close();
            return true;
        }
        
        // Check if click is on the sheet
        if (this.isOpen && this.contains(x, y)) {
            // Let children handle click
            return super.handleClick(x, y);
        }
        
        return false;
    }
}

// Compact mobile shop that fits in a drawer
class MobileShopContent extends UIElement {
    constructor(x, y, width, purchaseManager) {
        super(x, y, width, 700);
        this.purchaseManager = purchaseManager;
        this.currentCategory = 'solar_panels';
        this.buttons = [];
        this.categoryButtons = [];
        this.equipmentButtons = [];
        this.scrollY = 0;
        // Store original position for button creation
        this.originalX = x;
        this.originalY = y;
        this.setupUI();
    }
    
    setupUI() {
        this.buttons = [];
        this.categoryButtons = [];
        this.equipmentButtons = [];
        
        // Compact category buttons
        const categories = [
            { text: '☀️ Solar', category: 'solar_panels' },
            { text: '🔋 Battery', category: 'batteries' },
            { text: '🏠 Building', category: 'households' }
        ];
        
        categories.forEach((cat, index) => {
            const isSelected = cat.category === this.currentCategory;
            const button = new Button(
                this.originalX + index * (this.width / 3),
                this.originalY,
                this.width / 3 - 5,
                40,
                cat.text,
                () => this.setCategory(cat.category),
                {
                    bgColor: isSelected ? '#6c5ce7' : '#4a4a4a',
                    hoverBgColor: '#5f27cd',
                    activeBgColor: '#341f97',
                    borderColor: isSelected ? '#a55eea' : '#666666',
                    textColor: '#ffffff',
                    fontSize: '11px'
                }
            );
            button.category = cat.category;
            this.buttons.push(button);
            this.categoryButtons.push(button);
            this.addChild(button);
        });
        
        this.renderEquipmentButtons();
    }
    
    setCategory(category) {
        this.currentCategory = category;
        
        // Update category button styling
        this.categoryButtons.forEach(btn => {
            const isSelected = btn.category === category;
            btn.style.bgColor = isSelected ? '#6c5ce7' : '#4a4a4a';
            btn.style.borderColor = isSelected ? '#a55eea' : '#666666';
        });
        
        this.renderEquipmentButtons();
    }
    
    renderEquipmentButtons() {
        // Remove old equipment buttons
        for (let i = this.children.length - 1; i >= this.categoryButtons.length; i--) {
            this.removeChild(this.children[i]);
        }
        this.buttons = this.buttons.slice(0, this.categoryButtons.length);
        this.equipmentButtons = [];
        
        const equipment = this.purchaseManager.catalog.getAllEquipment(this.currentCategory);
        const currentMoney = this.purchaseManager.gameState.money;
        
        equipment.forEach((eq, index) => {
            const canAfford = currentMoney >= eq.cost;
            
            // Create compact button text
            let buttonText = eq.name;
            if (eq.type === 'solar_panel') {
                buttonText = `${eq.capacity}kW - $${eq.cost}`;
            } else if (eq.type === 'battery') {
                buttonText = `${eq.capacity}kWh - $${eq.cost}`;
            } else if (eq.type === 'household') {
                buttonText = `${eq.name}\n$${eq.cost}`;
            }
            
            const button = new Button(
                this.originalX + 5,
                this.originalY + 50 + index * 55,
                this.width - 10,
                50,
                buttonText,
                () => {
                    if (window.Game) {
                        window.Game.startPlacement(eq);
                        // Close the drawer
                        if (window.Game.mobileShopDrawer) {
                            window.Game.mobileShopDrawer.close();
                        }
                    }
                },
                {
                    bgColor: eq.special ? '#3d3d6b' : '#2d3436',
                    hoverBgColor: '#4a4a4a',
                    activeBgColor: '#1e272e',
                    borderColor: eq.special ? '#ffd700' : '#666666',
                    textColor: canAfford ? '#ffffff' : '#888888',
                    disabledBgColor: '#1a1a1a',
                    disabledTextColor: '#555555',
                    disabledBorderColor: '#333333',
                    fontSize: '12px'
                }
            );
            
            button.equipmentCost = eq.cost;
            button.equipment = eq;
            button.setDisabled(!canAfford);
            
            this.buttons.push(button);
            this.equipmentButtons.push(button);
            this.addChild(button);
        });
    }
    
    updateAffordability() {
        if (!this.purchaseManager || !this.purchaseManager.gameState) return;
        
        const currentMoney = this.purchaseManager.gameState.money;
        
        this.equipmentButtons.forEach(button => {
            if (button.equipmentCost !== undefined) {
                const canAfford = currentMoney >= button.equipmentCost;
                button.setDisabled(!canAfford);
                button.style.textColor = canAfford ? '#ffffff' : '#888888';
            }
        });
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        // Draw money display
        if (this.purchaseManager && this.purchaseManager.gameState) {
            ctx.fillStyle = '#00b894';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`$${this.purchaseManager.gameState.money.toFixed(0)}`, this.x + this.width - 10, this.y - 10);
        }
        
        super.render(ctx);
        
        // Draw special labels
        this.equipmentButtons.forEach(button => {
            if (button.equipment && button.equipment.special && !button.disabled) {
                const labelX = button.x + button.width - 80;
                const labelY = button.y + 5;
                
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(button.equipment.special.name, labelX, labelY + 8);
            }
        });
    }
}

// Compact mobile selection panel content
class MobileSelectionContent extends UIElement {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.entity = null;
        this.entityType = null;
        this.upgradeCallback = null;
        this.deleteCallback = null;
        this.closeCallback = null;
    }
    
    setEntity(entity, entityType) {
        this.entity = entity;
        this.entityType = entityType;
    }
    
    setCallbacks(onUpgrade, onDelete, onClose) {
        this.upgradeCallback = onUpgrade;
        this.deleteCallback = onDelete;
        this.closeCallback = onClose;
    }
    
    render(ctx) {
        if (!this.visible || !this.entity) return;
        
        const padding = 15;
        let yOffset = this.y + 50;
        
        // Entity info
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        
        // ID and type
        ctx.fillText(`${this.entity.id || 'Unknown'}`, this.x + padding, yOffset);
        yOffset += 25;
        
        // Tier
        const tier = this.entity.tier || 'tier1';
        ctx.fillStyle = tier === 'tier4' || tier === 'corporate' ? '#ffd700' : '#aaaaaa';
        ctx.fillText(`Tier: ${tier.replace('tier', '')}`, this.x + padding, yOffset);
        yOffset += 25;
        
        // Type-specific stats
        ctx.fillStyle = '#ffffff';
        switch (this.entityType) {
            case 'solar':
                ctx.fillText(`Capacity: ${this.entity.capacity} kW`, this.x + padding, yOffset);
                yOffset += 20;
                ctx.fillText(`Efficiency: ${(this.entity.efficiency * 100).toFixed(0)}%`, this.x + padding, yOffset);
                break;
            case 'battery':
                ctx.fillText(`Capacity: ${this.entity.capacity} kWh`, this.x + padding, yOffset);
                yOffset += 20;
                ctx.fillText(`Charge: ${this.entity.charge.toFixed(1)} kWh`, this.x + padding, yOffset);
                yOffset += 20;
                ctx.fillText(`Efficiency: ${(this.entity.efficiency * 100).toFixed(0)}%`, this.x + padding, yOffset);
                break;
            case 'household':
                ctx.fillText(`Load: ${this.entity.baseLoad}-${(this.entity.baseLoad + this.entity.variableLoad).toFixed(1)} kW`, this.x + padding, yOffset);
                yOffset += 20;
                const satColor = this.entity.satisfaction > 0.7 ? '#00b894' : this.entity.satisfaction > 0.4 ? '#fdcb6e' : '#d63031';
                ctx.fillStyle = satColor;
                ctx.fillText(`Satisfaction: ${(this.entity.satisfaction * 100).toFixed(0)}%`, this.x + padding, yOffset);
                break;
        }
        
        // Action buttons
        const buttonY = this.y + this.height - 60;
        const buttonWidth = (this.width - 40) / 2;
        
        // Upgrade button (only for solar/battery)
        if (this.entityType !== 'household') {
            const tierOrder = ['tier1', 'tier2', 'tier3', 'tier4'];
            const currentTierIndex = tierOrder.indexOf(tier);
            const isMaxTier = currentTierIndex >= tierOrder.length - 1;
            
            // Calculate upgrade cost to check affordability
            let canAfford = true;
            let upgradeCost = 0;
            if (!isMaxTier) {
                const equipmentCosts = {
                    solar: { tier1: 500, tier2: 925, tier3: 1390, tier4: 2500 },
                    battery: { tier1: 400, tier2: 740, tier3: 1480, tier4: 3000 }
                };
                const costs = equipmentCosts[this.entityType];
                if (costs) {
                    const nextTier = tierOrder[currentTierIndex + 1];
                    const currentCost = costs[tier];
                    const nextCost = costs[nextTier];
                    upgradeCost = nextCost - currentCost;
                    
                    // Check if player can afford
                    if (window.Game && window.Game.gameState) {
                        canAfford = window.Game.gameState.money >= upgradeCost;
                    }
                }
            }
            
            const isDisabled = isMaxTier || !canAfford;
            
            ctx.fillStyle = isDisabled ? '#666666' : '#00b894';
            ctx.fillRect(this.x + padding, buttonY, buttonWidth, 45);
            ctx.strokeStyle = isDisabled ? '#444444' : '#00a884';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + padding, buttonY, buttonWidth, 45);
            
            ctx.fillStyle = isDisabled ? '#999999' : '#ffffff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            
            // Show different text based on state
            let buttonText = 'UPGRADE';
            if (isMaxTier) {
                buttonText = 'MAX TIER';
            } else if (!canAfford) {
                buttonText = `$${upgradeCost}`;
            } else {
                buttonText = `UPGRADE $${upgradeCost}`;
            }
            ctx.fillText(buttonText, this.x + padding + buttonWidth / 2, buttonY + 28);
            
            // Store button bounds
            this.upgradeBounds = { x: this.x + padding, y: buttonY, width: buttonWidth, height: 45, disabled: isDisabled };
        }
        
        // Delete/Sell button
        const deleteX = this.entityType !== 'household' ? this.x + padding + buttonWidth + 10 : this.x + padding;
        const deleteWidth = this.entityType !== 'household' ? buttonWidth : this.width - 30;
        
        ctx.fillStyle = '#d63031';
        ctx.fillRect(deleteX, buttonY, deleteWidth, 45);
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.strokeRect(deleteX, buttonY, deleteWidth, 45);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELL (50%)', deleteX + deleteWidth / 2, buttonY + 28);
        
        this.deleteBounds = { x: deleteX, y: buttonY, width: deleteWidth, height: 45 };
    }
    
    handleClick(x, y) {
        if (!this.visible || !this.entity) return false;
        
        // Check upgrade button
        if (this.upgradeBounds && !this.upgradeBounds.disabled) {
            if (x >= this.upgradeBounds.x && x <= this.upgradeBounds.x + this.upgradeBounds.width &&
                y >= this.upgradeBounds.y && y <= this.upgradeBounds.y + this.upgradeBounds.height) {
                if (this.upgradeCallback) this.upgradeCallback();
                return true;
            }
        }
        
        // Check delete button
        if (this.deleteBounds) {
            if (x >= this.deleteBounds.x && x <= this.deleteBounds.x + this.deleteBounds.width &&
                y >= this.deleteBounds.y && y <= this.deleteBounds.y + this.deleteBounds.height) {
                if (this.deleteCallback) this.deleteCallback();
                return true;
            }
        }
        
        return false;
    }
}

window.UIElement = UIElement;
window.Button = Button;
window.Panel = Panel;
window.Dialog = Dialog;
window.EnergyBar = EnergyBar;
window.NotificationSystem = NotificationSystem;
window.MobileDrawer = MobileDrawer;
window.MobileBottomSheet = MobileBottomSheet;
window.MobileShopContent = MobileShopContent;
window.MobileSelectionContent = MobileSelectionContent;
