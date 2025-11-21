import Snake from './Snake.js';
import { GAME_CONFIG } from '../config.js';

export default class EnemySnake extends Snake {
    constructor(x, y, color, worldWidth, worldHeight) {
        super(x, y);
        this.color = color;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Randomize characteristics
        const sizeVariance = Math.random();
        if (sizeVariance > 0.8) {
            // Big Boss Snake
            this.length = 100;
            this.thickness = GAME_CONFIG.SNAKE_THICKNESS * 1.5;
            this.speed = GAME_CONFIG.SNAKE_SPEED * 0.7; // Slower
        } else if (sizeVariance < 0.3) {
            // Speedy Small Snake
            this.length = 15;
            this.thickness = GAME_CONFIG.SNAKE_THICKNESS * 0.8;
            this.speed = GAME_CONFIG.SNAKE_SPEED * 1.1; // Faster
        } else {
            // Normal Snake
            this.length = 40;
            this.speed = GAME_CONFIG.SNAKE_SPEED * 0.9;
        }

        // Initialize segments based on length
        this.segments = [];
        for (let i = 0; i < this.length; i++) {
            this.segments.push({ x: x, y: y + i * 2 });
        }

        this.turnSpeed = 0.15;
        this.state = 'hunting';
        this.target = null;
        this.changeDirTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
    }

    update(deltaTime, foods, snakes) {
        // AI Logic
        this.decideMove(foods, snakes);

        // Physics update
        const moveDist = this.speed * deltaTime;

        // Update velocity based on target angle
        if (this.targetAngle !== undefined) {
            const currentAngle = Math.atan2(this.vy, this.vx);
            let diff = this.targetAngle - currentAngle;

            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            const turn = Math.max(-this.turnSpeed, Math.min(this.turnSpeed, diff));
            const newAngle = currentAngle + turn;

            this.vx = Math.cos(newAngle) * this.speed;
            this.vy = Math.sin(newAngle) * this.speed;
        }

        // Move head
        const newX = this.head.x + this.vx * deltaTime;
        const newY = this.head.y + this.vy * deltaTime;

        this.segments.unshift({ x: newX, y: newY });

        if (this.growAmount > 0) {
            this.length++;
            this.growAmount--;
        }

        if (this.segments.length > this.length) {
            this.segments.pop();
        }

        // Handle wall wrapping
        if (this.head.x < 0) this.head.x = this.worldWidth;
        if (this.head.x > this.worldWidth) this.head.x = 0;
        if (this.head.y < 0) this.head.y = this.worldHeight;
        if (this.head.y > this.worldHeight) this.head.y = 0;
    }

    decideMove(foods, snakes) {
        // 1. Find nearest food
        let nearestFood = null;
        let minFoodDist = Infinity;

        // Scan a subset of food for performance if needed, but 300 isn't too many
        for (const food of foods) {
            const dist = Math.hypot(food.x - this.head.x, food.y - this.head.y);
            if (dist < minFoodDist && dist < 1000) { // Only care about food within 1000px
                minFoodDist = dist;
                nearestFood = food;
            }
        }

        // 2. Check for threats (bigger snakes) and prey (smaller snakes)
        let nearestThreat = null;
        let minThreatDist = Infinity;

        for (const other of snakes) {
            if (other === this) continue;

            const dist = Math.hypot(other.head.x - this.head.x, other.head.y - this.head.y);

            // If close
            if (dist < 400) {
                if (other.length > this.length * 1.2) {
                    // Threat
                    if (dist < minThreatDist) {
                        minThreatDist = dist;
                        nearestThreat = other;
                    }
                }
            }
        }

        // State Machine
        if (nearestThreat && minThreatDist < 200) {
            this.state = 'fleeing';
            // Run away from threat head
            const dx = this.head.x - nearestThreat.head.x;
            const dy = this.head.y - nearestThreat.head.y;
            this.targetAngle = Math.atan2(dy, dx);
        } else if (nearestFood) {
            this.state = 'hunting';
            const dx = nearestFood.x - this.head.x;
            const dy = nearestFood.y - this.head.y;
            this.targetAngle = Math.atan2(dy, dx);
        } else {
            this.state = 'wandering';
            this.changeDirTimer++;
            if (this.changeDirTimer > 50) {
                this.wanderAngle += (Math.random() - 0.5) * 2;
                this.changeDirTimer = 0;
            }
            this.targetAngle = this.wanderAngle;
        }

        // 3. Obstacle Avoidance (Raycasting-ish)
        this.avoidObstacles(snakes);
    }

    avoidObstacles(snakes) {
        // Look ahead vector
        const lookAheadDist = 100;
        const currentAngle = Math.atan2(this.vy, this.vx);
        const lookX = this.head.x + Math.cos(currentAngle) * lookAheadDist;
        const lookY = this.head.y + Math.sin(currentAngle) * lookAheadDist;

        let collisionImminent = false;

        // Check against all snakes segments
        for (const snake of snakes) {
            if (snake === this) continue;

            // Optimization: only check if snake is somewhat close
            if (Math.hypot(snake.head.x - this.head.x, snake.head.y - this.head.y) > 500) continue;

            for (let i = 0; i < snake.segments.length; i += 2) {
                const seg = snake.segments[i];
                const dist = Math.hypot(lookX - seg.x, lookY - seg.y);
                if (dist < this.thickness + snake.thickness + 20) {
                    collisionImminent = true;
                    break;
                }
            }
            if (collisionImminent) break;
        }

        if (collisionImminent) {
            // Emergency turn!
            this.targetAngle += Math.PI / 2; // Turn 90 degrees
        }
    }

    draw(ctx) {
        // Override draw to use custom color
        const theme = { primary: this.color, secondary: '#fff' };
        super.draw(ctx, theme);
    }
}
