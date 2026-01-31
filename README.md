# Solar Microgrid Management Game - Quick Start

## What's New

**Phase 1 & 2 Complete!** The game now includes all core systems and interactive UI:

### ✅ Implemented Features:

**Phase 1 (T001-T007)** - Complete:
- Game engine with canvas rendering
- Energy system (solar panels, batteries, consumption)
- Weather system with forecasting
- Crisis event system
- Save/load functionality

**Phase 2 (T008-T011)** - Complete:
- **Interactive UI Framework** (T008)
  - Pokemon-style buttons, panels, dialogs
  - Typewriter text effects
  - Mouse click/hover interactions
  
- **Visual Rendering** (T009)
  - Procedural sprite rendering (cabins, solar panels, batteries)
  - Particle system for energy flow visualization
  - Grid-based world with weather effects
  
- **Economic System** (T010)
  - Equipment shop with 3 tiers of each type
  - Money tracking and purchasing
  - Equipment cost structures
  
- **Tutorial System** (T011)
  - Welcome dialog with instructions
  - On-screen guidance

## How to Play

### Starting the Game

```bash
# Option 1: Python server
python -m http.server 8000

# Option 2: Node server
npx http-server -p 8000

# Option 3: Use VS Code Live Server extension
```

Then open: `http://localhost:8000`

### Basic Controls

1. **Welcome Dialog** - Click "Start Game!" to begin
2. **Open Shop** - Click the green money button (top-right, shows your current balance)
3. **Purchase Equipment** - In the shop menu, select:
   - Solar Panels (Tier 1-3)
   - Batteries (Tier 1-3)
   - Households (Basic Cabin, Family Home, Business)
4. **Monitor Energy** - Watch the three energy bars:
   - Blue: Generation (solar output)
   - Green: Storage (battery charge)
   - Red: Consumption (household demand)
5. **Save/Load** - Use Save and Load buttons to persist your game
6. **Weather Events** - Watch for storm clouds affecting solar output
7. **Crisis Events** - Equipment failures and demand spikes will appear as notifications

### Game Mechanics

- **Energy Balance**: Keep generation ≥ consumption to prevent blackouts
- **Battery Storage**: Excess energy charges batteries; deficits discharge them
- **Weather**: Clouds reduce solar generation (0-100%)
- **Time**: Day/night cycle affects solar output (6AM-6PM)
- **Crisis Events**: Random events require quick action
- **Money**: Earn money by managing successful grids; spend on upgrades

### Tips

- Start with one solar panel and battery
- Add households gradually as you expand
- Watch the weather forecast and prepare for storms
- Keep battery charge above 50% for emergencies
- Higher tier equipment is more efficient but expensive

## Technical Features

### Architecture

- **Pure JavaScript**: No frameworks, no build tools
- **Canvas Rendering**: HTML5 Canvas with procedural graphics
- **State Management**: Centralized GameState with localStorage persistence
- **Event System**: Flexible crisis event framework
- **UI Framework**: Pokemon-style component system
- **Particle System**: Animated energy flow visualization

### File Structure

```
/
├── index.html              # Game entry point
├── js/
│   ├── gameState.js        # Core game state and storage
│   ├── eventSystem.js      # Crisis event management
│   ├── uiFramework.js      # UI components (Button, Panel, Dialog, etc.)
│   ├── visualRenderer.js   # World rendering and particles
│   ├── economicSystem.js   # Shop and purchasing system
│   └── main.js            # Game loop and main controller
├── styles/
│   └── main.css           # Game styles
├── AGENTS.md              # Development guide for AI agents
├── tasks.md               # Task breakdown (T001-T011 complete)
└── PRD.md                 # Product requirements document
```

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Requires: ES6+ support (Canvas API, arrow functions, classes)

## Debugging

Open browser console (F12) to:

```javascript
// Check game state
console.log(Game.gameState);

// Test weather change
Game.gameState.triggerWeatherChange();

// Force event trigger
Game.gameState.eventSystem.triggerRandomEvent();

// Manually save
StorageManager.saveGame(Game.gameState);

// View localStorage
localStorage.getItem('microgrid_game_save');
```

## Performance

- Target: 60 FPS
- Monitor FPS counter (top-left of canvas)
- Supports up to 20 households, 20 solar panels, 10 batteries

## Known Limitations

- No mobile touch optimization yet
- Equipment positioning is automatic (random placement)
- Income generation is not fully implemented (planned for T020)
- Advanced equipment interactions coming in Phase 3

## Next Steps (Phase 3)

Tasks T012-T016 will add:
- Multi-crisis management
- Power line infrastructure
- Household expansion with diverse types
- Seasonal weather patterns
- Enhanced visual effects

## Support

For issues or questions:
1. Check the browser console for errors
2. Review tasks.md for implementation status
3. Read AGENTS.md for development guidelines

---

**Version**: 1.2.0  
**Status**: Phase 2 Complete (T001-T011)  
**Last Updated**: 2026-01-29
