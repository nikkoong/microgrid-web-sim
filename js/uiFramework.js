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

        ctx.fillStyle = bgColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = textColor;
        ctx.font = `bold ${this.style.fontSize} ${this.style.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Handle multi-line text
        const lines = this.text.split('\n');
        const lineHeight = parseInt(this.style.fontSize) + 4;
        const totalHeight = lines.length * lineHeight;
        const startY = this.y + (this.height - totalHeight) / 2 + lineHeight / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, this.x + this.width / 2, startY + index * lineHeight);
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

window.UIElement = UIElement;
window.Button = Button;
window.Panel = Panel;
window.Dialog = Dialog;
window.EnergyBar = EnergyBar;
window.NotificationSystem = NotificationSystem;
