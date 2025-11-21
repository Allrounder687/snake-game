export class ThemeManager {
    constructor() {
        this.themes = [
            {
                name: 'Neon Night',
                score: 0,
                bg: '#111',
                primary: '#00ff88', // Green
                secondary: '#00ffff' // Cyan
            },
            {
                name: 'Cyber Red',
                score: 100,
                bg: '#1a0505',
                primary: '#ff0055', // Red/Pink
                secondary: '#ffcc00' // Gold
            },
            {
                name: 'Deep Ocean',
                score: 200,
                bg: '#001133',
                primary: '#00aaff', // Blue
                secondary: '#ff00ff' // Magenta
            },
            {
                name: 'Solar Flare',
                score: 300,
                bg: '#221100',
                primary: '#ffaa00', // Orange
                secondary: '#ffffff' // White
            }
        ];

        this.currentIndex = 0;
    }

    get currentTheme() {
        return this.themes[this.currentIndex];
    }

    checkProgression(score) {
        // Check if we should advance to next theme
        if (this.currentIndex < this.themes.length - 1) {
            if (score >= this.themes[this.currentIndex + 1].score) {
                this.currentIndex++;
                this.updateUI();
            }
        }
    }

    updateUI() {
        const themeDisplay = document.getElementById('theme-display');
        if (themeDisplay) {
            themeDisplay.textContent = this.currentTheme.name;
            themeDisplay.style.color = this.currentTheme.primary;
        }

        // Update CSS variables for UI consistency if needed
        document.documentElement.style.setProperty('--primary-color', this.currentTheme.primary);
    }
}
