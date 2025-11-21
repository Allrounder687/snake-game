import { GAME_CONFIG } from '../config.js';

export default class Snake {
    constructor(x, y) {
        this.reset(x, y);
        this.speed = GAME_CONFIG.SNAKE_SPEED;
        this.thickness = GAME_CONFIG.SNAKE_THICKNESS;
        this.vx = 0;
        this.vy = -this.speed;
        this.inputQueue = [];
        this.type = 'classic';
        this.ghostMode = false; // For ghost power-up
        this.bindControls();
    }

    bindControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowup' || key === 'w') this.inputQueue.push({ x: 0, y: -1 });
            if (key === 'arrowdown' || key === 's') this.inputQueue.push({ x: 0, y: 1 });
            if (key === 'arrowleft' || key === 'a') this.inputQueue.push({ x: -1, y: 0 });
            if (key === 'arrowright' || key === 'd') this.inputQueue.push({ x: 1, y: 0 });
        });
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.segments = [];
        this.growAmount = 0;
        this.length = 30;
        this.vx = 0;
        this.vy = -this.speed;
        this.inputQueue = [];
        for (let i = 0; i < this.length; i++) {
            this.segments.push({ x: x, y: y + i * 2 });
        }
    }

    get head() {
        return this.segments[0];
    }

    update(deltaTime) {
        if (this.inputQueue.length > 0) {
            const nextDir = this.inputQueue.shift();
            if (this.vy !== 0 && nextDir.x !== 0) {
                this.vx = nextDir.x * this.speed;
                this.vy = 0;
            } else if (this.vx !== 0 && nextDir.y !== 0) {
                this.vx = 0;
                this.vy = nextDir.y * this.speed;
            }
        }

        const moveDist = this.speed * deltaTime;
        const newX = this.head.x + (this.vx !== 0 ? Math.sign(this.vx) * moveDist : 0);
        const newY = this.head.y + (this.vy !== 0 ? Math.sign(this.vy) * moveDist : 0);

        this.segments.unshift({ x: newX, y: newY });

        if (this.growAmount > 0) {
            this.length++;
            this.growAmount--;
        }

        if (this.segments.length > this.length) {
            this.segments.pop();
        }
    }

    grow() {
        this.growAmount += GAME_CONFIG.GROWTH_AMOUNT;
    }

    checkFoodCollision(food) {
        const dx = this.head.x - food.x;
        const dy = this.head.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (this.thickness + food.radius);
    }

    checkSelfCollision() {
        const safeZone = GAME_CONFIG.SAFE_COLLISION_ZONE;
        for (let i = safeZone; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const dx = this.head.x - seg.x;
            const dy = this.head.y - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.thickness - 2) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, theme) {
        // Draw body
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Optimize: Use fake glow instead of shadowBlur (huge performance gain)
        // Draw thicker transparent line for glow
        ctx.lineWidth = this.thickness + 10;
        ctx.strokeStyle = theme.primary;
        ctx.globalAlpha = 0.2;
        this.drawBodyPath(ctx);

        // Draw actual body
        ctx.globalAlpha = 1;
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = theme.primary;

        if (this.ghostMode) {
            ctx.globalAlpha = 0.5;
        }

        this.drawBodyPath(ctx);

        ctx.globalAlpha = 1;

        // Draw Head
        this.drawHead(ctx, theme);
    }

    drawBodyPath(ctx) {
        if (this.segments.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);

        for (let i = 1; i < this.segments.length; i++) {
            const pPrev = this.segments[i - 1];
            const pCurr = this.segments[i];

            // Check for wrapping (large jump)
            if (Math.abs(pCurr.x - pPrev.x) > 100 || Math.abs(pCurr.y - pPrev.y) > 100) {
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pCurr.x, pCurr.y);
            } else {
                ctx.lineTo(pCurr.x, pCurr.y);
            }
        }
        ctx.stroke();
    }

    drawHead(ctx, theme) {
        const head = this.head;
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(angle);

        // Head shape
        ctx.fillStyle = theme.primary;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.thickness, this.thickness * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeOffset = this.thickness * 0.4;
        const eyeSize = this.thickness * 0.25;

        ctx.fillStyle = '#fff';

        // Left Eye
        ctx.beginPath();
        ctx.arc(eyeOffset, -eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.arc(eyeOffset, eyeOffset, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        const pupilSize = eyeSize * 0.5;
        const pupilOffset = eyeSize * 0.3;

        ctx.beginPath();
        ctx.arc(eyeOffset + pupilOffset, -eyeOffset, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(eyeOffset + pupilOffset, eyeOffset, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
