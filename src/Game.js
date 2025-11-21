import { Snake } from './Snake.js';
import { Food } from './Food.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ThemeManager } from './ThemeManager.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;

        this.running = false;
        this.score = 0;
        this.lastTime = 0;

        this.themeManager = new ThemeManager();
        this.particleSystem = new ParticleSystem();
        this.snake = new Snake(this.width / 2, this.height / 2);
        this.food = new Food(this.width, this.height);

        // Handle Window Resize
        window.addEventListener('resize', () => {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        });

        // Bind Loop
        this.loop = this.loop.bind(this);
    }

    start() {
        this.running = true;
        this.score = 0;
        this.snake.reset(this.width / 2, this.height / 2);
        this.food.spawn(this.snake.segments);
        this.particleSystem.reset();
        this.lastTime = performance.now();

        // Reset Score UI
        window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: 0 } }));

        requestAnimationFrame(this.loop);
    }

    stop() {
        this.running = false;
        window.dispatchEvent(new CustomEvent('gameover', { detail: { score: this.score } }));
    }

    loop(timestamp) {
        if (!this.running) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        this.snake.update(deltaTime);
        this.particleSystem.update(deltaTime);

        // Wall Wrapping
        this.handleWallWrapping();

        // Collision with Food
        if (this.snake.checkFoodCollision(this.food)) {
            this.score += 10;
            this.snake.grow();
            this.food.spawn(this.snake.segments);
            this.particleSystem.createExplosion(this.food.x, this.food.y, this.themeManager.currentTheme.primary);

            // Update Score UI
            window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: this.score } }));

            // Check for Theme Update
            this.themeManager.checkProgression(this.score);
        }

        // Collision with Self
        if (this.snake.checkSelfCollision()) {
            this.particleSystem.createExplosion(this.snake.head.x, this.snake.head.y, '#ff0000');
            this.stop();
        }
    }

    handleWallWrapping() {
        const head = this.snake.head;
        if (head.x < 0) head.x = this.width;
        if (head.x > this.width) head.x = 0;
        if (head.y < 0) head.y = this.height;
        if (head.y > this.height) head.y = 0;
    }

    draw() {
        // Clear with theme background
        this.ctx.fillStyle = this.themeManager.currentTheme.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Elements
        this.food.draw(this.ctx, this.themeManager.currentTheme);
        this.snake.draw(this.ctx, this.themeManager.currentTheme);
        this.particleSystem.draw(this.ctx);
    }
}
