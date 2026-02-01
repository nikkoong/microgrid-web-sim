# Mobile Implementation Plan (Pivot: High-Res & Zoom)

**Status**: Planning Phase (Pivot from previous "scale-to-fit" approach)
**Goal**: Deliver a high-fidelity mobile experience that feels native on modern high-DPI devices (iPhone Pro Max, etc.), allowing users to zoom and pan freely while keeping UI accessible.

## Core Philosophy
1.  **High Resolution**: Render at full device pixel ratio (e.g., ~2556x1179 physical pixels). No blurry upscaling.
2.  **User Freedom**: Enable pinch-to-zoom and panning. Do not lock the viewport to a static single screen.
3.  **Unobtrusive UI**: Menus (Shop, Tools) must effectively "disappear" or minimize when not in use to maximize the viewable game area.
4.  **Logical Height**: The game simulation runs on a logical height of ~1200px. The canvas will be physically large, but coordinate systems must map correctly to this logical space.

## 1. Viewport & Canvas Configuration

### Resolution Target
*   **Physical Resolution**: Target ~2556x1179 (landscape) at ~460ppi.
*   **DPR Handling**: `ctx.scale(dpr, dpr)` must be used. Canvas `width/height` attributes set to `window.innerWidth * dpr`. CSS `width/height` set to `100%`.

### Viewport Meta
Update `index.html` to allow scaling:
```html
<!-- ALLOW zooming, but prevent accidental double-tap zoom if possible via touch-action CSS -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
```

### Canvas Logic
*   **Coordinate System**: The game logic (placing buildings, rendering sprites) will continue to use the logical coordinate system (e.g., 800x600 or 1200x900 base).
*   **Transform Matrix**: The rendering loop must apply a transform matrix that accounts for:
    *   Device Pixel Ratio (DPR)
    *   User Pan Offset (x, y)
    *   User Zoom Level (scale)

## 2. Input Handling (Touch)

### Gestures
We need a custom gesture handler in `main.js` or a new `InputManager` class to handle:
*   **One-finger drag**: Pan the camera.
*   **Two-finger pinch**: Zoom in/out (modifies global render scale).
*   **Tap**: Select entity / Open menu.
*   **Long Press**: Context action (e.g., show details or delete).

### Touch Action CSS
Prevent default browser behaviors that interfere with game control:
```css
canvas {
    touch-action: none; /* Disables browser scrolling/zooming on the canvas element itself so we can handle it manually in JS */
}
```

## 3. UI Redesign: "Out of the Way"

The current UI (fixed overlay bars) takes up too much space on mobile.

### New Layout Strategy
*   **HUD (Heads Up Display)**: Minimalist top bar showing only critical stats (Money, Energy Balance, Time).
*   **Collapsible Menus**:
    *   **Shop**: Instead of a permanent sidebar/topbar, use a **Floating Action Button (FAB)** or a small icon that expands into a drawer or modal.
    *   **Selection Info**: When an object is selected, a panel slides up from the bottom (Sheet UI pattern).
*   **Safe Areas**: Respect iOS notch/home bar areas using `env(safe-area-inset-*)`.

## 4. Implementation Tasks

### Phase 1: Foundation (High Res & Zoom)
- [ ] **T020**: Update `index.html` viewport meta tags to enable scaling.
- [ ] **T021**: Refactor `main.js` initialization to handle High DPI (Retina) rendering correctly (multiply canvas dimensions by `window.devicePixelRatio`).
- [ ] **T022**: Implement a `Camera` class or object in `main.js` to store `scrollX`, `scrollY`, and `zoomLevel`.
- [ ] **T023**: Update `VisualRenderer.js` to apply the Camera transform before drawing the world.

### Phase 2: Touch Controls
- [ ] **T024**: Implement `TouchHandler` to distinguish between Panning (1 finger move) and Zooming (2 finger pinch).
- [ ] **T025**: Map touch coordinates from "Screen Space" to "World Space" for accurate clicking/placing of buildings.

### Phase 3: Adaptive UI
- [ ] **T026**: Create a "Mobile Layout" state in `UIFramework`.
- [ ] **T027**: Move the Shop menu to a toggleable Drawer/Modal.
- [ ] **T028**: Move the Entity Inspector to a bottom slide-up panel.

## Migration Checklist
*   [ ] Remove old "scale-to-fit" logic from `main.js`.
*   [ ] Remove `user-scalable=no` from `index.html`.
*   [ ] CSS: Ensure `canvas` is `width: 100%; height: 100%;`.
