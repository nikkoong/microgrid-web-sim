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
    
    init() {
        console.log("Initializing game...");
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
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
        // Game logic updates will go here
        // For now, just a placeholder
    },
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#90ee90';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw FPS counter for debugging
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 25);
        
        // Temporary text to show the game is running
        this.ctx.fillStyle = '#2b2b2b';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Solar Microgrid Management Game', this.width / 2, this.height / 2);
        this.ctx.fillText('Game Loop Active', this.width / 2, this.height / 2 + 40);
        this.ctx.textAlign = 'left'; // Reset alignment
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
