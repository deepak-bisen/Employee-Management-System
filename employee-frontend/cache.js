// Simple caching utility for API responses
class APICache {
    constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
        this.cache = new Map();
        this.maxAge = maxAge;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        return this.cache.delete(key);
    }

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }
}

// Global cache instance
const apiCache = new APICache();

// Cached fetch function
const cachedFetch = async (url, options = {}, useCache = true) => {
    const cacheKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`;

    if (useCache && options.method === 'GET') {
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (useCache && options.method === 'GET') {
            apiCache.set(cacheKey, data);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APICache, apiCache, cachedFetch };
}