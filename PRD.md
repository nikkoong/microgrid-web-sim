# Solar Microgrid Management Game - PRD

## Project Overview

A browser-based educational game that teaches renewable energy principles through crisis-driven microgrid management. Players start with a basic solar setup for a single cabin and progressively expand to manage a complex microgrid of 20+ households, learning to balance energy generation, storage, and demand while handling real-time crises.

### Learning Objectives
- Understand basic principles of renewable energy and grid management
- Experience real-time supply-demand balancing challenges
- Learn about the trade-offs between growth, efficiency, and resilience in energy systems

### Core Game Loop
Crisis-driven gameplay where players react to multiple simultaneous emergencies (weather events, equipment failures, demand spikes) while managing long-term grid expansion and economic constraints.

## Core Requirements

### Functional Requirements
- Real-time energy flow simulation and visualization
- Weather-based solar generation variability
- Household-specific energy demand patterns and personalities
- Economic progression system tied to grid expansion
- Crisis event system with escalating complexity
- Equipment upgrade and purchasing system

### Non-Functional Requirements
- Browser-based gameplay (HTML5/JavaScript)
- Pokemon-inspired art style and UI design
- Responsive controls suitable for crisis management
- Educational content integrated naturally into gameplay
- Scalable difficulty from 1 to 20+ households

## Core Features

### 1. Energy System Management
- **Solar Generation**: 3-tier solar panels with varying efficiency and capacity
- **Battery Storage**: Capacity management with charge/discharge visualization
- **Power Distribution**: Grid infrastructure with bottleneck management
- **Real-time Monitoring**: Live energy flow visualization with animated particles

### 2. Crisis Management System
- **Weather Events**: Storms, clouds, seasonal variations affecting solar output
- **Equipment Failures**: Random component breakdowns requiring immediate response
- **Demand Spikes**: Unexpected high-energy usage from households
- **Multiple Simultaneous Alerts**: Overcooked-style concurrent crisis handling
- **Cascading Effects**: Problems that can spread if not addressed quickly

### 3. Household Management
- **Distinct Personalities**: Each household has unique energy priorities and patterns
- **Cooperative Interaction**: Households respond to player requests for load reduction
- **Energy Profiles**: Different consumption patterns (families, elderly, work-from-home)
- **Direct Controls**: UI buttons for power allocation and demand management

### 4. Progression System
- **Economic Growth**: Tax base increases with household count
- **Technology Unlocks**: Better equipment becomes available through progression
- **Grid Expansion**: New households unlock automatically with increased capacity
- **Difficulty Scaling**: Exponential complexity increase beyond 20 households

## Core Components

### 1. Game Engine
- Real-time simulation engine for energy flows
- Event system for crisis management
- Economic calculation system
- Save/load functionality

### 2. Visual Systems
- Pokemon-style 2D art and animations
- Particle system for energy flow visualization
- Weather effects overlays
- UI dialog boxes and control panels

### 3. Data Management
- Household profile system
- Equipment catalog and upgrade trees
- Crisis scenario database
- Player progress tracking

### 4. AI/Logic Systems
- Weather pattern generation
- Crisis event scheduling
- Household behavior simulation
- Economic balancing algorithms

## App/User Flow

### Initial Setup
1. Player starts with single cabin and basic solar/battery setup
2. Tutorial introduces energy flow visualization and basic controls
3. First simple crisis (cloud cover) teaches crisis response

### Early Game (1-5 households)
1. Player manages basic supply/demand balancing
2. Earns money through successful crisis management
3. Purchases equipment upgrades or adds households
4. Learns household personalities and energy patterns

### Mid Game (5-20 households)
1. Multiple crisis types introduced gradually
2. Infrastructure bottlenecks require power line upgrades
3. Economic decisions become more strategic
4. Seasonal patterns teach planning ahead

### Late Game (20+ households)
1. Multiple simultaneous crises create "Overcooked chaos"
2. Cascading failures test system resilience
3. Complex load balancing across diverse household types
4. Master-level crisis choreography and management

### Game Loop
1. **Monitoring Phase**: Watch energy flows, check forecasts
2. **Crisis Alert**: Multiple simultaneous problems arise
3. **Decision Phase**: Prioritize and allocate resources quickly
4. **Execution Phase**: Send commands to households and equipment
5. **Resolution Phase**: Handle consequences and prepare for next crisis

## Tech Stack

### Frontend
- **Game Engine**: HTML5 Canvas with vanilla JavaScript
- **Framework**: No framework - pure HTML, CSS, and JavaScript
- **Styling**: CSS3 with animations, Pokemon-inspired design system
- **Assets**: Simple image files and basic audio (no complex bundling)

### Backend
- **Storage**: Browser localStorage for game saves and progress
- **Hosting**: Static file hosting (GitHub Pages, Netlify, or simple web server)
- **No server required**: Pure client-side application

### Development Tools
- **Version Control**: Git with GitHub
- **Development**: Live Server extension for local development
- **Testing**: Manual testing and simple console logging
- **Deployment**: Direct file upload or git-based static hosting

## Implementation Plan

### Phase 1: Core Foundation (4-6 weeks)
- Set up basic HTML structure and canvas element
- Implement energy simulation engine in vanilla JavaScript
- Create basic solar panel and battery systems
- Build particle-based energy flow visualization with canvas
- Design Pokemon-style UI with pure CSS and HTML

### Phase 2: Basic Gameplay (4-6 weeks)
- Implement household system with JavaScript objects and arrays
- Create weather system affecting solar generation
- Build crisis event system with simple scenarios
- Add economic progression using localStorage for persistence
- Develop tutorial and first 5 household scenarios

### Phase 3: Crisis Complexity (4-6 weeks)
- Implement multiple simultaneous crisis handling
- Add infrastructure bottleneck systems
- Create cascading failure mechanics
- Build seasonal weather patterns
- Expand to 10-15 household scenarios

### Phase 4: Advanced Features (4-6 weeks)
- Implement 20+ household complexity
- Add advanced equipment tiers and upgrade paths
- Create master-level crisis choreography
- Build simple analytics using browser console and localStorage
- Polish visual effects and animations

### Phase 5: Testing & Launch (2-4 weeks)
- Manual playtesting and balancing
- Performance optimization for canvas rendering
- Educational content validation
- Bug fixes and final polish
- Deploy to static hosting platform

### Success Metrics
- Player retention through different complexity levels
- Learning outcome assessment (pre/post knowledge tests)
- Crisis resolution success rates
- Player progression completion rates
- Community feedback and educational impact