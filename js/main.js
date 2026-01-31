// Solar Microgrid Management Game - Main JavaScript

// Main game object
const Game = {
    canvas: null,
    ctx: null,
    width: 1200,
    height: 800,
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
    
    // Device and layout detection
    isMobile: false,
    isTouch: false,
    orientation: 'landscape',
    viewportWidth: 1200,
    viewportHeight: 800,
    scaleFactor: 1,
    layoutMode: 'desktop', // 'desktop', 'tablet', 'mobile'
    orientationWarningShown: false,
    notificationPosition: { x: 500, y: 470 },
    
    // Touch state tracking
    touch: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        startTime: 0,
        isDragging: false,
        dragThreshold: 10, // pixels before considered a drag
        longPressTime: 500, // ms for long press
        longPressTimer: null
    },
    
    // Mobile cancel button (only visible in placement mode on mobile)
    cancelPlacementButton: null,
    
    // Layout configuration for different screen sizes
    layouts: {
        desktop: {
            shopButton: { x: 1050, y: 10, w: 140, h: 40 },
            newGameButton: { x: 900, y: 10, w: 140, h: 40 },
            timeButton: { x: 20, y: 10, w: 200, h: 30 },
            pauseButton: { x: 230, y: 10, w: 100, h: 30 },
            helpButton: { x: 340, y: 10, w: 40, h: 30 },
            weatherButton: { x: 20, y: 50, w: 300, h: 30 },
            energyBars: { x: 20, y: 450, w: 300, h: 30, spacing: 40 },
            statsPanel: { x: 20, y: 580, w: 300, h: 230 },
            goalPanel: { x: 400, y: 10, w: 400, h: 110 },
            shopMenu: { x: 900, y: 100, w: 280, h: 400 },
            selectionPanel: { x: 900, y: 520, w: 280, h: 200 },
            notifications: { x: 500, y: 470 },
            fontSize: { small: 10, medium: 12, large: 14 }
        },
        tablet: {
            shopButton: { x: 1050, y: 10, w: 140, h: 44 },
            newGameButton: { x: 900, y: 10, w: 140, h: 44 },
            timeButton: { x: 20, y: 10, w: 200, h: 35 },
            pauseButton: { x: 230, y: 10, w: 100, h: 35 },
            helpButton: { x: 340, y: 10, w: 44, h: 35 },
            weatherButton: { x: 20, y: 55, w: 300, h: 35 },
            energyBars: { x: 20, y: 450, w: 300, h: 35, spacing: 45 },
            statsPanel: { x: 20, y: 590, w: 300, h: 210 },
            goalPanel: { x: 400, y: 10, w: 400, h: 110 },
            shopMenu: { x: 900, y: 100, w: 280, h: 400 },
            selectionPanel: { x: 900, y: 520, w: 280, h: 200 },
            notifications: { x: 500, y: 470 },
            fontSize: { small: 11, medium: 13, large: 15 }
        },
        mobile: {
            // Mobile landscape layout - UI compressed to edges
            shopButton: { x: 1050, y: 10, w: 140, h: 50 },
            newGameButton: { x: 900, y: 10, w: 140, h: 50 },
            timeButton: { x: 20, y: 10, w: 180, h: 35 },
            pauseButton: { x: 210, y: 10, w: 80, h: 35 },
            helpButton: { x: 300, y: 10, w: 50, h: 35 },
            weatherButton: { x: 20, y: 55, w: 280, h: 35 },
            energyBars: { x: 20, y: 420, w: 280, h: 40, spacing: 50 },
            statsPanel: { x: 20, y: 580, w: 280, h: 200 },
            goalPanel: { x: 380, y: 10, w: 380, h: 100 },
            shopMenu: { x: 460, y: 100, w: 280, h: 380 },
            selectionPanel: { x: 460, y: 500, w: 280, h: 180 },
            notifications: { x: 460, y: 350 },
            fontSize: { small: 12, medium: 14, large: 16 },
            // Mobile-specific: cancel button for placement mode
            cancelButton: { x: 540, y: 740, w: 120, h: 50 }
        }
    },
    
    // Entity selection and management
    selectedEntity: null,
    selectedEntityType: null, // 'solar', 'battery', 'household'
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Detect device FIRST
        this.detectDevice();
        
        // Initialize game state
        this.gameState = new GameState();
        this.gameState.initialize();
        
        // Initialize new systems
        this.initializeSystems();
        
        // Set up canvas dimensions
        this.setupCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle orientation change (iOS specific)
        window.addEventListener('orientationchange', () => {
            // Delay to allow browser to update dimensions
            setTimeout(() => this.handleResize(), 100);
        });
        
        // Handle mouse events
        this.setupMouseEvents();
        
        // Check orientation on mobile
        this.checkOrientation();
        
        // Start game loop
        this.startGameLoop();
        
        // Show tutorial dialog
        this.showTutorial();
    },
    
    initializeSystems() {
        // Initialize UI framework
        this.notificationSystem = new NotificationSystem();
        this.lastEventNotificationDay = -1; // Track last day we showed an event notification
        
        // Initialize visual systems
        this.spriteManager = new SpriteManager();
        this.particleSystem = new ParticleSystem();
        this.worldRenderer = new WorldRenderer(
            this.ctx,
            this.gameState,
            this.spriteManager,
            this.particleSystem
        );
        
        // Initialize economic system
        this.purchaseManager = new PurchaseManager(this.gameState);
        
        // Create HUD elements
        this.createHUD();
        
        // Create shop menu (hidden by default)
        this.shopMenu = new ShopMenu(900, 100, 280, 400, this.purchaseManager);
        this.shopMenu.visible = false;
        this.uiElements.push(this.shopMenu);
    },
    
    createHUD() {
        // Shop button (with money display)
        const moneyButton = new Button(
            1050, 10, 140, 40,
            'SHOP - $1000', // Shop button with money display
            () => {
                this.shopMenu.visible = !this.shopMenu.visible;
            },
            { 
                bgColor: '#00b894', 
                hoverBgColor: '#00cec9',
                activeBgColor: '#00a884',
                borderColor: '#00cec9',
                textColor: '#ffffff' 
            }
        );
        this.uiElements.push(moneyButton);
        
        // Energy bars (max values will be updated dynamically)
        const generationBar = new EnergyBar(20, 450, 300, 30, 50, 0, '#1e90ff', 'Generation');
        const storageBar = new EnergyBar(20, 490, 300, 30, 100, 0, '#00ff00', 'Storage');
        const consumptionBar = new EnergyBar(20, 530, 300, 30, 50, 0, '#ff6b6b', 'Consumption');
        
        this.uiElements.push(generationBar, storageBar, consumptionBar);
        
        // Time display button
        const timeButton = new Button(20, 10, 200, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: '#000000' });
        this.uiElements.push(timeButton);
        
        // Pause/Play button
        const pauseButton = new Button(230, 10, 100, 30, 'Pause', () => {
            this.isPaused = !this.isPaused;
            pauseButton.text = this.isPaused ? 'Play ▶' : 'Pause ⏸';
            this.notificationSystem.addNotification(this.isPaused ? 'Game paused' : 'Game resumed', 'info');
        }, { 
            bgColor: '#74b9ff',
            hoverBgColor: '#0984e3',
            activeBgColor: '#0652dd',
            fontSize: '14px'
        });
        this.uiElements.push(pauseButton);
        
        // Weather info (move below energy bars, not overlapping time)
        const weatherButton = new Button(20, 50, 300, 30, '', () => {}, { bgColor: 'transparent', borderColor: 'transparent', textColor: '#000000' });
        this.uiElements.push(weatherButton);
        
        // Stats panel (bottom-left, below energy bars and weather) - increased height for satisfaction line
        const statsPanel = new Panel(20, 580, 300, 230, 'Grid Statistics');
        this.uiElements.push(statsPanel);
        
        // Goal panel (top-center, taller to accommodate detailed progress)
        const goalPanel = new Panel(400, 10, 400, 110, 'Current Goal');
        this.uiElements.push(goalPanel);
        
        // Start New Game button (left of Shop button)
        const newGameButton = new Button(900, 10, 140, 40, 'Start New Game', () => {
            if (confirm('Start a new game? All progress will be lost!')) {
                this.resetGame();
                this.notificationSystem.addNotification('New game started!', 'success');
            }
        }, { 
            fontSize: '12px',
            bgColor: '#e17055',
            hoverBgColor: '#d63031',
            activeBgColor: '#c0392b'
        });
        
        this.uiElements.push(newGameButton);
        
        // Help button (?) - positioned next to pause button
        const helpButton = new Button(340, 10, 40, 30, '?', () => {
            this.helpPanelVisible = !this.helpPanelVisible;
        }, { 
            bgColor: '#6c5ce7',
            hoverBgColor: '#5f27cd',
            activeBgColor: '#341f97',
            fontSize: '18px',
            fontWeight: 'bold'
        });
        this.uiElements.push(helpButton);
        
        // Help panel (hidden by default)
        this.helpPanelVisible = false;
    },
    
    // Create mobile cancel button
    createMobileCancelButton() {
        if (!this.isMobile && !this.isTouch) return;
        
        const layout = this.layouts.mobile;
        
        this.cancelPlacementButton = new Button(
            layout.cancelButton.x, layout.cancelButton.y,
            layout.cancelButton.w, layout.cancelButton.h,
            'CANCEL',
            () => {
                this.cancelPlacement();
            },
            {
                bgColor: '#d63031',
                hoverBgColor: '#e74c3c',
                activeBgColor: '#c0392b',
                borderColor: '#c0392b',
                textColor: '#ffffff',
                fontSize: '16px'
            }
        );
        this.cancelPlacementButton.visible = false;
    },
    
    // Device detection
    detectDevice() {
        // Detect touch capability
        this.isTouch = ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0) ||
                       (navigator.msMaxTouchPoints > 0);
        
        // Detect mobile by screen size and touch
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.isMobile = this.isTouch && (width <= 1024 || height <= 768);
        
        // Detect orientation
        this.orientation = width > height ? 'landscape' : 'portrait';
        
        // Set layout mode
        if (width <= 480 || (this.orientation === 'portrait' && width <= 768)) {
            this.layoutMode = 'mobile';
        } else if (width <= 1024) {
            this.layoutMode = 'tablet';
        } else {
            this.layoutMode = 'desktop';
        }
        
        this.viewportWidth = width;
        this.viewportHeight = height;
    },
    
    // Check orientation and show warning on mobile
    checkOrientation() {
        if (this.isMobile && this.orientation === 'portrait') {
            // Show one-time orientation suggestion
            if (!this.orientationWarningShown) {
                this.notificationSystem.addNotification('Tip: Rotate to landscape for the best experience!', 'info');
                this.orientationWarningShown = true;
            }
        }
    },
    
    setupCanvas() {
        // Detect device first
        this.detectDevice();
        
        // Keep internal resolution at 1200x800 for consistent game logic
        // But scale the display to fit the viewport
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Calculate scale to fit viewport
        this.updateCanvasScale();
        
        // Create mobile cancel button if needed
        this.createMobileCancelButton();
    },
    
    updateCanvasScale() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Account for iOS Safari's dynamic viewport
        const safeHeight = window.innerHeight;
        const safeWidth = window.innerWidth;
        
        const targetWidth = Math.min(containerWidth, safeWidth);
        const targetHeight = Math.min(containerHeight, safeHeight);
        
        const scaleX = targetWidth / this.width;
        const scaleY = targetHeight / this.height;
        
        // Use the smaller scale to maintain aspect ratio
        // Add padding factor for mobile (95% on desktop, 100% on mobile to maximize space)
        const paddingFactor = this.isMobile ? 1.0 : 0.95;
        this.scaleFactor = Math.min(scaleX, scaleY) * paddingFactor;
        
        // Apply scale via CSS transform
        this.canvas.style.transform = `scale(${this.scaleFactor})`;
        this.canvas.style.transformOrigin = 'top left';
        
        // Center the canvas
        const scaledWidth = this.width * this.scaleFactor;
        const scaledHeight = this.height * this.scaleFactor;
        
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(targetWidth - scaledWidth) / 2}px`;
        this.canvas.style.top = `${(targetHeight - scaledHeight) / 2}px`;
    },
    
    // Reposition UI elements based on layout mode
    repositionUI() {
        const layout = this.layouts[this.layoutMode];
        if (!layout) return;
        
        // Update button positions based on layout
        // uiElements order: [moneyButton, genBar, storageBar, consumptionBar, timeButton, 
        //                    pauseButton, weatherButton, statsPanel, goalPanel, newGameButton, helpButton]
        
        // Money/Shop button (index 0)
        if (this.uiElements[0]) {
            this.uiElements[0].x = layout.shopButton.x;
            this.uiElements[0].y = layout.shopButton.y;
            this.uiElements[0].width = layout.shopButton.w;
            this.uiElements[0].height = layout.shopButton.h;
        }
        
        // Energy bars (indices 1, 2, 3)
        for (let i = 0; i < 3; i++) {
            if (this.uiElements[i + 1]) {
                this.uiElements[i + 1].x = layout.energyBars.x;
                this.uiElements[i + 1].y = layout.energyBars.y + (i * layout.energyBars.spacing);
                this.uiElements[i + 1].width = layout.energyBars.w;
                this.uiElements[i + 1].height = layout.energyBars.h;
            }
        }
        
        // Time button (index 4)
        if (this.uiElements[4]) {
            this.uiElements[4].x = layout.timeButton.x;
            this.uiElements[4].y = layout.timeButton.y;
            this.uiElements[4].width = layout.timeButton.w;
            this.uiElements[4].height = layout.timeButton.h;
        }
        
        // Pause button (index 5)
        if (this.uiElements[5]) {
            this.uiElements[5].x = layout.pauseButton.x;
            this.uiElements[5].y = layout.pauseButton.y;
            this.uiElements[5].width = layout.pauseButton.w;
            this.uiElements[5].height = layout.pauseButton.h;
        }
        
        // Weather button (index 6)
        if (this.uiElements[6]) {
            this.uiElements[6].x = layout.weatherButton.x;
            this.uiElements[6].y = layout.weatherButton.y;
            this.uiElements[6].width = layout.weatherButton.w;
            this.uiElements[6].height = layout.weatherButton.h;
        }
        
        // Stats panel (index 7)
        if (this.uiElements[7]) {
            this.uiElements[7].x = layout.statsPanel.x;
            this.uiElements[7].y = layout.statsPanel.y;
            this.uiElements[7].width = layout.statsPanel.w;
            this.uiElements[7].height = layout.statsPanel.h;
        }
        
        // Goal panel (index 8)
        if (this.uiElements[8]) {
            this.uiElements[8].x = layout.goalPanel.x;
            this.uiElements[8].y = layout.goalPanel.y;
            this.uiElements[8].width = layout.goalPanel.w;
            this.uiElements[8].height = layout.goalPanel.h;
        }
        
        // New Game button (index 9)
        if (this.uiElements[9]) {
            this.uiElements[9].x = layout.newGameButton.x;
            this.uiElements[9].y = layout.newGameButton.y;
            this.uiElements[9].width = layout.newGameButton.w;
            this.uiElements[9].height = layout.newGameButton.h;
        }
        
        // Help button (index 10)
        if (this.uiElements[10]) {
            this.uiElements[10].x = layout.helpButton.x;
            this.uiElements[10].y = layout.helpButton.y;
            this.uiElements[10].width = layout.helpButton.w;
            this.uiElements[10].height = layout.helpButton.h;
        }
        
        // Shop menu
        if (this.shopMenu) {
            this.shopMenu.x = layout.shopMenu.x;
            this.shopMenu.y = layout.shopMenu.y;
            this.shopMenu.width = layout.shopMenu.w;
            this.shopMenu.height = layout.shopMenu.h;
        }
        
        // Store layout for notification rendering
        this.notificationPosition = layout.notifications;
    },
    
    setupMouseEvents() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Calculate scale factor
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Handle help panel close button (blocks input when visible)
            if (this.helpPanelVisible && this.helpCloseButton) {
                if (this.isPointInRect(x, y, this.helpCloseButton)) {
                    this.helpPanelVisible = false;
                    return;
                }
                // Block all other clicks when help panel is shown
                return;
            }
            
            // Handle victory overlay button first (blocks all other input)
            if (this.victoryOverlay && this.victoryButton) {
                if (this.isPointInRect(x, y, this.victoryButton)) {
                    this.victoryOverlay = false;
                    this.resetGame();
                    this.notificationSystem.addNotification('New game started!', 'success');
                    return;
                }
                // Block all other clicks when victory overlay is shown
                return;
            }
            
            // Handle dialog first
            if (this.dialog && this.dialog.visible) {
                if (this.dialog.handleClick(x, y)) return;
            }

            // Handle Placement Click
            if (this.placementMode) {
                // Left click to place
                if (e.button === 0) { 
                    this.handlePlacement(x, y);
                    return; 
                }
            }
            
            // Handle entity selection (not in placement mode)
            if (!this.placementMode) {
                // Check if clicking on upgrade/delete buttons
                if (this.selectedEntity) {
                    if (this.upgradeButton && this.isPointInRect(x, y, this.upgradeButton)) {
                        this.upgradeSelectedEntity();
                        return;
                    }
                    if (this.deleteButton && this.isPointInRect(x, y, this.deleteButton)) {
                        this.deleteSelectedEntity();
                        return;
                    }
                }
                
                const entity = this.getEntityAtPosition(x, y);
                if (entity) {
                    this.selectEntity(entity.item, entity.type);
                    return;
                } else {
                    // Clicked empty space, deselect
                    this.deselectEntity();
                }
            }
            
            // Handle UI elements (reverse order for z-index)
            for (let i = this.uiElements.length - 1; i >= 0; i--) {
                const element = this.uiElements[i];
                if (element.handleClick && element.handleClick(x, y)) {
                    return;
                }
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            
            // In placement mode, calculate snapped coordinates
            if (this.placementMode) {
                // Get grid offset from renderer
                const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
                const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
                
                // Snap to grid
                const rawX = this.mouseX - offsetX;
                const rawY = this.mouseY - offsetY;
                
                this.placementX = offsetX + Math.round(rawX / this.gridSize) * this.gridSize;
                this.placementY = offsetY + Math.round(rawY / this.gridSize) * this.gridSize;
                
                // Update validity (check bounds)
                const minX = offsetX;
                const maxX = offsetX + 600 - this.gridSize; // Adjust for item width if needed
                const minY = offsetY;
                const maxY = offsetY + 400 - this.gridSize;
                
                let inBounds = (this.placementX >= minX && this.placementX <= maxX && 
                               this.placementY >= minY && this.placementY <= maxY);
                               
                // Check collision if in bounds
                if (inBounds) {
                    // Convert screen coords to game world coords for collision check
                    const gameX = this.placementX - offsetX;
                    const gameY = this.placementY - offsetY;
                    
                    // Simple collision check - radius based
                    const collision = this.checkCollision(gameX, gameY);
                    this.placementValid = !collision;
                } else {
                    this.placementValid = false;
                }
            }

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
        
        // Escape key to cancel placement
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.placementMode) {
                this.cancelPlacement();
            }
            
            // Delete key to delete selected entity
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedEntity) {
                this.deleteSelectedEntity();
            }
            
            // U key to upgrade selected entity
            if (e.key === 'u' || e.key === 'U') {
                if (this.selectedEntity) {
                    this.upgradeSelectedEntity();
                }
            }
            
            // Cheat key sequence detection
            this.handleCheatKeySequence(e.key);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
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
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.uiElements.forEach(element => {
                if (element.handleMouseUp) {
                    element.handleMouseUp(x, y);
                }
            });
        });
        
        // Touch event support for mobile devices
        this.setupTouchEvents();
    },
    
    setupTouchEvents() {
        // Touch start - begin tracking
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const coords = this.getTouchCoords(touch);
                
                this.touch.active = true;
                this.touch.startX = coords.x;
                this.touch.startY = coords.y;
                this.touch.currentX = coords.x;
                this.touch.currentY = coords.y;
                this.touch.startTime = Date.now();
                this.touch.isDragging = false;
                
                // Update mouse position for placement preview
                this.mouseX = coords.x;
                this.mouseY = coords.y;
                
                // Start long press timer (for entity selection info)
                this.touch.longPressTimer = setTimeout(() => {
                    if (this.touch.active && !this.touch.isDragging) {
                        this.handleLongPress(coords.x, coords.y);
                    }
                }, this.touch.longPressTime);
                
                // Trigger visual feedback on buttons
                this.uiElements.forEach(element => {
                    if (element.handleMouseDown) {
                        element.handleMouseDown(coords.x, coords.y);
                    }
                });
                
                // Also check cancel button
                if (this.cancelPlacementButton && this.cancelPlacementButton.visible) {
                    if (this.cancelPlacementButton.handleMouseDown) {
                        this.cancelPlacementButton.handleMouseDown(coords.x, coords.y);
                    }
                }
                
                // If in placement mode, show preview at touch location
                if (this.placementMode) {
                    this.updatePlacementPreview(coords.x, coords.y);
                }
            }
        }, { passive: false });
        
        // Touch move - handle dragging
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.touch.active) {
                const touch = e.touches[0];
                const coords = this.getTouchCoords(touch);
                
                this.touch.currentX = coords.x;
                this.touch.currentY = coords.y;
                
                // Update mouse position
                this.mouseX = coords.x;
                this.mouseY = coords.y;
                
                // Check if we've moved enough to be considered dragging
                const dx = coords.x - this.touch.startX;
                const dy = coords.y - this.touch.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > this.touch.dragThreshold) {
                    this.touch.isDragging = true;
                    
                    // Cancel long press if dragging
                    if (this.touch.longPressTimer) {
                        clearTimeout(this.touch.longPressTimer);
                        this.touch.longPressTimer = null;
                    }
                }
                
                // If in placement mode, update preview position
                if (this.placementMode) {
                    this.updatePlacementPreview(coords.x, coords.y);
                }
                
                // Update hover states for UI elements
                this.uiElements.forEach(element => {
                    if (element.handleMouseMove) {
                        element.handleMouseMove(coords.x, coords.y);
                    }
                });
            }
        }, { passive: false });
        
        // Touch end - complete action
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Cancel long press timer
            if (this.touch.longPressTimer) {
                clearTimeout(this.touch.longPressTimer);
                this.touch.longPressTimer = null;
            }
            
            if (this.touch.active) {
                const x = this.touch.currentX;
                const y = this.touch.currentY;
                
                // Trigger mouseup on UI elements
                this.uiElements.forEach(element => {
                    if (element.handleMouseUp) {
                        element.handleMouseUp(x, y);
                    }
                });
                
                // Also check cancel button
                if (this.cancelPlacementButton && this.cancelPlacementButton.visible) {
                    if (this.cancelPlacementButton.handleMouseUp) {
                        this.cancelPlacementButton.handleMouseUp(x, y);
                    }
                }
                
                // Determine action based on whether it was a tap or drag
                const touchDuration = Date.now() - this.touch.startTime;
                
                if (!this.touch.isDragging && touchDuration < 300) {
                    // Short tap - treat as click
                    this.handleTouchClick(x, y);
                } else if (this.touch.isDragging && this.placementMode) {
                    // Drag ended in placement mode - try to place
                    this.handlePlacement(x, y);
                }
                
                // Reset touch state
                this.touch.active = false;
                this.touch.isDragging = false;
            }
        }, { passive: false });
        
        // Touch cancel - reset state
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            
            if (this.touch.longPressTimer) {
                clearTimeout(this.touch.longPressTimer);
                this.touch.longPressTimer = null;
            }
            
            this.touch.active = false;
            this.touch.isDragging = false;
            
            // Reset button states
            this.uiElements.forEach(element => {
                if (element.handleMouseUp) {
                    element.handleMouseUp(0, 0);
                }
            });
            
            if (this.cancelPlacementButton) {
                if (this.cancelPlacementButton.handleMouseUp) {
                    this.cancelPlacementButton.handleMouseUp(0, 0);
                }
            }
        }, { passive: false });
    },
    
    // Helper to get touch coordinates adjusted for canvas scaling
    getTouchCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    },
    
    // Update placement preview position (snapped to grid)
    updatePlacementPreview(x, y) {
        const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        const rawX = x - offsetX;
        const rawY = y - offsetY;
        
        this.placementX = offsetX + Math.round(rawX / this.gridSize) * this.gridSize;
        this.placementY = offsetY + Math.round(rawY / this.gridSize) * this.gridSize;
        
        // Update validity
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
    
    // Handle long press - show entity info
    handleLongPress(x, y) {
        if (this.placementMode) return;
        
        const entity = this.getEntityAtPosition(x, y);
        if (entity) {
            this.selectEntity(entity.item, entity.type);
        }
    },
    
    handleTouchClick(x, y) {
        // Handle cancel button first (for mobile placement mode)
        if (this.placementMode && this.cancelPlacementButton && this.cancelPlacementButton.visible) {
            if (this.cancelPlacementButton.contains(x, y)) {
                this.cancelPlacement();
                return;
            }
        }
        
        // Handle help panel close button (blocks input when visible)
        if (this.helpPanelVisible && this.helpCloseButton) {
            if (this.isPointInRect(x, y, this.helpCloseButton)) {
                this.helpPanelVisible = false;
                return;
            }
            return;
        }
        
        // Handle victory overlay button
        if (this.victoryOverlay && this.victoryButton) {
            if (this.isPointInRect(x, y, this.victoryButton)) {
                this.victoryOverlay = false;
                this.resetGame();
                this.notificationSystem.addNotification('New game started!', 'success');
                return;
            }
            return;
        }
        
        // Handle dialog
        if (this.dialog && this.dialog.visible) {
            if (this.dialog.handleClick(x, y)) return;
        }

        // Handle Placement
        if (this.placementMode) {
            this.handlePlacement(x, y);
            return;
        }
        
        // Handle entity selection
        if (!this.placementMode) {
            if (this.selectedEntity) {
                if (this.upgradeButton && this.isPointInRect(x, y, this.upgradeButton)) {
                    this.upgradeSelectedEntity();
                    return;
                }
                if (this.deleteButton && this.isPointInRect(x, y, this.deleteButton)) {
                    this.deleteSelectedEntity();
                    return;
                }
            }
            
            const entity = this.getEntityAtPosition(x, y);
            if (entity) {
                this.selectEntity(entity.item, entity.type);
                return;
            } else {
                this.deselectEntity();
            }
        }
        
        // Handle UI elements
        for (let i = this.uiElements.length - 1; i >= 0; i--) {
            const element = this.uiElements[i];
            if (element.handleClick && element.handleClick(x, y)) {
                return;
            }
        }
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
        this.notificationSystem.addNotification('Welcome! Click green button (top-right) to buy equipment. Complete goals to win!', 'info');
    },
    
    // Placement System Methods
    startPlacement(equipment) {
        // Check if player can afford it before entering placement mode
        if (!this.purchaseManager.canAfford(equipment.cost)) {
            this.notificationSystem.addNotification(`Not enough money! Need $${equipment.cost}`, 'error');
            return;
        }
        
        // Deduct money immediately when entering placement mode
        this.gameState.money -= equipment.cost;
        
        this.placementMode = true;
        this.placementItem = equipment;
        this.placementValid = true;
        
        if (this.shopMenu) {
            this.shopMenu.visible = false;
        }
        
        // Show cancel button on mobile
        if ((this.isMobile || this.isTouch) && this.cancelPlacementButton) {
            this.cancelPlacementButton.visible = true;
        }
        
        // Show instruction notification on mobile
        if (this.isMobile || this.isTouch) {
            this.notificationSystem.addNotification('Drag to position, lift to place. Tap CANCEL to abort.', 'info');
        }
    },
    
    cancelPlacement() {
        if (!this.placementMode) return;
        
        // Refund the money if item wasn't placed yet
        if (this.placementItem) {
            this.gameState.money += this.placementItem.cost;
            this.notificationSystem.addNotification(`Placement cancelled. Refunded $${this.placementItem.cost}`, 'info');
        }
        
        this.placementMode = false;
        this.placementItem = null;
        
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
    
    getEntityAtPosition(x, y) {
        const offsetX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const offsetY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        // Convert screen coords to game world coords
        const gameX = x - offsetX;
        const gameY = y - offsetY;
        
        // Larger hit radius on mobile for easier selection
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
    
    selectEntity(entity, type) {
        this.selectedEntity = entity;
        this.selectedEntityType = type;
        
        // Close shop menu when selecting entity
        if (this.shopMenu) {
            this.shopMenu.visible = false;
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
    
    handlePlacement(x, y) {
        if (!this.placementMode || !this.placementItem) return;
        
        // Use the calculated placement coordinates instead of raw mouse clicks
        // These are already snapped and stored in placementX/Y
        
        if (!this.placementValid) {
            this.notificationSystem.addNotification("Invalid placement location!", 'warning');
            return;
        }

        const minX = this.worldRenderer ? this.worldRenderer.offsetX : 50;
        const minY = this.worldRenderer ? this.worldRenderer.offsetY : 100;
        
        // Convert snapped screen coordinates to game world coordinates
        const gameX = this.placementX - minX;
        const gameY = this.placementY - minY;

        // Add equipment directly (money already deducted in startPlacement)
        this.purchaseManager.addEquipment(this.placementItem, gameX, gameY);
        
        this.notificationSystem.addNotification(`Placed ${this.placementItem.name}!`, 'success');
        
        // Exit placement mode (don't refund since item was placed)
        this.placementMode = false;
        this.placementItem = null;
        this.shopMenu.visible = true;
    },

    handleResize() {
        // Re-detect device on resize (handles orientation changes)
        this.detectDevice();
        
        // Update canvas scale
        this.updateCanvasScale();
        
        // Reposition UI elements for new layout
        this.repositionUI();
        
        // Check orientation on mobile
        this.checkOrientation();
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
        // Don't update game state if paused
        if (this.gameState && this.gameState.initialized && !this.isPaused) {
            this.gameState.update(deltaTime);
        }

        // Update systems - only update particles when not paused
        if (!this.isPaused) {
            this.particleSystem.update(deltaTime);
        }
        this.notificationSystem.update(currentTime);

        // Update shop menu affordability
        if (this.shopMenu && this.shopMenu.updateAffordability) {
            this.shopMenu.updateAffordability();
        }

        if (this.dialog && this.dialog.visible) {
            this.dialog.update(currentTime);
        }

        // Check for events and show notifications (limit to 1 per day)
        // Event notifications are now handled directly by EventSystem.notifyUI()
        // No need for duplicate notification logic here
        
        // Check for goal completion and show victory overlay
        if (this.gameState && this.gameState.gameWon && !this.victoryOverlay) {
            this.victoryOverlay = true;
            this.selectedFunFact = this.funFacts[Math.floor(Math.random() * this.funFacts.length)];
            this.isPaused = true;  // Pause game on victory
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
        
        // Clear shop menu reference and recreate
        const oldShopMenu = this.shopMenu;
        const shopWasVisible = oldShopMenu ? oldShopMenu.visible : false;
        
        // Remove old shop menu from UI elements
        const shopIndex = this.uiElements.indexOf(oldShopMenu);
        if (shopIndex > -1) {
            this.uiElements.splice(shopIndex, 1);
        }
        
        // Create new shop menu
        this.shopMenu = new ShopMenu(900, 100, 280, 400, this.purchaseManager);
        this.shopMenu.visible = shopWasVisible;
        this.uiElements.push(this.shopMenu);
        
        // Clear notifications
        this.notificationSystem.notifications = [];
    },
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#90ee90';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid and world - pass paused state to control particle emission
        this.worldRenderer.render(this.isPaused);
        
        // Render UI elements (backgrounds first)
        this.uiElements.forEach(element => element.render(this.ctx));
        
        // Render game state (text content on top of UI backgrounds)
        this.renderGameState();
        
        // Render dialog
        if (this.dialog && this.dialog.visible) {
            this.dialog.render(this.ctx);
        }
        
        // Render Placement Preview
        if (this.placementMode && this.placementItem) {
            this.renderPlacementPreview();
            
            // Render mobile cancel button during placement
            if (this.cancelPlacementButton && this.cancelPlacementButton.visible) {
                this.cancelPlacementButton.render(this.ctx);
            }
        }
        
        // Render entity selection UI
        if (this.selectedEntity && this.selectedEntityType) {
            this.renderSelectionUI();
        }

        // Render notifications - use dynamic position
        const notifPos = this.notificationPosition || { x: 500, y: 470 };
        this.notificationSystem.render(this.ctx, notifPos.x, notifPos.y);
        
        // Render victory overlay (on top of everything)
        if (this.victoryOverlay) {
            this.renderVictoryOverlay();
        }
        
        // Render help panel (on top of everything except victory)
        if (this.helpPanelVisible) {
            this.renderHelpPanel();
        }
    },
    
    renderGameState() {
        if (!this.gameState) return;
        
        const gs = this.gameState;
        
        // Update shop button text with money
        const moneyButton = this.uiElements[0];
        if (moneyButton) {
            moneyButton.text = `SHOP - $${gs.money.toFixed(0)}`;
        }
        
        // Update time button with day/night indicator
        const timeButton = this.uiElements[4];
        if (timeButton) {
            const hour = Math.floor(gs.time % 24);
            const day = Math.floor(gs.time / 24);
            const isDaytime = (hour >= 6 && hour <= 18);
            const timeIcon = isDaytime ? '☀️' : '🌙';
            timeButton.text = `${timeIcon} Day ${day} - ${hour.toString().padStart(2, '0')}:00`;
        }
        
        // Update weather button
        const weatherButton = this.uiElements[6];
        if (weatherButton) {
            const cloudPercent = (gs.weather.cloudCover * 100).toFixed(0);
            const intensityPercent = (gs.getSolarIntensity() * 100).toFixed(0);
            weatherButton.text = `Weather: ${cloudPercent}% clouds, ${intensityPercent}% sun`;
        }
        
        // Update energy bars with dynamic max values
        if (gs.energy) {
            const generationBar = this.uiElements[1];
            const storageBar = this.uiElements[2];
            const consumptionBar = this.uiElements[3];
            
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
        const statsPanel = this.uiElements[7];
        if (statsPanel) {
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
            
            this.ctx.fillStyle = '#2b2b2b';
            this.ctx.font = '12px monospace'; // Smaller font to fit
            this.ctx.textAlign = 'left';
            statsText.forEach((text, index) => {
                this.ctx.fillText(text, statsPanel.x + 10, statsPanel.y + 40 + index * 20);
            });
        }
        
        // Update goal panel
        const goalPanel = this.uiElements[8];
        if (goalPanel && gs.getCurrentGoal) {
            const currentGoal = gs.getCurrentGoal();
            const progress = gs.getGoalProgress();
            
            if (currentGoal) {
                this.ctx.fillStyle = '#2b2b2b';
                this.ctx.font = 'bold 14px monospace';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(currentGoal.description, goalPanel.x + 10, goalPanel.y + 35);
                
                this.ctx.font = '12px monospace';
                
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
                
                this.ctx.fillStyle = '#cccccc';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                this.ctx.fillStyle = '#00b894';
                this.ctx.fillRect(barX, barY, (barWidth * Math.min(progress.percentage, 100) / 100), barHeight);
            } else if (gs.gameWon) {
                this.ctx.fillStyle = '#00b894';
                this.ctx.font = 'bold 18px monospace';
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
        
        // Panel background (tan like stats panel)
        this.ctx.fillStyle = '#f5f5dc';
        this.ctx.strokeStyle = '#4a4a4a';
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title with instance ID
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = 'bold 14px monospace';
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
                const tagColor = event.severity === 'high' ? '#d63031' : event.severity === 'medium' ? '#fdcb6e' : '#74b9ff';
                this.ctx.fillStyle = tagColor;
                this.ctx.font = '10px monospace';
                const tagText = event.name || 'Event Active';
                const tagWidth = this.ctx.measureText(tagText).width + 10;
                this.ctx.fillRect(panelX + 10, panelY + yOffset - 10, tagWidth, 16);
                
                // Draw tag text
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px monospace';
                this.ctx.fillText(tagText, panelX + 15, panelY + yOffset);
                yOffset += 20;
            });
        }
        
        // Entity info
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '12px monospace';
        
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
        
        const normalColor = '#2b2b2b';
        const affectedColor = '#d63031';  // Red for affected stats
        
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
                this.ctx.fillStyle = '#888888';
            } else if (!canAfford) {
                this.ctx.fillStyle = '#a0a0a0';
            } else {
                this.ctx.fillStyle = mouseOver ? '#00cec9' : '#00b894';
            }
            
            this.ctx.fillRect(upgradeBtn.x, upgradeBtn.y, upgradeBtn.width, upgradeBtn.height);
            this.ctx.strokeStyle = isMaxTier || !canAfford ? '#666666' : '#00a884';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(upgradeBtn.x, upgradeBtn.y, upgradeBtn.width, upgradeBtn.height);
            
            this.ctx.fillStyle = isMaxTier || !canAfford ? '#cccccc' : '#ffffff';
            this.ctx.font = 'bold 11px monospace';
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
        
        this.ctx.fillStyle = mouseOverDelete ? '#d63031' : '#ff6b6b';
        this.ctx.fillRect(deleteBtn.x, deleteBtn.y, deleteBtn.width, deleteBtn.height);
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(deleteBtn.x, deleteBtn.y, deleteBtn.width, deleteBtn.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Refund 50%', deleteBtn.x + deleteBtn.width / 2, deleteBtn.y + 22);
        
        // Store button for click detection
        this.deleteButton = deleteBtn;
        
        // Draw selection indicator on the entity
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
    
    renderVictoryOverlay() {
        if (!this.victoryOverlay) return;
        
        // Semi-transparent dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Victory banner (centered, gold border)
        const bannerX = 150;
        const bannerY = 150;
        const bannerW = 900;
        const bannerH = 500;
        
        // Banner background
        this.ctx.fillStyle = '#2d3436';
        this.ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        
        // Gold border
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
        
        // "CONGRATULATIONS!" header
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONGRATULATIONS!', this.width / 2, bannerY + 80);
        
        // Subtitle
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px monospace';
        this.ctx.fillText("You've completed all goals and mastered the microgrid!", this.width / 2, bannerY + 130);
        
        // Fun fact header
        this.ctx.fillStyle = '#00b894';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText('Did You Know?', this.width / 2, bannerY + 200);
        
        // Fun fact text (word-wrapped)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
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
        
        this.ctx.fillStyle = isHovered ? '#00cec9' : '#00b894';
        this.ctx.fillRect(btnX, btnY, btnW, btnH);
        this.ctx.strokeStyle = '#00a884';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(btnX, btnY, btnW, btnH);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Start New Game?', this.width / 2, btnY + 16);
    },
    
    renderHelpPanel() {
        // Semi-transparent dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Help panel (centered, larger to fit new content)
        const panelX = 100;
        const panelY = 30;
        const panelW = 1000;
        const panelH = 740;
        
        // Panel background
        this.ctx.fillStyle = '#f5f5dc';
        this.ctx.fillRect(panelX, panelY, panelW, panelH);
        
        // Purple border
        this.ctx.strokeStyle = '#6c5ce7';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // Title
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME HELP', panelX + panelW / 2, panelY + 40);
        
        // Content sections
        let yPos = panelY + 70;
        const leftMargin = panelX + 20;
        const rightMargin = panelX + panelW / 2 + 20;
        const lineHeight = 20;
        
        this.ctx.textAlign = 'left';
        this.ctx.font = '11px monospace';
        
        // LEFT COLUMN
        
        // Section 1: Game Objective
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('GAME OBJECTIVE', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('Balance and upgrade your microgrid to build', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('more houses and keep them satisfied. Complete', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('all three goals to win!', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 2: Controls
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('CONTROLS', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('• Click SHOP to buy equipment', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Click grid to place equipment', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Right-click or ESC to cancel placement', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('• Click equipment to select/upgrade/delete', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 3: Energy System
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('ENERGY SYSTEM', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('Solar panels generate power during the day.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Batteries store excess energy for nighttime.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Households consume power 24/7.', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('Weather and time affect solar generation.', leftMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = '#00b894';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('Solar Panel Tiers:', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('T1: 5kW, 85% eff | T2: 10kW, 90% eff', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('T3: 15kW, 95% eff | T4: 25kW, 98% (WEATHERPROOF)', leftMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = '#00b894';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('Battery Tiers:', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('T1: 10kWh, 90% eff | T2: 20kWh, 92% eff', leftMargin, yPos);
        yPos += lineHeight;
        this.ctx.fillText('T3: 40kWh, 95% eff | T4: 80kWh, 98% (SELF-HEALING)', leftMargin, yPos);
        yPos += lineHeight + 8;
        
        // Section 4: Buildings
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('BUILDINGS AND INCOME', leftMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
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
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('CRISIS EVENTS', rightMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText('Random events challenge your grid management:', rightMargin, yPos);
        yPos += lineHeight + 4;
        
        this.ctx.fillStyle = '#d63031';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Equipment Failure', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Solar/battery malfunction', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#d63031';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Weather Storms', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Reduces solar generation', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Demand Spike', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Households use more power', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Battery Issue', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Discharge or efficiency drop', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Household Event', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Varies by household type', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#74b9ff';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Maintenance', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Temporary efficiency boost', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#00b894';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Grid Bonus', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Money or energy boost', rightMargin + 150, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.fillText('• Special Event', rightMargin, yPos);
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(' - Rare, high-impact events', rightMargin + 150, yPos);
        yPos += lineHeight + 8;
        
        
        // Strategy Tips Section
        this.ctx.fillStyle = '#6c5ce7';
        this.ctx.font = 'bold 13px monospace';
        this.ctx.fillText('STRATEGY TIPS', rightMargin, yPos);
        yPos += lineHeight;
        
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '11px monospace';
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
        
        this.ctx.fillStyle = isHovered ? '#d63031' : '#ff6b6b';
        this.ctx.fillRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(closeBtnX, closeBtnY, closeBtnSize, closeBtnSize);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 20px monospace';
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
