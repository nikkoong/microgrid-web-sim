// Economic and Purchasing System

class EquipmentCatalog {
    constructor() {
        // Pricing formula: 2x capacity = 1.85x price (makes upgrades worthwhile)
        // Solar: tier1=500, tier2=925 (1.85x for 2x cap), tier3=1390 (2.78x for 3x cap), tier4=2500 (elite)
        // Battery: tier1=400, tier2=740 (1.85x for 2x cap), tier3=1480 (3.7x for 4x cap), tier4=3000 (elite)
        this.catalog = {
            solar_panels: {
                tier1: {
                    id: 'solar_tier1',
                    name: 'Basic Solar Panel',
                    description: '5kW capacity, 85% efficiency',
                    capacity: 5,
                    efficiency: 0.85,
                    cost: 500,
                    type: 'solar_panel'
                },
                tier2: {
                    id: 'solar_tier2',
                    name: 'Advanced Solar Panel',
                    description: '10kW capacity, 90% efficiency',
                    capacity: 10,
                    efficiency: 0.90,
                    cost: 925,  // 1.85x tier1 for 2x capacity
                    type: 'solar_panel'
                },
                tier3: {
                    id: 'solar_tier3',
                    name: 'Premium Solar Panel',
                    description: '15kW capacity, 95% efficiency',
                    capacity: 15,
                    efficiency: 0.95,
                    cost: 1390,  // ~2.78x tier1 for 3x capacity
                    type: 'solar_panel'
                },
                tier4: {
                    id: 'solar_tier4',
                    name: 'Elite Solar Array',
                    description: '25kW capacity, 98% efficiency',
                    capacity: 25,
                    efficiency: 0.98,
                    cost: 2500,
                    type: 'solar_panel',
                    special: {
                        name: 'WEATHERPROOF',
                        tooltip: 'Immune to weather and malfunction events. Still affected by nighttime.'
                    }
                }
            },
            batteries: {
                tier1: {
                    id: 'battery_tier1',
                    name: 'Basic Battery',
                    description: '10kWh capacity, 90% efficiency',
                    capacity: 10,
                    efficiency: 0.90,
                    cost: 400,
                    type: 'battery'
                },
                tier2: {
                    id: 'battery_tier2',
                    name: 'Advanced Battery',
                    description: '20kWh capacity, 92% efficiency',
                    capacity: 20,
                    efficiency: 0.92,
                    cost: 740,  // 1.85x tier1 for 2x capacity
                    type: 'battery'
                },
                tier3: {
                    id: 'battery_tier3',
                    name: 'Premium Battery',
                    description: '40kWh capacity, 95% efficiency',
                    capacity: 40,
                    efficiency: 0.95,
                    cost: 1480,  // 3.7x tier1 for 4x capacity (1.85^2)
                    type: 'battery'
                },
                tier4: {
                    id: 'battery_tier4',
                    name: 'Elite Power Core',
                    description: '80kWh capacity, 98% efficiency',
                    capacity: 80,
                    efficiency: 0.98,
                    cost: 3000,
                    type: 'battery',
                    special: {
                        name: 'SELF-HEALING',
                        tooltip: 'Immune to battery events. Passively regenerates 0.5% charge per hour.'
                    }
                }
            },
            households: {
                cabin: {
                    id: 'household_cabin',
                    name: 'Basic Cabin',
                    description: 'Single household, low consumption',
                    baseLoad: 1.0,
                    variableLoad: 0.5,
                    cost: 1000,
                    type: 'household',
                    tier: 'cabin',
                    personality: {
                        cooperationLevel: 0.9,
                        priority: 'comfort'
                    }
                },
                family: {
                    id: 'household_family',
                    name: 'Family Home',
                    description: 'Family household, medium consumption',
                    baseLoad: 2.0,
                    variableLoad: 1.0,
                    cost: 2000,
                    type: 'household',
                    tier: 'family',
                    personality: {
                        cooperationLevel: 0.7,
                        priority: 'comfort'
                    }
                },
                business: {
                    id: 'household_business',
                    name: 'Small Business',
                    description: 'Business, high consumption',
                    baseLoad: 3.0,
                    variableLoad: 2.0,
                    cost: 3000,
                    type: 'household',
                    tier: 'business',
                    personality: {
                        cooperationLevel: 0.6,
                        priority: 'efficiency'
                    }
                },
                corporate: {
                    id: 'household_corporate',
                    name: 'Corporate HQ',
                    description: 'Corporate headquarters, highest consumption',
                    baseLoad: 5.0,
                    variableLoad: 3.0,
                    cost: 5000,
                    type: 'household',
                    tier: 'corporate',
                    special: {
                        name: 'GROWTH',
                        tooltip: 'Base $30/hr income grows by $1/hr each day, up to $75/hr max.'
                    },
                    personality: {
                        cooperationLevel: 0.5,
                        priority: 'efficiency'
                    }
                }
            }
        };
    }

    getEquipment(category, tier) {
        return this.catalog[category][tier];
    }

    getAllEquipment(category) {
        return Object.values(this.catalog[category]);
    }
}

class PurchaseManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.catalog = new EquipmentCatalog();
    }

    canAfford(cost) {
        return this.gameState.money >= cost;
    }

    purchaseEquipment(category, tier, x, y) {
        const equipment = this.catalog.getEquipment(category, tier);
        return this.purchaseItem(equipment, x, y);
    }

    purchaseItem(equipment, x, y) {
        if (!this.canAfford(equipment.cost)) {
            return { success: false, message: 'Not enough money!' };
        }

        if (!this.validatePurchase(equipment)) {
            return { success: false, message: 'Cannot purchase this item!' };
        }

        this.gameState.money -= equipment.cost;
        this.addEquipment(equipment, x, y);

        return { success: true, message: `Purchased ${equipment.name}!` };
    }

    validatePurchase(equipment) {
        if (equipment.type === 'solar_panel') {
            return this.gameState.solarPanels.length < 20;
        } else if (equipment.type === 'battery') {
            return this.gameState.batteries.length < 10;
        } else if (equipment.type === 'household') {
            return this.gameState.households.length < 20;
        }
        return false;
    }

    // Generate sequential ID for equipment type
    generateSequentialId(type) {
        let existingIds = [];
        let prefix = '';
        
        if (type === 'solar_panel') {
            prefix = 'panel';
            existingIds = this.gameState.solarPanels.map(p => p.id);
        } else if (type === 'battery') {
            prefix = 'battery';
            existingIds = this.gameState.batteries.map(b => b.id);
        } else if (type === 'household') {
            // All households use 'home' prefix
            prefix = 'home';
            existingIds = this.gameState.households.map(h => h.id);
        }
        
        // Find highest existing number for this type
        let maxNum = 0;
        existingIds.forEach(id => {
            const match = id.match(new RegExp(`^${prefix}_(\\d+)$`));
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        
        // Return next sequential ID
        return `${prefix}_${String(maxNum + 1).padStart(2, '0')}`;
    }

    addEquipment(equipment, x, y) {
        if (equipment.type === 'solar_panel') {
            const id = this.generateSequentialId('solar_panel');
            this.gameState.solarPanels.push({
                id,
                capacity: equipment.capacity,
                efficiency: equipment.efficiency,
                x: x || Math.random() * 400,
                y: y || Math.random() * 200,
                degradation: 1.0,
                tier: equipment.id.replace('solar_', ''),
                cost: equipment.cost
            });
        } else if (equipment.type === 'battery') {
            const id = this.generateSequentialId('battery');
            this.gameState.batteries.push({
                id,
                capacity: equipment.capacity,
                charge: equipment.capacity / 2,
                efficiency: equipment.efficiency,
                x: x || Math.random() * 400,
                y: y || Math.random() * 200,
                degradation: 1.0,
                tier: equipment.id.replace('battery_', ''),
                cost: equipment.cost
            });
        } else if (equipment.type === 'household') {
            // All households use unified 'home' prefix regardless of tier
            const prefix = 'home';
            
            // Find max number for all households
            let maxNum = 0;
            this.gameState.households.forEach(h => {
                const match = h.id.match(new RegExp(`^${prefix}_(\\d+)$`));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            
            const id = `${prefix}_${String(maxNum + 1).padStart(2, '0')}`;
            
            this.gameState.households.push({
                id,
                type: equipment.name.toLowerCase().replace(' ', '_'),
                baseLoad: equipment.baseLoad,
                variableLoad: equipment.variableLoad,
                satisfaction: 1.0,
                poweredTime: 0,
                totalTime: 0,
                x: x || Math.random() * 400,
                y: y || Math.random() * 200,
                personality: equipment.personality,
                tier: equipment.id.replace('household_', ''),
                cost: equipment.cost
            });
        }
    }

    sellEquipment(equipmentId) {
        let result = { success: false, message: 'Equipment not found!' };

        const solarPanel = this.gameState.solarPanels.find(p => p.id === equipmentId);
        if (solarPanel) {
            const refund = Math.floor(solarPanel.capacity * 100);
            this.gameState.money += refund;
            const index = this.gameState.solarPanels.indexOf(solarPanel);
            this.gameState.solarPanels.splice(index, 1);
            result = { success: true, message: `Sold solar panel for $${refund}` };
        }

        const battery = this.gameState.batteries.find(b => b.id === equipmentId);
        if (battery) {
            const refund = Math.floor(battery.capacity * 50);
            this.gameState.money += refund;
            const index = this.gameState.batteries.indexOf(battery);
            this.gameState.batteries.splice(index, 1);
            result = { success: true, message: `Sold battery for $${refund}` };
        }

        const household = this.gameState.households.find(h => h.id === equipmentId);
        if (household) {
            const refund = 500;
            this.gameState.money += refund;
            const index = this.gameState.households.indexOf(household);
            this.gameState.households.splice(index, 1);
            result = { success: true, message: `Sold household for $${refund}` };
        }

        return result;
    }
}

class ShopMenu extends Panel {
    constructor(x, y, width, height, purchaseManager) {
        super(x, y, width, height, 'Equipment Shop');
        this.purchaseManager = purchaseManager;
        this.currentCategory = 'solar_panels';
        this.buttons = [];
        this.categoryButtons = [];  // Track category buttons for selection styling
        this.equipmentButtons = [];  // Track equipment buttons separately for affordability updates
        this.tooltipData = null;     // Current tooltip to display
        this.setupUI();
    }

    setupUI() {
        this.buttons = [];
        this.categoryButtons = [];
        this.equipmentButtons = [];

        // Category buttons with tan/black styling
        const categoryConfigs = [
            { text: 'Solar', category: 'solar_panels' },
            { text: 'Batt', category: 'batteries' },
            { text: 'Home', category: 'households' }
        ];

        categoryConfigs.forEach((btn, index) => {
            const isSelected = btn.category === this.currentCategory;
            const button = new Button(
                this.x + 6 + index * 68,
                this.y + 32,
                64,
                28,
                btn.text,
                () => this.setCategory(btn.category),
                {
                    bgColor: Theme.colors.panelBg,
                    hoverBgColor: Theme.colors.panelBgAlt,
                    activeBgColor: Theme.colors.greenFaint,
                    borderColor: Theme.colors.greenFaint,
                    textColor: Theme.colors.textBright,
                    fontSize: '11px'
                }
            );
            button.category = btn.category;  // Store category reference
            this.buttons.push(button);
            this.categoryButtons.push(button);
            this.addChild(button);
        });

        this.renderEquipmentButtons();
    }

    setCategory(category) {
        this.currentCategory = category;
        this.renderEquipmentButtons();
    }

    // Override render to add shadow effect on selected tab and tooltips
    render(ctx) {
        // Don't render anything if not visible
        if (!this.visible) return;
        
        super.render(ctx);
        
        // Money display in the shop header (title is drawn by Panel at x+10,y+10)
        if (this.purchaseManager && this.purchaseManager.gameState) {
            const money = this.purchaseManager.gameState.money;
            ctx.fillStyle = Theme.colors.green;
            ctx.font = Theme.font(10);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(`$${money.toFixed(0)}`, this.x + this.width - 10, this.y + 12);
        }
        
        // Draw shadow/underline effect on selected category button
        this.categoryButtons.forEach(button => {
            if (button.category === this.currentCategory && button.visible) {
                // Draw shadow effect (bottom border accent)
                ctx.fillStyle = Theme.colors.bgBase;  // Shadow color
                ctx.fillRect(button.x, button.y + button.height - 4, button.width, 4);
                
                // Add subtle glow/shadow around the button
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 6;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                
                // Redraw button background with shadow
                ctx.fillStyle = Theme.colors.panelBgAlt;  // Slightly darker for selected
                ctx.fillRect(button.x + 1, button.y + 1, button.width - 2, button.height - 5);
                
                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Redraw the text on selected button
                ctx.fillStyle = Theme.colors.textBright;
                ctx.font = Theme.font(12);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 - 2);
            }
        });
        
        // Draw special ability labels on equipment buttons
        this.equipmentButtons.forEach(button => {
            if (button.equipment && button.equipment.special) {
                const special = button.equipment.special;
                const labelX = button.x + 5;
                const labelY = button.y + button.height - 18;
                
                // Measure label width
                ctx.font = Theme.font(9);
                const labelWidth = ctx.measureText(special.name).width + 8;
                
                // Draw gold label background
                ctx.fillStyle = Theme.colors.gold;
                ctx.fillRect(labelX, labelY, labelWidth, 14);
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 1;
                ctx.strokeRect(labelX, labelY, labelWidth, 14);
                
                // Draw label text
                ctx.fillStyle = Theme.colors.bgBase;
                ctx.font = Theme.font(9);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(special.name, labelX + 4, labelY + 7);
                
                // Store label bounds for tooltip hover detection
                button.specialLabelBounds = {
                    x: labelX,
                    y: labelY,
                    width: labelWidth,
                    height: 14
                };
            }
        });
        
        // Render tooltip if active
        if (this.tooltipData) {
            this.renderTooltip(ctx, this.tooltipData);
        }
    }
    
    renderTooltip(ctx, data) {
        const { text, x, y } = data;
        
        // Measure text for tooltip sizing
        ctx.font = Theme.font(10);
        const lines = this.wrapTooltipText(ctx, text, 180);
        const lineHeight = 14;
        const padding = 8;
        const tooltipWidth = 200;
        const tooltipHeight = lines.length * lineHeight + padding * 2;
        
        // Position tooltip to the left of the label
        let tooltipX = x - tooltipWidth - 10;
        let tooltipY = y - tooltipHeight / 2;
        
        // Keep tooltip within canvas bounds
        if (tooltipX < 10) tooltipX = x + 50;
        if (tooltipY < 10) tooltipY = 10;
        if (tooltipY + tooltipHeight > 790) tooltipY = 790 - tooltipHeight;
        
        // Draw tooltip background
        ctx.fillStyle = Theme.rgba(Theme.colors.bgBase, 0.95);
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw gold border
        ctx.strokeStyle = Theme.colors.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        ctx.fillStyle = Theme.colors.textBright;
        ctx.font = Theme.font(10);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((line, index) => {
            ctx.fillText(line, tooltipX + padding, tooltipY + padding + index * lineHeight);
        });
    }
    
    wrapTooltipText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    handleMouseMove(x, y) {
        super.handleMouseMove(x, y);
        
        // Check for tooltip hover on special ability labels
        this.tooltipData = null;
        
        this.equipmentButtons.forEach(button => {
            if (button.specialLabelBounds && button.equipment && button.equipment.special) {
                const bounds = button.specialLabelBounds;
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.tooltipData = {
                        text: button.equipment.special.tooltip,
                        x: bounds.x,
                        y: bounds.y + bounds.height / 2
                    };
                }
            }
        });
    }

    renderEquipmentButtons() {
        // Remove old equipment buttons (keep the first 3 category buttons)
        for (let i = this.children.length - 1; i >= 3; i--) {
            this.removeChild(this.children[i]);
        }
        
        // Remove from local buttons array (keep first 3)
        this.buttons = this.buttons.slice(0, 3);
        this.equipmentButtons = [];

        const equipment = this.purchaseManager.catalog.getAllEquipment(this.currentCategory);
        const currentMoney = this.purchaseManager.gameState.money;
        
        equipment.forEach((eq, index) => {
            // Create detailed description based on equipment type
            let detailText = `${eq.name} $${eq.cost}`;
            
            if (eq.type === 'solar_panel') {
                detailText = `${eq.name} $${eq.cost}\n${eq.capacity}kW`;
            } else if (eq.type === 'battery') {
                detailText = `${eq.name} $${eq.cost}\n${eq.capacity}kWh`;
            } else if (eq.type === 'household') {
                const minPower = (eq.baseLoad * 0.2).toFixed(1);
                const maxPower = (eq.baseLoad + eq.variableLoad).toFixed(1);
                detailText = `${eq.name} $${eq.cost}\n${minPower}-${maxPower}kW`;
            }
            
            const canAfford = currentMoney >= eq.cost;
            
            // Adjust button height for items with special abilities
            const buttonHeight = eq.special ? 70 : 60;
            
            const button = new Button(
                this.x + 10,
                this.y + 80 + index * 75,  // Increased spacing for taller buttons
                this.width - 20,
                buttonHeight,
                detailText,
                () => {
                    // Only check if Game exists - disabled state handles affordability
                    if (window.Game) {
                        window.Game.startPlacement(eq);
                        if (window.Game.shopMenu) window.Game.shopMenu.visible = false;
                    }
                },
                {
                    bgColor: eq.special ? Theme.colors.panelBgAlt : Theme.colors.panelBg,
                    hoverBgColor: Theme.colors.panelBgAlt,
                    activeBgColor: Theme.colors.greenFaint,
                    borderColor: eq.special ? Theme.colors.gold : Theme.colors.greenFaint,
                    textColor: Theme.colors.textBright,
                    disabledBgColor: Theme.colors.panelBgAlt,
                    disabledTextColor: Theme.colors.textDim,
                    disabledBorderColor: Theme.colors.greenFaint,
                    fontSize: '11px'
                }
            );
            
            // Store equipment reference and cost for affordability updates and tooltips
            button.equipmentCost = eq.cost;
            button.equipment = eq;  // Store full equipment data for special ability rendering
            button.setDisabled(!canAfford);
            
            this.buttons.push(button);
            this.equipmentButtons.push(button);
            this.addChild(button);
        });
    }

    // Update button affordability based on current money
    updateAffordability() {
        if (!this.purchaseManager || !this.purchaseManager.gameState) return;
        
        const currentMoney = this.purchaseManager.gameState.money;
        
        this.equipmentButtons.forEach(button => {
            if (button.equipmentCost !== undefined) {
                const canAfford = currentMoney >= button.equipmentCost;
                button.setDisabled(!canAfford);
            }
        });
    }

    purchaseEquipment(equipment, index) {
        const x = 50 + Math.random() * 400;
        const y = 100 + Math.random() * 200;
        const result = this.purchaseManager.purchaseEquipment(
            this.currentCategory.slice(0, -1),
            Object.keys(this.purchaseManager.catalog.catalog[this.currentCategory])[index],
            x,
            y
        );
        
        return result.success;
    }

    handleClick(x, y) {
        return super.handleClick(x, y);
    }
}

window.EquipmentCatalog = EquipmentCatalog;
window.PurchaseManager = PurchaseManager;
window.ShopMenu = ShopMenu;
