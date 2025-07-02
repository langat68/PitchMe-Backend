import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

type RateLimitOptions = {
  max: number;       // Max requests
  windowMs: number;  // Time window in milliseconds
};

// In-memory store (suitable for dev/testing only)
const store: Record<string, { count: number; expiresAt: number }> = {};

export const rateLimitMiddleware = ({ max, windowMs }: RateLimitOptions): MiddlewareHandler => {
  return async (c, next) => {
    const now = Date.now();

    // Use IP address for anonymous users; fallback to 'unknown'
    const ip = c.req.header('x-forwarded-for') ||
               c.req.raw.headers.get('x-real-ip') ||
               c.req.raw.headers.get('host') ||
               'unknown';

    // Optional: If you want per-user rate limits on authenticated routes:
    // const userId = c.get('userId'); // Uncomment this if needed
    // const key = userId || ip;

    const key = ip;

    if (!store[key] || store[key].expiresAt < now) {
      // Initialize or reset the window
      store[key] = {
        count: 1,
        expiresAt: now + windowMs,
      };
    } else {
      store[key].count += 1;
    }

    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].expiresAt - now) / 1000);
      throw new HTTPException(429, {
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
      });
    }

    await next();
  };
};
