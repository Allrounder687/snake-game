// Simple environment variable loader for vanilla JS
// This reads from .env file for local development

class EnvLoader {
    constructor() {
        this.env = {};
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return this.env;

        try {
            const response = await fetch('.env');
            if (!response.ok) {
                console.warn('.env file not found, using fallback configuration');
                return this.env;
            }

            const text = await response.text();
            const lines = text.split('\n');

            for (const line of lines) {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || !line.trim()) continue;

                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    this.env[key.trim()] = valueParts.join('=').trim();
                }
            }

            this.loaded = true;
            console.log('Environment variables loaded successfully');
        } catch (error) {
            console.error('Error loading .env file:', error);
        }

        return this.env;
    }

    get(key, fallback = null) {
        return this.env[key] || fallback;
    }

    getArray(prefix) {
        const result = [];
        let index = 1;

        while (this.env[`${prefix}_${index}`]) {
            result.push(this.env[`${prefix}_${index}`]);
            index++;
        }

        return result;
    }
}

// Export singleton instance
export default new EnvLoader();
