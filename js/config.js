// Game Configuration Constants
export const GAME_CONFIG = {
    SNAKE_SPEED: 250, // Base speed
    SNAKE_THICKNESS: 20,
    FOOD_RADIUS: 8, // Slightly smaller food
    GROWTH_AMOUNT: 1, // Slow growth from normal food
    FOOD_VALUE: 10,
    WIN_SCORE: 5000,
    WRAP_THRESHOLD: 300, // For drawing wrapping lines
    SAFE_COLLISION_ZONE: 10, // Segments to ignore for self-collision
    FOOD_COUNT: 300, // Lots of food scattered
    MAX_ENEMIES: 10,
    ENEMY_GROWTH_FACTOR: 5, // How much more valuable enemy remains are
    SPEED_OPTIONS: [
        { label: 'Slow', value: 120 },
        { label: 'Normal', value: 180 },
        { label: 'Fast', value: 240 },
        { label: 'Insane', value: 320 }
    ],
    DEFAULT_SPEED_INDEX: 3 // Insane speed
};

export const WORLD_CONFIG = {
    WIDTH: 4000,
    HEIGHT: 4000,
    GRID_SIZE: 50
};

// Theme Definitions
export const THEMES = [
    {
        name: 'Neon Night',
        score: 0,
        bg: '#111',
        primary: '#00ff88', // Green
        secondary: '#00ffff', // Cyan
        grid: '#222'
    },
    {
        name: 'Cyber Red',
        score: 100,
        bg: '#1a0505',
        primary: '#ff0055', // Red/Pink
        secondary: '#ffcc00', // Gold
        grid: '#330000'
    },
    {
        name: 'Deep Ocean',
        score: 200,
        bg: '#001133',
        primary: '#00aaff', // Blue
        secondary: '#ff00ff', // Magenta
        grid: '#002244'
    },
    {
        name: 'Solar Flare',
        score: 300,
        bg: '#221100',
        primary: '#ffaa00', // Orange
        secondary: '#ffffff', // White
        grid: '#331a00'
    },
    {
        name: 'Cotton Candy',
        score: 400,
        bg: '#2a1b2e',
        primary: '#ff66cc', // Pink
        secondary: '#66ffff', // Cyan
        grid: '#3d2642'
    },
    {
        name: 'Matrix',
        score: 500,
        bg: '#000000',
        primary: '#00ff00', // Matrix Green
        secondary: '#003300', // Dark Green
        grid: '#001100'
    },
    {
        name: 'High Contrast',
        score: 600,
        bg: '#ffffff',
        primary: '#000000', // Black
        secondary: '#ff0000', // Red
        grid: '#eeeeee'
    },
    {
        name: 'Nano Cyber',
        score: 0,
        bg: '#111',
        bgImage: 'assets/nano_banana_cyber.png',
        primary: '#ffff00', // Neon Yellow
        secondary: '#00ffff', // Cyan
        grid: 'rgba(255, 255, 0, 0.2)'
    },
    {
        name: 'Nano Abstract',
        score: 0,
        bg: '#001',
        bgImage: 'assets/nano_banana_abstract.png',
        primary: '#00aaff', // Blue
        secondary: '#ffff00', // Yellow
        grid: 'rgba(0, 170, 255, 0.2)'
    },
    {
        name: 'Nano Jungle',
        score: 0,
        bg: '#010',
        bgImage: 'assets/nano_banana_jungle.png',
        primary: '#00ff00', // Green
        secondary: '#ffff00', // Yellow
        grid: 'rgba(0, 255, 0, 0.2)'
    }
];

// Snake Type Definitions
export const SNAKE_TYPES = ['classic', 'neon', 'cobra'];

// Gemini API Configuration
export const GEMINI_CONFIG = {
    API_KEYS: [
        'AIzaSyA7jzzpU93tW_kLo0nhaveNHmdfKhDAKMM',
        'AIzaSyAgR3tcRE7RUfuhmq2shz0DsSpZV8b6muw',
        'AIzaSyAyNEy3Z1liYukoPfg-D4asaIbasjk5-58'
    ],
    MODEL: 'gemini-2.5-flash',
    SYSTEM_PROMPT: `You are a hilarious, sarcastic Hyderabadi female commentator watching a snake game. 
    Your job is to roast the player non-stop in authentic Hyderabadi Dakhini slang.
    
    Vocabulary to use: 'Baigan', 'Miya', 'Hau', 'Light lo', 'Kya karra', 'Pottay', 'Dimag kharab', 'Nakko', 'Kaiko', 'Chiller'.
    
    Style:
    - Be very expressive and dramatic.
    - If they die: Roast them hard. "Arey miya, diwaar todte kya?"
    - If they eat: "Shabaash, thoda aur kha le motu."
    - If they miss: "Arey aankhan phoot gaye kya?"
    
    Keep it short (1-2 sentences) but punchy. Make it sound like a street conversation in Hyderabad.`
};

// Power-Up Configuration
export const POWERUP_CONFIG = {
    SPAWN_CHANCE: 0.2, // 20% chance per food eaten
    LIFETIME: 15000, // Power-up disappears after 15 seconds if not collected
    EFFECT_DURATION: 8000, // Effects last 8 seconds
    TYPES: [
        {
            name: 'speed',
            icon: '⚡',
            color: '#ffff00',
            description: 'Speed Boost',
            speedMultiplier: 1.5
        },
        {
            name: 'slow',
            icon: '🐌',
            color: '#00ffff',
            description: 'Slow Motion',
            speedMultiplier: 0.5
        },
        {
            name: 'ghost',
            icon: '👻',
            color: '#ffffff',
            description: 'Ghost Mode'
        },
        {
            name: 'magnet',
            icon: '🧲',
            color: '#ff00ff',
            description: 'Food Magnet',
            magnetRadius: 150
        },
        {
            name: 'multiplier',
            icon: '✖️',
            color: '#ff8800',
            description: 'Score x2',
            scoreMultiplier: 2
        }
    ]
};
