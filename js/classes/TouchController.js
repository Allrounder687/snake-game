// Touch input controller with virtual joystick
export default class TouchController {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.joystickBase = null;
        this.joystickStick = null;
        this.touchStartPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.direction = { x: 0, y: 0 };
        this.deadzone = 15; // Minimum movement to register
        this.maxDistance = 50; // Maximum joystick displacement

        this.setupJoystick();
        this.setupTouchHandlers();
    }

    setupJoystick() {
        // Get joystick elements
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickStick = document.querySelector('.joystick-stick');

        if (!this.joystickBase || !this.joystickStick) {
            console.error('Joystick elements not found');
            return;
        }
    }

    setupTouchHandlers() {
        const touchControls = document.getElementById('touch-controls');
        if (!touchControls) return;

        // Touch start
        touchControls.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        // Touch move
        touchControls.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        // Touch end
        touchControls.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Touch cancel
        touchControls.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        this.active = true;

        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY
        };

        this.currentPos = { ...this.touchStartPos };

        // Show joystick at touch position
        this.showJoystick(this.touchStartPos.x, this.touchStartPos.y);
    }

    handleTouchMove(e) {
        if (!this.active) return;

        const touch = e.touches[0];
        this.currentPos = {
            x: touch.clientX,
            y: touch.clientY
        };

        // Calculate offset from start position
        const deltaX = this.currentPos.x - this.touchStartPos.x;
        const deltaY = this.currentPos.y - this.touchStartPos.y;

        // Calculate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Apply deadzone
        if (distance < this.deadzone) {
            this.direction = { x: 0, y: 0 };
            this.updateJoystickStick(0, 0);
            return;
        }

        // Limit to max distance
        const limitedDistance = Math.min(distance, this.maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;

        // Update stick position
        this.updateJoystickStick(limitedX, limitedY);

        // Calculate normalized direction
        this.direction = {
            x: limitedX / this.maxDistance,
            y: limitedY / this.maxDistance
        };

        // Convert to snake direction (8-directional)
        this.updateSnakeDirection();
    }

    handleTouchEnd(e) {
        this.active = false;
        this.direction = { x: 0, y: 0 };
        this.hideJoystick();
    }

    updateSnakeDirection() {
        const { x, y } = this.direction;

        // Determine primary direction based on angle
        const angle = Math.atan2(y, x);
        const degrees = angle * (180 / Math.PI);

        // 8-directional input
        let vx = 0, vy = 0;

        // Right
        if (degrees >= -22.5 && degrees < 22.5) {
            vx = 1; vy = 0;
        }
        // Down-Right
        else if (degrees >= 22.5 && degrees < 67.5) {
            vx = 1; vy = 1;
        }
        // Down
        else if (degrees >= 67.5 && degrees < 112.5) {
            vx = 0; vy = 1;
        }
        // Down-Left
        else if (degrees >= 112.5 && degrees < 157.5) {
            vx = -1; vy = 1;
        }
        // Left
        else if (degrees >= 157.5 || degrees < -157.5) {
            vx = -1; vy = 0;
        }
        // Up-Left
        else if (degrees >= -157.5 && degrees < -112.5) {
            vx = -1; vy = -1;
        }
        // Up
        else if (degrees >= -112.5 && degrees < -67.5) {
            vx = 0; vy = -1;
        }
        // Up-Right
        else if (degrees >= -67.5 && degrees < -22.5) {
            vx = 1; vy = -1;
        }

        // Only update if direction changed
        if (this.game.snake.vx !== vx || this.game.snake.vy !== vy) {
            // Prevent 180-degree turns
            if (!(vx === -this.game.snake.vx && vy === -this.game.snake.vy)) {
                this.game.snake.vx = vx;
                this.game.snake.vy = vy;
            }
        }
    }

    showJoystick(x, y) {
        if (!this.joystickBase) return;

        const touchControls = document.getElementById('touch-controls');
        touchControls.classList.remove('hidden');

        // Position joystick at touch point
        this.joystickBase.style.left = `${x}px`;
        this.joystickBase.style.top = `${y}px`;
        this.joystickBase.style.opacity = '1';
        this.joystickBase.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    hideJoystick() {
        if (!this.joystickBase) return;

        this.joystickBase.style.opacity = '0';
        this.joystickBase.style.transform = 'translate(-50%, -50%) scale(0.8)';

        // Reset stick position
        this.updateJoystickStick(0, 0);
    }

    updateJoystickStick(x, y) {
        if (!this.joystickStick) return;

        this.joystickStick.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    }

    show() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.remove('hidden');
        }
    }

    hide() {
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
    }

    getDirection() {
        return this.direction;
    }

    isActive() {
        return this.active;
    }
}
