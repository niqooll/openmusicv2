const redis = require('redis');

class CacheService {
  constructor() {
    this._client = null;
    this._connected = false;
    this._memoryCache = new Map(); // Fallback ke memory cache

    this._initializeRedis();
  }

  async _initializeRedis() {
    try {
      this._client = redis.createClient({
        socket: {
          host: process.env.REDIS_SERVER || 'localhost',
          port: 6379,
          connectTimeout: 5000,
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('Redis server is not available, using memory cache fallback');
            return false; // Stop retrying
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      this._client.on('error', (error) => {
        console.warn('Redis Client Error (using fallback):', error.message);
        this._connected = false;
      });

      this._client.on('connect', () => {
        console.log('Redis connected successfully');
        this._connected = true;
      });

      await this._client.connect();
    } catch (error) {
      console.warn('Failed to connect to Redis, using memory cache fallback:', error.message);
      this._connected = false;
    }
  }

  async set(key, value, expirationInSecond = 1800) {
    if (this._connected && this._client) {
      try {
        await this._client.setEx(key, expirationInSecond, value);
        return;
      } catch (error) {
        console.warn('Redis set failed, using memory fallback:', error.message);
        this._connected = false;
      }
    }

    // Fallback to memory cache
    const expirationTime = Date.now() + (expirationInSecond * 1000);
    this._memoryCache.set(key, { value, expirationTime });
    
    // Clean up expired entries periodically
    this._cleanupMemoryCache();
  }

  async get(key) {
    if (this._connected && this._client) {
      try {
        const result = await this._client.get(key);
        if (result === null) throw new Error('Cache tidak ditemukan');
        return result;
      } catch (error) {
        if (error.message === 'Cache tidak ditemukan') {
          throw error;
        }
        console.warn('Redis get failed, trying memory fallback:', error.message);
        this._connected = false;
      }
    }

    // Fallback to memory cache
    const cached = this._memoryCache.get(key);
    if (!cached) {
      throw new Error('Cache tidak ditemukan');
    }

    if (Date.now() > cached.expirationTime) {
      this._memoryCache.delete(key);
      throw new Error('Cache tidak ditemukan');
    }

    return cached.value;
  }

  async delete(key) {
    if (this._connected && this._client) {
      try {
        return await this._client.del(key);
      } catch (error) {
        console.warn('Redis delete failed, using memory fallback:', error.message);
        this._connected = false;
      }
    }

    // Fallback to memory cache
    return this._memoryCache.delete(key);
  }

  _cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this._memoryCache.entries()) {
      if (now > cached.expirationTime) {
        this._memoryCache.delete(key);
      }
    }
  }

  // Method to check if Redis is available
  isRedisConnected() {
    return this._connected;
  }
}

module.exports = CacheService;