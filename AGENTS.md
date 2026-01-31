# AGENTS.md - Development Guide for AI Coding Agents

This guide provides essential information for AI coding agents working on the Solar Microgrid Management Game.

## Project Overview

A browser-based educational game teaching renewable energy principles through crisis-driven microgrid management. Built with vanilla HTML5, CSS3, and JavaScript (no frameworks or build tools). Players manage solar panels, batteries, and household energy demands while responding to weather events and equipment failures.

**Current Status**: Phase 1 complete (T001-T007). Core foundation, energy system, weather, and crisis events implemented. Next phase focuses on UI framework and visual rendering (T008-T011).

## Build/Run/Test Commands

### Running the Game
```bash
# Option 1: Using Python's built-in server
python -m http.server 8000

# Option 2: Using Node's http-server (if installed globally)
npx http-server -p 8000

# Option 3: Use any IDE with Live Server extension
# VS Code: Right-click index.html → "Open with Live Server"
```

Then navigate to `http://localhost:8000` in your browser.

### Testing
- **No automated tests**: This project uses manual testing via browser console
- Open browser DevTools (F12) to monitor console logs
- Test state with: `console.log(Game.gameState)`
- Test localStorage: `localStorage.getItem('microgrid_game_save')`
- Monitor performance: Check FPS counter on canvas (top-left)

### Linting/Formatting
- **No linter configured**: Follow code style guidelines below
- Use browser's built-in syntax checking (errors appear in console)
- Validate HTML: Use W3C validator or IDE built-in validation

### Running Single Test Scenarios
Since there are no unit tests, test individual features manually:
```javascript
// In browser console, test specific game systems:
Game.gameState.triggerWeatherChange();
Game.gameState.eventSystem.triggerRandomEvent();
StorageManager.saveGame(Game.gameState);
```

## Code Style Guidelines

### File Organization
```
/
├── index.html          # Single HTML entry point
├── js/
│   ├── main.js         # Game initialization and render loop
│   ├── gameState.js    # State management and persistence
│   └── eventSystem.js  # Crisis event system
├── styles/
│   └── main.css        # All styles in single file
└── assets/             # Images, sprites (when added)
```

### JavaScript Style

#### Naming Conventions
- **Classes**: PascalCase (`GameState`, `EventSystem`, `StorageManager`)
- **Variables/Functions**: camelCase (`gameState`, `updateWeather`, `calculateSolarGeneration`)
- **Constants**: UPPER_SNAKE_CASE as static class properties (`StorageManager.SAVE_KEY`)
- **Private methods**: No special prefix (use naming to indicate intent)
- **IDs**: snake_case for game entity IDs (`'solar_01'`, `'cabin_01'`)

#### Class Structure
```javascript
// Use ES6 classes with clear constructor initialization
class GameState {
    constructor() {
        // Initialize all properties in constructor
        this.version = "1.0.0";
        this.initialized = false;
        this.property = value;
    }
    
    // Public methods
    initialize() {
        // Implementation
    }
    
    // Helper methods
    validateState() {
        // Implementation
    }
}

// Export to window for cross-file access
window.GameState = GameState;
```

#### Variables and Data Structures
- Use `const` by default, `let` when reassignment needed
- Never use `var`
- Prefer object literals with clear structure:
  ```javascript
  this.weather = {
      cloudCover: 0.0,
      intensity: 1.0,
      forecast: [],
      transitionSpeed: 0.1,
      nextWeatherChange: 0
  };
  ```

#### Array Methods
- Prefer modern array methods over loops:
  ```javascript
  // Good
  this.solarPanels.forEach(panel => { /* ... */ });
  this.activeEvents = this.activeEvents.filter(event => event.duration > 0);
  
  // Avoid
  for (let i = 0; i < this.solarPanels.length; i++) { /* ... */ }
  ```

#### Functions and Methods
- Use arrow functions for callbacks and inline functions
- Use regular methods for class methods
- Keep functions focused and single-purpose
- Extract complex logic into helper methods

### Comments and Documentation

#### Inline Comments
- Add comments for complex logic or non-obvious calculations
- Explain the "why", not the "what"
- Use comments to mark future work:
  ```javascript
  // This will be implemented when UI system is ready (T008)
  // TODO: Implement migration logic here
  ```

#### File Headers
```javascript
// [Descriptive File Purpose]
// Example: "Crisis Event System"
```

#### Method Documentation
```javascript
// Update game state (called each frame)
update(deltaTime) {
    // Implementation
}
```

### Error Handling

#### Console Logging
Use console methods extensively for debugging:
```javascript
console.log("Initializing game state...");
console.log("Game state initialized successfully");
console.warn(`Save version mismatch: ${saveData.version} vs ${gameState.version}`);
console.error("Game state validation failed!");
```

#### Validation Patterns
```javascript
// Early returns for invalid states
if (!this.initialized) return;

// Validation with clear error messages
validateState() {
    if (!Array.isArray(this.solarPanels)) return false;
    if (typeof this.money !== 'number') return false;
    if (this.money < 0) return false;
    
    console.log("Game state validation passed");
    return true;
}
```

#### Try-Catch for External Operations
```javascript
// Use try-catch for localStorage and other external operations
try {
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
    console.log("Game saved successfully");
    return true;
} catch (error) {
    console.error("Failed to save game:", error);
    return false;
}
```

### State Management Patterns

#### Single Source of Truth
- All game state lives in `GameState` instance
- Access via `Game.gameState` from main loop
- No global state outside of window exports

#### State Updates
```javascript
// Update methods receive deltaTime in seconds
update(deltaTime) {
    this.time += deltaTime / 3600; // Convert seconds to hours
    this.updateWeather(deltaTime);
    this.updateEnergySystem(deltaTime);
}
```

#### State Persistence
```javascript
// Use StorageManager for all localStorage operations
StorageManager.saveGame(gameState);
StorageManager.loadGame(gameState);
StorageManager.hasExistingSave();
```

### Canvas Rendering

#### Rendering Pattern
```javascript
render() {
    // 1. Clear canvas
    this.ctx.fillStyle = '#90ee90';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 2. Render game elements
    this.renderGameState();
    
    // 3. Debug overlays last
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
}
```

#### Canvas Context Usage
- Store context as `this.ctx`
- Set styles before drawing: `fillStyle`, `font`, `textAlign`
- Use `save()`/`restore()` for temporary transformations (future use)

## Architecture Patterns

### Cross-File Communication
Files communicate through `window` exports:
```javascript
// In gameState.js
window.GameState = GameState;
window.StorageManager = StorageManager;

// In eventSystem.js
window.EventSystem = EventSystem;

// In main.js
const Game = {
    gameState: new GameState(),  // Uses window.GameState
    // ...
};
```

### Event System Design
- Events are objects with properties: `name`, `description`, `duration`, `severity`
- Events have lifecycle hooks: `execute()`, `updateEffect()`, `onComplete()`
- Events modify game state directly via passed `gameState` reference

### Class Dependencies
- `GameState` initializes `EventSystem` after construction
- Pass dependencies via constructor: `new EventSystem(gameState)`
- Store references for later use: `this.gameState = gameState`

### Game Loop Pattern
```javascript
gameLoop(currentTime) {
    // 1. Calculate delta time
    const deltaTime = (currentTime - this.lastTime) / 1000;
    
    // 2. Update game state
    this.update(deltaTime);
    
    // 3. Render frame
    this.render();
    
    // 4. Continue loop
    requestAnimationFrame((time) => this.gameLoop(time));
}
```

## Development Workflow

### Git Conventions
- Make meaningful commits per subtask (reference tasks.md)
- Commit messages: Use present tense, be descriptive
- Example: "Implement weather system with forecast mechanics (T006.2)"

### Adding New Features
1. Reference task number from tasks.md (e.g., T008, T009)
2. Create necessary classes in separate files if substantial
3. Export via `window.[ClassName]`
4. Test in browser console before integrating
5. Update this AGENTS.md if architectural patterns change

### Debugging Workflow
1. Check browser console for errors/logs
2. Inspect `Game.gameState` object in console
3. Verify localStorage: `localStorage.getItem('microgrid_game_save')`
4. Use breakpoints in browser DevTools
5. Add temporary console.log statements liberally

### Performance Considerations
- Monitor FPS counter (visible on canvas)
- Target 60 FPS even with many entities
- Use object pooling for particles (future: T016, T023)
- Avoid creating objects in render loop

## Key Files Reference

- **index.html**: Canvas setup, script loading order matters
- **js/main.js**: Game singleton, game loop, rendering coordinator
- **js/gameState.js**: Core game state, energy system, weather, StorageManager
- **js/eventSystem.js**: Crisis events, event scheduling, event lifecycle
- **styles/main.css**: Pokemon-inspired UI styles, canvas styling
- **tasks.md**: Complete task breakdown and dependencies
- **PRD.md**: Product requirements and game design

## Common Patterns to Follow

### Creating Game Entities
```javascript
// Store entities in arrays with object literals
this.solarPanels.push({
    id: 'solar_01',
    capacity: 5,
    efficiency: 0.85,
    x: 200,
    y: 150,
    degradation: 1.0
});
```

### Time-Based Updates
```javascript
// Always use deltaTime for frame-independent updates
const hoursElapsed = deltaTime / 3600;
this.time += hoursElapsed;
```

### Random Events
```javascript
// Use Math.random() for variability
const delay = 0.5 + Math.random() * 1.5;  // 0.5 to 2.0 hours
const choice = array[Math.floor(Math.random() * array.length)];
```

## Important Notes

- **No TypeScript**: This is vanilla JavaScript, no type annotations
- **No React/Vue/Angular**: Pure DOM manipulation and Canvas API
- **No npm packages**: Everything is implemented from scratch
- **Pokemon-style UI**: Visual design should match Pokemon game aesthetics
- **Educational focus**: Code should teach renewable energy concepts clearly
- **Browser compatibility**: Target modern browsers (ES6+ support required)

## When You Get Stuck

1. Check tasks.md for context on current and upcoming features
2. Review PRD.md for game design intent
3. Look at existing similar code (e.g., another system) for patterns
4. Test incrementally in browser console
5. Console.log extensively to understand state flow
