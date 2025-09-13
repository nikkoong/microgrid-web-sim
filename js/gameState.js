// Game State Management System

class GameState {
    constructor() {
        this.version = "1.0.0";
        this.initialized = false;
        this.money = 1000; // Starting money
        this.time = 0; // Game time in hours
        
        // Energy system state
        this.energy = {
            generation: 0, // Current solar generation in kW
            storage: 50,   // Current battery charge in kWh
            consumption: 0, // Current total consumption in kW
            surplus: 0,    // Current surplus/deficit
        };
        
        // Equipment arrays
        this.solarPanels = [];
        this.batteries = [];
        this.powerLines = [];
        
        // Household array
        this.households = [];
        
        // Weather state
        this.weather = {
            cloudCover: 0.0, // 0.0 = clear, 1.0 = completely cloudy
            intensity: 1.0,  // Solar intensity multiplier
            forecast: [],    // Weather forecast array
            transitionSpeed: 0.1, // How fast weather changes
            nextWeatherChange: 0 // When next weather change occurs
        };
        
        // Initialize weather forecast
        this.generateWeatherForecast();
        
        // Crisis/event state
        this.activeEvents = [];
        this.eventHistory = [];
        this.eventSystem = null; // Will be initialized after construction
    }
    
    initialize() {
        if (this.initialized) return;
        
        console.log("Initializing game state...");
        
        // Set up initial cabin and basic equipment
        this.setupInitialState();
        
        // Initialize event system
        this.eventSystem = new EventSystem(this);
        
        // Validate initial state
        if (this.validateState()) {
            this.initialized = true;
            console.log("Game state initialized successfully");
        } else {
            console.error("Game state validation failed!");
        }
    }
    
    setupInitialState() {
        // Add initial solar panel
        this.solarPanels.push({
            id: 'solar_01',
            capacity: 5, // 5kW capacity
            efficiency: 0.85, // 85% efficiency (Tier 1)
            x: 200,
            y: 150,
            degradation: 1.0 // No degradation initially
        });
        
        // Add initial battery
        this.batteries.push({
            id: 'battery_01',
            capacity: 10, // 10kWh capacity
            charge: 5,    // Start 50% charged
            efficiency: 0.90, // 90% charge/discharge efficiency
            x: 250,
            y: 200,
            degradation: 1.0
        });
        
        // Add initial cabin household
        this.households.push({
            id: 'cabin_01',
            type: 'cabin',
            baseLoad: 1.0,    // 1kW base load
            variableLoad: 0.5, // Up to 0.5kW variable load
            satisfaction: 1.0, // 100% satisfied
            x: 300,
            y: 150,
            personality: {
                cooperationLevel: 0.9, // 90% cooperative
                priority: 'comfort'     // Prioritizes comfort over savings
            }
        });
    }
    
    validateState() {
        // Basic validation checks
        if (!Array.isArray(this.solarPanels)) return false;
        if (!Array.isArray(this.batteries)) return false;
        if (!Array.isArray(this.households)) return false;
        if (typeof this.money !== 'number') return false;
        if (this.money < 0) return false;
        
        console.log("Game state validation passed");
        return true;
    }
    
    // Update game state (called each frame)
    update(deltaTime) {
        if (!this.initialized) return;
        
        this.time += deltaTime / 3600; // Convert seconds to hours
        
        // Update weather system
        this.updateWeather(deltaTime);
        
        // Update event system
        if (this.eventSystem) {
            this.eventSystem.update(deltaTime);
        }
        
        // Update energy calculations
        this.updateEnergySystem(deltaTime);
    }
    
    updateWeather(deltaTime) {
        // Check if it's time for weather change
        if (this.time >= this.weather.nextWeatherChange) {
            this.triggerWeatherChange();
        }
        
        // Update weather forecast
        this.updateWeatherForecast();
    }
    
    triggerWeatherChange() {
        // Simple weather state transitions
        const weatherStates = [
            { cloudCover: 0.0, intensity: 1.0, duration: 2.0 }, // Clear
            { cloudCover: 0.3, intensity: 0.8, duration: 1.5 }, // Light clouds
            { cloudCover: 0.7, intensity: 0.4, duration: 1.0 }, // Heavy clouds
            { cloudCover: 0.9, intensity: 0.1, duration: 0.5 }  // Storm
        ];
        
        const newWeather = weatherStates[Math.floor(Math.random() * weatherStates.length)];
        
        // Transition to new weather
        this.weather.cloudCover = newWeather.cloudCover;
        this.weather.intensity = newWeather.intensity;
        this.weather.nextWeatherChange = this.time + newWeather.duration + Math.random();
        
        console.log(`Weather changed: ${newWeather.cloudCover * 100}% clouds`);
    }
    
    generateWeatherForecast() {
        // Generate simple 2-hour forecast
        this.weather.forecast = [];
        let currentTime = this.time;
        
        for (let i = 0; i < 4; i++) { // 4 30-minute periods
            currentTime += 0.5;
            
            // Simple forecast with some accuracy variation
            const accuracy = 0.8 + Math.random() * 0.2; // 80-100% accuracy
            const forecastCloudCover = Math.random() * accuracy;
            
            this.weather.forecast.push({
                time: currentTime,
                cloudCover: forecastCloudCover,
                confidence: accuracy
            });
        }
    }
    
    updateWeatherForecast() {
        // Update forecast every game hour
        if (Math.floor(this.time) !== Math.floor(this.time - 0.016)) { // Roughly every hour
            this.generateWeatherForecast();
        }
    }
    
    updateEnergySystem(deltaTime) {
        // Calculate solar generation
        this.energy.generation = this.calculateSolarGeneration();
        
        // Calculate total consumption
        this.energy.consumption = this.calculateTotalConsumption();
        
        // Calculate surplus/deficit
        this.energy.surplus = this.energy.generation - this.energy.consumption;
        
        // Update battery charge based on surplus/deficit
        this.updateBatteryCharge(deltaTime);
    }
    
    calculateSolarGeneration() {
        let totalGeneration = 0;
        
        // Get current solar intensity (based on time of day and weather)
        const solarIntensity = this.getSolarIntensity();
        
        this.solarPanels.forEach(panel => {
            const generation = panel.capacity * panel.efficiency * panel.degradation * solarIntensity;
            totalGeneration += generation;
        });
        
        return totalGeneration;
    }
    
    calculateTotalConsumption() {
        let totalConsumption = 0;
        
        this.households.forEach(household => {
            // Simple consumption model - will be expanded later
            const consumption = household.baseLoad + (household.variableLoad * Math.random());
            totalConsumption += consumption;
        });
        
        return totalConsumption;
    }
    
    getSolarIntensity() {
        // Simple time-of-day solar curve (0-24 hours)
        const hour = this.time % 24;
        let intensity = 0;
        
        if (hour >= 6 && hour <= 18) {
            // Rough sine curve for daylight hours
            const dayProgress = (hour - 6) / 12; // 0 to 1 over day
            intensity = Math.sin(dayProgress * Math.PI); // Sine curve
        }
        
        // Apply weather effects
        intensity *= (1.0 - this.weather.cloudCover * 0.8); // Clouds reduce intensity
        intensity *= this.weather.intensity;
        
        return Math.max(0, intensity);
    }
    
    updateBatteryCharge(deltaTime) {
        if (this.batteries.length === 0) return;
        
        const battery = this.batteries[0]; // Use first battery for now
        const hoursElapsed = deltaTime / 3600;
        
        if (this.energy.surplus > 0) {
            // Charge battery with surplus
            const chargeAmount = Math.min(
                this.energy.surplus * hoursElapsed * battery.efficiency,
                battery.capacity - battery.charge
            );
            battery.charge += chargeAmount;
        } else if (this.energy.surplus < 0) {
            // Discharge battery to meet deficit
            const dischargeAmount = Math.min(
                Math.abs(this.energy.surplus) * hoursElapsed / battery.efficiency,
                battery.charge
            );
            battery.charge -= dischargeAmount;
        }
        
        // Update storage display value
        this.energy.storage = battery.charge;
    }
}

// Storage management for save/load
class StorageManager {
    static SAVE_KEY = 'microgrid_game_save';
    
    static saveGame(gameState) {
        try {
            const saveData = {
                version: gameState.version,
                timestamp: Date.now(),
                state: {
                    money: gameState.money,
                    time: gameState.time,
                    energy: { ...gameState.energy },
                    solarPanels: [...gameState.solarPanels],
                    batteries: [...gameState.batteries],
                    households: [...gameState.households],
                    weather: { ...gameState.weather }
                }
            };
            
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            console.log("Game saved successfully");
            return true;
        } catch (error) {
            console.error("Failed to save game:", error);
            return false;
        }
    }
    
    static loadGame(gameState) {
        try {
            const saveDataString = localStorage.getItem(this.SAVE_KEY);
            if (!saveDataString) {
                console.log("No save data found");
                return false;
            }
            
            const saveData = JSON.parse(saveDataString);
            
            // Version checking for future updates
            if (saveData.version !== gameState.version) {
                console.warn(`Save version mismatch: ${saveData.version} vs ${gameState.version}`);
                // Could implement migration logic here
            }
            
            // Load state data
            gameState.money = saveData.state.money;
            gameState.time = saveData.state.time;
            gameState.energy = saveData.state.energy;
            gameState.solarPanels = saveData.state.solarPanels;
            gameState.batteries = saveData.state.batteries;
            gameState.households = saveData.state.households;
            gameState.weather = saveData.state.weather;
            
            console.log("Game loaded successfully");
            return true;
        } catch (error) {
            console.error("Failed to load game:", error);
            return false;
        }
    }
    
    static hasExistingSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
    
    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("Save data deleted");
    }
}

// Export for use in main.js
window.GameState = GameState;
window.StorageManager = StorageManager;
