import { Redis } from "@upstash/redis/cloudflare";
import type { MappingStatus } from "@universal-payment/protocol";

export type CacheEnv = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

const RESOLVE_CACHE_TTL_SECONDS = 300;
const CACHE_GET_TIMEOUT_MS = 120;

/** Transitional states must not be cached - they become ACTIVE by time. */
const NON_CACHEABLE_STATUSES = new Set<MappingStatus>([
  "pending",
  "update_pending",
]);

function redisClient(env: CacheEnv): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function resolveCacheKey(type: string, normalizedValue: string): string {
  return `rezva:resolve:v1:${type}:${normalizedValue}`;
}

export function shouldCacheResolveStatus(status: MappingStatus): boolean {
  return !NON_CACHEABLE_STATUSES.has(status);
}

export async function getCachedResolve<T>(
  env: CacheEnv,
  type: string,
  normalizedValue: string,
): Promise<T | null> {
  const redis = redisClient(env);
  if (!redis) {
    return null;
  }
  try {
    return await Promise.race([
      redis.get<T>(resolveCacheKey(type, normalizedValue)),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), CACHE_GET_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    console.error("resolve cache get failed", error);
    return null;
  }
}

export async function setCachedResolve(
  env: CacheEnv,
  type: string,
  normalizedValue: string,
  response: { status: MappingStatus },
): Promise<void> {
  const redis = redisClient(env);
  if (!redis) {
    return;
  }
  if (!shouldCacheResolveStatus(response.status)) {
    return;
  }
  try {
    await redis.set(resolveCacheKey(type, normalizedValue), response, {
      ex: RESOLVE_CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("resolve cache set failed", error);
  }
}

export async function invalidateResolveCache(
  env: CacheEnv,
  type: string,
  normalizedValue: string,
): Promise<void> {
  const redis = redisClient(env);
  if (!redis) {
    return;
  }
  try {
    await redis.del(resolveCacheKey(type, normalizedValue));
  } catch (error) {
    console.error("resolve cache invalidate failed", error);
  }
}
