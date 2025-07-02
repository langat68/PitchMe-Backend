import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthController } from './auth.controller.js';
import { jwt } from 'hono/jwt';

// Load and validate JWT secret
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is not defined in environment variables');

// Reusable JWT middleware
const jwtMiddleware = jwt({ secret: jwtSecret });

const auth = new Hono();
const authController = new AuthController();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Public routes
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  return await authController.register(c);
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  return await authController.login(c);
});

auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  return await authController.forgotPassword(c);
});

auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  return await authController.resetPassword(c);
});

auth.post('/verify-email', zValidator('json', verifyEmailSchema), async (c) => {
  return await authController.verifyEmail(c);
});

auth.post('/refresh-token', zValidator('json', refreshTokenSchema), async (c) => {
  return await authController.refreshToken(c);
});

// Protected routes
auth.use('/me', jwtMiddleware);
auth.get('/me', async (c) => {
  return await authController.getProfile(c);
});

auth.use('/logout', jwtMiddleware);
auth.post('/logout', async (c) => {
  return await authController.logout(c);
});

auth.use('/resend-verification', jwtMiddleware);
auth.post('/resend-verification', async (c) => {
  return await authController.resendVerification(c);
});

export { auth };
