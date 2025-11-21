export class Snake {
    constructor(x, y) {
        this.reset(x, y);
        this.turnSpeed = 4; // Radians per second
        this.speed = 150; // Pixels per second
        this.baseSpeed = 150;
        this.thickness = 12;
        this.gap = 8; // Distance between rendered segments

        // Input state
        this.keys = {
            left: false,
            right: false
        };

        this.bindControls();
    }

    bindControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
        });
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2; // Facing up
        this.segments = []; // History of points {x, y}
        this.growAmount = 0;
        this.length = 20; // Initial length (number of history points)

        // Initialize history
        for (let i = 0; i < this.length; i++) {
            this.segments.push({ x: x, y: y + i * 2 });
        }
    }

    get head() {
        return this.segments[0];
    }

    update(deltaTime) {
        // Turning
        if (this.keys.left) this.angle -= this.turnSpeed * deltaTime;
        if (this.keys.right) this.angle += this.turnSpeed * deltaTime;

        // Move Head
        const moveDist = this.speed * deltaTime;
        const newX = this.head.x + Math.cos(this.angle) * moveDist;
        const newY = this.head.y + Math.sin(this.angle) * moveDist;

        // Add new head position
        this.segments.unshift({ x: newX, y: newY });

        // Remove tail if not growing
        if (this.growAmount > 0) {
            this.length++;
            this.growAmount--;
        }

        // Maintain length
        // We calculate length based on distance between points to keep speed consistent
        // For simplicity in this version, we just trim the array to 'length'
        // A more advanced version would measure arc length
        if (this.segments.length > this.length) {
            this.segments.pop();
        }
    }

    grow() {
        this.growAmount += 10; // Add 10 history points
    }

    checkFoodCollision(food) {
        const dx = this.head.x - food.x;
        const dy = this.head.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (this.thickness + food.radius);
    }

    checkSelfCollision() {
        // Check collision with body segments (skip the first few to avoid head colliding with neck)
        const safeZone = 20;
        for (let i = safeZone; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const dx = this.head.x - seg.x;
            const dy = this.head.y - seg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.thickness) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, theme) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Shadow/Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = theme.primary;

        // Draw Body
        ctx.beginPath();
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = theme.primary;

        // Draw smooth curve through segments
        if (this.segments.length > 0) {
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            for (let i = 1; i < this.segments.length - 1; i++) {
                const xc = (this.segments[i].x + this.segments[i + 1].x) / 2;
                const yc = (this.segments[i].y + this.segments[i + 1].y) / 2;
                ctx.quadraticCurveTo(this.segments[i].x, this.segments[i].y, xc, yc);
            }
            // Connect to last point
            if (this.segments.length > 1) {
                const last = this.segments[this.segments.length - 1];
                ctx.lineTo(last.x, last.y);
            }
        }
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw Head Eyes
        const head = this.head;
        const eyeOffset = 4;
        const eyeSize = 2;

        ctx.fillStyle = '#fff';

        // Left Eye
        const lx = head.x + Math.cos(this.angle - Math.PI / 3) * eyeOffset;
        const ly = head.y + Math.sin(this.angle - Math.PI / 3) * eyeOffset;
        ctx.beginPath();
        ctx.arc(lx, ly, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right Eye
        const rx = head.x + Math.cos(this.angle + Math.PI / 3) * eyeOffset;
        const ry = head.y + Math.sin(this.angle + Math.PI / 3) * eyeOffset;
        ctx.beginPath();
        ctx.arc(rx, ry, eyeSize, 0, Math.PI * 2);
        ctx.fill();
    }
}
