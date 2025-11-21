import { GAME_CONFIG } from '../config.js';

export default class Food {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 0;
        this.y = 0;
        this.radius = GAME_CONFIG.FOOD_RADIUS;
        this.pulse = 0;
    }

    spawn(snakeSegments, worldWidth, worldHeight, x = null, y = null) {
        if (x !== null && y !== null) {
            this.x = x;
            this.y = y;
            return;
        }

        let valid = false;
        let attempts = 0;
        while (!valid && attempts < 50) {
            this.x = Math.random() * (worldWidth - 40) + 20;
            this.y = Math.random() * (worldHeight - 40) + 20;

            valid = true;
            // Optional: Check collision with snakes to avoid spawning inside them
            // For performance with many foods, we might skip this or do it lightly
            if (snakeSegments) {
                for (let i = 0; i < snakeSegments.length; i += 10) {
                    const seg = snakeSegments[i];
                    const dx = this.x - seg.x;
                    const dy = this.y - seg.y;
                    if (Math.hypot(dx, dy) < 50) {
                        valid = false;
                        break;
                    }
                }
            }
            attempts++;
        }
    }

    draw(ctx, theme) {
        this.pulse += 0.1;
        const scale = 1 + Math.sin(this.pulse) * 0.2;

        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.secondary;
        ctx.fillStyle = theme.secondary;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
