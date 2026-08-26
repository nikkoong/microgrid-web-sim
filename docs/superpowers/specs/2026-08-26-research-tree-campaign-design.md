# Research Tree & Campaign Progression — Design Spec

## Overview

Add a research/progression layer to the solar microgrid game: a Research Points (RP) currency earned from satisfied households, spent in a 3-branch Tech Tree that unlocks higher equipment tiers. Extend the goal ladder so runs are longer. Ensure the game stays balanced (never frustrating) and that each tier is visually distinct in shape and color.

## Goals

- Research Points (RP) earned from satisfied households — ties progression to gameplay skill
- 3-branch Tech Tree (Solar, Storage, Buildings) gating tier2-4 equipment + family/business/corporate buildings
- Longer run via an extended goal ladder (5-6 escalating goals)
- Balanced pacing: research always progressable, no dead-ends, no lockout
- Each equipment/building tier visually distinct (silhouette + color)

## Approach

RP is added to `GameState` and earned in the hourly income loop. A Tech Tree panel (new UI tab/drawer) lets the player spend RP to unlock nodes sequentially per branch. Unlocking a node makes the matching shop equipment buyable (it was earlier gated). The goal ladder is extended. World sprites get distinct shapes/colors per tier. Visual — DP.

---

## 1. Research Points (RP) — new currency

### State (`js/gameState.js`)
- `gameState.researchPoints` — number, starts at `0`.
- `gameState.research` — object with `solar`, `storage`, `buildings` arrays of nodes:
  ```js
  research: {
    solar:    [{ id, name, cost, unlocked }],
    storage:  [{ id, name, cost, unlocked }],
    buildings:[{ id, name, cost, unlocked }]
  }
  ```
  Each node: sequential within its branch; `unlocked` starts `false` except the first purchasable tier base.

### Earning (in `update()` income loop, per game hour)
For each household, add RP based on satisfaction:
- satisfaction `>= 0.85`: `+2 RP`
- satisfaction `>= 0.70`: `+1 RP`
- else: `+0 RP`

Accumulates into `gameState.researchPoints`. Spawn a small RP float text (cyan) over households when RP is earned (reuse the coin-popup effect with RP color).

### Spending (Tech Tree panel)
- Buying a node: `researchPoints -= cost`, `node.unlocked = true`.
- Precondition: the previous node in the branch is `unlocked` (sequential), and `researchPoints >= cost`.
- Unlocking is permanent — never re-locked, never "wasted."

### Save/load
- Add `researchPoints` and `research` to `StorageManager.saveGame`/`loadGame` save data. Older saves (no `research`) fall back to defaults (all purchasable base nodes unlocked, RP=0).

---

## 2. Tech Tree — 3 branches

### Branches & nodes (balance-tuned, early cheap)
```
solar:
  solar_t2  Advanced Cells      cost 15   (unlocks Solar tier2)
  solar_t3  Premium Photovoltaic cost 45   (unlocks Solar tier3)
  solar_t4  Elite Array          cost 110  (unlocks Solar tier4)

storage:
  stor_t2  Deep-Cycle Packs     cost 12   (unlocks Battery tier2)
  stor_t3  High-Capacity Bank   cost 40   (unlocks Battery tier3)
  stor_t4  Grid Core            cost 100  (unlocks Battery tier4)

buildings:
  bld_family   Family Home      cost 15   (unlocks Family building)
  bld_business Small Business   cost 40   (unlocks Business building)
  bld_corp     Corporate HQ     cost 100  (unlocks Corporate building)
```

**Base available from start (no research needed):** Solar tier1, Battery tier1, Cabin building. Everything above is researched then buyable.

**Balance rule:** earliest node in each branch is cheap (≤15 RP) so an unlock happens within ~1-2 game-days of 3-5 happy households. Research pacing: with 3 households at 70%+, ~3 RP/hr → first unlock in ~4-5 hrs (game-time). Costs scale with tier power.

### Gating the shop
- `PurchaseManager.purchaseItem` / shop `updateAffordability` must treat a locked tier as **disabled/unaffordable** until its research node is unlocked.
- Gate mapping: `solar_t2` ↔ Solar tier2, `solar_t3` ↔ tier3, `solar_t4` ↔ tier4; same for `storage`; `bld_family` ↔ Family building, `bld_business` ↔ Business, `bld_corp` ↔ Corporate.

---

## 3. Tech Tree UI (new panel)

A new tab or expandable panel (fits the existing shop/right-pane area) listing the 3 branches. Each node rendered as a card with:
- Node name + tier icon (color/shape-matched to the tier)
- RP cost
- Unlocked state (dimmed if locked/unaffordable)
- A "RESEARCH" button (enabled when affordable + prev unlocked)

Rendered with the existing CRT/panel theme. Selecting a node shows its tier preview (shape + color). On unlock, a `gold`/`cyan` notification fires.

Placement: a "RESEARCH" button in the top HUD (right of the help `?` button) toggles a Research panel in the right pane, shown above the shop. The shop and research panel share the right-pane column; when research is open it supersedes the shop view, and vice versa.

---

## 4. Extended goal ladder

Replace the 3-goal ladder with 6 escalating goals. Each awards **+$500 AND +30 RP** on completion, so goals always push research forward. Sequential unlock (goal N must complete to reveal N+1) — reuse existing `unlocked`/`currentGoalIndex` mechanics.

Goals (tuned to be attainable, not grindy):
1. Power 3 Basic Cabins (75%+ satisfaction)
2. Research Advanced Cells (unlock Solar tier2) + power 1 more cabin
3. Power 5 Family Homes (80%+ satisfaction)
4. Research Deep-Cycle Packs (unlock Battery tier2) + reach 90% satisfaction average
5. Power 3 Small Businesses (85%+ satisfaction)
6. Power 2 Corporate HQs + reach net-zero (surplus >= 0) — victory

The goal-description display and progress bar must support these mixed conditions (count-based + research-based + net-zero).

---

## 5. Visual tier distinction (shapes + colors)

Sprites evolve shape AND color per tier so research rewards are visible. Colors match the tech-tree node color.

**Solar panels** — `visualRenderer.js` `drawSolarPanel`:
- Tier1: single flat panel, green `#2ecc71`
- Tier2: 2-panel array, blue `#74b9ff`
- Tier3: 3-panel wide array, purple `#a55eea`
- Tier4: multi-wing fan array + gold glow, gold `#f1c40f`

**Batteries** — `drawBattery`:
- Tier1: single cell, green
- Tier2: stacked double cell, blue
- Tier3: triple bank, purple
- Tier4: radial core + gold glow

**Buildings** — `drawCabin` (already distinct; reinforce silhouettes):
- Cabin: small A-frame, brown
- Family: 2-story gable, blue-grey
- Business: storefront + awning, grey
- Corporate: tall tower + antenna + gold accents

**Tier badge:** draw a small `T2`/`T3`/`T4` label on researched equipment and on shop/tech cards, color-matched to tier. Buildings get no numeric badge (they have distinct names) but keep distinct silhouettes.

---

## 6. Files changed

| File | Change |
|------|--------|
| `js/gameState.js` | Add `researchPoints`, `research` tree, RP earning in income loop, extend goal ladder, goal-completion RP bonus, save/load fields |
| `js/economicSystem.js` | `PurchaseManager` gates locked tiers; shop `updateAffordability` respects research locks |
| `js/uiFramework.js` | (if needed) tech-tree node rendering helpers / a ResearchPanel |
| `js/visualRenderer.js` | Tier-distinct sprite shapes + colors, tier badges, panel for tier color mapping |
| `js/main.js` | Research panel UI + toggle, research click handling, RP float text hooks, goal display for mixed conditions |
| `js/theme.js` | (if needed) research RP color token + tier color constants |

---

## 7. Verification (dependency-free)

Manual + DevTools console:
- `Game.gameState.researchPoints` increments each hour based on satisfaction
- Open Tech Tree panel, research a node → RP decremented, node unlocked, shop tier enabled
- Locked tier disabled/not purchasable until researched
- Goal ladder completes and awards +$500 +30 RP
- Tier sprites show distinct shapes/colors; tier badges visible
- Save/load preserves research state (reload page)
- Smoke: weather/crisis events, buy/place/sell still work

## Critical Constraints

- No external dependencies; no build step
- Script load order unchanged (core → rendering → ui → systems → main)
- Cross-file access via `window.ClassName`
- Balanced: first research cheap, base tiers always available, no lockout, goals always give progress
- World sprite tier shapes/colors distinct; colors match tech-tree node colors
- Save backward-compatible (older saves fall back to base-unlocked research)
