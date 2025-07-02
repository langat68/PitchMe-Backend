import { pgTable, text, timestamp, uuid, integer, boolean, json, varchar, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
  isEmailVerified: boolean('is_email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

// Resume templates
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // 'modern', 'classic', 'creative', 'ats-friendly'
  description: text('description'),
  htmlTemplate: text('html_template').notNull(),
  cssStyles: text('css_styles').notNull(),
  previewImage: text('preview_image'),
  isPremium: boolean('is_premium').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Resumes table
export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  templateId: uuid('template_id').references(() => templates.id),
  title: varchar('title', { length: 255 }).notNull(),
  
  // Resume content stored as JSON
  personalInfo: json('personal_info').$type<{
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  }>(),
  
  professionalSummary: text('professional_summary'),
  
  experience: json('experience').$type<Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    isCurrentRole: boolean;
    description: string;
    achievements: string[];
  }>>(),
  
  education: json('education').$type<Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
    achievements?: string[];
  }>>(),
  
  skills: json('skills').$type<{
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  }>(),
  
  projects: json('projects').$type<Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    github?: string;
    startDate: string;
    endDate?: string;
  }>>(),
  
  customSections: json('custom_sections').$type<Array<{
    id: string;
    title: string;
    content: string;
    type: 'text' | 'list' | 'achievements';
  }>>(),
  
  // Metadata
  targetRole: varchar('target_role', { length: 100 }),
  industry: varchar('industry', { length: 50 }),
  isPublic: boolean('is_public').default(false),
  shareToken: varchar('share_token', { length: 36 }).unique(), // For public sharing
  
  // AI Analytics
  atsScore: integer('ats_score'),
  lastAnalyzedAt: timestamp('last_analyzed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('resume_user_id_idx').on(table.userId),
  shareTokenIdx: index('share_token_idx').on(table.shareToken),
}));

// AI Enhancement History
export const aiEnhancements = pgTable('ai_enhancements', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  sectionType: varchar('section_type', { length: 50 }).notNull(), // 'summary', 'experience', 'skills', etc.
  sectionId: varchar('section_id', { length: 36 }), // For specific experience/education items
  originalText: text('original_text').notNull(),
  enhancedText: text('enhanced_text').notNull(),
  improvementType: varchar('improvement_type', { length: 50 }).notNull(), // 'clarity', 'impact', 'keywords', 'tone'
  aiProvider: varchar('ai_provider', { length: 20 }).default('openai'),
  tokensUsed: integer('tokens_used'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }), // AI confidence score 0-1
  wasAccepted: boolean('was_accepted'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  resumeIdIdx: index('ai_enhancement_resume_id_idx').on(table.resumeId),
}));

// User Analytics & Activity
export const userAnalytics = pgTable('user_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }),
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'resume_created', 'ai_enhancement', 'pdf_export', 'template_changed'
  metadata: json('metadata').$type<Record<string, any>>(), // Additional context data
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('analytics_user_id_idx').on(table.userId),
  actionTypeIdx: index('analytics_action_type_idx').on(table.actionType),
  timestampIdx: index('analytics_timestamp_idx').on(table.timestamp),
}));

// PDF Exports tracking
export const pdfExports = pgTable('pdf_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url'), // S3 URL or local path
  fileSize: integer('file_size'), // in bytes
  downloadCount: integer('download_count').default(0),
  expiresAt: timestamp('expires_at'), // For temporary downloads
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  resumeIdIdx: index('pdf_resume_id_idx').on(table.resumeId),
  userIdIdx: index('pdf_user_id_idx').on(table.userId),
}));

// Feedback & Ratings
export const feedbacks = pgTable('feedbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  resumeId: uuid('resume_id').references(() => resumes.id, { onDelete: 'cascade' }),
  enhancementId: uuid('enhancement_id').references(() => aiEnhancements.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(), // 'ai_enhancement', 'template', 'general'
  rating: integer('rating'), // 1-5 stars
  comment: text('comment'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// API Usage tracking (for rate limiting)
export const apiUsage = pgTable('api_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: varchar('endpoint', { length: 100 }).notNull(),
  requestCount: integer('request_count').default(1),
  date: timestamp('date').defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index('api_usage_user_date_idx').on(table.userId, table.date),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  analytics: many(userAnalytics),
  pdfExports: many(pdfExports),
  feedbacks: many(feedbacks),
  apiUsage: many(apiUsage),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [resumes.templateId],
    references: [templates.id],
  }),
  aiEnhancements: many(aiEnhancements),
  analytics: many(userAnalytics),
  pdfExports: many(pdfExports),
  feedbacks: many(feedbacks),
}));

export const aiEnhancementsRelations = relations(aiEnhancements, ({ one, many }) => ({
  resume: one(resumes, {
    fields: [aiEnhancements.resumeId],
    references: [resumes.id],
  }),
  feedbacks: many(feedbacks),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  resumes: many(resumes),
}));

export const userAnalyticsRelations = relations(userAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [userAnalytics.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [userAnalytics.resumeId],
    references: [resumes.id],
  }),
}));

export const pdfExportsRelations = relations(pdfExports, ({ one }) => ({
  user: one(users, {
    fields: [pdfExports.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [pdfExports.resumeId],
    references: [resumes.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [feedbacks.resumeId],
    references: [resumes.id],
  }),
  enhancement: one(aiEnhancements, {
    fields: [feedbacks.enhancementId],
    references: [aiEnhancements.id],
  }),
}));

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
}));