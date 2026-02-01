// Camera System - Handles pan, zoom, and coordinate transformation for mobile
// This provides a virtual camera that can pan and zoom the game world

class Camera {
    constructor(viewportWidth, viewportHeight) {
        // Viewport dimensions (CSS pixels)
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        
        // Camera position in world space (top-left corner)
        this.x = 0;
        this.y = 0;
        
        // Zoom level (1.0 = 100%, 2.0 = 200%, etc.)
        this.zoom = 1.0;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        
        // World bounds (the logical game area)
        this.worldWidth = 1200;
        this.worldHeight = 800;
        
        // Smooth animation properties
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1.0;
        this.smoothing = 0.15; // Lerp factor for smooth camera movement
        
        // Device pixel ratio for high-DPI rendering
        this.dpr = window.devicePixelRatio || 1;
    }
    
    // Update camera with smooth interpolation
    update() {
        // Lerp towards target position
        this.x += (this.targetX - this.x) * this.smoothing;
        this.y += (this.targetY - this.y) * this.smoothing;
        this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
        
        // Clamp camera to world bounds
        this.clampToBounds();
    }
    
    // Clamp camera position so we don't scroll outside the world
    clampToBounds() {
        // Calculate visible area in world coordinates
        const visibleWidth = this.viewportWidth / this.zoom;
        const visibleHeight = this.viewportHeight / this.zoom;
        
        // Clamp X
        const maxX = Math.max(0, this.worldWidth - visibleWidth);
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.targetX = Math.max(0, Math.min(this.targetX, maxX));
        
        // Clamp Y
        const maxY = Math.max(0, this.worldHeight - visibleHeight);
        this.y = Math.max(0, Math.min(this.y, maxY));
        this.targetY = Math.max(0, Math.min(this.targetY, maxY));
    }
    
    // Set viewport size (call on resize)
    setViewport(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
        this.clampToBounds();
    }
    
    // Pan the camera by a delta amount (in screen pixels)
    pan(deltaX, deltaY) {
        // Convert screen delta to world delta
        const worldDeltaX = deltaX / this.zoom;
        const worldDeltaY = deltaY / this.zoom;
        
        this.targetX -= worldDeltaX;
        this.targetY -= worldDeltaY;
        
        this.clampToBounds();
    }
    
    // Zoom towards a point (in screen coordinates)
    zoomAt(screenX, screenY, zoomDelta) {
        // Get world position before zoom
        const worldBefore = this.screenToWorld(screenX, screenY);
        
        // Apply zoom
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom * zoomDelta));
        
        // Snap zoom for smooth update
        this.zoom = this.targetZoom;
        
        // Get world position after zoom
        const worldAfter = this.screenToWorld(screenX, screenY);
        
        // Adjust camera position to keep the point under the cursor
        this.targetX += worldBefore.x - worldAfter.x;
        this.targetY += worldBefore.y - worldAfter.y;
        this.x = this.targetX;
        this.y = this.targetY;
        
        this.clampToBounds();
    }
    
    // Set zoom level directly
    setZoom(zoom) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
    
    // Center camera on a world position
    centerOn(worldX, worldY) {
        const visibleWidth = this.viewportWidth / this.zoom;
        const visibleHeight = this.viewportHeight / this.zoom;
        
        this.targetX = worldX - visibleWidth / 2;
        this.targetY = worldY - visibleHeight / 2;
        
        this.clampToBounds();
    }
    
    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.x,
            y: (screenY / this.zoom) + this.y
        };
    }
    
    // Convert world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    
    // Apply camera transform to canvas context
    applyTransform(ctx) {
        ctx.save();
        // Scale for zoom
        ctx.scale(this.zoom, this.zoom);
        // Translate for pan (negative because we're moving the world, not the camera)
        ctx.translate(-this.x, -this.y);
    }
    
    // Restore canvas context after drawing world
    restoreTransform(ctx) {
        ctx.restore();
    }
    
    // Reset camera to default position
    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1.0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1.0;
    }
    
    // Fit the entire world in view
    fitWorld() {
        const scaleX = this.viewportWidth / this.worldWidth;
        const scaleY = this.viewportHeight / this.worldHeight;
        this.targetZoom = Math.min(scaleX, scaleY, 1.0); // Don't zoom in past 1.0
        this.targetX = 0;
        this.targetY = 0;
        this.clampToBounds();
    }
}

// Touch gesture handler for mobile
class TouchHandler {
    constructor(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        
        // Touch tracking
        this.touches = new Map(); // Track all active touches
        this.lastTouchDistance = 0;
        this.lastTouchCenter = { x: 0, y: 0 };
        
        // Gesture state
        this.isPanning = false;
        this.isPinching = false;
        this.gestureStarted = false;
        
        // Single touch tracking for tap detection
        this.tapStartTime = 0;
        this.tapStartPos = { x: 0, y: 0 };
        this.tapThreshold = 10; // Max movement for a tap
        this.tapTimeout = 300; // Max time for a tap (ms)
        
        // Callbacks
        this.onTap = null; // (worldX, worldY) => void
        this.onLongPress = null; // (worldX, worldY) => void
        this.onPanStart = null;
        this.onPanEnd = null;
        
        // Long press detection
        this.longPressTimer = null;
        this.longPressTime = 500;
        
        // Bind event handlers
        this.setupEvents();
    }
    
    setupEvents() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Mouse wheel for desktop zoom (also useful for trackpad pinch)
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    }
    
    // Get touch position relative to canvas in LOGICAL pixels (not CSS pixels)
    // This matches the coordinate system used by mouse events in main.js
    getTouchPos(touch) {
        const rect = this.canvas.getBoundingClientRect();
        // Convert from CSS pixels to logical pixels
        const scaleX = this.camera.viewportWidth / rect.width;
        const scaleY = this.camera.viewportHeight / rect.height;
        
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        // Store all touches
        for (let touch of e.changedTouches) {
            const pos = this.getTouchPos(touch);
            this.touches.set(touch.identifier, pos);
        }
        
        if (this.touches.size === 1) {
            // Single touch - potential tap or pan
            const pos = this.getTouchPos(e.touches[0]);
            this.tapStartTime = Date.now();
            this.tapStartPos = { ...pos };
            this.isPanning = false;
            this.gestureStarted = false;
            
            // Start long press timer
            this.longPressTimer = setTimeout(() => {
                if (this.touches.size === 1 && !this.gestureStarted) {
                    // Long press detected - pass SCREEN coordinates (logical pixels)
                    // The caller will convert to world coords if needed
                    if (this.onLongPress) {
                        this.onLongPress(pos.x, pos.y);
                    }
                    this.gestureStarted = true; // Prevent tap
                }
            }, this.longPressTime);
            
        } else if (this.touches.size === 2) {
            // Two touches - pinch/zoom
            this.cancelLongPress();
            this.isPinching = true;
            this.isPanning = false;
            this.gestureStarted = true;
            
            const positions = Array.from(this.touches.values());
            this.lastTouchDistance = this.getDistance(positions[0], positions[1]);
            this.lastTouchCenter = this.getCenter(positions[0], positions[1]);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        // Update touch positions
        for (let touch of e.changedTouches) {
            if (this.touches.has(touch.identifier)) {
                this.touches.set(touch.identifier, this.getTouchPos(touch));
            }
        }
        
        if (this.touches.size === 1) {
            // Single touch move - pan
            const pos = Array.from(this.touches.values())[0];
            
            // Check if we've moved enough to start panning
            const dx = pos.x - this.tapStartPos.x;
            const dy = pos.y - this.tapStartPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.tapThreshold) {
                this.cancelLongPress();
                
                if (!this.isPanning) {
                    this.isPanning = true;
                    this.gestureStarted = true;
                    if (this.onPanStart) this.onPanStart();
                }
                
                // Pan camera
                this.camera.pan(-dx, -dy);
                this.tapStartPos = { ...pos };
            }
            
        } else if (this.touches.size === 2 && this.isPinching) {
            // Two touch move - pinch zoom
            const positions = Array.from(this.touches.values());
            const newDistance = this.getDistance(positions[0], positions[1]);
            const newCenter = this.getCenter(positions[0], positions[1]);
            
            // Calculate zoom delta
            if (this.lastTouchDistance > 0) {
                const zoomDelta = newDistance / this.lastTouchDistance;
                this.camera.zoomAt(newCenter.x, newCenter.y, zoomDelta);
            }
            
            // Also pan based on center movement
            const panDeltaX = newCenter.x - this.lastTouchCenter.x;
            const panDeltaY = newCenter.y - this.lastTouchCenter.y;
            this.camera.pan(-panDeltaX, -panDeltaY);
            
            this.lastTouchDistance = newDistance;
            this.lastTouchCenter = newCenter;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Remove ended touches
        for (let touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }
        
        this.cancelLongPress();
        
        // Check for tap (single quick touch with little movement)
        if (this.touches.size === 0) {
            const elapsed = Date.now() - this.tapStartTime;
            
            if (!this.gestureStarted && elapsed < this.tapTimeout) {
                // It's a tap! Pass SCREEN coordinates (logical pixels)
                // The caller will convert to world coords if needed
                if (this.onTap) {
                    this.onTap(this.tapStartPos.x, this.tapStartPos.y);
                }
            }
            
            if (this.isPanning && this.onPanEnd) {
                this.onPanEnd();
            }
            
            // Reset state
            this.isPanning = false;
            this.isPinching = false;
            this.gestureStarted = false;
        } else if (this.touches.size === 1) {
            // Went from 2 touches to 1 - continue as pan
            this.isPinching = false;
            const pos = Array.from(this.touches.values())[0];
            this.tapStartPos = { ...pos };
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        // Convert from CSS pixels to logical pixels
        const scaleX = this.camera.viewportWidth / rect.width;
        const scaleY = this.camera.viewportHeight / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // Zoom in/out based on wheel delta
        // Normalize wheel delta across browsers
        const delta = -e.deltaY * 0.001;
        const zoomFactor = 1 + delta;
        
        this.camera.zoomAt(mouseX, mouseY, zoomFactor);
    }
    
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getCenter(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    }
}

// Export to window
window.Camera = Camera;
window.TouchHandler = TouchHandler;
