// Crisis Event System

class EventSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.eventQueue = [];
        this.activeEvents = [];
        this.eventHistory = [];
        this.nextEventTime = 0;
        
        // Event types configuration with severity-based probabilities
        // Lower severity = higher probability (5-30% range)
        // High severity events: 5-10%
        // Medium severity events: 10-20%
        // Low severity events: 20-30%
        this.eventTypes = {
            weatherChange: {
                name: "Weather Change",
                probability: 0.23,  // Mixed severity, moderate probability
                create: () => this.createWeatherEvent()
            },
            equipmentFailure: {
                name: "Equipment Failure", 
                probability: 0.08,  // High severity - lower probability
                create: () => this.createEquipmentFailureEvent()
            },
            demandSpike: {
                name: "Demand Spike",
                probability: 0.14,  // Medium severity
                create: () => this.createDemandSpikeEvent()
            },
            batteryIssue: {
                name: "Battery Issue",
                probability: 0.12,  // Mixed severity
                create: () => this.createBatteryEvent()
            },
            gridBonus: {
                name: "Grid Bonus",
                probability: 0.10,  // Low severity (positive) - higher probability
                create: () => this.createGridBonusEvent()
            },
            householdEvent: {
                name: "Household Event",
                probability: 0.18,  // Medium severity
                create: () => this.createHouseholdEvent()
            },
            maintenanceEvent: {
                name: "Maintenance",
                probability: 0.14,  // Low severity
                create: () => this.createMaintenanceEvent()
            },
            specialEvent: {
                name: "Special Event",
                probability: 0.05,  // High severity - lowest probability
                create: () => this.createSpecialEvent()
            }
        };
        
        this.scheduleNextEvent();
    }
    
    // Check if an entity already has an active energy-modification event
    // Global events (no targetId) and instant bonus events are allowed to stack
    hasActiveEventOnEntity(entityId) {
        if (!entityId) return false;
        
        return this.activeEvents.some(event => {
            const eventTargetId = event.targetId || event.affectedEquipment || event.affectedHousehold;
            return eventTargetId === entityId;
        });
    }
    
    // Get entities that don't have active events
    getAvailableSolarPanels() {
        return this.gameState.solarPanels.filter(p => !this.hasActiveEventOnEntity(p.id));
    }
    
    getAvailableBatteries() {
        return this.gameState.batteries.filter(b => !this.hasActiveEventOnEntity(b.id));
    }
    
    getAvailableHouseholds() {
        return this.gameState.households.filter(h => !this.hasActiveEventOnEntity(h.id));
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
        // Early game (first 3 days / 72 hours): much less frequent events
        // Mid game (days 3-7): moderate frequency
        // Late game (after day 7): normal frequency
        const currentDay = this.gameState.time / 24;
        
        let minDelay, maxDelay;
        if (currentDay < 3) {
            // First 3 days: events every 8-16 hours (very rare)
            minDelay = 8;
            maxDelay = 16;
        } else if (currentDay < 7) {
            // Days 3-7: events every 4-8 hours (moderate)
            minDelay = 4;
            maxDelay = 8;
        } else {
            // After day 7: events every 2-5 hours (normal)
            minDelay = 2;
            maxDelay = 5;
        }
        
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
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
            // deltaTime is in seconds, and 1 sec = 1 game hour, so deltaTime IS in game hours
            event.duration -= deltaTime;
            
            // Remove expired events
            if (event.duration <= 0) {
                if (event.onComplete) {
                    event.onComplete(this.gameState);
                }
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
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "medium",
                execute: (gameState) => {
                    // Use targets for smooth transition
                    gameState.weather.targetCloudCover = 0.6;
                    gameState.weather.targetIntensity = 0.4;
                }
            },
            {
                name: "Storm Approaching",
                description: "A storm is coming! Solar generation will drop to 10%",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "high",
                execute: (gameState) => {
                    // Use targets for smooth transition
                    gameState.weather.targetCloudCover = 0.9;
                    gameState.weather.targetIntensity = 0.1;
                }
            },
            {
                name: "Clear Skies",
                description: "Weather clearing up, solar generation returning to normal",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "low",
                execute: (gameState) => {
                    // Use targets for smooth transition
                    gameState.weather.targetCloudCover = 0.1;
                    gameState.weather.targetIntensity = 1.0;
                }
            }
        ];
        
        return weatherEvents[Math.floor(Math.random() * weatherEvents.length)];
    }
    
    createEquipmentFailureEvent() {
        // Only target panels without active events AND not tier4 (WEATHERPROOF)
        const availablePanels = this.getAvailableSolarPanels().filter(p => p.tier !== 'tier4');
        if (availablePanels.length === 0) return null;
        
        const failedPanel = availablePanels[Math.floor(Math.random() * availablePanels.length)];
        const originalEfficiency = failedPanel.efficiency; // Capture in closure
        
        // Create event object first so we can reference it in callbacks
        const event = {
            name: "Solar Panel Malfunction",
            description: `${failedPanel.id} is malfunctioning! Output reduced to 20%`,
            duration: 12 + Math.random() * 24, // 12-36 hours
            severity: "medium",
            affectedEquipment: failedPanel.id,
            originalEfficiency: originalEfficiency,
            executed: false,
            execute: function(gameState) {
                // Only apply once - use function() so 'this' refers to event
                if (!this.executed) {
                    failedPanel.efficiency = originalEfficiency * 0.2; // Reduce to 20% of original
                    this.executed = true;
                }
            },
            onComplete: function(gameState) {
                failedPanel.efficiency = originalEfficiency; // Restore from captured value
            }
        };
        
        return event;
    }
    
    createDemandSpikeEvent() {
        // Only target households without active events
        const availableHouseholds = this.getAvailableHouseholds();
        if (availableHouseholds.length === 0) return null;
        
        const household = availableHouseholds[Math.floor(Math.random() * availableHouseholds.length)];
        const spikeReasons = [
            "heating system working overtime",
            "electric vehicle charging", 
            "running multiple appliances",
            "hot water heater malfunction"
        ];
        
        const reason = spikeReasons[Math.floor(Math.random() * spikeReasons.length)];
        const spikeMultiplier = 2.0 + Math.random() * 1.5; // 2x to 3.5x normal load
        
        const originalBaseLoad = household.baseLoad; // Capture in closure
        
        // Create event object first so we can reference it in callbacks
        const event = {
            name: "High Energy Demand",
            description: `${household.id} has increased demand due to ${reason}`,
            duration: 12 + Math.random() * 24, // 12-36 hours
            severity: "medium",
            affectedHousehold: household.id,
            targetId: household.id,
            originalBaseLoad: originalBaseLoad,
            spikeMultiplier: spikeMultiplier,
            executed: false, // Track if we've already applied the spike
            execute: function(gameState) {
                // Only apply spike once - use function() to access 'this' as event
                if (!this.executed) {
                    household.baseLoad = originalBaseLoad * spikeMultiplier;
                    this.executed = true;
                }
            },
            onComplete: function(gameState) {
                household.baseLoad = originalBaseLoad; // Restore to captured original value
            }
        };
        
        return event;
    }
    
    createBatteryEvent() {
        // Only target batteries without active events AND not tier4 (SELF-HEALING)
        const availableBatteries = this.getAvailableBatteries().filter(b => b.tier !== 'tier4');
        if (availableBatteries.length === 0) return null;
        
        const battery = availableBatteries[Math.floor(Math.random() * availableBatteries.length)];
        
        const batteryEvents = [
            {
                name: "Battery Overheating",
                description: `${battery.id} is overheating! Efficiency reduced by 30%`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "high",
                targetId: battery.id,
                originalEfficiency: battery.efficiency,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        battery.efficiency = this.originalEfficiency * 0.7;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    battery.efficiency = this.originalEfficiency;
                }
            },
            {
                name: "Battery Calibration",
                description: `${battery.id} is auto-calibrating. Charge/discharge paused.`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "medium",
                targetId: battery.id,
                originalEfficiency: battery.efficiency,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        battery.efficiency = 0; // Can't charge or discharge
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    battery.efficiency = this.originalEfficiency;
                }
            },
            {
                name: "Battery Surge",
                description: `${battery.id} received power surge! Gained 20% charge.`,
                duration: 0.1, // Instant bonus - stays short
                severity: "low",
                targetId: battery.id,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        battery.charge = Math.min(battery.capacity, battery.charge + battery.capacity * 0.2);
                        this.executed = true;
                    }
                }
            }
        ];
        
        return batteryEvents[Math.floor(Math.random() * batteryEvents.length)];
    }
    
    createGridBonusEvent() {
        const bonusEvents = [
            {
                name: "Peak Sun Hours",
                description: "Optimal sun angle! Solar generation +25%.",
                duration: 9 + Math.random() * 9, // 9-18 hours (status effect)
                severity: "medium",
                executed: false,
                originalIntensity: this.gameState.weather.intensity,
                execute: function(gameState) {
                    if (!this.executed) {
                        gameState.weather.intensity = Math.min(1.25, gameState.weather.intensity * 1.25);
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.weather.intensity = Math.max(0.1, gameState.weather.intensity / 1.25);
                }
            },
            {
                name: "Government Subsidy",
                description: "Energy subsidy received! +$100 bonus.",
                duration: 0.1, // Instant bonus - stays short
                severity: "low",
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        gameState.money += 100;
                        this.executed = true;
                    }
                }
            },
            {
                name: "Community Energy Award",
                description: "Your grid won an efficiency award! +$200 bonus.",
                duration: 0.1, // Instant bonus - stays short
                severity: "low",
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        gameState.money += 200;
                        this.executed = true;
                    }
                }
            }
        ];
        
        return bonusEvents[Math.floor(Math.random() * bonusEvents.length)];
    }
    
    createHouseholdEvent() {
        // Only target households without active events
        const availableHouseholds = this.getAvailableHouseholds();
        if (availableHouseholds.length === 0) return null;
        
        const household = availableHouseholds[Math.floor(Math.random() * availableHouseholds.length)];
        
        const householdEvents = [
            {
                name: "Vacation Mode",
                description: `${household.id} is on vacation! Power usage reduced 70%.`,
                duration: 12 + Math.random() * 48, // 12-60 hours
                severity: "low",
                targetId: household.id,
                affectedHousehold: household.id,
                originalBaseLoad: household.baseLoad,
                originalVariableLoad: household.variableLoad,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        household.baseLoad = this.originalBaseLoad * 0.3;
                        household.variableLoad = this.originalVariableLoad * 0.3;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    household.baseLoad = this.originalBaseLoad;
                    household.variableLoad = this.originalVariableLoad;
                }
            },
            {
                name: "Home Party",
                description: `${household.id} is hosting a party! Power usage +50%.`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "medium",
                targetId: household.id,
                affectedHousehold: household.id,
                originalBaseLoad: household.baseLoad,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        household.baseLoad = this.originalBaseLoad * 1.5;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    household.baseLoad = this.originalBaseLoad;
                }
            },
            {
                name: "Work From Home",
                description: `${household.id} working from home. Steady high usage.`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "medium",
                targetId: household.id,
                affectedHousehold: household.id,
                originalBaseLoad: household.baseLoad,
                originalVariableLoad: household.variableLoad,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        household.baseLoad = this.originalBaseLoad * 1.5;
                        household.variableLoad = 0.1; // Very consistent usage
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    household.baseLoad = this.originalBaseLoad;
                    household.variableLoad = this.originalVariableLoad;
                }
            },
            {
                name: "AC Breakdown",
                description: `${household.id}'s AC broke! Reduced power needs but lower satisfaction.`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "medium",
                targetId: household.id,
                affectedHousehold: household.id,
                originalBaseLoad: household.baseLoad,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        household.baseLoad = this.originalBaseLoad * 0.6;
                        household.satisfaction = Math.max(0.3, household.satisfaction - 0.4);
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    household.baseLoad = this.originalBaseLoad;
                    household.satisfaction = Math.min(1.0, household.satisfaction + 0.1);
                }
            }
        ];
        
        return householdEvents[Math.floor(Math.random() * householdEvents.length)];
    }
    
    createMaintenanceEvent() {
        // Can affect solar panels or batteries - only those without active events
        // Tier4 equipment is immune to maintenance events (they're self-maintaining)
        const availablePanels = this.getAvailableSolarPanels().filter(p => p.tier !== 'tier4');
        const availableBatteries = this.getAvailableBatteries().filter(b => b.tier !== 'tier4');
        
        // Decide which type based on availability
        const canTargetSolar = availablePanels.length > 0;
        const canTargetBattery = availableBatteries.length > 0;
        
        if (!canTargetSolar && !canTargetBattery) return null;
        
        let targetType;
        if (canTargetSolar && canTargetBattery) {
            targetType = Math.random() < 0.5 ? 'solar' : 'battery';
        } else {
            targetType = canTargetSolar ? 'solar' : 'battery';
        }
        
        if (targetType === 'solar') {
            const panel = availablePanels[Math.floor(Math.random() * availablePanels.length)];
            
            const maintenanceEvents = [
                {
                    name: "Panel Cleaning",
                    description: `${panel.id} being cleaned. Temporarily offline, then +10% efficiency!`,
                    duration: 9 + Math.random() * 9, // 9-18 hours
                    severity: "low",
                    targetId: panel.id,
                    affectedEquipment: panel.id,
                    originalEfficiency: panel.efficiency,
                    executed: false,
                    execute: function(gameState) {
                        if (!this.executed) {
                            panel.efficiency = 0;
                            this.executed = true;
                        }
                    },
                    onComplete: function(gameState) {
                        panel.efficiency = Math.min(1.0, this.originalEfficiency * 1.1);
                    }
                },
                {
                    name: "Inverter Check",
                    description: `${panel.id} inverter inspection. Output at 50%.`,
                    duration: 9 + Math.random() * 9, // 9-18 hours
                    severity: "low",
                    targetId: panel.id,
                    affectedEquipment: panel.id,
                    originalEfficiency: panel.efficiency,
                    executed: false,
                    execute: function(gameState) {
                        if (!this.executed) {
                            panel.efficiency = this.originalEfficiency * 0.5;
                            this.executed = true;
                        }
                    },
                    onComplete: function(gameState) {
                        panel.efficiency = this.originalEfficiency;
                    }
                }
            ];
            
            return maintenanceEvents[Math.floor(Math.random() * maintenanceEvents.length)];
        } else {
            const battery = availableBatteries[Math.floor(Math.random() * availableBatteries.length)];
            
            return {
                name: "Battery Maintenance",
                description: `${battery.id} scheduled maintenance. Offline briefly.`,
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "low",
                targetId: battery.id,
                originalEfficiency: battery.efficiency,
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        battery.efficiency = 0;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    battery.efficiency = this.originalEfficiency;
                }
            };
        }
    }
    
    createSpecialEvent() {
        const specialEvents = [
            {
                name: "Solar Eclipse",
                description: "A solar eclipse is occurring! Solar generation drops to 5%.",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "high",
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        gameState.weather.targetCloudCover = 0.95;
                        gameState.weather.targetIntensity = 0.05;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.weather.targetCloudCover = 0.2;
                    gameState.weather.targetIntensity = 1.0;
                }
            },
            {
                name: "Heat Wave",
                description: "Heat wave! All households using +40% power for cooling.",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "high",
                executed: false,
                originalLoads: [],
                execute: function(gameState) {
                    if (!this.executed) {
                        this.originalLoads = gameState.households.map(h => h.baseLoad);
                        gameState.households.forEach(h => {
                            h.baseLoad *= 1.4;
                        });
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.households.forEach((h, i) => {
                        if (this.originalLoads[i] !== undefined) {
                            h.baseLoad = this.originalLoads[i];
                        }
                    });
                }
            },
            {
                name: "Grid Instability",
                description: "Regional grid issues! All equipment at 70% efficiency.",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "high",
                executed: false,
                originalPanelEfficiencies: [],
                originalBatteryEfficiencies: [],
                execute: function(gameState) {
                    if (!this.executed) {
                        this.originalPanelEfficiencies = gameState.solarPanels.map(p => p.efficiency);
                        this.originalBatteryEfficiencies = gameState.batteries.map(b => b.efficiency);
                        gameState.solarPanels.forEach(p => p.efficiency *= 0.7);
                        gameState.batteries.forEach(b => b.efficiency *= 0.7);
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.solarPanels.forEach((p, i) => {
                        if (this.originalPanelEfficiencies[i] !== undefined) {
                            p.efficiency = this.originalPanelEfficiencies[i];
                        }
                    });
                    gameState.batteries.forEach((b, i) => {
                        if (this.originalBatteryEfficiencies[i] !== undefined) {
                            b.efficiency = this.originalBatteryEfficiencies[i];
                        }
                    });
                }
            },
            {
                name: "Perfect Day",
                description: "Perfect weather conditions! +30% solar for the next 2 hours.",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "low",
                executed: false,
                execute: function(gameState) {
                    if (!this.executed) {
                        gameState.weather.targetCloudCover = 0;
                        gameState.weather.targetIntensity = 1.3;
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.weather.targetIntensity = 1.0;
                }
            },
            {
                name: "Night Owl Hours",
                description: "Late night! Households using only 40% power.",
                duration: 9 + Math.random() * 9, // 9-18 hours
                severity: "low",
                executed: false,
                originalLoads: [],
                execute: function(gameState) {
                    if (!this.executed) {
                        this.originalLoads = gameState.households.map(h => h.baseLoad);
                        gameState.households.forEach(h => {
                            h.baseLoad *= 0.4;
                        });
                        this.executed = true;
                    }
                },
                onComplete: function(gameState) {
                    gameState.households.forEach((h, i) => {
                        if (this.originalLoads[i] !== undefined) {
                            h.baseLoad = this.originalLoads[i];
                        }
                    });
                }
            }
        ];
        
        return specialEvents[Math.floor(Math.random() * specialEvents.length)];
    }
    
    notifyUI(event) {
        // Add notification to the notification system via global Game object
        if (window.Game && window.Game.notificationSystem) {
            let severity = 'info';
            if (event.severity === 'high') {
                severity = 'error';
            } else if (event.severity === 'medium') {
                severity = 'warning';
            } else if (event.severity === 'low') {
                severity = 'success';
            }
            window.Game.notificationSystem.addNotification(`${event.name}: ${event.description}`, severity);
        }
    }
    
    // Get current active events for UI display
    getActiveEvents() {
        return this.activeEvents.map(event => ({
            name: event.name,
            description: event.description,
            severity: event.severity,
            timeRemaining: event.duration,
            targetId: event.targetId || event.affectedEquipment || event.affectedHousehold
        }));
    }
    
    // Get recent event history for UI
    getRecentEvents(count = 5) {
        return this.eventHistory.slice(-count);
    }
}

// Export for use in gameState.js
window.EventSystem = EventSystem;
