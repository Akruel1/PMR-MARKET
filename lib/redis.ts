import { createClient } from 'redis';

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
  redisConnected: boolean;
  redisInitialized: boolean;
};

let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnected = false;
let redisInitialized = false;

// Lazy initialization of Redis
async function initRedis() {
  if (redisInitialized) return;
  redisInitialized = true;

  try {
    redisClient = globalForRedis.redis ?? createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false, // Don't auto-reconnect
      },
    });

    if (!globalForRedis.redis) {
      globalForRedis.redis = redisClient;
      redisClient.on('error', () => {
        redisConnected = false;
      });
      redisClient.on('connect', () => {
        redisConnected = true;
      });
      
      try {
        await redisClient.connect();
        redisConnected = true;
      } catch (error) {
        redisConnected = false;
        // Silently fail - will use fallback
      }
    } else {
      redisConnected = true;
    }

    if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redisClient;
  } catch (error) {
    redisConnected = false;
    // Silently fail - will use fallback
  }
}

// In-memory fallback for typing status
const typingCache = new Map<string, number>();

export const redis = {
  async setEx(key: string, seconds: number, value: string): Promise<void> {
    if (!redisInitialized) {
      await initRedis();
    }
    
    if (redisConnected && redisClient) {
      try {
        await redisClient.setEx(key, seconds, value);
        return;
      } catch (error) {
        redisConnected = false;
      }
    }
    // Fallback: in-memory cache
    typingCache.set(key, Date.now() + seconds * 1000);
    setTimeout(() => typingCache.delete(key), seconds * 1000);
  },
  async get(key: string): Promise<string | null> {
    if (!redisInitialized) {
      await initRedis();
    }
    
    if (redisConnected && redisClient) {
      try {
        return await redisClient.get(key);
      } catch (error) {
        redisConnected = false;
      }
    }
    // Fallback: in-memory cache
    const expiry = typingCache.get(key);
    if (expiry && expiry > Date.now()) {
      return '1';
    }
    typingCache.delete(key);
    return null;
  },
};


