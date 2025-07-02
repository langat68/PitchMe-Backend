// middleware/auth.middleware.ts
import  type { Context, Next } from 'hono';
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
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = await verify(token, jwtSecret);
    
    if (!payload || !payload.userId) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }

    // Set user information in context
    c.set('userId', payload.userId);
    c.set('userEmail', payload.email);
    c.set('subscriptionTier', payload.subscriptionTier);

    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    throw new HTTPException(401, { message: 'Authentication failed' });
  }
};