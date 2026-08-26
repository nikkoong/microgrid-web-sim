# Research Tree & Campaign Progression — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Research Points (RP) currency earned from satisfied households, spent in a 3-branch Tech Tree that gates higher equipment tiers, plus an extended goal ladder — with balanced pacing and distinct tier shapes/colors.

**Architecture:** `GameState` gains `researchPoints` and a `research` tree, earns RP in the hourly income loop, and gates `PurchaseManager`/shop on research unlocks. A Research panel (in the right pane) renders the tree and handles RP spend. `WorldRenderer` draws tier-distinct shapes/colors + tier badges. Save/load persists research.

**Tech Stack:** Vanilla HTML5 Canvas + JavaScript. No frameworks, no build tools, no npm.

**Spec:** `docs/superpowers/specs/2026-08-26-research-tree-campaign-design.md`

## Global Constraints

- No external dependencies — everything hand-rolled
- No build step — plain HTML/CSS/JS
- Script load order unchanged: theme → gameState → eventSystem → uiFramework → camera → visualRenderer → economicSystem → main
- All cross-file access via `window.ClassName`
- Verify via browser DevTools console (no test suite)
- Balance: base equipment (Solar tier1, Battery tier1, Cabin) always available; first research cheap (≤15 RP); no lockout; every goal awards +$500 AND +30 RP
- Tier shapes/colors distinct; colors match tech-tree node colors
- Save backward-compatible (older saves fall back to base-unlocked research, RP=0)

---

## File Structure

| File | Change |
|------|--------|
| `js/gameState.js` | Add `researchPoints`, `research` tree, RP earning, extended goals, RP bonus, save/load fields |
| `js/economicSystem.js` | `PurchaseManager` gates locked tiers; shop `updateAffordability` respects locks |
| `js/uiFramework.js` | (as needed) research node render helpers |
| `js/visualRenderer.js` | Tier-distinct sprite shapes/colors, tier badges |
| `js/main.js` | Research panel + toggle, research click handling, RP float text |
| `js/theme.js` | RP token + tier color constants |

---

### Task 1: Research Points + tech tree state (gameState.js)

**Files:**
- Modify: `js/gameState.js` (constructor, `generateIncome`, `setupInitialState`)

**Interfaces:**
- Produces: `gameState.researchPoints` (number), `gameState.research` (object: `solar`, `storage`, `buildings` arrays), helper `getResearchNode(branch, id)`

- [ ] **Step 1: Add research state to constructor**

In the `GameState` constructor, after `this.gameWon = false;`, add:

```javascript
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
```

- [ ] **Step 2: Add a getResearchNode helper method**

Add this method to `GameState` (place near `getCurrentGoal`):

```javascript
getResearchNode(branch, id) {
    return this.research[branch].find(n => n.id === id) || null;
}
```

- [ ] **Step 3: Earn RP in generateIncome**

In `generateIncome`, inside the `households.forEach` loop (after computing `income`), accumulate RP based on satisfaction. Add a `let totalRP = 0;` before the forEach, and inside the loop:

```javascript
// Research points from satisfaction: +2 at 85%+, +1 at 70%+
if (household.satisfaction >= 0.85) totalRP += 2;
else if (household.satisfaction >= 0.70) totalRP += 1;
```

After the forEach, inside `if (totalIncome > 0)` block's sibling, add:

```javascript
if (totalRP > 0) {
    this.researchPoints += totalRP;
    if (window.Game && window.Game.worldRenderer) {
        window.Game.worldRenderer.spawnFloatText(
            this.households[0].x, this.households[0].y - 10,
            `+${totalRP} RP`, Theme.colors.cyan
        );
    }
}
```

- [ ] **Step 4: Verify in browser console**

```javascript
// Set a satisfied household, force an hour to pass, check RP earned
Game.gameState.households[0].satisfaction = 0.9;
Game.gameState.lastIncomeTime = Game.gameState.time - 1;
Game.gameState.time += 0.1; // trigger income tick through game loop
// after ~1s: Game.gameState.researchPoints should have increased
Game.gameState.researchPoints.length >= 0
```

- [ ] **Step 5: Commit**

```bash
git add js/gameState.js
git commit -m "feat: add research points currency and tech tree state"
```

---

### Task 2: Extended goal ladder + RP bonus (gameState.js)

**Files:**
- Modify: `js/gameState.js` (constructor goals array, `updateGoalProgress`)

**Interfaces:**
- Consumes: `gameState.researchPoints` (Task 1), `getResearchNode` (Task 1)
- Produces: extended `goals` array; RP awarded on goal completion

- [ ] **Step 1: Replace the goals array**

In the `GameState` constructor, replace the existing `this.goals = [...]` with a 6-goal ladder:

```javascript
this.goals = [
    { id: 1, description: 'Power 3 Basic Cabins with 75%+ satisfaction', target: 3, satisfactionThreshold: 0.75, requiredType: 'cabin', completed: false, unlocked: true },
    { id: 2, description: 'Research Advanced Cells (Solar tier 2)', researchGoal: 'solar_t2', completed: false, unlocked: false },
    { id: 3, description: 'Power 5 Family Homes with 80%+ satisfaction', target: 5, satisfactionThreshold: 0.80, requiredType: 'family', completed: false, unlocked: false },
    { id: 4, description: 'Research Deep-Cycle Packs (Battery tier 2) and power 3 homes above 80%', researchGoal: 'stor_t2', target: 3, satisfactionThreshold: 0.80, requiredType: 'any', completed: false, unlocked: false },
    { id: 5, description: 'Power 3 Small Businesses with 85%+ satisfaction', target: 3, satisfactionThreshold: 0.85, requiredType: 'business', completed: false, unlocked: false },
    { id: 6, description: 'Power 2 Corporate HQs and reach net-zero (surplus >= 0)', requireCorporate: 2, requireNetZero: true, completed: false, unlocked: false }
];
```

- [ ] **Step 2: Rewrite updateGoalProgress**

Replace the body of `updateGoalProgress` to handle the mixed conditions. Keep the existing count-based logic, add research-based, any-type, and net-zero goals:

```javascript
updateGoalProgress() {
    if (this.gameWon) return;
    const currentGoal = this.goals[this.currentGoalIndex];
    if (!currentGoal || currentGoal.completed) return;

    let goalMet = false;

    // Research-based goal: a specific research node must be unlocked
    if (currentGoal.researchGoal) {
        const node = this.getResearchNode(
            currentGoal.researchGoal.startsWith('solar') ? 'solar' :
            currentGoal.researchGoal.startsWith('stor') ? 'storage' : 'buildings',
            currentGoal.researchGoal
        );
        goalMet = !!(node && node.unlocked);
    }
    // Corporate + net-zero goal
    else if (currentGoal.requireNetZero) {
        const corpCount = this.households.filter(h => h.tier === 'corporate' && h.satisfaction >= 0.85).length;
        goalMet = corpCount >= currentGoal.requireCorporate && this.energy.surplus >= 0;
    }
    // Any-type count goal (households of any tier above threshold)
    else if (currentGoal.requiredType === 'any') {
        const count = this.households.filter(h => h.satisfaction >= currentGoal.satisfactionThreshold).length;
        goalMet = count >= currentGoal.target;
    }
    // Type-specific count goal (existing logic)
    else {
        const satisfied = this.households.filter(h =>
            h.tier === currentGoal.requiredType &&
            h.satisfaction >= currentGoal.satisfactionThreshold
        ).length;
        goalMet = satisfied >= currentGoal.target;
    }

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
```

- [ ] **Step 3: Verify in browser console**

```javascript
Game.gameState.goals.length  // 6
Game.gameState.getCurrentGoal().id  // 1
// Simulate completing goal 1 by placing 3 cabins at 75%+, or force:
Game.gameState.households.push({id:'t', x:0, y:0, tier:'cabin', satisfaction:0.9, baseLoad:1, variableLoad:0.5});
Game.gameState.updateGoalProgress();
Game.gameState.currentGoalIndex  // advanced to 2 (research goal)
```

- [ ] **Step 4: Commit**

```bash
git add js/gameState.js
git commit -m "feat: extend goal ladder and award RP on completion"
```

---

### Task 3: Gate shop/purchase on research unlocks (economicSystem.js + gameState helpers)

**Files:**
- Modify: `js/economicSystem.js` (PurchaseManager, ShopMenu updateAffordability)
- Modify: `js/gameState.js` (add `isResearchUnlocked` + `isEquipmentLocked` helpers)

**Interfaces:**
- Consumes: `gameState.research` (Task 1)
- Produces: `isResearchUnlocked(branch, id)` → bool, `isEquipmentLocked(type, tier)` → bool; gated `purchaseItem`

- [ ] **Step 1: Add unlock-check helpers to GameState**

Add to `GameState`:

```javascript
isResearchUnlocked(branch, id) {
    const node = this.getResearchNode(branch, id);
    return !!(node && node.unlocked);
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
        if (tierKey === 'tier1') return false; // base always available
        return !this.isResearchUnlocked(branch, (branch === 'solar' ? 'solar_' : 'stor_') + tierKey);
    }

    if (type === 'household') {
        tierKey = equipment.tier || 'cabin';
        if (tierKey === 'cabin') return false; // base always available
        return !this.isResearchUnlocked('buildings', 'bld_' + tierKey);
    }

    return false;
}
```

- [ ] **Step 2: Gate purchaseItem**

In `PurchaseManager.purchaseItem`, after the `validatePurchase` check, add:

```javascript
if (this.gameState.isEquipmentLocked && this.gameState.isEquipmentLocked(equipment)) {
    return { success: false, message: 'Research required to unlock this item!' };
}
```

(Note: `equipment.tier` — ensure the catalog items carry a `tier` field equal to `'tier1'`/`'tier2'`/etc. or the mapping key `'cabin'`/`'family'`/etc. If the item lacks a `tier` property, derive it from `equipment.id` in the helper.)

- [ ] **Step 3: Gate shop updateAffordability (economicSystem.js)**

In `ShopMenu.updateAffordability` (and `renderEquipmentButtons` disabled logic), a button should be disabled if the item is research-locked:

```javascript
const locked = this.purchaseManager.gameState.isEquipmentLocked(eq);
button.setDisabled(locked || !canAfford);
```

- [ ] **Step 4: Verify in browser console**

```javascript
Game.gameState.research.solar[0].unlocked = true;  // unlock Advanced Cells (solar_t2 -> tier2)
Game.gameState.isEquipmentLocked({id:'solar_tier2', type:'solar_panel'})  // false after unlock
Game.gameState.isEquipmentLocked({id:'solar_tier4', type:'solar_panel'})  // true (solar_t4 locked)
Game.gameState.isEquipmentLocked({id:'household_family', type:'household', tier:'family'})  // true (bld_family locked)
```

- [ ] **Step 5: Commit**

```bash
git add js/economicSystem.js js/gameState.js
git commit -m "feat: gate equipment tiers behind research unlocks"
```

---

### Task 4: Tier-distinct sprite shapes + colors + tier badges (visualRenderer.js)

**Files:**
- Modify: `js/visualRenderer.js` (SpriteManager.drawSolarPanel, drawBattery, drawCabin; WorldRenderer.drawEquipment)

**Interfaces:**
- Consumes: `gameState.researchPoints` (display of tier); tier color constants
- Produces: tier-color map; distinct shapes per tier; `drawTierBadge`

- [ ] **Step 1: Add tier color constants + badge helper**

In `Theme` (js/theme.js) add to `colors`:

```javascript
// Tier colors (match tech-tree node colors)
tierColors: {
    tier1: '#2ecc71',
    tier2: '#74b9ff',
    tier3: '#a55eea',
    tier4: '#f1c40f'
}
```

In `visualRenderer.js` add `drawTierBadge(x, y, tier)` to SpriteManager:

```javascript
drawTierBadge(ctx, x, y, tier) {
    const colors = Theme.colors.tierColors || {};
    const color = colors[tier] || Theme.colors.green;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = Theme.font(7);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tier.replace('tier','T').toUpperCase(), x, y);
    ctx.restore();
}
```

- [ ] **Step 2: Rewrite drawSolarPanel for distinct shapes**

Replace `drawSolarPanel` so each tier draws a different array shape and cell color (green/blue/purple/gold). Tier1 single small panel; tier2 two side-by-side; tier3 three wide; tier4 multi-wing fan. Use `Theme.colors.tierColors[tier]` for the cells.

- [ ] **Step 3: Rewrite drawBattery for distinct shapes**

Replace `drawBattery` so tier1 = single tall cell, tier2 = stacked pair, tier3 = triple bank, tier4 = circular radial core with gold glow. Cell color from `tierColors[tier]`.

- [ ] **Step 4: Reinforce building silhouettes + badges**

Keep `drawCabin` tier silhouettes; ensure family/business/corporate are clearly distinct. In `WorldRenderer.drawEquipment`, after drawing each researched (tier 2-4) solar/battery, call `this.spriteManager.drawTierBadge(...)` above it.

- [ ] **Step 5: Verify in browser console**

```javascript
// Force a tier4 solar panel, confirm distinct gold shape renders + badge
Game.gameState.solarPanels.push({id:'p', x:300, y:200, capacity:25, efficiency:0.98, degradation:1, tier:'tier4', cost:2500});
// screenshot: tier4 panel should be gold and fan-shaped with a T4 badge
```

- [ ] **Step 6: Commit**

```bash
git add js/visualRenderer.js js/theme.js
git commit -m "feat: distinguish equipment tiers by shape and color with badges"
```

---

### Task 5: Research panel + toggle + click handling (main.js)

**Files:**
- Modify: `js/main.js` (createHUD, render, handleClick, resetGame, setupState)

**Interfaces:**
- Consumes: `gameState.research`, `isResearchUnlocked`, `researchPoints`, `getResearchNode` (Tasks 1-2)
- Produces: `this.researchPanelVisible`, `this.researchNodes` (buttons), `researchButton`, RP float text

- [ ] **Step 1: Add a Research toggle button in createHUD**

After the help button (`?`), add a `RESEARCH` button (green style) at `x=440, y=10, 100x30`:

```javascript
const researchButton = new Button(440, 10, 100, 30, 'RESEARCH', () => {
    this.researchPanelVisible = !this.researchPanelVisible;
}, {
    bgColor: Theme.colors.green,
    hoverBgColor: Theme.colors.greenDark,
    activeBgColor: Theme.colors.greenDark,
    borderColor: Theme.colors.greenDim,
    textColor: Theme.colors.textBright,
    fontSize: '10px'
});
this.uiElements.push(researchButton);
this.researchButton = researchButton;
```

(Note: `uiElements` indices in `renderGameState` shift — recompute or use `this.researchButton` reference instead of index. Reference-based access preferred.)

- [ ] **Step 2: Initialize research panel state**

In `Game.init()` or `createHUD`, add:

```javascript
this.researchPanelVisible = false;
this.researchNodeButtons = [];
```

- [ ] **Step 3: Build research node buttons**

Add method `buildResearchButtons()` that creates a Button per research node (using fields from Section 1 of the spec for costs), storing `{ button, branch, id, cost }`. Positioned in the right pane column (x≈960, below where the shop sits). Re-running shows locked vs unlocked state.

- [ ] **Step 4: Handle research click**

Add method `handleResearchClick(button)`:

```javascript
const { branch, id, cost } = button;
const node = this.gameState.getResearchNode(branch, id);
if (!node || node.unlocked) return;
// sequential gate: previous node in branch must be unlocked
const branchNodes = this.gameState.research[branch];
const idx = branchNodes.indexOf(node);
if (idx > 0 && !branchNodes[idx - 1].unlocked) {
    this.notificationSystem.addNotification('Research the previous tech first!', 'warning');
    return;
}
if (this.gameState.researchPoints < cost) {
    this.notificationSystem.addNotification(`Need ${cost} RP to research!`, 'error');
    return;
}
this.gameState.researchPoints -= cost;
node.unlocked = true;
this.notificationSystem.addNotification(`${node.name} researched!`, 'success');
```

- [ ] **Step 5: Render the research panel**

In `render()`, when `this.researchPanelVisible`, draw a themed Panel in the right pane listing each branch's nodes with cost + unlocked state + a RESEARCH button. Reuse Panel + Theme. Draw current `RP: N` in the panel header.

- [ ] **Step 6: Add research panel to input routing**

In `handleClick`, route clicks to research node buttons when `this.researchPanelVisible` (before shop handling).

- [ ] **Step 7: Persist and reset**

Ensure `resetGame()` resets `researchPoints=0` and re-locks all research nodes (except base), and `renderGameState` shows `RP` in the shop/stats header or research panel.

- [ ] **Step 8: Verify in browser console**

```javascript
Game.researchButton.onClick();  // toggles panel
Game.gameState.researchPoints = 50;
// Click the first solar node button -> node unlocked, RP decremented
```

- [ ] **Step 9: Commit**

```bash
git add js/main.js
git commit -m "feat: add research panel, toggle, and RP spending UI"
```

---

### Task 6: Save/load research + final integration check

**Files:**
- Modify: `js/gameState.js` (StorageManager.saveGame, loadGame)
- Modify: `js/main.js` (as needed)

**Interfaces:**
- Consumes: `gameState.researchPoints`, `gameState.research` (Tasks 1-2)

- [ ] **Step 1: Add research to saveGame**

In `StorageManager.saveGame`, in the `state` object, add:

```javascript
researchPoints: gameState.researchPoints,
research: gameState.research
```

- [ ] **Step 2: Add research to loadGame**

In `StorageManager.loadGame`, after loading goals, add:

```javascript
gameState.researchPoints = saveData.state.researchPoints || 0;
if (saveData.state.research) {
    gameState.research = saveData.state.research;
}
```

- [ ] **Step 3: Verify save/load**

```javascript
Game.gameState.researchPoints = 80;
Game.gameState.research.solar[0].unlocked = true;
StorageManager.saveGame(Game.gameState);
// force an unload of state, then:
StorageManager.loadGame(Game.gameState);
Game.gameState.researchPoints  // 80
Game.gameState.research.solar[0].unlocked  // true
```

- [ ] **Step 4: Final integration smoke test**

```javascript
// Build a full research path: earn RP, unlock tier2, buy it, place it, verify flow
Game.gameState.researchPoints = 100;
// (simulate unlock + purchase)
```

Then run the existing smoke tests (buy→place→sell, weather/crisis, cheat) and confirm no regressions.

- [ ] **Step 5: Commit**

```bash
git add js/gameState.js js/main.js
git commit -m "feat: persist research state and finalize progression integration"
```

---

## Completion Checklist

- [ ] `researchPoints` currency earned hourly from satisfied households
- [ ] 3-branch tech tree (solar/storage/buildings) with sequential unlocks
- [ ] Base equipment always available; tier2-4 researched before buyable
- [ ] Shop/purchase gated on research unlocks
- [ ] Extended 6-goal ladder awarding +$500 +30 RP
- [ ] Research panel UI (toggle, node cards, RP spend, sequential gating)
- [ ] Tier-distinct sprite shapes/colors + tier badges
- [ ] Save/load persists research (backward-compatible)
- [ ] Smoke tests pass (buy/place/sell, weather, crisis, cheat)
