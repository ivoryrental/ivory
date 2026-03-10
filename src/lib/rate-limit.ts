import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitMode = "upstash" | "memory";

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // Unix epoch in ms
    mode: RateLimitMode;
}

interface MemoryRecord {
    count: number;
    reset: number;
}

const memoryStore = new Map<string, MemoryRecord>();
let redisClient: Redis | null | undefined;
let warnedMissingUpstash = false;
const limiterCache = new Map<string, Ratelimit>();

function getRedisClient(): Redis | null {
    if (redisClient !== undefined) {
        return redisClient;
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        redisClient = null;
        if (process.env.NODE_ENV === "production" && !warnedMissingUpstash) {
            console.warn(
                "[RateLimit] UPSTASH_REDIS_REST_URL/TOKEN is not configured. Public write requests will be blocked."
            );
            warnedMissingUpstash = true;
        }
        return redisClient;
    }

    redisClient = new Redis({ url, token });
    return redisClient;
}

function getOrCreateLimiter(scope: string, maxRequests: number, windowMs: number): Ratelimit | null {
    const redis = getRedisClient();
    if (!redis) {
        return null;
    }

    const cacheKey = `${scope}:${maxRequests}:${windowMs}`;
    const existing = limiterCache.get(cacheKey);
    if (existing) {
        return existing;
    }

    const seconds = Math.max(1, Math.ceil(windowMs / 1000));
    const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, `${seconds} s`),
        prefix: `ratelimit:${scope}`,
        analytics: true,
    });

    limiterCache.set(cacheKey, limiter);
    return limiter;
}

function applyMemoryRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const existing = memoryStore.get(key);

    if (!existing || existing.reset <= now) {
        const reset = now + windowMs;
        memoryStore.set(key, { count: 1, reset });
        return {
            success: true,
            limit: maxRequests,
            remaining: Math.max(0, maxRequests - 1),
            reset,
            mode: "memory",
        };
    }

    const nextCount = existing.count + 1;
    existing.count = nextCount;
    memoryStore.set(key, existing);

    return {
        success: nextCount <= maxRequests,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - nextCount),
        reset: existing.reset,
        mode: "memory",
    };
}

async function applyRateLimit(
    scope: string,
    clientKey: string,
    maxRequests: number,
    windowMs: number
): Promise<RateLimitResult> {
    const limiter = getOrCreateLimiter(scope, maxRequests, windowMs);
    if (!limiter) {
        return applyMemoryRateLimit(`${scope}:${clientKey}`, maxRequests, windowMs);
    }

    const result = await limiter.limit(clientKey);
    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        mode: "upstash",
    };
}

export async function limitContactRequests(clientKey: string): Promise<RateLimitResult> {
    return applyRateLimit("contact", clientKey, 5, 60 * 1000);
}

export async function limitLoginRequests(clientKey: string): Promise<RateLimitResult> {
    return applyRateLimit("login", clientKey, 10, 10 * 60 * 1000);
}

export function retryAfterSeconds(result: RateLimitResult): string {
    const seconds = Math.ceil((result.reset - Date.now()) / 1000);
    return String(Math.max(1, seconds));
}
