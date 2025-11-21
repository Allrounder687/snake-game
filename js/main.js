import Game from './classes/Game.js';

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);

    // Get UI elements
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const pauseMenu = document.getElementById('pause-menu');
    const hud = document.getElementById('hud');

    const startBtn = document.getElementById('start-btn');
    const continueBtn = document.getElementById('continue-btn');
    const restartBtn = document.getElementById('restart-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const saveQuitBtn = document.getElementById('save-quit-btn');

    const scoreDisplay = document.getElementById('score-display');
    const finalScoreDisplay = document.getElementById('final-score');

    // Check for saved game
    if (localStorage.getItem('snakeGameState')) {
        continueBtn.style.display = 'block';
    }

    // Event Listeners
    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        startScreen.classList.remove('active');
        hud.classList.remove('hidden');
        game.start();
    });

    continueBtn.addEventListener('click', () => {
        game.loadState();
    });

    restartBtn.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.classList.remove('active');
        hud.classList.remove('hidden');
        game.start();
    });

    pauseBtn.addEventListener('click', () => {
        game.togglePause();
    });

    // Mute button
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        const isMuted = game.audioManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    resumeBtn.addEventListener('click', () => {
        game.togglePause();
    });

    saveQuitBtn.addEventListener('click', () => {
        game.saveState();
        // Return to main menu
        pauseMenu.classList.add('hidden');
        pauseMenu.classList.remove('active');
        hud.classList.add('hidden');
        startScreen.classList.remove('hidden');
        startScreen.classList.add('active');
        game.running = false;
        continueBtn.style.display = 'block';
    });

    // Keyboard pause
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p') {
            if (game.running) {
                game.togglePause();
            }
        }
    });

    // Game event listeners
    window.addEventListener('gameover', (e) => {
        const score = e.detail.score;
        finalScoreDisplay.textContent = `Score: ${score}`;
        hud.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('active');
        localStorage.removeItem('snakeGameState'); // Clear save on death
        continueBtn.style.display = 'none';
    });

    window.addEventListener('scoreupdate', (e) => {
        scoreDisplay.textContent = e.detail.score;
    });
});
