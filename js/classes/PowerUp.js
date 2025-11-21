import { POWERUP_CONFIG } from '../config.js';

export default class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.createdAt = Date.now();
        this.lifetime = POWERUP_CONFIG.LIFETIME;
        this.pulse = 0;

        // Get type-specific properties
        const typeConfig = POWERUP_CONFIG.TYPES.find(t => t.name === type.name);
        this.icon = typeConfig.icon;
        this.color = typeConfig.color;
        this.description = typeConfig.description;
    }

    isExpired() {
        return Date.now() - this.createdAt > this.lifetime;
    }

    checkCollision(snake) {
        const head = snake.head;
        const dx = this.x - head.x;
        const dy = this.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (this.radius + snake.thickness / 2);
    }

    draw(ctx) {
        this.pulse += 0.15;
        const scale = 1 + Math.sin(this.pulse) * 0.3;

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Background circle
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * scale * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Main circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.shadowBlur = 0;
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
    }
}
