import { GEMINI_CONFIG } from '../config.js';

export default class GeminiService {
    constructor() {
        this.apiKeys = GEMINI_CONFIG.API_KEYS;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = GEMINI_CONFIG.MODEL;
    }

    getRandomKey() {
        return this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)];
    }

    async generateTaunt(context) {
        const apiKey = this.getRandomKey();
        if (!apiKey) return null;

        const prompt = `The player just ${context}. Give me a short Hyderabadi taunt.`;

        try {
            const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: GEMINI_CONFIG.SYSTEM_PROMPT + "\n\n" + prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 1000,
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error('Gemini API Error:', data.error);
                return null;
            }

            if (data.candidates &&
                data.candidates.length > 0 &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                console.error('Gemini Unexpected Response:', JSON.stringify(data));
                return null;
            }

            return null;
        } catch (error) {
            console.error('Gemini Request Failed:', error);
            return null;
        }
    }

    async generateTauntBatch(category, count = 3) {
        const apiKey = this.getRandomKey();
        if (!apiKey) return [];

        const prompt = `Give me ${count} distinct, funny, sarcastic Hyderabadi taunts for a player who just: ${category}. 
        Return them as a JSON array of strings. Example: ["Taunt 1", "Taunt 2"]`;

        try {
            const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: GEMINI_CONFIG.SYSTEM_PROMPT + "\n\n" + prompt }] }],
                    generationConfig: {
                        temperature: 1.0,
                        maxOutputTokens: 1000,
                        responseMimeType: "application/json"
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                const text = data.candidates[0].content.parts[0].text;
                return JSON.parse(text);
            }
            return [];
        } catch (error) {
            console.error('Gemini Batch Request Failed:', error);
            return [];
        }
    }
}
