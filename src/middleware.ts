// middleware/auth.middleware.ts
import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verify } from 'hono/jwt';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      throw new HTTPException(401, { message: 'Authorization header missing' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new HTTPException(401, { message: 'Token missing' });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'supersecretkey123';
    const payload = await verify(token, jwtSecret);
    
    // Check for required payload fields - using 'sub' instead of 'userId'
    if (!payload || !payload.sub) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }

    // Set user information in context - only set what exists in the token
    c.set('userId', payload.sub);
    c.set('tokenType', payload.type);
    
    // Only set optional fields if they exist in the token
    if (payload.email) c.set('userEmail', payload.email);
    if (payload.subscriptionTier) c.set('subscriptionTier', payload.subscriptionTier);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: 'Authentication failed' });
  }
};