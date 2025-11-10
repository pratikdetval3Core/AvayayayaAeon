/**
 * Cache Manager
 * Manages caching strategies for static assets and API responses
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cachePrefix = 'app_cache_';
    this.defaultTTL = 3600000; // 1 hour in milliseconds
  }

  /**
   * Set item in memory cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setMemory(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.memoryCache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Get item from memory cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getMemory(key) {
    const cached = this.memoryCache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  /**
   * Set item in localStorage cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setLocal(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.cachePrefix + key;
      const expiresAt = Date.now() + ttl;
      
      const cacheData = {
        value,
        expiresAt
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  /**
   * Get item from localStorage cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getLocal(key) {
    try {
      const cacheKey = this.cachePrefix + key;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheData.value;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  /**
   * Remove item from cache
   * @param {string} key - Cache key
   */
  remove(key) {
    this.memoryCache.delete(key);
    
    try {
      const cacheKey = this.cachePrefix + key;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Failed to remove from localStorage cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    
    try {
      // Remove all items with cache prefix
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired() {
    // Clear expired memory cache
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear expired localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            if (now > cached.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired localStorage cache:', error);
    }
  }

  /**
   * Get cache size in bytes (approximate)
   * @returns {number} Size in bytes
   */
  getSize() {
    let size = 0;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          size += localStorage.getItem(key).length * 2; // UTF-16 = 2 bytes per char
        }
      });
    } catch (error) {
      console.warn('Failed to calculate cache size:', error);
    }
    
    return size;
  }

  /**
   * Cache API response
   * @param {string} url - API URL
   * @param {*} data - Response data
   * @param {number} ttl - Time to live
   */
  cacheResponse(url, data, ttl = this.defaultTTL) {
    const key = `api_${url}`;
    this.setMemory(key, data, ttl);
  }

  /**
   * Get cached API response
   * @param {string} url - API URL
   * @returns {*} Cached response or null
   */
  getCachedResponse(url) {
    const key = `api_${url}`;
    return this.getMemory(key);
  }

  /**
   * Invalidate API cache for a URL pattern
   * @param {string} pattern - URL pattern to match
   */
  invalidatePattern(pattern) {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
const cacheManager = new CacheManager();

// Clear expired cache on initialization
cacheManager.clearExpired();

// Clear expired cache periodically (every 5 minutes)
setInterval(() => {
  cacheManager.clearExpired();
}, 300000);

export default cacheManager;
