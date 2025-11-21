import { GEMINI_CONFIG } from '../config.js';

export default class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.muted = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;

        this.voiceEnabled = true;

        // API Keys for Gemini TTS
        this.apiKeys = GEMINI_CONFIG.API_KEYS;
    }

    getRandomKey() {
        return this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)];
    }

    // Load sound effect
    loadSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.sfxVolume;
        this.sounds[name] = audio;
    }

    // Load background music
    loadMusic(path) {
        this.music = new Audio(path);
        this.music.volume = this.musicVolume;
        this.music.loop = true;
    }

    // Play sound effect
    playSound(name) {
        if (this.muted || !this.sounds[name]) return;

        const sound = this.sounds[name].cloneNode();
        sound.volume = this.sfxVolume;
        sound.play().catch(e => console.log('Sound play failed:', e));
    }

    // Play background music
    playMusic() {
        if (this.muted || !this.music) return;
        this.music.play().catch(e => console.log('Music play failed:', e));
    }

    // Stop background music
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    // Toggle mute
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
        return this.muted;
    }

    // Speak text using Gemini 2.5 Flash TTS
    async speak(text, options = {}) {
        if (!this.voiceEnabled || this.muted || !text) return;

        if (this.apiKeys && this.apiKeys.length > 0) {
            try {
                await this.speakWithGeminiTTS(text);
            } catch (error) {
                console.error('Gemini TTS failed:', error);
            }
        } else {
            console.warn('Gemini API Key missing for TTS');
        }
    }

    // Generate Audio Buffer from Gemini TTS (without playing)
    async generateAudioBuffer(text) {
        const apiKey = this.getRandomKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text }] }],
                generationConfig: {
                    responseModalities: ["AUDIO"],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' } // Female voice
                        }
                    }
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini TTS API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        if (!data.candidates ||
            !data.candidates[0] ||
            !data.candidates[0].content ||
            !data.candidates[0].content.parts ||
            !data.candidates[0].content.parts[0]) {
            console.error(`Gemini TTS Unexpected Response for text: "${text}"`, JSON.stringify(data));
            throw new Error('Invalid response structure from Gemini TTS');
        }

        const base64Audio = data.candidates[0].content.parts[0].inlineData?.data;

        if (base64Audio) {
            return await this.decodeAudio(base64Audio);
        } else {
            console.error('Gemini TTS Missing Audio Data:', JSON.stringify(data));
            throw new Error('No audio data received from Gemini TTS');
        }
    }

    // Speak using Gemini 2.5 Flash TTS REST API (Direct Play)
    async speakWithGeminiTTS(text) {
        const buffer = await this.generateAudioBuffer(text);
        this.playBuffer(buffer);
    }

    // Decode base64 to AudioBuffer
    async decodeAudio(base64String) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Convert base64 to Float32Array (PCM data)
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // The API returns 16-bit PCM, 24kHz (usually)
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        const sampleRate = 24000;
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Array);

        return audioBuffer;
    }

    // Play an AudioBuffer
    playBuffer(buffer) {
        if (this.muted || !buffer) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = this.sfxVolume;

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(0);
    }

    // Legacy method wrapper
    async playPCMAudio(base64String) {
        const buffer = await this.decodeAudio(base64String);
        this.playBuffer(buffer);
    }

    // Enable/disable voice announcements
    setVoiceEnabled(enabled) {
        this.voiceEnabled = enabled;
    }
}
