import { apiError } from "@universal-payment/protocol";
import { Redis } from "@upstash/redis/cloudflare";
import { errorResponse } from "./http.js";

export type RateLimitEnv = {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

function redisClient(env: RateLimitEnv): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function enforceRateLimit(
  env: RateLimitEnv,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<Response | null> {
  const redis = redisClient(env);
  if (!redis) {
    return null;
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    if (count > limit) {
      return errorResponse(
        apiError("RATE_LIMITED", "Rate limit exceeded. Try again later."),
        429,
      );
    }
    return null;
  } catch (error) {
    console.error("rate limit check failed", error);
    return null;
  }
}
