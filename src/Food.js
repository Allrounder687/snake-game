export class Food {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 0;
        this.y = 0;
        this.radius = 6;
        this.pulse = 0;
    }

    spawn(snakeSegments) {
        let valid = false;
        while (!valid) {
            this.x = Math.random() * (this.gameWidth - 40) + 20;
            this.y = Math.random() * (this.gameHeight - 40) + 20;

            // Simple check to ensure not spawning on snake
            // For performance, we just check a few points or distance to head
            // A full check might be too expensive if snake is huge, but for now:
            valid = true;
            for (let i = 0; i < snakeSegments.length; i += 5) { // Check every 5th segment
                const seg = snakeSegments[i];
                const dx = this.x - seg.x;
                const dy = this.y - seg.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    valid = false;
                    break;
                }
            }
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
