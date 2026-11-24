interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache for rate limiting
const attemptStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  maxAttempts: number; // e.g. 5 failed attempts
  windowMs: number;    // e.g. 15 minutes
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Clean up expired rate limit entries to prevent memory leaks in long-running processes
 */
function cleanupExpired() {
  const now = Date.now();
  attemptStore.forEach((entry, key) => {
    if (entry.resetAt <= now) {
      attemptStore.delete(key);
    }
  });
}

// Periodic cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  const timer = setInterval(cleanupExpired, 5 * 60 * 1000);
  if (timer && typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}

/**
 * Checks whether an action is permitted under rate limit policy.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const key = `rl:${identifier}`;
  const record = attemptStore.get(key);

  if (!record || record.resetAt <= now) {
    return {
      allowed: true,
      remaining: options.maxAttempts,
      resetSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    allowed: true,
    remaining: options.maxAttempts - record.count,
    resetSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Records a failed attempt for an identifier.
 */
export function recordFailedAttempt(
  identifier: string,
  options: RateLimitOptions = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
) {
  const now = Date.now();
  const key = `rl:${identifier}`;
  const record = attemptStore.get(key);

  if (!record || record.resetAt <= now) {
    attemptStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
  } else {
    record.count += 1;
  }
}

/**
 * Resets rate limit counters upon successful authentication.
 */
export function resetRateLimit(identifier: string) {
  attemptStore.delete(`rl:${identifier}`);
}
