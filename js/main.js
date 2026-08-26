// Solar Microgrid Management Game - Main JavaScript

// Main game object
const Game = {
    canvas: null,
    ctx: null,
    width: 1200,  // Logical game width
    height: 800,  // Logical game height
    lastTime: 0,
    isRunning: false,
    gameState: null,
    
    // New systems
    uiElements: [],
    notificationSystem: null,
    spriteManager: null,
    particleSystem: null,
    worldRenderer: null,
    purchaseManager: null,
    shopMenu: null,
    dialog: null,
    mouseX: 0,
    mouseY: 0,
    
    // Camera and touch systems (new)
    camera: null,
    touchHandler: null,
    dpr: 1, // Device pixel ratio
    
    // Placement system
    placementMode: false,
    placementItem: null,
    placementValid: true,
    placementX: 0,
    placementY: 0,
    gridSize: 40,
    
    // Victory state
    victoryShown: false,
    victoryOverlay: false,
    victoryButton: null,
    selectedFunFact: null,
    
    // Cheat system
    keySequence: '',
    keySequenceTimeout: null,
    
    // Fun facts about solar microgrids
    funFacts: [
        "Solar microgrids can reduce carbon emissions by up to 80% compared to traditional power sources.",
        "A single solar panel can offset approximately 1 ton of CO2 over its 25-year lifespan.",
        "Microgrids can operate independently during main grid outages, providing critical power resilience.",
        "Battery storage in microgrids has decreased in cost by over 85% in the last decade.",
        "Solar microgrids in developing regions have brought electricity to over 100 million people who previously had none."
    ],
    
    // Pause/Play state
    isPaused: false,
    
    // Device detection
    isMobile: false,
    isTouch: false,
    orientation: 'landscape',
    layoutMode: 'desktop', // 'desktop', 'tablet', 'mobile'
    
    // Mobile UI state
    shopDrawerOpen: false,
    selectionPanelOpen: false,
    
    // Entity selection and management
    selectedEntity: null,
    selectedEntityType: null, // 'solar', 'battery', 'household'
    
    // Research panel state
    researchPanelVisible: false,
    researchNodeButtons: [],
    researchButton: null,
    researchBranchHeaderYs: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Detect device type
        this.detectDevice();
        
        // Set up High-DPI canvas
        this.setupHighDPICanvas();
        
        // Initialize camera system
        this.camera = new Camera(this.width, this.height);
        
        // Initialize game state
        this.gameState = new GameState();
        this.gameState.initialize();
        
        // Initialize new systems
        this.initializeSystems();
        
        // Set up touch handler (for mobile pan/zoom)
        this.setupTouchHandler();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle orientation change (iOS specific)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Handle mouse events (for desktop)
        this.setupMouseEvents();
        
        // Start game loop
        this.startGameLoop();
        
        // Show tutorial notification
        this.showTutorial();
    },
    
    setupHighDPICanvas() {
        // Get device pixel ratio
        this.dpr = window.devicePixelRatio || 1;
        
        // Get the container dimensions
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate the display size (CSS pixels) - fit to container while maintaining aspect ratio
        const aspectRatio = this.width / this.height;
        let displayWidth, displayHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
            // Container is wider - fit to height
            displayHeight = containerHeight;
            displayWidth = displayHeight * aspectRatio;
        } else {
            // Container is taller - fit to width
            displayWidth = containerWidth;
            displayHeight = displayWidth / aspectRatio;
        }
        
        // Set display size (CSS pixels)
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Set actual canvas resolution (physical pixels for high-DPI)
        // Note: Setting canvas.width/height resets the context transform
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        
        // Scale the context to match DPI
        // (no need to reset transform first since setting canvas dimensions already resets it)
        this.ctx.scale(this.dpr, this.dpr);
        
        // Update camera viewport
        if (this.camera) {
            this.camera.setViewport(this.width, this.height);
            this.camera.dpr = this.dpr;
        }
        
        console.log(`Canvas setup: ${this.width}x${this.height} logical, ${this.canvas.width}x${this.canvas.height} physical (DPR: ${this.dpr})`);
    },
    
    setupTouchHandler() {
        // Create touch handler with camera
        this.touchHandler = new TouchHandler(this.canvas, this.camera);
        
        // Set up tap callback (treat as click)
        // Note: onTap receives SCREEN coordinates (logical pixels), not world coordinates
        // We need to handle UI clicks first (screen space) before world clicks
        this.touchHandler.onTap = (screenX, screenY) => {
            // First check UI elements (they're in screen space)
            if (this.handleUIClick(screenX, screenY)) {
                return;
            }
            
            // Convert to world coordinates for game objects
            const worldPos = this.camera.screenToWorld(screenX, screenY);
            this.handleWorldClick(worldPos.x, worldPos.y);
        };
        
        // Set up long press callback (show entity details)
        // Also receives screen coordinates
        this.touchHandler.onLongPress = (screenX, screenY) => {
            if (!this.placementMode) {
                const worldPos = this.camera.screenToWorld(screenX, screenY);
                const entity = this.getEntityAtWorldPosition(worldPos.x, worldPos.y);
                if (entity) {
                    this.selectEntity(entity.item, entity.type);
                }
            }
        };
        
        // Set up touch move callback for placement mode
        this.touchHandler.onTouchMove = (screenX, screenY) => {
            if (this.placementMode) {
                const worldPos = this.camera.screenToWorld(screenX, screenY);
                this.updatePlacementPreview(worldPos.x, worldPos.y);
            }
        };
    },
    
    initializeSystems() {
        // Initialize UI framework
        this.notificationSystem = new NotificationSystem();
        this.lastEventNotificationDay = -1;
        
        // Initialize visual systems
        this.spriteManager = new SpriteManager();
        this.particleSystem = new ParticleSystem();
        this.worldRenderer = new WorldRenderer(
            this.ctx,
            this.gameState,
            this.spriteManager,
            this.particleSystem
        );
        
        // Pass camera to world renderer
        this.worldRenderer.camera = this.camera;
        
        // Initialize economic system
        this.purchaseManager = new PurchaseManager(this.gameState);
        
        // Create HUD elements
        this.createHUD();
        
        // Create shop menu based on device type
        if (this.isMobile || this.isTouch) {
            this.createMobileUI();
        } else {
            // Desktop shop menu - always visible, in the right pane
            this.shopMenu = new ShopMenu(960, 210, 215, 400, this.purchaseManager);
            this.shopMenu.visible = true;
            this.uiElements.push(this.shopMenu);
        }
    },
    
    createMobileUI() {
        // Create mobile shop drawer (slides from right)
        this.mobileShopDrawer = new MobileDrawer(280, 800, 'right', 'SHOP');
        
        // Add shop content inside drawer
        // X position is relative to drawer's open position (1200 - 280 = 920)
        this.mobileShopContent = new MobileShopContent(
            920 + 10,         // x position when drawer is open
            60,               // y position (below title)
            260,              // width
            this.purchaseManager
        );
        this.mobileShopDrawer.addChild(this.mobileShopContent);
        
        // Create mobile selection bottom sheet
        this.mobileSelectionSheet = new MobileBottomSheet(400, 250, 'Selected Entity');
        this.mobileSelectionContent = new MobileSelectionContent(
            (1200 - 400) / 2 + 10,  // Centered x + padding
            800 - 250 + 50,         // At bottom sheet open position + padding for title
            380,                    // Width
            180                     // Height (reduced to fit)
        );
        this.mobileSelectionContent.setCallbacks(
            () => this.upgradeSelectedEntity(),
            () => this.deleteSelectedEntity(),
            () => {
                this.mobileSelectionSheet.close();
                this.deselectEntity();
            }
        );
        this.mobileSelectionSheet.addChild(this.mobileSelectionContent);
        
        // These are handled separately from uiElements for proper layering
        this.mobileShopDrawer.visible = true;
        this.mobileSelectionSheet.visible = true;
    },
    
    createHUD() {
        // Adjust positions based on device type
        const isMobileLayout = this.isMobile || this.isTouch;
        
        // Energy bars - mobile: bottom-left; desktop: left pane, top-aligned with shop panel
        const barX = 8;
        const barY = isMobileLayout ? 640 : 210;  // Mobile: near bottom, Desktop: top-aligned with shop
        const barWidth = isMobileLayout ? 180 : 210;
        const barHeight = isMobileLayout ? 22 : 30;
        const barSpacing = isMobileLayout ? 28 : 40;
        
        const generationBar = new EnergyBar(barX, barY, barWidth, barHeight, 50, 0, Theme.colors.green, 'Gen');
        const storageBar = new EnergyBar(barX, barY + barSpacing, barWidth, barHeight, 100, 0, Theme.colors.darkBlue, 'Stor');
        const consumptionBar = new EnergyBar(barX, barY + barSpacing * 2, barWidth, barHeight, 50, 0, Theme.colors.red, 'Use');
        
        this.uiElements.push(generationBar, storageBar, consumptionBar);
        
        // Time display button
        const timeButton = new Button(20, 10, 220, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: Theme.colors.textBright, textAlign: 'left', fontSize: '13px' });
        this.uiElements.push(timeButton);
        
        // Pause/Play button
        const pauseButton = new Button(230, 10, 100, 30, 'Pause', () => {
            this.isPaused = !this.isPaused;
            pauseButton.text = this.isPaused ? 'Play' : 'Pause';
            this.notificationSystem.addNotification(this.isPaused ? 'Game paused' : 'Game resumed', 'info');
        }, { 
            bgColor: Theme.colors.green,
            hoverBgColor: Theme.colors.greenDark,
            activeBgColor: Theme.colors.greenDark,
            borderColor: Theme.colors.greenDim,
            textColor: Theme.colors.textBright,
            fontSize: '14px'
        });
        this.uiElements.push(pauseButton);
        
        // Weather info
        const weatherButton = new Button(20, 50, 220, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: Theme.colors.textBright, textAlign: 'left', fontSize: '12px' });
        this.uiElements.push(weatherButton);
        
        // Stats panel - left pane, below energy bars, same bottom as shop panel
        const statsPanelX = isMobileLayout ? 210 : 8;
        const statsPanelY = isMobileLayout ? 580 : 340;
        const statsPanelWidth = isMobileLayout ? 280 : 212;
        const statsPanelHeight = isMobileLayout ? 210 : 270;
        const statsPanel = new Panel(statsPanelX, statsPanelY, statsPanelWidth, statsPanelHeight, 'Grid Statistics');
        statsPanel.visible = true;
        this.uiElements.push(statsPanel);
        
        // Goal panel - stays near top, shifted right so the restart button doesn't cover it
        const goalWidth = isMobileLayout ? 400 : 380;
        const goalHeight = isMobileLayout ? 80 : 110;
        const goalX = isMobileLayout ? (this.width - goalWidth) / 2 : 450;  // right of the restart button
        const goalY = isMobileLayout ? 50 : 10;
        const goalPanel = new Panel(goalX, goalY, goalWidth, goalHeight, 'Current Goal');
        this.uiElements.push(goalPanel);
        
        // Restart button (redo icon) - placed right of the help (?) button
        // Opens a confirmation dialog at the top-center of the screen
        const newGameButton = new Button(390, 10, 40, 30, '\u21ba', () => {
            if (this.dialog) this.dialog.visible = false;
            this.dialog = new Dialog(
                430, 130, 340, 150,
                'Are you sure you want to restart the simulation?',
                [
                    { text: 'Yes, restart', onClick: () => {
                        this.dialog = null;
                        this.resetGame();
                        this.notificationSystem.addNotification('Simulation restarted!', 'success');
                    }},
                    { text: 'No, keep going', onClick: () => {
                        this.dialog = null;
                    }}
                ]
            );
            this.dialog.visible = true;
        }, { 
            bgColor: Theme.colors.green,
            hoverBgColor: Theme.colors.greenDark,
            activeBgColor: Theme.colors.greenDark,
            borderColor: Theme.colors.greenDim,
            textColor: Theme.colors.textBright,
            fontSize: '18px',
            fontWeight: 'bold'
        });
        newGameButton.visible = !isMobileLayout;
        this.uiElements.push(newGameButton);
        
        // Help button (?)
        const helpButton = new Button(340, 10, 40, 30, '?', () => {
            this.helpPanelVisible = !this.helpPanelVisible;
        }, { 
            bgColor: Theme.colors.green,
            hoverBgColor: Theme.colors.greenDark,
            activeBgColor: Theme.colors.greenDark,
            borderColor: Theme.colors.greenDim,
            textColor: Theme.colors.textBright,
            fontSize: '18px',
            fontWeight: 'bold'
        });
        this.uiElements.push(helpButton);
        
        // Research toggle button - right of the restart button
        const researchButton = new Button(440, 10, 100, 30, 'RESEARCH', () => {
            this.toggleResearchPanel();
        }, { 
            bgColor: Theme.colors.green,
            hoverBgColor: Theme.colors.greenDark,
            activeBgColor: Theme.colors.greenDark,
            borderColor: Theme.colors.greenDim,
            textColor: Theme.colors.textBright,
            fontSize: '10px'
        });
        researchButton.visible = true;
        this.uiElements.push(researchButton);
        this.researchButton = researchButton;
        
        // Build research node buttons
        this.buildResearchButtons();
        
        // Store references to frequently-updated HUD elements (avoid index drift)
        this.timeButtonRef = timeButton;
        this.weatherButtonRef = weatherButton;
        this.generationBarRef = generationBar;
        this.storageBarRef = storageBar;
        this.consumptionBarRef = consumptionBar;
        this.statsPanelRef = statsPanel;
        this.goalPanelRef = goalPanel;
        
        // Help panel (hidden by default)
        this.helpPanelVisible = false;
        
        // NotificationSystem width — right pane on desktop, wider on mobile
        this.notificationSystem.notifWidth = (this.isMobile || this.isTouch) ? 380 : 212;
        
        // Mobile-specific: Cancel button for placement mode
        if (this.isMobile || this.isTouch) {
            this.cancelPlacementButton = new Button(
                540, 740, 120, 50,
                'CANCEL',
                () => this.cancelPlacement(),
                {
                    bgColor: Theme.colors.red,
                    hoverBgColor: Theme.colors.red,
                    activeBgColor: Theme.colors.red,
                    borderColor: Theme.colors.red,
                    textColor: Theme.colors.textBright,
                    fontSize: '16px'
                }
            );
            this.cancelPlacementButton.visible = false;
        }
    },
    
    buildResearchButtons() {
        if (!this.gameState || !this.gameState.research) return;
        
        this.researchNodeButtons = [];
        this.researchBranchHeaderYs = {};
        
        const bp = this.researchPanelBounds();
        let y = bp.y + 48;
        
        const branches = ['solar', 'storage', 'buildings'];
        
        for (const branch of branches) {
            this.researchBranchHeaderYs[branch] = y;
            y += 16;
            
            const branchNodes = this.gameState.research[branch];
            branchNodes.forEach((node, nodeIndex) => {
                const tierKey = 'tier' + (nodeIndex + 2);
                const iconColor = (Theme.colors.tierColors && Theme.colors.tierColors[tierKey]) || Theme.colors.green;
                
                const btn = new Button(bp.x + 10, y, bp.width - 20, 26, `${node.name}  ${node.cost} RP`, () => {
                    this.handleResearchClick(branch, node.id, node.cost);
                }, {
                    bgColor: Theme.rgba(iconColor, 0.25),
                    hoverBgColor: Theme.rgba(iconColor, 0.4),
                    activeBgColor: Theme.rgba(iconColor, 0.5),
                    borderColor: iconColor,
                    textColor: Theme.colors.textBright,
                    fontSize: '9px'
                });
                
                this.researchNodeButtons.push({ button: btn, branch, id: node.id, cost: node.cost });
                y += 28;
            });
            
            y += 8;
        }
    },
    
    researchPanelBounds() {
        return { x: 962, y: 210, width: 215, height: 396 };
    },
    
    handleResearchClick(branch, id, cost) {
        if (!this.gameState) return;
        
        const node = this.gameState.getResearchNode(branch, id);
        if (!node || node.unlocked) return;
        
        // Sequential gate: previous node must be unlocked
        const branchNodes = this.gameState.research[branch];
        const idx = branchNodes.indexOf(node);
        if (idx > 0 && !branchNodes[idx - 1].unlocked) {
            this.notificationSystem.addNotification('Research the previous tech first!', 'warning');
            return;
        }
        
        if (this.gameState.researchPoints < cost) {
            this.notificationSystem.addNotification(`Need ${cost} RP to research!`, 'error');
            return;
        }
        
        this.gameState.researchPoints -= cost;
        node.unlocked = true;
        this.notificationSystem.addNotification(`${node.name} researched!`, 'success');
    },
    
    toggleResearchPanel() {
        this.researchPanelVisible = !this.researchPanelVisible;
        // Hide the shop menu while researching so the panel isn't cluttered
        if (!(this.isMobile || this.isTouch) && this.shopMenu) {
            this.shopMenu.visible = !this.researchPanelVisible;
        }
    },
    
    renderResearchPanel() {
        if (!this.gameState || !this.gameState.research) return;
        
        const bp = this.researchPanelBounds();
        
        // Panel background
        const panel = new Panel(bp.x, bp.y, bp.width, bp.height, 'RESEARCH');
        panel.render(this.ctx);
        
        // RP counter in header
        this.ctx.fillStyle = Theme.colors.gold;
        this.ctx.font = Theme.font(12);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`RP: ${this.gameState.researchPoints}`, bp.x + 10, bp.y + 30);
        
        // Branch labels + node state
        const branches = ['solar', 'storage', 'buildings'];
        const branchLabels = { solar: 'SOLAR', storage: 'STORAGE', buildings: 'BUILDINGS' };
        
        this.ctx.font = Theme.font(10);
        this.ctx.textBaseline = 'top';
        for (const branch of branches) {
            const headerY = this.researchBranchHeaderYs[branch];
            this.ctx.fillStyle = Theme.colors.textBright;
            this.ctx.fillText(branchLabels[branch], bp.x + 10, headerY);
        }
        
        // Render each node button, updating locked/unlocked state
        this.researchNodeButtons.forEach(rbtn => {
            const node = this.gameState.getResearchNode(rbtn.branch, rbtn.id);
            if (node && node.unlocked) {
                rbtn.button.setDisabled(true);
            } else {
                rbtn.button.setDisabled(false);
            }
            rbtn.button.render(this.ctx);
        });
    },
    
    // Device detection
    detectDevice() {
        this.isTouch = ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0) ||
                       (navigator.msMaxTouchPoints > 0);
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.isMobile = this.isTouch && (width <= 1024 || height <= 768);
        this.orientation = width > height ? 'landscape' : 'portrait';
        
        // Set layout mode
        if (this.isMobile && this.orientation === 'portrait') {
            this.layoutMode = 'mobile';
        } else if (width <= 1024) {
            this.layoutMode = 'tablet';
        } else {
            this.layoutMode = 'desktop';
        }
        
        console.log(`Device: ${this.layoutMode}, Touch: ${this.isTouch}, Mobile: ${this.isMobile}`);
    },
    
    setupMouseEvents() {
        // Mouse click - convert to world coordinates
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Convert from CSS pixels to logical pixels
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            
            const screenX = (e.clientX - rect.left) * scaleX;
            const screenY = (e.clientY - rect.top) * scaleY;
            
            // First check UI elements (they're in screen space)
            if (this.handleUIClick(screenX, screenY)) {
                return;
            }
            
            // Convert to world coordinates for game objects
            const worldPos = this.camera.screenToWorld(screenX, screenY);
            this.handleWorldClick(worldPos.x, worldPos.y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            
            // In placement mode, calculate snapped world coordinates
            if (this.placementMode) {
                const worldPos = this.camera.screenToWorld(this.mouseX, this.mouseY);
                this.updatePlacementPreview(worldPos.x, worldPos.y);
            }

            // Update UI hover states
            this.uiElements.forEach(element => {
                if (element.handleMouseMove) {
                    element.handleMouseMove(this.mouseX, this.mouseY);
                }
            });
        });
        
        // Right click to cancel placement
        this.canvas.addEventListener('contextmenu', (e) => {
            if (this.placementMode) {
                e.preventDefault();
                this.cancelPlacement();
            }
        });
        
        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.placementMode) {
                this.cancelPlacement();
            }
            
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedEntity) {
                this.deleteSelectedEntity();
            }
            
            if ((e.key === 'u' || e.key === 'U') && this.selectedEntity) {
                this.upgradeSelectedEntity();
            }
            
            // Cheat key sequence detection
            this.handleCheatKeySequence(e.key);
        });

        // Mouse down/up for button states
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.uiElements.forEach(element => {
                if (element.handleMouseDown) {
                    element.handleMouseDown(x, y);
                }
            });
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.uiElements.forEach(element => {
                if (element.handleMouseUp) {
                    element.handleMouseUp(x, y);
                }
            });
        });
    },
    
    // Handle UI element clicks (screen space)
    handleUIClick(screenX, screenY) {
        // Handle help panel close button
        if (this.helpPanelVisible && this.helpCloseButton) {
            if (this.isPointInRect(screenX, screenY, this.helpCloseButton)) {
                this.helpPanelVisible = false;
                return true;
            }
            return true; // Block all clicks when help panel is shown
        }
        
        // Handle victory overlay button
        if (this.victoryOverlay && this.victoryButton) {
            if (this.isPointInRect(screenX, screenY, this.victoryButton)) {
                this.victoryOverlay = false;
                this.resetGame();
                this.notificationSystem.addNotification('New game started!', 'success');
                return true;
            }
            return true; // Block all clicks when victory overlay is shown
        }
        
        // Handle dialog
        if (this.dialog && this.dialog.visible) {
            if (this.dialog.handleClick(screenX, screenY)) return true;
        }
        
        // Handle mobile UI elements first (they're on top)
        if (this.isMobile || this.isTouch) {
            // Handle mobile shop drawer
            if (this.mobileShopDrawer && this.mobileShopDrawer.handleClick(screenX, screenY)) {
                return true;
            }
            
            // Handle mobile selection sheet
            if (this.mobileSelectionSheet && this.selectedEntity) {
                if (this.mobileSelectionSheet.handleClick(screenX, screenY)) {
                    return true;
                }
                // Also check selection content buttons
                if (this.mobileSelectionContent && this.mobileSelectionContent.handleClick(screenX, screenY)) {
                    return true;
                }
            }
        }
        
        // Handle cancel button in placement mode
        if (this.placementMode && this.cancelPlacementButton && this.cancelPlacementButton.visible) {
            if (this.cancelPlacementButton.contains(screenX, screenY)) {
                this.cancelPlacement();
                return true;
            }
        }
        
        // Handle selection panel buttons (desktop only)
        if (this.selectedEntity && !(this.isMobile || this.isTouch)) {
            if (this.upgradeButton && this.isPointInRect(screenX, screenY, this.upgradeButton)) {
                this.upgradeSelectedEntity();
                return true;
            }
            if (this.deleteButton && this.isPointInRect(screenX, screenY, this.deleteButton)) {
                this.deleteSelectedEntity();
                return true;
            }
        }
        
        // Handle research node buttons (research panel)
        if (this.researchPanelVisible && this.researchNodeButtons) {
            for (const rbtn of this.researchNodeButtons) {
                if (!rbtn.button.disabled && rbtn.button.handleClick(screenX, screenY)) {
                    return true;
                }
            }
            // Block clicks over the panel body (but not the toggle button outside it)
            const bp = this.researchPanelBounds();
            if (this.isPointInRect(screenX, screenY, { x: bp.x, y: bp.y, width: bp.width, height: bp.height })) {
                return true;
            }
        }
        
        // Handle UI elements (reverse order for z-index)
        for (let i = this.uiElements.length - 1; i >= 0; i--) {
            const element = this.uiElements[i];
            if (element.handleClick && element.handleClick(screenX, screenY)) {
                return true;
            }
        }
        
        return false;
    },
    
    // Handle world clicks (world space coordinates)
    handleWorldClick(worldX, worldY) {
        // Handle placement mode
        if (this.placementMode) {
            this.handlePlacement(worldX, worldY);
            return;
        }
        
        // Handle entity selection
        const entity = this.getEntityAtWorldPosition(worldX, worldY);
        if (entity) {
            this.selectEntity(entity.item, entity.type);
        } else {
            this.deselectEntity();
        }
    },
    
    // Update placement preview position (world coordinates)
    updatePlacementPreview(worldX, worldY) {
        const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        // Snap to grid in world space
        const rawX = worldX - offsetX;
        const rawY = worldY - offsetY;
        
        this.placementX = offsetX + Math.round(rawX / this.gridSize) * this.gridSize;
        this.placementY = offsetY + Math.round(rawY / this.gridSize) * this.gridSize;
        
        // Check validity
        const minX = offsetX;
        const maxX = offsetX + 600 - this.gridSize;
        const minY = offsetY;
        const maxY = offsetY + 400 - this.gridSize;
        
        let inBounds = (this.placementX >= minX && this.placementX <= maxX && 
                       this.placementY >= minY && this.placementY <= maxY);
        
        if (inBounds) {
            const gameX = this.placementX - offsetX;
            const gameY = this.placementY - offsetY;
            const collision = this.checkCollision(gameX, gameY);
            this.placementValid = !collision;
        } else {
            this.placementValid = false;
        }
    },
    
    // Get entity at world position
    getEntityAtWorldPosition(worldX, worldY) {
        const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        // Convert to game coordinates
        const gameX = worldX - offsetX;
        const gameY = worldY - offsetY;
        
        // Hit radius - larger on mobile
        const hitRadius = (this.isMobile || this.isTouch) ? 60 : 50;
        
        // Check solar panels
        for (let panel of this.gameState.solarPanels) {
            const dx = panel.x - gameX;
            const dy = panel.y - gameY;
            if (Math.sqrt(dx*dx + dy*dy) < hitRadius) {
                return { item: panel, type: 'solar' };
            }
        }
        
        // Check batteries
        for (let battery of this.gameState.batteries) {
            const dx = battery.x - gameX;
            const dy = battery.y - gameY;
            if (Math.sqrt(dx*dx + dy*dy) < hitRadius) {
                return { item: battery, type: 'battery' };
            }
        }
        
        // Check households
        for (let household of this.gameState.households) {
            const dx = household.x - gameX;
            const dy = household.y - gameY;
            if (Math.sqrt(dx*dx + dy*dy) < hitRadius) {
                return { item: household, type: 'household' };
            }
        }
        
        return null;
    },
    
    handleCheatKeySequence(key) {
        // Only track lowercase letters
        if (key.length === 1 && key.match(/[a-z]/i)) {
            this.keySequence += key.toLowerCase();
            
            // Clear timeout if exists
            if (this.keySequenceTimeout) {
                clearTimeout(this.keySequenceTimeout);
            }
            
            // Reset sequence after 2 seconds of inactivity
            this.keySequenceTimeout = setTimeout(() => {
                this.keySequence = '';
            }, 2000);
            
            // Check for cheat code "mmm"
            if (this.keySequence.endsWith('mmm')) {
                this.activateCheat();
                this.keySequence = ''; // Reset after activation
            }
            
            // Limit sequence length to prevent memory issues
            if (this.keySequence.length > 10) {
                this.keySequence = this.keySequence.slice(-10);
            }
        }
    },
    
    activateCheat() {
        if (!this.gameState) return;
        
        // Add $50,000 to balance
        this.gameState.money += 50000;
        
        // Set all batteries to 100% charge
        this.gameState.batteries.forEach(battery => {
            battery.charge = battery.capacity;
        });
        
        // Update aggregate storage display
        this.gameState.energy.storage = this.gameState.batteries.reduce((sum, b) => sum + b.charge, 0);
        
        // Show notification
        if (this.notificationSystem) {
            this.notificationSystem.addNotification('Cheat activated! +$50,000 and batteries at 100%', 'success');
        }
    },
    
    showTutorial() {
        // Don't show blocking dialog - just add a subtle notification
        this.notificationSystem.addNotification('Welcome! Buy equipment from the shop to power your first buildings.', 'info');
    },
    
    // Placement System Methods
    startPlacement(equipment) {
        // Reject research-locked items before deducting money / entering placement
        if (this.gameState.isEquipmentLocked && this.gameState.isEquipmentLocked(equipment)) {
            this.notificationSystem.addNotification('Research required to unlock this item!', 'error');
            return;
        }

        // Check if player can afford it before entering placement mode
        if (!this.purchaseManager.canAfford(equipment.cost)) {
            this.notificationSystem.addNotification(`Not enough money! Need $${equipment.cost}!`, 'error');
            return;
        }
        
        // Deduct money immediately when entering placement mode
        this.gameState.money -= equipment.cost;
        
        this.placementMode = true;
        this.placementItem = equipment;
        this.placementValid = true;
        
        // Disable camera panning during placement on mobile
        if (this.touchHandler) {
            this.touchHandler.panningDisabled = true;
        }
        
        if (this.shopMenu && (this.isMobile || this.isTouch)) {
            this.shopMenu.visible = false;
        }
        
        // Show cancel button on mobile
        if ((this.isMobile || this.isTouch) && this.cancelPlacementButton) {
            this.cancelPlacementButton.visible = true;
        }
        
        // Show instruction notification on mobile
        if (this.isMobile || this.isTouch) {
            this.notificationSystem.addNotification('Drag to position, lift to place. Tap CANCEL to abort!', 'info');
        }
    },
    
    cancelPlacement() {
        if (!this.placementMode) return;
        
        // Refund the money if item wasn't placed yet
        if (this.placementItem) {
            this.gameState.money += this.placementItem.cost;
            this.notificationSystem.addNotification(`Placement cancelled. Refunded $${this.placementItem.cost}!`, 'info');
        }
        
        this.placementMode = false;
        this.placementItem = null;
        
        // Re-enable camera panning
        if (this.touchHandler) {
            this.touchHandler.panningDisabled = false;
        }
        
        // Hide cancel button
        if (this.cancelPlacementButton) {
            this.cancelPlacementButton.visible = false;
        }
        
        if (this.shopMenu) {
            this.shopMenu.visible = true;
        }
    },
    
    checkCollision(x, y) {
        if (!this.gameState) return false;
        
        // Define a safe radius for collision (slightly less than grid size to allow adjacent placement)
        const radius = 25; 
        
        const checkItem = (item) => {
            const dx = item.x - x;
            const dy = item.y - y;
            return Math.sqrt(dx*dx + dy*dy) < radius;
        };

        return this.gameState.solarPanels.some(checkItem) ||
               this.gameState.batteries.some(checkItem) ||
               this.gameState.households.some(checkItem);
    },

    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    },
    
    selectEntity(entity, type) {
        this.selectedEntity = entity;
        this.selectedEntityType = type;
        
        // Close shop menu when selecting entity (desktop shop stays open)
        if (this.shopMenu && (this.isMobile || this.isTouch)) {
            this.shopMenu.visible = false;
        }
        
        // Close mobile shop drawer when selecting entity
        if (this.mobileShopDrawer && this.mobileShopDrawer.isOpen) {
            this.mobileShopDrawer.close();
        }
    },
    
    deselectEntity() {
        this.selectedEntity = null;
        this.selectedEntityType = null;
    },
    
    deleteSelectedEntity() {
        if (!this.selectedEntity || !this.selectedEntityType) return;
        
        const gs = this.gameState;
        let deleted = false;
        let refund = 0;
        
        // Calculate 50% refund based on entity's cost
        if (this.selectedEntity.cost) {
            refund = Math.floor(this.selectedEntity.cost * 0.5);
        }
        
        switch (this.selectedEntityType) {
            case 'solar':
                const solarIndex = gs.solarPanels.indexOf(this.selectedEntity);
                if (solarIndex > -1) {
                    gs.solarPanels.splice(solarIndex, 1);
                    deleted = true;
                }
                break;
            case 'battery':
                const batteryIndex = gs.batteries.indexOf(this.selectedEntity);
                if (batteryIndex > -1) {
                    gs.batteries.splice(batteryIndex, 1);
                    deleted = true;
                }
                break;
            case 'household':
                const householdIndex = gs.households.indexOf(this.selectedEntity);
                if (householdIndex > -1) {
                    gs.households.splice(householdIndex, 1);
                    deleted = true;
                }
                break;
        }
        
        if (deleted) {
            // Add refund to player's money
            if (refund > 0) {
                gs.money += refund;
                this.notificationSystem.addNotification(`Sold ${this.selectedEntityType} for $${refund}!`, 'success');
            } else {
                this.notificationSystem.addNotification(`Deleted ${this.selectedEntityType}!`, 'success');
            }
            this.deselectEntity();
        }
    },
    
    upgradeSelectedEntity() {
        if (!this.selectedEntity || !this.selectedEntityType) return;
        
        // Tier upgrade mapping and costs (balanced: 2x capacity = 1.85x price)
        // Tier4 is premium/elite tier with special abilities
        const tierOrder = ['tier1', 'tier2', 'tier3', 'tier4'];
        const equipmentCosts = {
            solar: { tier1: 500, tier2: 925, tier3: 1390, tier4: 2500 },
            battery: { tier1: 400, tier2: 740, tier3: 1480, tier4: 3000 }
        };
        const equipmentStats = {
            solar: {
                tier1: { capacity: 5, efficiency: 0.85 },
                tier2: { capacity: 10, efficiency: 0.90 },
                tier3: { capacity: 15, efficiency: 0.95 },
                tier4: { capacity: 25, efficiency: 0.98 }  // Elite Solar Array - WEATHERPROOF
            },
            battery: {
                tier1: { capacity: 10, efficiency: 0.90 },
                tier2: { capacity: 20, efficiency: 0.92 },
                tier3: { capacity: 40, efficiency: 0.95 },
                tier4: { capacity: 80, efficiency: 0.98 }  // Elite Power Core - SELF-HEALING
            }
        };
        
        // Get current tier
        const currentTier = this.selectedEntity.tier || 'tier1';
        const currentTierIndex = tierOrder.indexOf(currentTier);
        
        // Check if already at max tier
        if (currentTierIndex >= tierOrder.length - 1) {
            this.notificationSystem.addNotification('Already at max tier!', 'warning');
            return;
        }
        
        // Households cannot be upgraded
        if (this.selectedEntityType === 'household') {
            this.notificationSystem.addNotification('Households cannot be upgraded!', 'warning');
            return;
        }
        
        const nextTier = tierOrder[currentTierIndex + 1];
        const costs = equipmentCosts[this.selectedEntityType];
        
        if (!costs) {
            this.notificationSystem.addNotification('Cannot upgrade this item!', 'error');
            return;
        }
        
        // Research gate: upgrading into tiers 2-4 requires the matching research node
        const researchBranch = this.selectedEntityType === 'solar' ? 'solar'
            : this.selectedEntityType === 'battery' ? 'storage' : 'buildings';
        const requiredNodeId = this.gameState.nodeIdFor(this.selectedEntityType, nextTier);
        if (requiredNodeId && !this.gameState.isResearchUnlocked(researchBranch, requiredNodeId)) {
            this.notificationSystem.addNotification('Research required to unlock this item!', 'error');
            return;
        }
        
        // Calculate upgrade cost as difference between tiers
        const currentCost = costs[currentTier];
        const nextCost = costs[nextTier];
        const upgradeCost = nextCost - currentCost;
        
        if (this.gameState.money < upgradeCost) {
            this.notificationSystem.addNotification(`Need $${upgradeCost} to upgrade!`, 'error');
            return;
        }
        
        // Apply the upgrade
        const stats = equipmentStats[this.selectedEntityType][nextTier];
        this.selectedEntity.tier = nextTier;
        this.selectedEntity.capacity = stats.capacity;
        this.selectedEntity.efficiency = stats.efficiency;
        
        // For batteries, scale charge proportionally to new capacity
        if (this.selectedEntityType === 'battery') {
            const oldCapacity = equipmentStats.battery[currentTier].capacity;
            const chargeRatio = this.selectedEntity.charge / oldCapacity;
            this.selectedEntity.charge = stats.capacity * chargeRatio;
        }
        
        this.gameState.money -= upgradeCost;
        
        // Special message for tier4 upgrades
        let upgradeMessage = `Upgraded to ${nextTier.replace('tier', 'Tier ')} for $${upgradeCost}!`;
        if (nextTier === 'tier4') {
            if (this.selectedEntityType === 'solar') {
                upgradeMessage = `Elite Solar Array unlocked! WEATHERPROOF ability active. Cost: $${upgradeCost}`;
            } else if (this.selectedEntityType === 'battery') {
                upgradeMessage = `Elite Power Core unlocked! SELF-HEALING ability active. Cost: $${upgradeCost}`;
            }
        }
        
        this.notificationSystem.addNotification(upgradeMessage, 'success');
    },
    
    handlePlacement(worldX, worldY) {
        if (!this.placementMode || !this.placementItem) return;
        
        // Use the pre-calculated snapped placement coordinates
        if (!this.placementValid) {
            this.notificationSystem.addNotification("Invalid placement location!", 'warning');
            return;
        }

        const minX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const minY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        // Convert snapped world coordinates to game coordinates
        const gameX = this.placementX - minX;
        const gameY = this.placementY - minY;

        // Add equipment directly (money already deducted in startPlacement)
        this.purchaseManager.addEquipment(this.placementItem, gameX, gameY);
        
        this.notificationSystem.addNotification(`Placed ${this.placementItem.name}!`, 'success');
        
        // Exit placement mode
        this.placementMode = false;
        this.placementItem = null;
        
        // Re-enable camera panning
        if (this.touchHandler) {
            this.touchHandler.panningDisabled = false;
        }
        
        // Hide cancel button
        if (this.cancelPlacementButton) {
            this.cancelPlacementButton.visible = false;
        }
        
        // Show shop menu (desktop only)
        if (this.shopMenu) {
            this.shopMenu.visible = true;
        }
    },

    handleResize() {
        // Re-detect device
        this.detectDevice();
        
        // Re-setup high-DPI canvas
        this.setupHighDPICanvas();
        
        // Update camera viewport
        if (this.camera) {
            this.camera.setViewport(this.width, this.height);
        }
    },
    
    startGameLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    },
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime, currentTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    update(deltaTime, currentTime) {
        // Update camera (smooth pan/zoom animations)
        if (this.camera) {
            this.camera.update();
        }
        
        // Don't update game state if paused
        if (this.gameState && this.gameState.initialized && !this.isPaused) {
            const prevMoney = this.gameState.money;
            this.gameState.update(deltaTime);
            // Coin popups when money increased (income earned)
            const gained = this.gameState.money - prevMoney;
            if (gained > 0 && this.worldRenderer && this.worldRenderer.addIncomeEffects) {
                this.worldRenderer.addIncomeEffects(gained);
            }
        }

        // Update systems - only update particles when not paused
        if (!this.isPaused) {
            this.particleSystem.update(deltaTime);
        }
        if (this.worldRenderer && this.worldRenderer.updateFloatTexts) {
            this.worldRenderer.updateFloatTexts(deltaTime);
        }
        this.notificationSystem.update(currentTime);

        // Update shop menu affordability (desktop)
        if (this.shopMenu && this.shopMenu.updateAffordability) {
            this.shopMenu.updateAffordability();
        }
        
        // Update mobile shop content affordability
        if (this.mobileShopContent && this.mobileShopContent.updateAffordability) {
            this.mobileShopContent.updateAffordability();
        }
        
        // Update mobile selection content
        if (this.mobileSelectionContent && this.selectedEntity) {
            this.mobileSelectionContent.setEntity(this.selectedEntity, this.selectedEntityType);
        }

        if (this.dialog && this.dialog.visible) {
            this.dialog.update(currentTime);
        }

        // Check for goal completion and show victory overlay
        if (this.gameState && this.gameState.gameWon && !this.victoryOverlay) {
            this.victoryOverlay = true;
            this.selectedFunFact = this.funFacts[Math.floor(Math.random() * this.funFacts.length)];
            this.isPaused = true;
            this.victoryShown = true;
        }
    },
    
    resetGame() {
        // Cancel any active placement
        if (this.placementMode) {
            this.cancelPlacement();
        }
        
        // Deselect any selected entity
        this.deselectEntity();
        
        // Create a fresh game state
        this.gameState = new GameState();
        this.gameState.initialize();
        
        // Reset victory state
        this.victoryShown = false;
        
        // Re-initialize purchase manager with new game state
        this.purchaseManager = new PurchaseManager(this.gameState);
        
        // Re-initialize world renderer with new game state
        this.worldRenderer = new WorldRenderer(
            this.ctx,
            this.gameState,
            this.spriteManager,
            this.particleSystem
        );
        
        // Pass camera to world renderer
        this.worldRenderer.camera = this.camera;
        
        // Recreate shop menu based on device type
        if (this.isMobile || this.isTouch) {
            // Update mobile shop content with new purchase manager
            if (this.mobileShopContent) {
                this.mobileShopContent.purchaseManager = this.purchaseManager;
                this.mobileShopContent.setupUI();  // Recreate buttons
            }
            // Close mobile drawer
            if (this.mobileShopDrawer) {
                this.mobileShopDrawer.close();
            }
            // Close mobile selection sheet
            if (this.mobileSelectionSheet) {
                this.mobileSelectionSheet.close();
            }
        } else {
            // Desktop: Clear shop menu reference and recreate
            const oldShopMenu = this.shopMenu;
            const shopWasVisible = oldShopMenu ? oldShopMenu.visible : false;
            
            // Remove old shop menu from UI elements
            const shopIndex = this.uiElements.indexOf(oldShopMenu);
            if (shopIndex > -1) {
                this.uiElements.splice(shopIndex, 1);
            }
            
            // Create new shop menu
            this.shopMenu = new ShopMenu(960, 210, 215, 400, this.purchaseManager);
            this.shopMenu.visible = shopWasVisible;
            this.uiElements.push(this.shopMenu);
        }
        
        // Clear notifications
        this.notificationSystem.notifications = [];
    },
    
    render() {
        // Reset context transform for high-DPI
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        
        // Clear canvas with background (dark CRT green — world sits on dark theme)
        this.ctx.fillStyle = Theme.colors.bgBase;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Apply camera transform for world rendering
        if (this.camera) {
            this.camera.applyTransform(this.ctx);
        }
        
        // Draw grid and world - pass paused state to control particle emission
        this.worldRenderer.render(this.isPaused);
        
        // Render placement preview (in world space)
        if (this.placementMode && this.placementItem) {
            this.renderPlacementPreview();
        }
        
        // Render entity selection indicator (in world space)
        if (this.selectedEntity && this.selectedEntityType) {
            this.renderEntityHighlight();
        }
        
        // Restore camera transform before drawing UI
        if (this.camera) {
            this.camera.restoreTransform(this.ctx);
        }
        
        // --- Screen-space UI rendering below ---
        
        // Render UI elements
        this.uiElements.forEach(element => element.render(this.ctx));
        
        // Render game state (text content on top of UI)
        this.renderGameState();
        
        // Render dialog
        if (this.dialog && this.dialog.visible) {
            this.dialog.render(this.ctx);
        }
        
        // Render mobile cancel button during placement
        if (this.placementMode && this.cancelPlacementButton && this.cancelPlacementButton.visible) {
            this.cancelPlacementButton.render(this.ctx);
        }
        
        // Render entity selection UI panel (screen space) - desktop only
        if (this.selectedEntity && this.selectedEntityType && !(this.isMobile || this.isTouch)) {
            this.renderSelectionUI();
        }

        // Render notifications - top-right corner, in the right pane (outside play area)
        const notifX = (this.isMobile || this.isTouch) ? 12 : 968;
        const notifY = 10;
        this.notificationSystem.render(this.ctx, notifX, notifY);
        
        // Render mobile UI elements (on top of regular UI)
        if (this.isMobile || this.isTouch) {
            // Render mobile shop drawer
            if (this.mobileShopDrawer) {
                this.mobileShopDrawer.render(this.ctx);
            }
            
            // Render mobile selection sheet when entity is selected
            if (this.mobileSelectionSheet && this.selectedEntity) {
                if (!this.mobileSelectionSheet.isOpen) {
                    this.mobileSelectionSheet.open();
                }
                this.mobileSelectionSheet.render(this.ctx);
            } else if (this.mobileSelectionSheet && !this.selectedEntity) {
                if (this.mobileSelectionSheet.isOpen) {
                    this.mobileSelectionSheet.close();
                }
                this.mobileSelectionSheet.render(this.ctx);  // Render to animate close
            }
        }
        
        // Render victory overlay (on top of everything)
        if (this.victoryOverlay) {
            this.renderVictoryOverlay();
        }
        
        // Render help panel (on top of everything except victory)
        if (this.helpPanelVisible) {
            this.renderHelpPanel();
        }
        
        // Render research panel (right pane, below/over shop)
        if (this.researchPanelVisible) {
            this.renderResearchPanel();
        }
        
        // Debug: Show zoom level on mobile
        if (this.isMobile && this.camera) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Zoom: ${(this.camera.zoom * 100).toFixed(0)}%`, this.width - 10, this.height - 10);
        }
    },
    
    // Render highlight around selected entity (in world space)
    renderEntityHighlight() {
        const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        const entityX = offsetX + this.selectedEntity.x;
        const entityY = offsetY + this.selectedEntity.y;
        
        this.ctx.strokeStyle = '#FFD700'; // Gold color
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(entityX + 25, entityY + 25, 35, 0, Math.PI * 2);
        this.ctx.stroke();
    },
    
    renderGameState() {
        if (!this.gameState) return;
        
        const gs = this.gameState;
        
        // Update time button with day/night indicator
        const timeButton = this.timeButtonRef || this.uiElements[3];
        if (timeButton) {
            const hour = Math.floor(gs.time % 24);
            const day = Math.floor(gs.time / 24);
            const isDaytime = (hour >= 6 && hour <= 18);
            const timeIcon = isDaytime ? '☀️' : '🌙';
            timeButton.text = `${timeIcon} Day ${day} - ${hour.toString().padStart(2, '0')}:00`;
        }
        
        // Update weather button
        const weatherButton = this.weatherButtonRef || this.uiElements[5];
        if (weatherButton) {
            const cloudPercent = (gs.weather.cloudCover * 100).toFixed(0);
            const intensityPercent = (gs.getSolarIntensity() * 100).toFixed(0);
            weatherButton.text = `Weather: ${cloudPercent}% clouds, ${intensityPercent}% sun`;
        }
        
        // Update energy bars with dynamic max values
        if (gs.energy) {
            const generationBar = this.generationBarRef || this.uiElements[0];
            const storageBar = this.storageBarRef || this.uiElements[1];
            const consumptionBar = this.consumptionBarRef || this.uiElements[2];
            
            if (generationBar) {
                // Update max based on total solar capacity
                const totalGenCap = gs.solarPanels.reduce((sum, p) => sum + p.capacity, 0);
                generationBar.maxValue = Math.max(totalGenCap, 10);
                
                generationBar.setValue(gs.energy.generation);
            }
            if (storageBar) {
                // Update max based on total battery capacity
                const totalStorageCap = gs.batteries.reduce((sum, b) => sum + b.capacity, 0);
                storageBar.maxValue = Math.max(totalStorageCap, 10);
                // Use aggregate battery charge instead of just energy.storage
                const totalCharge = gs.batteries.reduce((sum, b) => sum + b.charge, 0);
                
                storageBar.setValue(totalCharge);
            }
            if (consumptionBar) {
                // Update max based on total household consumption
                const totalConsumptionCap = gs.households.reduce((sum, h) => sum + h.baseLoad + h.variableLoad, 0);
                consumptionBar.maxValue = Math.max(totalConsumptionCap, 10);
                consumptionBar.setValue(gs.energy.consumption);
            }
        }
        
        // Update stats panel
        const statsPanel = this.statsPanelRef || this.uiElements[6];
        if (statsPanel && statsPanel.visible) {
            // Calculate average satisfaction
            const avgSatisfaction = gs.households.length > 0 
                ? gs.households.reduce((sum, h) => sum + h.satisfaction, 0) / gs.households.length
                : 0;
            
            const statsText = [
                `Time: ${Math.floor(gs.time)}h (${gs.getSolarIntensity().toFixed(2)}x Sun)`,
                `Money: $${gs.money.toFixed(0)}`,
                `Solar: ${gs.solarPanels.length} (${gs.energy.generation.toFixed(1)} kW)`,
                `Batteries: ${gs.batteries.length} (${gs.energy.storage.toFixed(1)} kWh)`,
                `Houses: ${gs.households.length} (-${gs.energy.consumption.toFixed(1)} kW)`,
                `Avg Satisfaction: ${(avgSatisfaction * 100).toFixed(0)}%`,
                `Surplus: ${gs.energy.surplus > 0 ? '+' : ''}${gs.energy.surplus.toFixed(1)} kW`
            ];
            
            this.ctx.fillStyle = Theme.colors.text;
            this.ctx.font = Theme.font(12); // Smaller font to fit
            this.ctx.textAlign = 'left';
            statsText.forEach((text, index) => {
                this.ctx.fillText(text, statsPanel.x + 10, statsPanel.y + 40 + index * 20);
            });
        }
        
        // Update goal panel
        const goalPanel = this.goalPanelRef || this.uiElements[7];
        if (goalPanel && gs.getCurrentGoal) {
            const currentGoal = gs.getCurrentGoal();
            const progress = gs.getGoalProgress();
            
            if (currentGoal) {
                this.ctx.fillStyle = Theme.colors.textBright;
                this.ctx.font = Theme.font(14);
                this.ctx.textAlign = 'left';
                this.ctx.fillText(currentGoal.description, goalPanel.x + 10, goalPanel.y + 35);
                
                this.ctx.font = Theme.font(12);
                
                // Show detailed breakdown for multi-type goals (Goal 3)
                if (progress.detailed) {
                    const d = progress.detailed;
                    let detailText;
                    if (d.corporate && d.business) {
                        // New Goal 3 format: corporate_business
                        detailText = `Corporate: ${d.corporate.current}/${d.corporate.target}  |  Business: ${d.business.current}/${d.business.target}`;
                    } else {
                        // Legacy 'all' type format
                        detailText = `Cabins: ${d.cabin.current}/${d.cabin.target}  |  Families: ${d.family.current}/${d.family.target}  |  Business: ${d.business.current}/${d.business.target}`;
                    }
                    this.ctx.fillText(detailText, goalPanel.x + 10, goalPanel.y + 55);
                } else {
                    const progressText = `Progress: ${progress.current}/${progress.target} (${progress.percentage.toFixed(0)}%)`;
                    this.ctx.fillText(progressText, goalPanel.x + 10, goalPanel.y + 55);
                }
                
                // Draw progress bar
                const barX = goalPanel.x + 10;
                const barY = goalPanel.y + 70;
                const barWidth = goalPanel.width - 20;
                const barHeight = 6;
                
                this.ctx.fillStyle = Theme.colors.panelBgAlt;
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                this.ctx.fillStyle = Theme.colors.green;
                this.ctx.fillRect(barX, barY, (barWidth * Math.min(progress.percentage, 100) / 100), barHeight);
            } else if (gs.gameWon) {
                this.ctx.fillStyle = Theme.colors.green;
                this.ctx.font = Theme.font(18);
                this.ctx.textAlign = 'center';
                this.ctx.fillText('ALL GOALS COMPLETED!', goalPanel.x + goalPanel.width / 2, goalPanel.y + 45);
            }
        }
        
    },
    
    renderLoadingScreen() {
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Game State...', this.width / 2, this.height / 2);
    },
    
    renderPlacementPreview() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.6; // Semi-transparent
        
        // Use the snapped coordinates
        const x = this.placementX;
        const y = this.placementY;
        
        // Determine sprite type and size based on item type
        let type = 'solar_panel';
        let w = 60, h = 40;
        
        if (this.placementItem.type === 'battery') {
            type = 'battery';
            w = 40; h = 60;
        } else if (this.placementItem.type === 'household') {
            type = 'cabin';
            w = 50; h = 40;
        }
        
        // Use sprite manager to draw the preview
        this.spriteManager.drawProceduralSprite(this.ctx, type, x, y, w, h);
        
        // Draw validity indicator
        this.ctx.strokeStyle = this.placementValid ? '#00ff00' : '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);
        
        // Draw cost
        this.ctx.fillStyle = this.placementValid ? '#000000' : '#ff0000';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`-$${this.placementItem.cost}`, x + w/2, y - 10);
        
        this.ctx.restore();
    },
    
    renderSelectionUI() {
        // Draw selection panel
        const panelX = 900;
        const panelY = 520;
        const panelWidth = 280;
        const panelHeight = 200;
        
        // Panel background (dark like stats panel)
        this.ctx.fillStyle = Theme.colors.panelBg;
        this.ctx.strokeStyle = Theme.colors.greenFaint;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title with instance ID
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(14);
        this.ctx.textAlign = 'left';
        const instanceId = this.selectedEntity.id || 'unknown';
        this.ctx.fillText(`Selected: ${instanceId}`, panelX + 10, panelY + 20);
        
        // Check for active events affecting this entity (use raw activeEvents for full data)
        const rawActiveEvents = this.gameState.eventSystem ? this.gameState.eventSystem.activeEvents : [];
        const entityEvents = rawActiveEvents.filter(event => {
            // Check if event targets this specific entity by any ID field
            if (event.targetId === this.selectedEntity.id) return true;
            if (event.affectedEquipment === this.selectedEntity.id) return true;
            if (event.affectedHousehold === this.selectedEntity.id) return true;
            return false;
        });
        
        // Draw event status tag if any
        let yOffset = 40;
        if (entityEvents.length > 0) {
            entityEvents.forEach(event => {
                // Draw tag background
                const tagColor = event.severity === 'high' ? Theme.colors.red : event.severity === 'medium' ? Theme.colors.amber : Theme.colors.cyan;
                this.ctx.fillStyle = tagColor;
                this.ctx.font = Theme.font(10);
                const tagText = event.name || 'Event Active';
                const tagWidth = this.ctx.measureText(tagText).width + 10;
                this.ctx.fillRect(panelX + 10, panelY + yOffset - 10, tagWidth, 16);
                
                // Draw tag text
                this.ctx.fillStyle = Theme.colors.textBright;
                this.ctx.font = Theme.font(10);
                this.ctx.fillText(tagText, panelX + 15, panelY + yOffset);
                yOffset += 20;
            });
        }
        
        // Entity info
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(12);
        
        // Tier info
        const currentTier = this.selectedEntity.tier || 'tier1';
        const tierDisplay = currentTier.replace('tier', 'Tier ');
        this.ctx.fillText(`Tier: ${tierDisplay}`, panelX + 10, panelY + yOffset);
        yOffset += 16;
        
        // Determine which stats are affected by events
        const affectedStats = new Set();
        entityEvents.forEach(event => {
            // Check event effects to determine which stats are affected
            if (event.effects) {
                if (event.effects.efficiency !== undefined) affectedStats.add('efficiency');
                if (event.effects.charge !== undefined) affectedStats.add('charge');
                if (event.effects.satisfaction !== undefined) affectedStats.add('satisfaction');
                if (event.effects.baseLoad !== undefined) affectedStats.add('baseLoad');
            }
            // Also check by event type/name for common events
            const eventName = (event.name || '').toLowerCase();
            if (eventName.includes('panel') || eventName.includes('solar') || eventName.includes('degradation')) {
                affectedStats.add('efficiency');
            }
            if (eventName.includes('battery') || eventName.includes('discharge') || eventName.includes('malfunction')) {
                affectedStats.add('efficiency');
                affectedStats.add('charge');
            }
            if (eventName.includes('demand') || eventName.includes('surge') || eventName.includes('household')) {
                affectedStats.add('baseLoad');
                affectedStats.add('satisfaction');
            }
        });
        
        const normalColor = Theme.colors.text;
        const affectedColor = Theme.colors.red;  // Red for affected stats
        
        switch (this.selectedEntityType) {
            case 'solar':
                this.ctx.fillStyle = normalColor;
                this.ctx.fillText(`Capacity: ${this.selectedEntity.capacity.toFixed(1)} kW`, panelX + 10, panelY + yOffset);
                yOffset += 16;
                this.ctx.fillStyle = affectedStats.has('efficiency') ? affectedColor : normalColor;
                this.ctx.fillText(`Efficiency: ${(this.selectedEntity.efficiency * 100).toFixed(0)}%`, panelX + 10, panelY + yOffset);
                break;
            case 'battery':
                this.ctx.fillStyle = normalColor;
                this.ctx.fillText(`Capacity: ${this.selectedEntity.capacity.toFixed(1)} kWh`, panelX + 10, panelY + yOffset);
                yOffset += 16;
                this.ctx.fillStyle = affectedStats.has('charge') ? affectedColor : normalColor;
                this.ctx.fillText(`Charge: ${this.selectedEntity.charge.toFixed(1)} kWh`, panelX + 10, panelY + yOffset);
                yOffset += 16;
                this.ctx.fillStyle = affectedStats.has('efficiency') ? affectedColor : normalColor;
                this.ctx.fillText(`Efficiency: ${(this.selectedEntity.efficiency * 100).toFixed(0)}%`, panelX + 10, panelY + yOffset);
                break;
            case 'household':
                this.ctx.fillStyle = affectedStats.has('baseLoad') ? affectedColor : normalColor;
                this.ctx.fillText(`Base Load: ${this.selectedEntity.baseLoad.toFixed(1)} kW`, panelX + 10, panelY + yOffset);
                yOffset += 16;
                this.ctx.fillStyle = affectedStats.has('satisfaction') ? affectedColor : normalColor;
                this.ctx.fillText(`Satisfaction: ${(this.selectedEntity.satisfaction * 100).toFixed(0)}%`, panelX + 10, panelY + yOffset);
                break;
        }
        
        // Draw buttons
        yOffset += 25;
        
        // Calculate upgrade cost for display
        const tierOrder = ['tier1', 'tier2', 'tier3', 'tier4'];
        const equipmentCosts = {
            solar: { tier1: 500, tier2: 925, tier3: 1390, tier4: 2500 },
            battery: { tier1: 400, tier2: 740, tier3: 1480, tier4: 3000 }
        };
        const currentTierIndex = tierOrder.indexOf(currentTier);
        const isMaxTier = currentTierIndex >= tierOrder.length - 1;
        
        // Upgrade button (if applicable)
        if (this.selectedEntityType !== 'household') {
            const costs = equipmentCosts[this.selectedEntityType];
            let upgradeCost = 0;
            let canAfford = false;
            let buttonText = 'MAX TIER';
            
            if (!isMaxTier && costs) {
                const nextTier = tierOrder[currentTierIndex + 1];
                upgradeCost = costs[nextTier] - costs[currentTier];
                canAfford = this.gameState.money >= upgradeCost;
                // Special label for tier4 upgrades
                if (nextTier === 'tier4') {
                    buttonText = `ELITE $${upgradeCost}`;
                } else {
                    buttonText = `Upgrade $${upgradeCost}`;
                }
            }
            
            const upgradeBtn = {
                x: panelX + 10,
                y: panelY + yOffset,
                width: 120,
                height: 35
            };
            
            const mouseOver = this.mouseX >= upgradeBtn.x && this.mouseX <= upgradeBtn.x + upgradeBtn.width &&
                             this.mouseY >= upgradeBtn.y && this.mouseY <= upgradeBtn.y + upgradeBtn.height;
            
            // Gray out if can't afford or max tier
            if (isMaxTier) {
                this.ctx.fillStyle = Theme.colors.textDim;
            } else if (!canAfford) {
                this.ctx.fillStyle = Theme.colors.panelBgAlt;
            } else {
                this.ctx.fillStyle = mouseOver ? Theme.colors.greenDark : Theme.colors.green;
            }
            
            this.ctx.fillRect(upgradeBtn.x, upgradeBtn.y, upgradeBtn.width, upgradeBtn.height);
            this.ctx.strokeStyle = isMaxTier || !canAfford ? Theme.colors.textDim : Theme.colors.greenDim;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(upgradeBtn.x, upgradeBtn.y, upgradeBtn.width, upgradeBtn.height);
            
            this.ctx.fillStyle = isMaxTier || !canAfford ? Theme.colors.textDim : Theme.colors.textBright;
            this.ctx.font = Theme.font(11);
            this.ctx.textAlign = 'center';
            this.ctx.fillText(buttonText, upgradeBtn.x + upgradeBtn.width / 2, upgradeBtn.y + 22);
            
            // Store button for click detection (only if can afford and not max tier)
            this.upgradeButton = (canAfford && !isMaxTier) ? upgradeBtn : null;
        } else {
            this.upgradeButton = null;
        }
        
        // Delete button
        const deleteBtn = {
            x: panelX + 150,
            y: panelY + yOffset,
            width: 120,
            height: 35
        };
        
        const mouseOverDelete = this.mouseX >= deleteBtn.x && this.mouseX <= deleteBtn.x + deleteBtn.width &&
                               this.mouseY >= deleteBtn.y && this.mouseY <= deleteBtn.y + deleteBtn.height;
        
        this.ctx.fillStyle = mouseOverDelete ? Theme.rgba(Theme.colors.red, 0.8) : Theme.colors.red;
        this.ctx.fillRect(deleteBtn.x, deleteBtn.y, deleteBtn.width, deleteBtn.height);
        this.ctx.strokeStyle = Theme.colors.red;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(deleteBtn.x, deleteBtn.y, deleteBtn.width, deleteBtn.height);
        
        this.ctx.fillStyle = Theme.colors.textBright;
        this.ctx.font = Theme.font(12);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Refund 50%', deleteBtn.x + deleteBtn.width / 2, deleteBtn.y + 22);
        
        // Store button for click detection
        this.deleteButton = deleteBtn;
        
        // NOTE: Entity highlight is now rendered in world space by renderEntityHighlight()
        // which is called during the world rendering phase (before UI).
    },
    
    renderVictoryOverlay() {
        if (!this.victoryOverlay) return;
        
        // Semi-transparent dark overlay
        this.ctx.fillStyle = Theme.colors.backdrops;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Victory banner (centered, gold border)
        const bannerX = 150;
        const bannerY = 150;
        const bannerW = 900;
        const bannerH = 500;
        
        // Banner background
        this.ctx.fillStyle = Theme.colors.panelBg;
        this.ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        
        // Gold border
        this.ctx.strokeStyle = Theme.colors.gold;
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
        
        // "CONGRATULATIONS!" header
        this.ctx.fillStyle = Theme.colors.gold;
        this.ctx.font = Theme.font(48);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONGRATULATIONS!', this.width / 2, bannerY + 80);
        
        // Subtitle
        this.ctx.fillStyle = Theme.colors.textBright;
        this.ctx.font = Theme.font(24);
        this.ctx.fillText("You've completed all goals and mastered the microgrid!", this.width / 2, bannerY + 130);
        
        // Fun fact header
        this.ctx.fillStyle = Theme.colors.green;
        this.ctx.font = Theme.font(20);
        this.ctx.fillText('Did You Know?', this.width / 2, bannerY + 200);
        
        // Fun fact text (word-wrapped)
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(16);
        this.wrapText(this.selectedFunFact, this.width / 2, bannerY + 240, bannerW - 80, 24);
        
        // "Start New Game?" button
        const btnX = this.width / 2 - 120;
        const btnY = bannerY + 380;
        const btnW = 240;
        const btnH = 50;
        
        // Store button bounds for click detection
        this.victoryButton = { x: btnX, y: btnY, width: btnW, height: btnH };
        
        // Button hover effect
        const isHovered = this.mouseX >= btnX && this.mouseX <= btnX + btnW &&
                          this.mouseY >= btnY && this.mouseY <= btnY + btnH;
        
        this.ctx.fillStyle = isHovered ? Theme.colors.greenDark : Theme.colors.green;
        this.ctx.fillRect(btnX, btnY, btnW, btnH);
        this.ctx.strokeStyle = Theme.colors.greenDim;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(btnX, btnY, btnW, btnH);
        
        this.ctx.fillStyle = Theme.colors.textBright;
        this.ctx.font = Theme.font(20);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Start New Game?', this.width / 2, btnY + 16);
    },
    
    renderHelpPanel() {
        // Semi-transparent dark overlay
        this.ctx.fillStyle = Theme.colors.backdrops;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Help panel (centered, larger to fit new content)
        const panelX = 100;
        const panelY = 30;
        const panelW = 1000;
        const panelH = 740;
        
        // Panel background
        this.ctx.fillStyle = Theme.colors.panelBg;
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        
        // Purple border
        this.ctx.strokeStyle = Theme.colors.purple;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // Title
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(24);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME HELP', panelX + panelW / 2, panelY + 40);
        
        // Content sections
        let yPos = panelY + 70;
        const leftMargin = panelX + 20;
        const rightMargin = panelX + panelW / 2 + 20;
        const lineHeight = 20;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = Theme.font(11);
        
        // LEFT COLUMN
        
        // Section 1: Game Objective
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('GAME OBJECTIVE', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Balance and upgrade your microgrid to build', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('more houses and keep them satisfied. Complete', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('all three goals to win!', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 2: Controls
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('CONTROLS', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Click SHOP to buy equipment', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Click grid to place equipment', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Right-click or ESC to cancel placement', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Click equipment to select/upgrade/delete', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 3: Energy System
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('ENERGY SYSTEM', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Solar panels generate power during the day.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Batteries store excess energy for nighttime.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Households consume power 24/7.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Weather and time affect solar generation.', leftMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = Theme.colors.green;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Solar Panel Tiers:', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('T1: 5kW, 85% eff | T2: 10kW, 90% eff', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('T3: 15kW, 95% eff | T4: 25kW, 98% (WEATHERPROOF)', leftMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = Theme.colors.green;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Battery Tiers:', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('T1: 10kWh, 90% eff | T2: 20kWh, 92% eff', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('T3: 40kWh, 95% eff | T4: 80kWh, 98% (SELF-HEALING)', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 4: Buildings
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('BUILDINGS AND INCOME', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Cabin: 1.0-1.5kW | Hourly: $8 + $5 satisfaction bonus', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Family Home: 3.0-4.5kW | Hourly: $16 + $10 satisfaction bonus', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Business: 6.0-9.0kW | Hourly: $30 (no bonus)', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Corporate HQ: 10.0-15.0kW | Hourly: $30-75 (Income Grows)', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Satisfaction bonus requires 70%+ uptime.', leftMargin, yPos);
        yPos += lineHeight;
        
        // RIGHT COLUMN
        yPos = panelY + 70;
        
        // Section 5: Events
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('CRISIS EVENTS', rightMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('Random events challenge your grid management:', rightMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = Theme.severityColor('error');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Equipment Failure', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Solar/battery malfunction', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('error');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Weather Storms', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Reduces solar generation', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('warning');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Demand Spike', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Households use more power', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('warning');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Battery Issue', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Discharge or efficiency drop', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('warning');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Household Event', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Varies by household type', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('info');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Maintenance', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Temporary efficiency boost', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.severityColor('success');
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Grid Bonus', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Money or energy boost', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Special Event', rightMargin, yPos);
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText(' - Rare, high-impact events', rightMargin + 150, yPos);
        yPos += lineHeight + 8;
        
        
        // Strategy Tips Section
        this.ctx.fillStyle = Theme.colors.purple;
        this.ctx.font = Theme.font(13);
        this.ctx.fillText('STRATEGY TIPS', rightMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = Theme.colors.text;
        this.ctx.font = Theme.font(11);
        this.ctx.fillText('• Build enough batteries for nighttime demand', rightMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Upgrade to Tier 4 for elite abilities', rightMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Monitor satisfaction to maximize income', rightMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Plan for weather changes and events', rightMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Balance equipment costs vs. income', rightMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Click entities to see event status', rightMargin, yPos);
        yPos += lineHeight;
        
        // Close button (X) at top-right
        const closeBtnX = panelX + panelW - 50;
        const closeBtnY = panelY + 10;
        const closeBtnSize = 35;
        
        // Store button bounds for click detection
        this.helpCloseButton = { x: closeBtnX, y: closeBtnY, width: closeBtnSize, height: closeBtnSize };
        
        // Button hover effect
        const isHovered = this.mouseX >= closeBtnX && this.mouseX <= closeBtnX + closeBtnSize &&
                          this.mouseY >= closeBtnY && this.mouseY <= closeBtnY + closeBtnSize;
        
        this.ctx.fillStyle = isHovered ? Theme.rgba(Theme.colors.red, 0.8) : Theme.colors.red;
        this.ctx.fillRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
        this.ctx.strokeStyle = Theme.colors.red;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
        
        this.ctx.fillStyle = Theme.colors.textBright;
        this.ctx.font = Theme.font(20);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('X', closeBtnX + closeBtnSize / 2, closeBtnY + 10);
    },
    
    // Helper for word-wrapping text (used by victory overlay)
    wrapText(text, x, y, maxWidth, lineHeight) {
        if (!text) return;
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        this.ctx.textAlign = 'center';
        
        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                this.ctx.fillText(line.trim(), x, currentY);
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line.trim(), x, currentY);
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
}); 

// Export Game to window so other modules can access it (e.g., visualRenderer for placement)
window.Game = Game;
