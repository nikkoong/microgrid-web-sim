// Game State Management System

class GameState {
    constructor() {
        this.version = "1.0.0";
        this.initialized = false;
        this.money = 1000; // Starting money
        this.time = 0; // Game time in hours
        this.lastIncomeTime = 0; // Track last time we earned money
        
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
            nextWeatherChange: 0, // When next weather change occurs
            targetCloudCover: 0.0, // Target cloudCover for smooth transitions
            targetIntensity: 1.0   // Target intensity for smooth transitions
        };
        
        // Initialize weather forecast
        this.generateWeatherForecast();
        
        // Crisis/event state
        this.activeEvents = [];
        this.eventHistory = [];
        this.eventSystem = null; // Will be initialized after construction
        
        // Goal/progression system
        this.goals = [
            { id: 1, description: 'Power 3 Basic Cabins with 75%+ satisfaction', target: 3, satisfactionThreshold: 0.75, requiredType: 'cabin', completed: false, unlocked: true },
            { id: 2, description: 'Research Advanced Cells (Solar tier 2)', researchGoal: 'solar_t2', completed: false, unlocked: false },
            { id: 3, description: 'Power 5 Family Homes with 80%+ satisfaction', target: 5, satisfactionThreshold: 0.80, requiredType: 'family', completed: false, unlocked: false },
            { id: 4, description: 'Research Deep-Cycle Packs (Battery tier 2) and power 3 homes above 80%', researchGoal: 'stor_t2', target: 3, satisfactionThreshold: 0.80, requiredType: 'any', completed: false, unlocked: false },
            { id: 5, description: 'Power 3 Small Businesses with 85%+ satisfaction', target: 3, satisfactionThreshold: 0.85, requiredType: 'business', completed: false, unlocked: false },
            { id: 6, description: 'Power 2 Corporate HQs and reach net-zero (surplus >= 0)', requireCorporate: 2, requireNetZero: true, completed: false, unlocked: false }
        ];
        this.currentGoalIndex = 0;
        this.gameWon = false;

        // Research Points currency
        this.researchPoints = 0;

        // Tech tree: each branch is a sequential node chain. unlocked=false except the first tier base.
        this.research = {
            solar: [
                { id: 'solar_t2', name: 'Advanced Cells', cost: 15, unlocked: false },
                { id: 'solar_t3', name: 'Premium Photovoltaic', cost: 45, unlocked: false },
                { id: 'solar_t4', name: 'Elite Array', cost: 110, unlocked: false }
            ],
            storage: [
                { id: 'stor_t2', name: 'Deep-Cycle Packs', cost: 12, unlocked: false },
                { id: 'stor_t3', name: 'High-Capacity Bank', cost: 40, unlocked: false },
                { id: 'stor_t4', name: 'Grid Core', cost: 100, unlocked: false }
            ],
            buildings: [
                { id: 'bld_family', name: 'Family Home', cost: 15, unlocked: false },
                { id: 'bld_business', name: 'Small Business', cost: 40, unlocked: false },
                { id: 'bld_corp', name: 'Corporate HQ', cost: 100, unlocked: false }
            ]
        };
    }
    
    initialize() {
        if (this.initialized) return;
        
        // Set up initial cabin and basic equipment
        this.setupInitialState();
        
        // Initialize event system
        this.eventSystem = new EventSystem(this);
        
        // Validate initial state
        if (this.validateState()) {
            this.initialized = true;
        }
    }
    
    setupInitialState() {
        // Add initial solar panel (tier 1)
        this.solarPanels.push({
            id: 'panel_01',
            capacity: 5, // 5kW capacity
            efficiency: 0.85, // 85% efficiency (Tier 1)
            x: 200,
            y: 150,
            degradation: 1.0,
            tier: 'tier1',
            cost: 500 // Store original cost for upgrade calculations
        });
        
        // Add initial battery (tier 1)
        this.batteries.push({
            id: 'battery_01',
            capacity: 10, // 10kWh capacity
            charge: 5,    // Start 50% charged
            efficiency: 0.90, // 90% charge/discharge efficiency
            x: 250,
            y: 200,
            degradation: 1.0,
            tier: 'tier1',
            cost: 400
        });
        
        // Add initial cabin household (basic)
        this.households.push({
            id: 'home_01',
            type: 'cabin',
            baseLoad: 1.0,    // 1kW base load
            variableLoad: 0.5, // Up to 0.5kW variable load
            satisfaction: 1.0, // 100% satisfied (0.0 to 1.0)
            poweredTime: 0,   // Time spent fully powered
            totalTime: 0,     // Total time tracked
            x: 300,
            y: 150,
            personality: {
                cooperationLevel: 0.9, // 90% cooperative
                priority: 'comfort'     // Prioritizes comfort over savings
            },
            tier: 'cabin',
            cost: 1000
        });
    }
    
    validateState() {
        // Basic validation checks
        if (!Array.isArray(this.solarPanels)) return false;
        if (!Array.isArray(this.batteries)) return false;
        if (!Array.isArray(this.households)) return false;
        if (typeof this.money !== 'number') return false;
        if (this.money < 0) return false;
        
        return true;
    }
    
    // Update game state (called each frame)
    update(deltaTime) {
        if (!this.initialized) return;
        
        // Speed up time for gameplay balance (1 real sec = 1 game hour)
        // Original: this.time += deltaTime / 3600; 
        this.time += deltaTime * 1.0; 
        
        // Update weather system
        this.updateWeather(deltaTime);
        
        // Update event system
        if (this.eventSystem) {
            this.eventSystem.update(deltaTime);
        }
        
        // Update energy calculations
        this.updateEnergySystem(deltaTime);
        
        // Generate income from households (every game hour = 1 real second)
        this.generateIncome(deltaTime);
        
        // Update goal progress
        this.updateGoalProgress();
    }
    
    generateIncome(deltaTime) {
        // Income system: Scales by home type
        // Cabin: $8/hr base + $5/hr satisfaction bonus (if >= 70%)
        // Family: $16/hr base + $10/hr satisfaction bonus (if >= 70%)
        // Business: $30/hr base, no satisfaction bonus
        // Corporate: $30/hr base + $1/hr per day growth (max $75/hr), no satisfaction bonus
        // Income is generated every game hour (1 real second = 1 game hour)
        const hoursPassed = Math.floor(this.time) - Math.floor(this.lastIncomeTime);
        
        if (hoursPassed >= 1) {
            let totalIncome = 0;
            let totalRP = 0;
            
            this.households.forEach(household => {
                let baseIncomePerHour = 8;   // Default (cabin)
                let satisfactionBonus = 0;
                
                // Scale income based on home type/tier
                const tier = household.tier || 'cabin';
                
                if (tier === 'cabin') {
                    baseIncomePerHour = 8;
                    if (household.satisfaction >= 0.7) satisfactionBonus = 5;
                } else if (tier === 'family') {
                    baseIncomePerHour = 16;
                    if (household.satisfaction >= 0.7) satisfactionBonus = 10;
                } else if (tier === 'business') {
                    baseIncomePerHour = 30;
                    // No satisfaction bonus for businesses
                } else if (tier === 'corporate') {
                    // GROWTH mechanic: $30/hr base, +$1/hr per day, max $75/hr
                    // Initialize growth tracking if not present
                    if (household.incomeGrowth === undefined) {
                        household.incomeGrowth = 0;
                        household.lastGrowthDay = Math.floor(this.time / 24);
                    }
                    
                    // Check if a new day has passed
                    const currentDay = Math.floor(this.time / 24);
                    if (currentDay > household.lastGrowthDay) {
                        const daysPassed = currentDay - household.lastGrowthDay;
                        // Max growth is +$45 (30 base + 45 growth = 75 max)
                        household.incomeGrowth = Math.min(household.incomeGrowth + daysPassed, 45);
                        household.lastGrowthDay = currentDay;
                    }
                    
                    baseIncomePerHour = 30 + household.incomeGrowth;
                    // Corporate HQ has no satisfaction bonus
                }
                
                const income = baseIncomePerHour + satisfactionBonus;
                totalIncome += income;

                // Research points from satisfaction: +2 at 85%+, +1 at 70%+
                if (household.satisfaction >= 0.85) totalRP += 2;
                else if (household.satisfaction >= 0.70) totalRP += 1;
            });
            
            if (totalIncome > 0) {
                this.money += totalIncome;
            }

            if (totalRP > 0) {
                // RP growth cut by 35% (×0.65) for balance
                const rpGained = totalRP * 0.65;
                this.researchPoints += rpGained;
                if (window.Game && window.Game.worldRenderer) {
                    window.Game.worldRenderer.spawnFloatText(
                        this.households[0].x, this.households[0].y - 10,
                        `+${rpGained.toFixed(1)} RP`, Theme.colors.cyan
                    );
                }
            }
            
            this.lastIncomeTime = this.time;
        }
    }
    
    updateWeather(deltaTime) {
        // Smoothly interpolate towards target weather
        const transitionRate = this.weather.transitionSpeed * deltaTime;
        
        if (this.weather.cloudCover !== this.weather.targetCloudCover) {
            const diff = this.weather.targetCloudCover - this.weather.cloudCover;
            this.weather.cloudCover += diff * Math.min(transitionRate, 1.0);
            
            // Snap to target if very close
            if (Math.abs(diff) < 0.01) {
                this.weather.cloudCover = this.weather.targetCloudCover;
            }
        }
        
        if (this.weather.intensity !== this.weather.targetIntensity) {
            const diff = this.weather.targetIntensity - this.weather.intensity;
            this.weather.intensity += diff * Math.min(transitionRate, 1.0);
            
            // Snap to target if very close
            if (Math.abs(diff) < 0.01) {
                this.weather.intensity = this.weather.targetIntensity;
            }
        }
        
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
        
        // Set targets for smooth transition instead of instant change
        this.weather.targetCloudCover = newWeather.cloudCover;
        this.weather.targetIntensity = newWeather.intensity;
        this.weather.nextWeatherChange = this.time + newWeather.duration + Math.random();
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
        
        // Update household satisfaction based on power availability
        this.updateHouseholdSatisfaction(deltaTime);
    }
    
    calculateSolarGeneration() {
        let totalGeneration = 0;
        
        // Get current solar intensity (based on time of day and weather)
        const solarIntensity = this.getSolarIntensity();
        // Get base time-of-day intensity (without weather effects)
        const baseTimeIntensity = this.getBaseTimeIntensity();
        
        this.solarPanels.forEach(panel => {
            // Tier4 panels (WEATHERPROOF) are immune to weather effects but still affected by nighttime
            const effectiveIntensity = (panel.tier === 'tier4') ? baseTimeIntensity : solarIntensity;
            const generation = panel.capacity * panel.efficiency * panel.degradation * effectiveIntensity;
            totalGeneration += generation;
        });
        
        return totalGeneration;
    }
    
    // Get base time-of-day solar intensity without weather effects (for tier4 WEATHERPROOF)
    getBaseTimeIntensity() {
        const hour = this.time % 24;
        let intensity = 0;
        
        // Day/Night Cycle Logic (same as getSolarIntensity but without weather)
        if (hour >= 6 && hour <= 18) {
            const dayProgress = (hour - 6) / 12;
            intensity = Math.sin(dayProgress * Math.PI);
        } else {
            intensity = 0; // Night time
        }
        
        return Math.max(0, intensity);
    }
    
    calculateTotalConsumption() {
        let totalConsumption = 0;
        
        // Get time-of-day multiplier
        const hour = this.time % 24;
        let timeMultiplier = 1.0;
        
        // Time-of-day consumption pattern
        if (hour >= 0 && hour < 6) {
            // Night (12am-6am): 20% usage (people sleeping)
            timeMultiplier = 0.2;
        } else if (hour >= 6 && hour < 9) {
            // Morning (6am-9am): 70% usage (getting ready)
            timeMultiplier = 0.7;
        } else if (hour >= 9 && hour < 17) {
            // Day (9am-5pm): 40% usage (most people at work)
            timeMultiplier = 0.4;
        } else if (hour >= 17 && hour < 22) {
            // Evening (5pm-10pm): 100% usage (peak hours - cooking, entertainment)
            timeMultiplier = 1.0;
        } else {
            // Late evening (10pm-12am): 60% usage (winding down)
            timeMultiplier = 0.6;
        }
        
        this.households.forEach(household => {
            // Calculate actual consumption based on base + variable load, multiplied by time of day
            const maxConsumption = household.baseLoad + household.variableLoad;
            let consumption = maxConsumption * timeMultiplier;
            
            // Apply power caps based on home type to prevent excessive event spikes
            const tier = household.tier || 'cabin';
            let powerCap = 8;  // Default cabin cap: 8kW
            
            if (tier === 'family') {
                powerCap = 15;  // Family cap: 15kW
            } else if (tier === 'business') {
                powerCap = 20;  // Business cap: 20kW
            } else if (tier === 'corporate') {
                powerCap = 25;  // Corporate HQ cap: 25kW (high power needs)
            }
            
            // Clamp consumption to cap (handles demand spike events)
            consumption = Math.min(consumption, powerCap);
            totalConsumption += consumption;
        });
        
        return totalConsumption;
    }
    
    getSolarIntensity() {
        // Simple time-of-day solar curve (0-24 hours)
        const hour = this.time % 24;
        let intensity = 0;
        
        // Day/Night Cycle Logic
        // Sunrise: 6am, Peak: 12pm, Sunset: 6pm
        if (hour >= 6 && hour <= 18) {
            // Rough sine curve for daylight hours
            const dayProgress = (hour - 6) / 12; // 0 to 1 over day
            intensity = Math.sin(dayProgress * Math.PI); // Sine curve
        } else {
            intensity = 0; // Night time
        }
        
        // Apply weather effects
        // Cloud cover reduces intensity (0% clouds = 1.0x, 100% clouds = 0.2x)
        const weatherFactor = 1.0 - (this.weather.cloudCover * 0.8);
        intensity *= weatherFactor;
        
        // Apply global event intensity modifier
        intensity *= this.weather.intensity;
        
        return Math.max(0, intensity);
    }
    
    updateBatteryCharge(deltaTime) {
        if (this.batteries.length === 0) return;
        
        // Since 1 real second = 1 game hour (line 121), deltaTime is already in the right units
        // deltaTime comes in seconds, and represents the equivalent game hours
        const gameHours = deltaTime; // deltaTime is in seconds, but game runs at 1 sec = 1 hour
        
        // Update all batteries proportionally
        this.batteries.forEach(battery => {
            // SELF-HEALING for tier4 batteries: passive 0.5% charge regen per hour
            if (battery.tier === 'tier4' && battery.charge < battery.capacity) {
                const regenAmount = battery.capacity * 0.005 * gameHours; // 0.5% per hour
                battery.charge = Math.min(battery.charge + regenAmount, battery.capacity);
            }
            
            if (this.energy.surplus > 0) {
                // Charge battery with surplus (distribute surplus across all batteries)
                const surplusPerBattery = this.energy.surplus / this.batteries.length;
                const chargeAmount = Math.min(
                    surplusPerBattery * gameHours * battery.efficiency,
                    battery.capacity - battery.charge
                );
                battery.charge += chargeAmount;
            } else if (this.energy.surplus < 0) {
                // Discharge battery to meet deficit (distribute deficit across all batteries)
                const deficitPerBattery = Math.abs(this.energy.surplus) / this.batteries.length;
                const dischargeAmount = Math.min(
                    deficitPerBattery * gameHours / battery.efficiency,
                    battery.charge
                );
                battery.charge -= dischargeAmount;
            }
        });
        
        // Update aggregate storage display value
        this.energy.storage = this.batteries.reduce((sum, b) => sum + b.charge, 0);
    }
    
    updateHouseholdSatisfaction(deltaTime) {
        // Update satisfaction based on whether the grid can meet demand
        // Satisfaction = % of time that household demand is fully met
        
        this.households.forEach(household => {
            // Ensure tracking properties exist (backwards compatibility)
            if (typeof household.poweredTime !== 'number') household.poweredTime = 0;
            if (typeof household.totalTime !== 'number') household.totalTime = 0;
            if (typeof household.satisfaction !== 'number') household.satisfaction = 1.0;
            
            const householdDemand = household.baseLoad + household.variableLoad;
            
            // Check if we have enough power to meet this household's demand
            // Consider: generation + battery discharge capacity
            const totalAvailablePower = this.energy.generation + this.energy.storage;
            const isPowered = (totalAvailablePower >= this.energy.consumption) || (this.energy.surplus >= 0);
            
            // Track powered time
            household.totalTime += deltaTime;
            if (isPowered) {
                household.poweredTime += deltaTime;
            }
            
            // Calculate satisfaction as percentage of uptime (with some decay for recent history)
            // Use a weighted average: 80% historical uptime + 20% current state
            // Prevent division by zero on first frame
            if (household.totalTime > 0) {
                const historicalSatisfaction = household.poweredTime / household.totalTime;
                const currentState = isPowered ? 1.0 : 0.0;
                household.satisfaction = (historicalSatisfaction * 0.8) + (currentState * 0.2);
            } else {
                // First frame: assume powered
                household.satisfaction = isPowered ? 1.0 : 0.0;
            }
            
            // Clamp between 0 and 1, and ensure it's a valid number
            household.satisfaction = Math.max(0.0, Math.min(1.0, household.satisfaction));
            
            // Final NaN check - reset to 1.0 if somehow still invalid
            if (isNaN(household.satisfaction)) {
                household.satisfaction = 1.0;
            }
        });
    }
    
    updateGoalProgress() {
        if (this.gameWon) return;
        const currentGoal = this.goals[this.currentGoalIndex];
        if (!currentGoal || currentGoal.completed) return;

        // Research requirement (a goal may require a research node and/or a count).
        // Defaults to met when the goal has no research requirement.
        let researchMet = true;
        if (currentGoal.researchGoal) {
            const node = this.getResearchNode(
                currentGoal.researchGoal.startsWith('solar') ? 'solar' :
                currentGoal.researchGoal.startsWith('stor') ? 'storage' : 'buildings',
                currentGoal.researchGoal
            );
            researchMet = !!(node && node.unlocked);
        }

        // Count requirement (corporate+net-zero, any-type, or type-specific).
        // Defaults to met when the goal has no count requirement.
        let countMet = true;
        if (currentGoal.requireNetZero) {
            const corpCount = this.households.filter(h => h.tier === 'corporate' && h.satisfaction >= 0.85).length;
            countMet = corpCount >= currentGoal.requireCorporate && this.energy.surplus >= 0;
        } else if (currentGoal.requiredType) {
            const count = (currentGoal.requiredType === 'any')
                ? this.households.filter(h => h.satisfaction >= currentGoal.satisfactionThreshold).length
                : this.households.filter(h =>
                    h.tier === currentGoal.requiredType &&
                    h.satisfaction >= currentGoal.satisfactionThreshold
                ).length;
            countMet = count >= currentGoal.target;
        }

        // Goal 4 combines BOTH a research requirement and a count requirement.
        let goalMet = researchMet && countMet;

        if (goalMet) {
            currentGoal.completed = true;
            this.money += 500;
            this.researchPoints += 30;
            if (window.Game && window.Game.notificationSystem) {
                window.Game.notificationSystem.addNotification(
                    `Goal Complete! "${currentGoal.description}" +$500 +30 RP!`, 'gold'
                );
            }
            if (this.currentGoalIndex + 1 < this.goals.length) {
                this.currentGoalIndex++;
                this.goals[this.currentGoalIndex].unlocked = true;
            } else {
                this.gameWon = true;
            }
        }
    }
    
    getCurrentGoal() {
        return this.goals[this.currentGoalIndex];
    }

    getResearchNode(branch, id) {
        return this.research[branch].find(n => n.id === id) || null;
    }

    isResearchUnlocked(branch, id) {
        const node = this.getResearchNode(branch, id);
        return !!(node && node.unlocked);
    }

    // Shared mapping: a type + tier → research node id, or null when no gate applies.
    // type: 'solar'/'solar_panel', 'battery', 'household'.
    // tier: 'tier2'..'tier4' for solar/battery, 'cabin'/'family'/'business'/'corporate' for households.
    // Base tiers (tier1 / cabin) return null (always available).
    nodeIdFor(type, tier) {
        const t = tier || '';

        if (type === 'household') {
            return {
                cabin: null,
                family: 'bld_family',
                business: 'bld_business',
                corporate: 'bld_corp'
            }[t] || null;
        }

        if (type === 'solar' || type === 'solar_panel' || type === 'battery') {
            const m = String(t).match(/^tier(\d+)$/);
            if (!m || m[1] === '1') return null; // base tier always available
            const prefix = (type === 'solar' || type === 'solar_panel') ? 'solar_t' : 'stor_t';
            return prefix + m[1];
        }

        return null;
    }

    // Map an equipment catalog item to whether it's research-locked.
    // Solar/battery items: id like 'solar_tier2'/'battery_tier2' (no separate tier field).
    // Household items: carry a 'tier' field like 'cabin'/'family'.
    isEquipmentLocked(equipment) {
        const type = equipment.type;
        let branch, tierKey;

        if (type === 'solar_panel' || type === 'battery') {
            branch = type === 'solar_panel' ? 'solar' : 'storage';
            const m = (equipment.id || '').match(/_(tier\d+)$/);
            tierKey = m ? m[1] : 'tier1';
        } else if (type === 'household') {
            branch = 'buildings';
            tierKey = equipment.tier || 'cabin';
        } else {
            return false;
        }

        const nodeId = this.nodeIdFor(type, tierKey);
        if (!nodeId) return false; // base always available
        return !this.isResearchUnlocked(branch, nodeId);
    }
    
    getGoalProgress() {
        const currentGoal = this.getCurrentGoal();
        if (!currentGoal) return { current: 0, target: 0, percentage: 100, detailed: null };

        // Safe percentage: never divide by zero/undefined.
        const safePercent = (current, target) => {
            if (typeof target !== 'number' || !isFinite(target) || target <= 0) return 0;
            return Math.min(100, Math.max(0, (current / target) * 100));
        };
        const getResearchUnlocked = (goal) => {
            if (!goal.researchGoal) return true;
            const node = this.getResearchNode(
                goal.researchGoal.startsWith('solar') ? 'solar' :
                goal.researchGoal.startsWith('stor') ? 'storage' : 'buildings',
                goal.researchGoal
            );
            return !!(node && node.unlocked);
        };

        // Corporate + net-zero goal: corporate count contribution + surplus (clamped 0..1)
        // Simple shape: current = corporate count, target = required corporate, percentage blends surplus.
        if (currentGoal.requireNetZero) {
            const corpCount = this.households.filter(h =>
                h.tier === 'corporate' && h.satisfaction >= 0.85
            ).length;
            const corpTarget = (currentGoal.requireCorporate || 0) > 0 ? currentGoal.requireCorporate : 1;
            const corpProgress = Math.min(1, corpCount / corpTarget);
            const surplusProgress = this.energy.surplus >= 0 ? 1 : 0;
            const percentage = ((corpProgress + surplusProgress) / 2) * 100;
            return {
                current: corpCount,
                target: corpTarget,
                percentage,
                detailed: null
            };
        }
        // Research-based goal: progress is 0 or 1 based on node unlocked.
        // A goal may combine research with a count requirement (e.g. goal 4),
        // in which case the ratio blends the research state with the home count.
        else if (currentGoal.researchGoal) {
            const researchMet = getResearchUnlocked(currentGoal);
            const hasCount = currentGoal.requiredType || typeof currentGoal.target === 'number';
            if (hasCount) {
                const count = currentGoal.requiredType === 'any'
                    ? this.households.filter(h => h.satisfaction >= currentGoal.satisfactionThreshold).length
                    : this.households.filter(h =>
                        h.tier === currentGoal.requiredType &&
                        h.satisfaction >= currentGoal.satisfactionThreshold
                    ).length;
                const countRatio = safePercent(count, currentGoal.target) / 100;
                return {
                    current: count,
                    target: currentGoal.target,
                    percentage: ((researchMet ? 1 : 0) + countRatio) / 2 * 100,
                    detailed: null
                };
            }
            return { current: researchMet ? 1 : 0, target: 1, percentage: researchMet ? 100 : 0, detailed: null };
        }
        // Any-type count goal (households of any tier above threshold)
        else if (currentGoal.requiredType === 'any') {
            const count = this.households.filter(h => h.satisfaction >= currentGoal.satisfactionThreshold).length;
            return {
                current: count,
                target: currentGoal.target,
                percentage: safePercent(count, currentGoal.target),
                detailed: null
            };
        } else if (currentGoal.requiredType === 'corporate_business') {
            // Goal 3: Need 2 Corporate HQs + 3 Small Businesses at threshold
            const corporateCount = this.households.filter(h => 
                h.tier === 'corporate' && 
                h.satisfaction >= currentGoal.satisfactionThreshold
            ).length;
            const businessCount = this.households.filter(h => 
                h.tier === 'business' && 
                h.satisfaction >= currentGoal.satisfactionThreshold
            ).length;
            
            const targetCorporate = currentGoal.target.corporate;
            const targetBusiness = currentGoal.target.business;
            const totalNeeded = targetCorporate + targetBusiness;
            const totalAchieved = Math.min(corporateCount, targetCorporate) + 
                                  Math.min(businessCount, targetBusiness);
            
            return {
                current: totalAchieved,
                target: totalNeeded,
                percentage: safePercent(totalAchieved, totalNeeded),
                detailed: {
                    corporate: { current: corporateCount, target: targetCorporate },
                    business: { current: businessCount, target: targetBusiness }
                }
            };
        } else if (currentGoal.requiredType === 'all') {
            // Legacy Goal 3 format: Need 3 of EACH type at threshold
            const cabinCount = this.households.filter(h => 
                h.tier === 'cabin' && 
                h.satisfaction >= currentGoal.satisfactionThreshold
            ).length;
            const familyCount = this.households.filter(h => 
                h.tier === 'family' && 
                h.satisfaction >= currentGoal.satisfactionThreshold
            ).length;
            const businessCount = this.households.filter(h => 
                h.tier === 'business' && 
                h.satisfaction >= currentGoal.satisfactionThreshold
            ).length;
            
            const totalNeeded = currentGoal.target * 3;
            const totalAchieved = Math.min(cabinCount, currentGoal.target) + 
                                  Math.min(familyCount, currentGoal.target) + 
                                  Math.min(businessCount, currentGoal.target);
            
            return {
                current: totalAchieved,
                target: totalNeeded,
                percentage: safePercent(totalAchieved, totalNeeded),
                detailed: {
                    cabin: { current: cabinCount, target: currentGoal.target },
                    family: { current: familyCount, target: currentGoal.target },
                    business: { current: businessCount, target: currentGoal.target }
                }
            };
        } else {
            // Goals 1 & 2: Count specific type
            const satisfiedHouseholds = this.households.filter(h => {
                return h.tier === currentGoal.requiredType && 
                       typeof h.satisfaction === 'number' && 
                       !isNaN(h.satisfaction) && 
                       h.satisfaction >= currentGoal.satisfactionThreshold;
            }).length;
            
            const total = typeof currentGoal.target === 'number' ? currentGoal.target : 0;
            
            return {
                current: satisfiedHouseholds,
                target: total,
                percentage: safePercent(satisfiedHouseholds, total),
                detailed: null
            };
        }
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
                    weather: { ...gameState.weather },
                    goals: [...gameState.goals],
                    currentGoalIndex: gameState.currentGoalIndex,
                    gameWon: gameState.gameWon,
                    researchPoints: gameState.researchPoints,
                    research: gameState.research
                }
            };
            
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static loadGame(gameState) {
        try {
            const saveDataString = localStorage.getItem(this.SAVE_KEY);
            if (!saveDataString) {
                return false;
            }
            
            const saveData = JSON.parse(saveDataString);
            
            // Version checking for future updates
            if (saveData.version !== gameState.version) {
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
            
            // Load goal data (with fallback for older saves)
            if (saveData.state.goals) {
                gameState.goals = saveData.state.goals;
                gameState.currentGoalIndex = saveData.state.currentGoalIndex || 0;
                gameState.gameWon = saveData.state.gameWon || false;
            }

            // Load research data (with fallback for older saves)
            gameState.researchPoints = saveData.state.researchPoints || 0;
            if (saveData.state.research) {
                gameState.research = saveData.state.research;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static hasExistingSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }
    
    static deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }
}

// Export for use in main.js
window.GameState = GameState;
window.StorageManager = StorageManager;
