import Redis from 'ioredis';

type RedisGlobal = {
  redis: Redis | null | undefined;
  redisListenersRegistered?: boolean;
  redisCleanupRegistered?: boolean;
};

const globalForRedis = globalThis as unknown as RedisGlobal;

const requiredVars = ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD'] as const;
const missingVars = requiredVars.filter((key) => !process.env[key]);
const redisDisabled = missingVars.length > 0;

if (redisDisabled) {
  console.warn(
    `[Redis] Disabled (missing ${missingVars.join(', ')}). Running without Redis cache.`,
  );
}

const redisInstance =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : redisDisabled
      ? null
      : new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_TLS_ENABLED === 'true' ? {} : undefined,
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            return Math.min(times * 50, 2000);
          },
          reconnectOnError(err) {
            return ['READONLY', 'ECONNRESET'].some((code) => err.message.includes(code));
          },
          lazyConnect: false,
          enableReadyCheck: true,
          showFriendlyErrorStack: process.env.NODE_ENV === 'development',
        });

if (redisInstance && !globalForRedis.redisListenersRegistered) {
  redisInstance.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redisInstance.on('ready', () => {
    console.log('[Redis] Ready');
  });

  redisInstance.on('error', (err) => {
    console.error('[Redis] Error:', err);
  });

  redisInstance.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  redisInstance.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  globalForRedis.redisListenersRegistered = true;
}

if (redisInstance && !globalForRedis.redisCleanupRegistered) {
  process.on('SIGTERM', async () => {
    try {
      await redisInstance.quit();
    } catch (error) {
      console.error('[Redis] Error closing connection on SIGTERM:', error);
    }
  });

  globalForRedis.redisCleanupRegistered = true;
}

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redisInstance;
}

export const redis = redisInstance;
export default redisInstance;

