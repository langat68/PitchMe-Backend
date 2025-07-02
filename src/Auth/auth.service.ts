import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/db.js'; // Your database connection
import { users } from '../db/schema.js'; // Your schema
import { EmailService } from './email.service.js';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private emailService = new EmailService();
  private refreshTokens: Set<string> = new Set(); // In production, use Redis or database

  // Generate JWT tokens
  private generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { sub: userId, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    this.refreshTokens.add(refreshToken);
    return { accessToken, refreshToken };
  }

  // Generate verification token
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
async register(data: RegisterData): Promise<LoginResult> {
  const { email, password, firstName, lastName } = data;

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await this.hashPassword(password);

  // Insert new user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName,
      lastName,
      subscriptionTier: 'free',
      isEmailVerified: false,
    })
    .returning();

  console.log('[Register Service] Inserted user:', newUser);

  if (!newUser || !newUser.id) {
    throw new Error('User creation failed: newUser is undefined or missing id');
  }

  // Generate tokens
  const tokens = this.generateTokens(newUser.id);

  // Send verification email
  await this.sendVerificationEmail(newUser.email, newUser.id);

  return {
    user: newUser,
    ...tokens,
  };
}


  async login(email: string, password: string): Promise<LoginResult> {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if email is verified (optional - you can allow unverified users)
    // if (!user.isEmailVerified) {
    //   throw new Error('Email not verified');
    // }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Remove refresh token from storage
    this.refreshTokens.delete(refreshToken);
    
    // In production, you'd also invalidate the token in your database/Redis
    // and possibly add the access token to a blacklist
  }

  async forgotPassword(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal whether user exists or not
      return;
    }

    // Generate reset token (in production, store this in database with expiry)
    const resetToken = this.generateVerificationToken();
    
    // Store reset token in database (you'll need to add a table for this)
    // For now, we'll use JWT with short expiry
    const resetJWT = jwt.sign(
      { sub: user.id, type: 'reset', token: resetToken },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetJWT);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (payload.type !== 'reset') {
        throw new Error('Invalid token type');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user password
      await db
        .update(users)
        .set({ 
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.sub));

    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async verifyEmail(token: string): Promise<any> {
    try {
      // Verify token
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (payload.type !== 'verify') {
        throw new Error('Invalid token type');
      }

      // Update user email verification status
      const [updatedUser] = await db
        .update(users)
        .set({ 
          isEmailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, payload.sub))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async resendVerification(userId: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    await this.sendVerificationEmail(user.email, user.id);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      if (payload.type !== 'refresh' || !this.refreshTokens.has(refreshToken)) {
        throw new Error('Invalid refresh token');
      }

      // Remove old refresh token
      this.refreshTokens.delete(refreshToken);

      // Generate new tokens
      const tokens = this.generateTokens(payload.sub);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        subscriptionTier: users.subscriptionTier,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async sendVerificationEmail(email: string, userId: string): Promise<void> {
    // Generate verification token
    const verificationToken = jwt.sign(
      { sub: userId, type: 'verify' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);
  }
}