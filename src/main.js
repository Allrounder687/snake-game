import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // UI Elements
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const hud = document.getElementById('hud');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const scoreDisplay = document.getElementById('score-display');
    const finalScoreDisplay = document.getElementById('final-score');

    // Start Game
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        startScreen.classList.remove('active');
        hud.classList.remove('hidden');
        game.start();
    });

    // Restart Game
    restartBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.classList.remove('active');
        hud.classList.remove('hidden');
        game.start();
    });

    // Listen for Game Over
    window.addEventListener('gameover', (e) => {
        const score = e.detail.score;
        finalScoreDisplay.textContent = `Score: ${score}`;
        hud.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('active');
    });

    // Listen for Score Updates
    window.addEventListener('scoreupdate', (e) => {
        scoreDisplay.textContent = e.detail.score;
    });
});
