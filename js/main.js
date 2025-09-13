// Solar Microgrid Management Game - Main JavaScript

// Game initialization
console.log("Solar Microgrid Management Game starting...");

// Main game object
const Game = {
    canvas: null,
    ctx: null,
    width: 1200,
    height: 800,
    lastTime: 0,
    fps: 0,
    frameCount: 0,
    fpsUpdateTime: 0,
    isRunning: false,
    gameState: null,
    autoSaveInterval: 30000, // Auto-save every 30 seconds
    lastAutoSave: 0,
    
    init() {
        console.log("Initializing game...");
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize game state
        this.gameState = new GameState();
        
        // Try to load existing save, otherwise use initial state
        if (StorageManager.hasExistingSave()) {
            console.log("Found existing save, loading...");
            StorageManager.loadGame(this.gameState);
        }
        
        // Initialize the game state
        this.gameState.initialize();
        
        // Set up canvas dimensions
        this.setupCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Start game loop
        this.startGameLoop();
        
        console.log("Game initialized successfully!");
    },
    
    setupCanvas() {
        // Set canvas dimensions
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Set up coordinate system (screen to game world)
        this.ctx.translate(0, 0); // No translation for now, 1:1 mapping
        
        console.log(`Canvas set up: ${this.width}x${this.height}`);
    },
    
    handleResize() {
        // Keep canvas centered and responsive
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit container while maintaining aspect ratio
        const scaleX = containerWidth / this.width;
        const scaleY = containerHeight / this.height;
        const scale = Math.min(scaleX, scaleY) * 0.95; // 95% to leave some margin
        
        this.canvas.style.transform = `scale(${scale})`;
        
        console.log(`Canvas resized with scale: ${scale}`);
    },
    
    startGameLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    },
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Update game state
        this.update(deltaTime);
        
        // Handle auto-save
        this.handleAutoSave(currentTime);
        
        // Render frame
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    },
    
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.fpsUpdateTime >= 1000) { // Update every second
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }
    },
    
    update(deltaTime) {
        // Update game state
        if (this.gameState && this.gameState.initialized) {
            this.gameState.update(deltaTime);
        }
    },
    
    handleAutoSave(currentTime) {
        if (currentTime - this.lastAutoSave >= this.autoSaveInterval) {
            StorageManager.saveGame(this.gameState);
            this.lastAutoSave = currentTime;
        }
    },
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#90ee90';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render game state if available
        if (this.gameState && this.gameState.initialized) {
            this.renderGameState();
        } else {
            this.renderLoadingScreen();
        }
        
        // Draw FPS counter for debugging
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    },
    
    renderGameState() {
        const gs = this.gameState;
        
        // Title
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Solar Microgrid Management Game', this.width / 2, 50);
        
        // Game stats display
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        
        // Money and time
        this.ctx.fillText(`Money: $${gs.money.toFixed(0)}`, 20, 100);
        this.ctx.fillText(`Time: ${gs.time.toFixed(1)} hours`, 20, 120);
        
        // Energy system stats
        this.ctx.fillText('=== Energy System ===', 20, 150);
        this.ctx.fillText(`Generation: ${gs.energy.generation.toFixed(2)} kW`, 20, 170);
        this.ctx.fillText(`Consumption: ${gs.energy.consumption.toFixed(2)} kW`, 20, 190);
        this.ctx.fillText(`Storage: ${gs.energy.storage.toFixed(1)}/${gs.batteries[0]?.capacity || 0} kWh`, 20, 210);
        this.ctx.fillText(`Surplus: ${gs.energy.surplus.toFixed(2)} kW`, 20, 230);
        
        // Equipment counts
        this.ctx.fillText('=== Equipment ===', 20, 260);
        this.ctx.fillText(`Solar Panels: ${gs.solarPanels.length}`, 20, 280);
        this.ctx.fillText(`Batteries: ${gs.batteries.length}`, 20, 300);
        this.ctx.fillText(`Households: ${gs.households.length}`, 20, 320);
        
        // Weather
        this.ctx.fillText('=== Weather ===', 20, 350);
        this.ctx.fillText(`Cloud Cover: ${(gs.weather.cloudCover * 100).toFixed(0)}%`, 20, 370);
        this.ctx.fillText(`Solar Intensity: ${(gs.getSolarIntensity() * 100).toFixed(0)}%`, 20, 390);
        
        // Active Events
        this.ctx.fillText('=== Active Events ===', 20, 420);
        if (gs.eventSystem) {
            const activeEvents = gs.eventSystem.getActiveEvents();
            if (activeEvents.length === 0) {
                this.ctx.fillText('No active events', 20, 440);
            } else {
                activeEvents.slice(0, 3).forEach((event, index) => {
                    const y = 440 + index * 20;
                    this.ctx.fillText(`${event.name}: ${event.timeRemaining.toFixed(1)}h`, 20, y);
                });
            }
        }
        
        // Simple visualization placeholder
        this.ctx.fillStyle = '#4a4a4a';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('(Visual game world will be implemented in T009)', this.width / 2, this.height - 120);
        this.ctx.fillText('Game state system active and updating!', this.width / 2, this.height - 100);
        this.ctx.fillText('Crisis events now triggering automatically!', this.width / 2, this.height - 80);
    },
    
    renderLoadingScreen() {
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Game State...', this.width / 2, this.height / 2);
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
