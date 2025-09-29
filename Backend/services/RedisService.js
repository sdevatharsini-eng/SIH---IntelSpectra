const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriber = null;
    this.publisher = null;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Create main client
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Create subscriber and publisher clients
      this.subscriber = this.client.duplicate();
      this.publisher = this.client.duplicate();

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);

      this.isConnected = true;
      console.log('✅ Connected to Redis');

      // Handle connection events
      this.client.on('error', (error) => {
        console.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      // Initialize Redis data structures
      await this.initialize();

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Don't throw error - Redis is optional for basic functionality
      this.isConnected = false;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }
      this.isConnected = false;
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  async initialize() {
    try {
      if (!this.isConnected) return;

      // Initialize counters
      await this.client.setnx('stats:total_threats', '0');
      await this.client.setnx('stats:active_threats', '0');
      await this.client.setnx('stats:resolved_threats', '0');
      await this.client.setnx('stats:total_videos', '0');
      await this.client.setnx('stats:active_cameras', '0');

      // Initialize system status
      await this.client.hset('system:status', {
        uptime: Date.now(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });

      console.log('Redis initialization completed');
    } catch (error) {
      console.error('Redis initialization error:', error);
    }
  }

  // Cache operations
  async get(key) {
    try {
      if (!this.isConnected) return null;
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, expireInSeconds = null) {
    try {
      if (!this.isConnected) return false;
      
      if (expireInSeconds) {
        await this.client.setex(key, expireInSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Hash operations
  async hget(key, field) {
    try {
      if (!this.isConnected) return null;
      return await this.client.hget(key, field);
    } catch (error) {
      console.error('Redis hget error:', error);
      return null;
    }
  }

  async hset(key, field, value) {
    try {
      if (!this.isConnected) return false;
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      console.error('Redis hset error:', error);
      return false;
    }
  }

  async hgetall(key) {
    try {
      if (!this.isConnected) return {};
      return await this.client.hgetall(key);
    } catch (error) {
      console.error('Redis hgetall error:', error);
      return {};
    }
  }

  // List operations
  async lpush(key, value) {
    try {
      if (!this.isConnected) return false;
      await this.client.lpush(key, value);
      return true;
    } catch (error) {
      console.error('Redis lpush error:', error);
      return false;
    }
  }

  async rpop(key) {
    try {
      if (!this.isConnected) return null;
      return await this.client.rpop(key);
    } catch (error) {
      console.error('Redis rpop error:', error);
      return null;
    }
  }

  async lrange(key, start, stop) {
    try {
      if (!this.isConnected) return [];
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      console.error('Redis lrange error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key, member) {
    try {
      if (!this.isConnected) return false;
      await this.client.sadd(key, member);
      return true;
    } catch (error) {
      console.error('Redis sadd error:', error);
      return false;
    }
  }

  async srem(key, member) {
    try {
      if (!this.isConnected) return false;
      await this.client.srem(key, member);
      return true;
    } catch (error) {
      console.error('Redis srem error:', error);
      return false;
    }
  }

  async smembers(key) {
    try {
      if (!this.isConnected) return [];
      return await this.client.smembers(key);
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  }

  // Counter operations
  async incr(key) {
    try {
      if (!this.isConnected) return 0;
      return await this.client.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  async decr(key) {
    try {
      if (!this.isConnected) return 0;
      return await this.client.decr(key);
    } catch (error) {
      console.error('Redis decr error:', error);
      return 0;
    }
  }

  // Pub/Sub operations
  async publish(channel, message) {
    try {
      if (!this.isConnected) return false;
      await this.publisher.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      if (!this.isConnected) return false;
      
      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
          callback(message);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Redis subscribe error:', error);
      return false;
    }
  }

  // Specialized methods for IntelSpectra
  async cacheVideoAnalysis(videoId, analysis, expireInHours = 24) {
    const key = `video:analysis:${videoId}`;
    const expireInSeconds = expireInHours * 60 * 60;
    return await this.set(key, JSON.stringify(analysis), expireInSeconds);
  }

  async getCachedVideoAnalysis(videoId) {
    const key = `video:analysis:${videoId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheThreatDetection(threatId, detection, expireInHours = 48) {
    const key = `threat:detection:${threatId}`;
    const expireInSeconds = expireInHours * 60 * 60;
    return await this.set(key, JSON.stringify(detection), expireInSeconds);
  }

  async addActiveCamera(cameraId) {
    return await this.sadd('cameras:active', cameraId);
  }

  async removeActiveCamera(cameraId) {
    return await this.srem('cameras:active', cameraId);
  }

  async getActiveCameras() {
    return await this.smembers('cameras:active');
  }

  async updateSystemMetrics(metrics) {
    const key = 'system:metrics';
    for (const [field, value] of Object.entries(metrics)) {
      await this.hset(key, field, value.toString());
    }
    await this.client.expire(key, 300); // Expire in 5 minutes
  }

  async getSystemMetrics() {
    return await this.hgetall('system:metrics');
  }

  async addRecentThreat(threat) {
    const key = 'threats:recent';
    await this.lpush(key, JSON.stringify(threat));
    // Keep only the 100 most recent threats
    await this.client.ltrim(key, 0, 99);
  }

  async getRecentThreats(count = 10) {
    const key = 'threats:recent';
    const threats = await this.lrange(key, 0, count - 1);
    return threats.map(threat => JSON.parse(threat));
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'unhealthy',
          connected: false,
          error: 'Not connected to Redis'
        };
      }

      // Test basic operations
      const testKey = 'health:check';
      const testValue = Date.now().toString();
      
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.del(testKey);

      if (retrieved !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      return {
        status: 'healthy',
        connected: true,
        latency: Date.now() - parseInt(testValue)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = RedisService;
