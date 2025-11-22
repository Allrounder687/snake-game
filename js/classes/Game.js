import ThemeManager from './ThemeManager.js';
import ParticleSystem from './ParticleSystem.js';
import Food from './Food.js';
import Snake from './Snake.js';
import EnemySnake from './EnemySnake.js';
import PowerUp from './PowerUp.js';
import AudioManager from './AudioManager.js';
import GeminiService from './GeminiService.js';
import MobileController from './MobileController.js';
import TouchController from './TouchController.js';
import { GAME_CONFIG, POWERUP_CONFIG, WORLD_CONFIG } from '../config.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Canvas dimensions (Viewport)
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.canvas.width = this.viewport.width;
        this.canvas.height = this.viewport.height;

        // World dimensions
        this.worldWidth = WORLD_CONFIG.WIDTH;
        this.worldHeight = WORLD_CONFIG.HEIGHT;

        this.running = false;
        this.paused = false;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.lastTime = 0;
        this.frameCount = 0; // For throttling

        this.themeManager = new ThemeManager();
        this.particleSystem = new ParticleSystem();

        // Spawn player in middle of world
        this.snake = new Snake(this.worldWidth / 2, this.worldHeight / 2);
        this.foods = []; // Array for multiple food items
        this.audioManager = new AudioManager();
        this.geminiService = new GeminiService();

        // Power-up system
        this.powerUps = [];
        this.activePowerUps = [];

        // Enemy System
        this.enemies = [];
        this.maxEnemies = GAME_CONFIG.MAX_ENEMIES;
        this.enemySpawnTimer = 0;

        window.addEventListener('resize', () => {
            this.viewport.width = this.canvas.width = window.innerWidth;
            this.viewport.height = this.canvas.height = window.innerHeight;
        });

        // Taunt Pool
        this.tauntPool = {
            'start': [],
            'eat': [],
            'die': []
        };
        this.isPreloading = false;
        this.preloadTaunts();

        // Mobile Support
        this.mobileController = new MobileController();
        this.touchController = null;

        if (this.mobileController.isMobile()) {
            this.setupMobileControls();
        }
    }

    async preloadTaunts() {
        if (this.isPreloading) return;
        this.isPreloading = true;
        console.log('Preloading taunts...');

        try {
            // Preload for each category if low on taunts
            if (this.tauntPool['start'].length < 2) await this.fillPool('start', 'starting the game');
            if (this.tauntPool['eat'].length < 3) await this.fillPool('eat', 'eating food');
            if (this.tauntPool['die'].length < 2) await this.fillPool('die', 'dying in the game');
        } catch (e) {
            console.error('Preload failed:', e);
        } finally {
            this.isPreloading = false;
        }
    }

    async fillPool(category, context) {
        const texts = await this.geminiService.generateTauntBatch(context, 3);
        for (const text of texts) {
            try {
                const buffer = await this.audioManager.generateAudioBuffer(text);
                this.tauntPool[category].push({ text, buffer });
            } catch (e) {
                console.warn('Failed to buffer taunt:', text, e);
            }
        }
        console.log(`Pool '${category}' size: ${this.tauntPool[category].length}`);
    }

    setupMobileControls() {
        // Initialize touch controller
        this.touchController = new TouchController(this);

        // Prevent default touch behaviors
        this.mobileController.preventDefaultTouchBehaviors();

        // Touch controls will be shown when game starts
        // Keep them hidden on menu screens to avoid blocking UI buttons

        console.log('Mobile controls initialized');
    }

    start() {
        // Mobile: Check orientation and request landscape
        if (this.mobileController && this.mobileController.isMobile()) {
            if (!this.mobileController.isLandscape()) {
                // Show orientation prompt and wait for landscape
                this.mobileController.showOrientationPrompt();
                return; // Don't start game until in landscape
            }

            // Request fullscreen and landscape lock
            this.mobileController.requestLandscape();
        }

        this.running = true;
        this.paused = false;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.powerUps = [];
        this.activePowerUps = [];
        this.enemies = [];
        this.snake.reset(this.worldWidth / 2, this.worldHeight / 2);

        // Apply selected settings
        const themeSelect = document.getElementById('theme-select');
        const snakeSelect = document.getElementById('snake-select');
        const speedSelect = document.getElementById('speed-select');

        this.themeManager.setTheme(parseInt(themeSelect.value));
        this.snake.type = snakeSelect.value;

        // Apply speed setting (Default to Insane - Index 3)
        const speedIndex = parseInt(speedSelect.value) || 3;
        this.snake.speed = GAME_CONFIG.SPEED_OPTIONS[speedIndex].value;
        if (speedSelect.value !== String(speedIndex)) speedSelect.value = String(speedIndex);

        // Spawn initial food
        this.foods = [];
        for (let i = 0; i < GAME_CONFIG.FOOD_COUNT; i++) {
            const f = new Food(this.worldWidth, this.worldHeight);
            f.spawn(null, this.worldWidth, this.worldHeight);
            this.foods.push(f);
        }

        this.particleSystem.reset();
        this.lastTime = performance.now();

        window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: 0 } }));

        this.audioManager.playMusic();
        this.triggerTaunt('started the game');

        // Show touch controls on mobile during gameplay
        if (this.touchController) {
            this.touchController.show();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
        this.audioManager.stopMusic();
        this.triggerTaunt('died with score ' + this.score);

        // Hide touch controls when returning to menu
        if (this.touchController) {
            this.touchController.hide();
        }

        window.dispatchEvent(new CustomEvent('gameover', { detail: { score: this.score } }));
    }

    async triggerTaunt(context) {
        let category = 'eat';
        if (context.includes('died')) category = 'die';
        if (context.includes('started')) category = 'start';

        // Try to play from pool
        if (this.tauntPool[category] && this.tauntPool[category].length > 0) {
            const taunt = this.tauntPool[category].shift(); // Get first
            console.log('Playing cached taunt:', taunt.text);
            this.audioManager.playBuffer(taunt.buffer);

            // Replenish pool in background
            this.preloadTaunts();
        } else {
            // Fallback to real-time if pool empty (rare if preloaded)
            console.log('Pool empty, generating real-time taunt...');
            const taunt = await this.geminiService.generateTaunt(context);
            if (taunt) {
                this.audioManager.speak(taunt);
            }
        }
    }

    togglePause() {
        if (!this.running) return;
        this.paused = !this.paused;

        const pauseMenu = document.getElementById('pause-menu');
        if (this.paused) {
            pauseMenu.classList.remove('hidden');
            pauseMenu.classList.add('active');
            this.audioManager.stopMusic();
        } else {
            pauseMenu.classList.add('hidden');
            pauseMenu.classList.remove('active');
            this.lastTime = performance.now(); // Reset time to prevent jump
            this.audioManager.playMusic();
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    saveState() {
        const state = {
            score: this.score,
            snake: {
                segments: this.snake.segments,
                vx: this.snake.vx,
                vy: this.snake.vy,
                length: this.snake.length,
                type: this.snake.type
            },
            themeIndex: this.themeManager.currentIndex
        };
        localStorage.setItem('snakeGameState', JSON.stringify(state));
        this.audioManager.speak('Game Saved');
    }

    loadState() {
        const saved = localStorage.getItem('snakeGameState');
        if (saved) {
            const state = JSON.parse(saved);
            this.score = state.score;
            this.snake.segments = state.snake.segments;
            this.snake.vx = state.snake.vx;
            this.snake.vy = state.snake.vy;
            this.snake.length = state.snake.length;
            this.snake.type = state.snake.type;
            this.themeManager.setTheme(state.themeIndex);

            this.running = true;
            this.paused = true; // Load paused
            this.lastTime = performance.now();

            window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: this.score } }));

            // Show pause menu immediately
            const pauseMenu = document.getElementById('pause-menu');
            pauseMenu.classList.remove('hidden');
            pauseMenu.classList.add('active');

            // Hide start screen
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('active');
            document.getElementById('hud').classList.remove('hidden');

            requestAnimationFrame((t) => this.loop(t));
        }
    }

    spawnEnemy() {
        if (this.enemies.length < this.maxEnemies) {
            let x, y;
            do {
                x = Math.random() * this.worldWidth;
                y = Math.random() * this.worldHeight;
            } while (Math.hypot(x - this.snake.head.x, y - this.snake.head.y) < 500); // Spawn further away

            const colors = ['#ff0000', '#ff00ff', '#ffff00', '#00ffff', '#ff8800', '#00ff00'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.enemies.push(new EnemySnake(x, y, color, this.worldWidth, this.worldHeight));
        }
    }

    loop(timestamp) {
        if (!this.running) return;
        if (this.paused) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(deltaTime) {
        this.frameCount++;

        this.snake.update(deltaTime);
        this.particleSystem.update(deltaTime);

        this.handleWallWrapping();

        // Spawn Enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > 2) { // Faster spawn rate
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }

        // Combine all snakes for AI awareness
        const allSnakes = [this.snake, ...this.enemies];

        // Update Enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update(deltaTime, this.foods, allSnakes);

            // Enemy vs Food
            for (let i = this.foods.length - 1; i >= 0; i--) {
                const food = this.foods[i];
                // Simple distance check first
                if (Math.abs(enemy.head.x - food.x) < 50 && Math.abs(enemy.head.y - food.y) < 50) {
                    if (enemy.checkFoodCollision(food)) {
                        enemy.grow();
                        // Respawn food elsewhere
                        food.spawn(null, this.worldWidth, this.worldHeight);
                    }
                }
            }

            // Enemy vs Player Body (Enemy Dies)
            if (this.checkCollisionWithSnake(enemy.head, this.snake)) {
                this.killEnemy(index);
                this.audioManager.speak("You killed an enemy!");
            }

            // Player vs Enemy Body (Player Dies)
            if (!this.snake.ghostMode && this.checkCollisionWithSnake(this.snake.head, enemy)) {
                this.stop();
            }

            // Enemy vs Enemy
            for (let j = 0; j < this.enemies.length; j++) {
                if (index === j) continue;
                const other = this.enemies[j];
                if (this.checkCollisionWithSnake(enemy.head, other)) {
                    this.killEnemy(index);
                    break; // Enemy died
                }
            }
        });

        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];

            if (powerUp.isExpired()) {
                this.powerUps.splice(i, 1);
            } else if (powerUp.checkCollision(this.snake)) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }

        // Update active power-up effects
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const effect = this.activePowerUps[i];
            const elapsed = Date.now() - effect.startTime;

            if (elapsed >= effect.duration) {
                // Remove effect
                if (effect.type === 'speed' || effect.type === 'slow') {
                    this.snake.speed /= effect.config.speedMultiplier;
                } else if (effect.type === 'ghost') {
                    this.snake.ghostMode = false;
                } else if (effect.type === 'multiplier') {
                    this.scoreMultiplier = 1;
                }
                this.activePowerUps.splice(i, 1);
                this.updatePowerUpIndicators();
            }
        }

        // Player vs Food
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            // Optimization: Simple distance check
            if (Math.abs(this.snake.head.x - food.x) < 50 && Math.abs(this.snake.head.y - food.y) < 50) {
                if (this.snake.checkFoodCollision(food)) {
                    const points = GAME_CONFIG.FOOD_VALUE * this.scoreMultiplier;
                    this.score += points;
                    this.snake.grow();

                    // Respawn food
                    food.spawn(null, this.worldWidth, this.worldHeight);

                    this.particleSystem.createExplosion(food.x, food.y, this.themeManager.currentTheme.primary);
                    this.audioManager.playSound('eat');

                    window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: this.score } }));

                    this.themeManager.checkProgression(this.score);
                    this.spawnPowerUp();

                    // Only taunt occasionally to avoid spam
                    if (Math.random() < 0.1) this.triggerTaunt('ate food');
                }
            }
        }

        // Self collision (unless in ghost mode)
        if (!this.snake.ghostMode && this.snake.checkSelfCollision()) {
            this.particleSystem.createExplosion(this.snake.head.x, this.snake.head.y, '#ff0000');
            this.stop();
        }

        // Update power-up indicators
        if (this.activePowerUps.length > 0) {
            this.updatePowerUpIndicators();
        }
    }

    checkCollisionWithSnake(point, snake) {
        // Optimization: Bounding box check first
        const distToHead = Math.hypot(point.x - snake.head.x, point.y - snake.head.y);
        if (distToHead > snake.length * snake.thickness * 2) {
            return false;
        }

        // Check if point collides with any segment of snake
        for (let i = 0; i < snake.segments.length; i++) {
            const seg = snake.segments[i];
            // Optimization: Simple box check before sqrt
            if (Math.abs(point.x - seg.x) < snake.thickness && Math.abs(point.y - seg.y) < snake.thickness) {
                const dist = Math.hypot(point.x - seg.x, point.y - seg.y);
                if (dist < snake.thickness) return true;
            }
        }
        return false;
    }

    killEnemy(index) {
        const enemy = this.enemies[index];
        // Turn segments into food
        for (let i = 0; i < enemy.segments.length; i += 2) { // Every 2nd segment
            const seg = enemy.segments[i];
            this.particleSystem.createExplosion(seg.x, seg.y, enemy.color);

            // Spawn a new food item at this location
            const f = new Food(this.worldWidth, this.worldHeight);
            f.spawn(null, this.worldWidth, this.worldHeight, seg.x, seg.y);
            this.foods.push(f);
        }

        this.score += 500; // Big bonus for kill
        window.dispatchEvent(new CustomEvent('scoreupdate', { detail: { score: this.score } }));
        this.enemies.splice(index, 1);
    }

    spawnPowerUp() {
        if (Math.random() < POWERUP_CONFIG.SPAWN_CHANCE) {
            const typeIndex = Math.floor(Math.random() * POWERUP_CONFIG.TYPES.length);
            const type = POWERUP_CONFIG.TYPES[typeIndex];

            const x = Math.random() * (this.worldWidth - 100) + 50;
            const y = Math.random() * (this.worldHeight - 100) + 50;

            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    collectPowerUp(powerUp) {
        const effect = {
            type: powerUp.type.name,
            startTime: Date.now(),
            duration: POWERUP_CONFIG.EFFECT_DURATION,
            config: powerUp.type
        };

        this.activePowerUps.push(effect);
        this.audioManager.playSound('powerup');
        this.audioManager.speak(powerUp.description);
        this.particleSystem.createExplosion(powerUp.x, powerUp.y, powerUp.color);

        // Apply immediate effects
        if (effect.type === 'speed') {
            this.snake.speed *= effect.config.speedMultiplier;
        } else if (effect.type === 'slow') {
            this.snake.speed *= effect.config.speedMultiplier;
        } else if (effect.type === 'ghost') {
            this.snake.ghostMode = true;
        } else if (effect.type === 'multiplier') {
            this.scoreMultiplier = effect.config.scoreMultiplier;
        }

        this.updatePowerUpIndicators();
    }

    updatePowerUpIndicators() {
        const container = document.getElementById('powerup-indicators');
        container.innerHTML = '';

        this.activePowerUps.forEach(effect => {
            const remaining = Math.max(0, effect.duration - (Date.now() - effect.startTime));
            const seconds = Math.ceil(remaining / 1000);

            const indicator = document.createElement('div');
            indicator.className = 'powerup-indicator';
            indicator.style.borderColor = effect.config.color;
            indicator.innerHTML = `
                <span class="icon">${effect.config.icon}</span>
                <span class="timer">${seconds}s</span>
            `;
            container.appendChild(indicator);
        });
    }

    handleWallWrapping() {
        const head = this.snake.head;
        if (head.x < 0) head.x = this.worldWidth;
        if (head.x > this.worldWidth) head.x = 0;
        if (head.y < 0) head.y = this.worldHeight;
        if (head.y > this.worldHeight) head.y = 0;
    }

    drawGrid(cameraX, cameraY) {
        const gridSize = WORLD_CONFIG.GRID_SIZE;
        const theme = this.themeManager.currentTheme;

        this.ctx.save();
        this.ctx.strokeStyle = theme.grid || '#333';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        const startX = Math.floor(cameraX / gridSize) * gridSize;
        const startY = Math.floor(cameraY / gridSize) * gridSize;

        this.ctx.beginPath();
        for (let x = startX; x < cameraX + this.viewport.width + gridSize; x += gridSize) {
            this.ctx.moveTo(x, cameraY);
            this.ctx.lineTo(x, cameraY + this.viewport.height);
        }
        for (let y = startY; y < cameraY + this.viewport.height + gridSize; y += gridSize) {
            this.ctx.moveTo(cameraX, y);
            this.ctx.lineTo(cameraX + this.viewport.width, y);
        }
        this.ctx.stroke();

        // Draw World Borders
        this.ctx.strokeStyle = theme.primary;
        this.ctx.lineWidth = 5;
        this.ctx.globalAlpha = 1;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        this.ctx.restore();
    }

    isInViewport(obj, buffer = 100) {
        // Simple AABB check with camera
        const camX = this.snake.head.x - this.viewport.width / 2;
        const camY = this.snake.head.y - this.viewport.height / 2;

        return (
            obj.x >= camX - buffer &&
            obj.x <= camX + this.viewport.width + buffer &&
            obj.y >= camY - buffer &&
            obj.y <= camY + this.viewport.height + buffer
        );
    }

    draw() {
        const theme = this.themeManager.currentTheme;

        // Clear screen with solid color
        this.ctx.fillStyle = theme.bg;
        this.ctx.fillRect(0, 0, this.viewport.width, this.viewport.height);

        // Calculate Camera Position (centered on player)
        let camX = this.snake.head.x - this.viewport.width / 2;
        let camY = this.snake.head.y - this.viewport.height / 2;

        this.ctx.save();
        this.ctx.translate(-camX, -camY);

        // Draw background image if exists (tiled)
        if (theme.bgImage && theme.imgObject && theme.imgObject.complete) {
            const img = theme.imgObject;
            const pattern = this.ctx.createPattern(img, 'repeat');
            if (pattern) {
                this.ctx.fillStyle = pattern;
                this.ctx.globalAlpha = 0.3; // Semi-transparent overlay
                this.ctx.fillRect(camX, camY, this.viewport.width, this.viewport.height);
                this.ctx.globalAlpha = 1;
            }
        }

        this.drawGrid(camX, camY);

        // Draw Food (Cull off-screen)
        for (const food of this.foods) {
            if (this.isInViewport(food)) {
                food.draw(this.ctx, theme);
            }
        }

        // Draw Powerups (Cull off-screen)
        for (const powerUp of this.powerUps) {
            if (this.isInViewport(powerUp)) {
                powerUp.draw(this.ctx);
            }
        }

        // Draw Enemies (Cull off-screen)
        this.enemies.forEach(enemy => {
            // Check if head is in viewport (simple check, could be better)
            if (this.isInViewport(enemy.head, 500)) { // Larger buffer for snakes
                enemy.draw(this.ctx);
            }
        });

        // Draw Player
        this.snake.draw(this.ctx, theme);

        this.particleSystem.draw(this.ctx);

        this.ctx.restore();
    }
}
