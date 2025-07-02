import type { Context } from 'hono';
import { AuthService } from './auth.service.js';
import { HTTPException } from 'hono/http-exception';

export class AuthController {
  private authService = new AuthService();

  async register(c: Context) {
    try {
      const { email, password, firstName, lastName } = await c.req.json();

      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      if (!result?.user) {
        throw new Error('User creation failed: result.user is undefined');
      }

      return c.json({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            isEmailVerified: result.user.isEmailVerified,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      }, 201);
    } catch (error: any) {
      console.error('[Register Controller Error]', error);

      if (error.message === 'User already exists') {
        throw new HTTPException(409, { message: 'User with this email already exists' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async login(c: Context) {
    try {
      const { email, password } = await c.req.json();

      const result = await this.authService.login(email, password);

      return c.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            isEmailVerified: result.user.isEmailVerified,
            subscriptionTier: result.user.subscriptionTier,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      console.error('[Login Controller Error]', error);

      if (error.message === 'Invalid credentials') {
        throw new HTTPException(401, { message: 'Invalid email or password' });
      }
      if (error.message === 'Email not verified') {
        throw new HTTPException(403, { message: 'Please verify your email before logging in' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async logout(c: Context) {
    try {
      const payload = c.get('jwtPayload');
      const refreshToken = c.req.header('X-Refresh-Token');

      if (refreshToken) {
        await this.authService.logout(payload.sub, refreshToken);
      }

      return c.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('[Logout Controller Error]', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async forgotPassword(c: Context) {
    try {
      const { email } = await c.req.json();

      await this.authService.forgotPassword(email);

      return c.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('[Forgot Password Controller Error]', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async resetPassword(c: Context) {
    try {
      const { token, password } = await c.req.json();

      await this.authService.resetPassword(token, password);

      return c.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
      });
    } catch (error: any) {
      console.error('[Reset Password Controller Error]', error);

      if (error.message === 'Invalid or expired token') {
        throw new HTTPException(400, { message: 'Invalid or expired reset token' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async verifyEmail(c: Context) {
    try {
      const { token } = await c.req.json();

      const user = await this.authService.verifyEmail(token);

      return c.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
          },
        },
      });
    } catch (error: any) {
      console.error('[Verify Email Controller Error]', error);

      if (error.message === 'Invalid or expired token') {
        throw new HTTPException(400, { message: 'Invalid or expired verification token' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async resendVerification(c: Context) {
    try {
      const payload = c.get('jwtPayload');

      await this.authService.resendVerification(payload.sub);

      return c.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error: any) {
      console.error('[Resend Verification Controller Error]', error);

      if (error.message === 'User not found') {
        throw new HTTPException(404, { message: 'User not found' });
      }

      if (error.message === 'Email already verified') {
        throw new HTTPException(400, { message: 'Email is already verified' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async refreshToken(c: Context) {
    try {
      const { refreshToken } = await c.req.json();

      const result = await this.authService.refreshToken(refreshToken);

      return c.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      console.error('[Refresh Token Controller Error]', error);

      if (error.message === 'Invalid refresh token') {
        throw new HTTPException(401, { message: 'Invalid or expired refresh token' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  async getProfile(c: Context) {
    try {
      const payload = c.get('jwtPayload');

      const user = await this.authService.getUserProfile(payload.sub);

      return c.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionTier: user.subscriptionTier,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error: any) {
      console.error('[Get Profile Controller Error]', error);

      if (error.message === 'User not found') {
        throw new HTTPException(404, { message: 'User not found' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
}
