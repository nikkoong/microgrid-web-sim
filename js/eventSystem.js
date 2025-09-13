// Crisis Event System

class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventQueue = [];
        this.activeEvents = [];
        this.eventHistory = [];
        this.nextEventTime = 0;
        
        // Event types configuration
        this.eventTypes = {
            weatherChange: {
                name: "Weather Change",
                probability: 0.3,
                create: () => this.createWeatherEvent()
            },
            equipmentFailure: {
                name: "Equipment Failure", 
                probability: 0.1,
                create: () => this.createEquipmentFailureEvent()
            },
            demandSpike: {
                name: "Demand Spike",
                probability: 0.2,
                create: () => this.createDemandSpikeEvent()
            }
        };
        
        this.scheduleNextEvent();
    }
    
    update(deltaTime) {
        // Check for scheduled events
        if (this.gameState.time >= this.nextEventTime) {
            this.triggerRandomEvent();
            this.scheduleNextEvent();
        }
        
        // Update active events
        this.updateActiveEvents(deltaTime);
    }
    
    scheduleNextEvent() {
        // Schedule next event 0.5 to 2 hours from now
        const delay = 0.5 + Math.random() * 1.5;
        this.nextEventTime = this.gameState.time + delay;
    }
    
    triggerRandomEvent() {
        // Select random event type based on probabilities
        const eventTypeNames = Object.keys(this.eventTypes);
        const randomValue = Math.random();
        let cumulativeProbability = 0;
        
        for (const typeName of eventTypeNames) {
            const eventType = this.eventTypes[typeName];
            cumulativeProbability += eventType.probability;
            
            if (randomValue <= cumulativeProbability) {
                const event = eventType.create();
                if (event) {
                    this.triggerEvent(event);
                }
                break;
            }
        }
    }
    
    triggerEvent(event) {
        console.log(`Event triggered: ${event.name}`);
        
        // Add to active events
        this.activeEvents.push(event);
        
        // Execute event effects immediately
        if (event.execute) {
            event.execute(this.gameState);
        }
        
        // Add to history
        this.eventHistory.push({
            ...event,
            triggerTime: this.gameState.time
        });
        
        // Notify UI (will be implemented in T008)
        this.notifyUI(event);
    }
    
    updateActiveEvents(deltaTime) {
        this.activeEvents = this.activeEvents.filter(event => {
            // Update event duration
            event.duration -= deltaTime / 3600; // Convert to hours
            
            // Remove expired events
            if (event.duration <= 0) {
                if (event.onComplete) {
                    event.onComplete(this.gameState);
                }
                console.log(`Event completed: ${event.name}`);
                return false;
            }
            
            // Update ongoing effects
            if (event.updateEffect) {
                event.updateEffect(this.gameState, deltaTime);
            }
            
            return true;
        });
    }
    
    createWeatherEvent() {
        const weatherEvents = [
            {
                name: "Sudden Cloud Cover",
                description: "Clouds are rolling in, reducing solar generation by 60%",
                duration: 0.5 + Math.random() * 0.5, // 30-60 minutes
                severity: "medium",
                execute: (gameState) => {
                    gameState.weather.cloudCover = 0.6;
                    gameState.weather.intensity = 0.4;
                }
            },
            {
                name: "Storm Approaching",
                description: "A storm is coming! Solar generation will drop to 10%",
                duration: 0.3 + Math.random() * 0.2, // 18-30 minutes
                severity: "high",
                execute: (gameState) => {
                    gameState.weather.cloudCover = 0.9;
                    gameState.weather.intensity = 0.1;
                }
            },
            {
                name: "Clear Skies",
                description: "Weather clearing up, solar generation returning to normal",
                duration: 1.0 + Math.random() * 1.0, // 1-2 hours
                severity: "low",
                execute: (gameState) => {
                    gameState.weather.cloudCover = 0.1;
                    gameState.weather.intensity = 1.0;
                }
            }
        ];
        
        return weatherEvents[Math.floor(Math.random() * weatherEvents.length)];
    }
    
    createEquipmentFailureEvent() {
        if (this.gameState.solarPanels.length === 0) return null;
        
        const failedPanel = this.gameState.solarPanels[Math.floor(Math.random() * this.gameState.solarPanels.length)];
        
        return {
            name: "Solar Panel Malfunction",
            description: `Solar panel ${failedPanel.id} is malfunctioning! Output reduced to 20%`,
            duration: 0.5 + Math.random() * 1.0, // 30-90 minutes
            severity: "medium",
            affectedEquipment: failedPanel.id,
            originalEfficiency: failedPanel.efficiency,
            execute: (gameState) => {
                failedPanel.efficiency *= 0.2; // Reduce to 20% efficiency
            },
            onComplete: (gameState) => {
                failedPanel.efficiency = this.originalEfficiency; // Restore efficiency
            }
        };
    }
    
    createDemandSpikeEvent() {
        if (this.gameState.households.length === 0) return null;
        
        const household = this.gameState.households[Math.floor(Math.random() * this.gameState.households.length)];
        const spikeReasons = [
            "heating system working overtime",
            "electric vehicle charging", 
            "running multiple appliances",
            "hot water heater malfunction"
        ];
        
        const reason = spikeReasons[Math.floor(Math.random() * spikeReasons.length)];
        const spikeMultiplier = 2.0 + Math.random() * 1.5; // 2x to 3.5x normal load
        
        return {
            name: "High Energy Demand",
            description: `${household.id} has increased demand due to ${reason}`,
            duration: 0.25 + Math.random() * 0.5, // 15-45 minutes
            severity: "medium",
            affectedHousehold: household.id,
            originalBaseLoad: household.baseLoad,
            spikeMultiplier: spikeMultiplier,
            execute: (gameState) => {
                household.baseLoad *= spikeMultiplier;
            },
            onComplete: (gameState) => {
                household.baseLoad = this.originalBaseLoad; // Restore normal load
            }
        };
    }
    
    notifyUI(event) {
        // This will be implemented when UI system is ready (T008)
        console.log(`UI Notification: ${event.description}`);
    }
    
    // Get current active events for UI display
    getActiveEvents() {
        return this.activeEvents.map(event => ({
            name: event.name,
            description: event.description,
            severity: event.severity,
            timeRemaining: event.duration
        }));
    }
    
    // Get recent event history for UI
    getRecentEvents(count = 5) {
        return this.eventHistory.slice(-count);
    }
}

// Export for use in gameState.js
window.EventSystem = EventSystem;
