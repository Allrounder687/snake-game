import { THEMES } from '../config.js';

export default class ThemeManager {
    constructor() {
        this.themes = THEMES;
        this.currentIndex = 0;
    }

    get currentTheme() {
        return this.themes[this.currentIndex];
    }

    setTheme(index) {
        if (index >= 0 && index < this.themes.length) {
            this.currentIndex = index;
            this.updateUI();

            // Preload image if exists
            if (this.currentTheme.bgImage && !this.currentTheme.imgObject) {
                const img = new Image();
                img.src = this.currentTheme.bgImage;
                this.currentTheme.imgObject = img;
            }
        }
    }

    checkProgression(score) {
        // Only progress automatically if we haven't manually selected a later theme
        // Or we can disable auto-progression if manual selection is used.
        // For now, let's keep simple progression logic but it might override manual choice if score matches.
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
        document.documentElement.style.setProperty('--primary-color', this.currentTheme.primary);
    }
}
