import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true', // convert string to boolean
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Resume Builder" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `<div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial;">
          <h1 style="text-align: center; color: #2563eb;">Resume Builder</h1>
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
            <h2>Verify Your Email</h2>
            <p>Click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Verify Email</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #64748b;">This link expires in 24 hours.</p>
        </div>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.error('❌ SMTP Send Error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Resume Builder" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `<div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial;">
          <h1 style="text-align: center; color: #2563eb;">Resume Builder</h1>
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
            <h2>Reset Your Password</h2>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #64748b;">This link expires in 1 hour.</p>
        </div>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: `"Resume Builder" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Welcome to Resume Builder!',
      html: `<div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial;">
          <h1 style="text-align: center; color: #2563eb;">Welcome, ${firstName} 🎉</h1>
          <div style="background: #f8fafc; padding: 30px; border-radius: 8px;">
            <p>Thanks for joining Resume Builder. We're excited to help you craft the perfect resume!</p>
            <ul style="padding-left: 20px;">
              <li>Build resumes using modern templates</li>
              <li>Get AI-powered content suggestions</li>
              <li>Export PDF resumes anytime</li>
            </ul>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Go to Dashboard</a>
            </div>
          </div>
        </div>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Do not throw to avoid blocking registration flow
    }
  }
}
