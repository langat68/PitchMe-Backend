import { z } from 'zod';

// Common validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
const URL_REGEX = /^https?:\/\/.+/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Common field validators
export const commonValidators = {
  email: z.string()
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters')
    .regex(EMAIL_REGEX, 'Invalid email format'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character'),
    
  simplePassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
    
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(200, 'Full name must be less than 200 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
    
  phone: z.string()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), 'Invalid phone number format'),
    
  website: z.string()
    .optional()
    .refine((val) => !val || URL_REGEX.test(val), 'Invalid website URL format'),
    
  linkedin: z.string()
    .optional()
    .refine((val) => !val || val.includes('linkedin.com'), 'Invalid LinkedIn URL'),
    
  github: z.string()
    .optional()
    .refine((val) => !val || val.includes('github.com'), 'Invalid GitHub URL'),
    
  uuid: z.string()
    .regex(UUID_REGEX, 'Invalid UUID format'),
    
  location: z.string()
    .min(1, 'Location is required')
    .max(255, 'Location must be less than 255 characters'),
    
  company: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be less than 100 characters'),
    
  position: z.string()
    .min(1, 'Position is required')
    .max(100, 'Position must be less than 100 characters'),
    
  institution: z.string()
    .min(1, 'Institution name is required')
    .max(100, 'Institution name must be less than 100 characters'),
    
  degree: z.string()
    .min(1, 'Degree is required')
    .max(100, 'Degree must be less than 100 characters'),
    
  field: z.string()
    .min(1, 'Field of study is required')
    .max(100, 'Field of study must be less than 100 characters'),
    
  gpa: z.string()
    .optional()
    .refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), 'Invalid GPA format'),
    
  dateString: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    
  yearMonth: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
    
  subscriptionTier: z.enum(['free', 'premium', 'pro'], {
    invalid_type_error: 'Invalid subscription tier'
  }),
    
  resumeTitle: z.string()
    .min(1, 'Resume title is required')
    .max(255, 'Resume title must be less than 255 characters'),
    
  templateCategory: z.enum(['modern', 'classic', 'creative', 'ats-friendly'], {
    invalid_type_error: 'Invalid template category'
  }),
    
  industry: z.string()
    .min(1, 'Industry is required')
    .max(50, 'Industry must be less than 50 characters'),
    
  targetRole: z.string()
    .min(1, 'Target role is required')
    .max(100, 'Target role must be less than 100 characters'),
};

// Auth validation schemas
export const authSchemas = {
  register: z.object({
    email: commonValidators.email,
    password: commonValidators.password,
    firstName: commonValidators.firstName,
    lastName: commonValidators.lastName,
  }),
  
  login: z.object({
    email: commonValidators.email,
    password: commonValidators.simplePassword,
  }),
  
  forgotPassword: z.object({
    email: commonValidators.email,
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: commonValidators.password,
  }),
  
  verifyEmail: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
  
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
  
  changePassword: z.object({
    currentPassword: commonValidators.simplePassword,
    newPassword: commonValidators.password,
  }),
  
  updateProfile: z.object({
    firstName: commonValidators.firstName.optional(),
    lastName: commonValidators.lastName.optional(),
  }),
};

// Define base schemas first to avoid circular references
const personalInfoSchema = z.object({
  fullName: commonValidators.fullName,
  email: commonValidators.email,
  phone: commonValidators.phone,
  location: commonValidators.location.optional(),
  website: commonValidators.website,
  linkedin: commonValidators.linkedin,
  github: commonValidators.github,
});

const experienceSchema = z.object({
  id: z.string().optional(),
  company: commonValidators.company,
  position: commonValidators.position,
  startDate: commonValidators.yearMonth,
  endDate: commonValidators.yearMonth.optional(),
  isCurrentRole: z.boolean().default(false),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  achievements: z.array(z.string().min(1, 'Achievement cannot be empty'))
    .max(10, 'Maximum 10 achievements allowed'),
});

const educationSchema = z.object({
  id: z.string().optional(),
  institution: commonValidators.institution,
  degree: commonValidators.degree,
  field: commonValidators.field,
  startDate: commonValidators.yearMonth,
  endDate: commonValidators.yearMonth.optional(),
  gpa: commonValidators.gpa,
  achievements: z.array(z.string().min(1, 'Achievement cannot be empty'))
    .max(5, 'Maximum 5 achievements allowed')
    .optional(),
});

const skillsSchema = z.object({
  technical: z.array(z.string().min(1, 'Skill cannot be empty'))
    .max(20, 'Maximum 20 technical skills allowed'),
  soft: z.array(z.string().min(1, 'Skill cannot be empty'))
    .max(15, 'Maximum 15 soft skills allowed'),
  languages: z.array(z.string().min(1, 'Language cannot be empty'))
    .max(10, 'Maximum 10 languages allowed'),
  certifications: z.array(z.string().min(1, 'Certification cannot be empty'))
    .max(10, 'Maximum 10 certifications allowed'),
});

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  technologies: z.array(z.string().min(1, 'Technology cannot be empty'))
    .max(15, 'Maximum 15 technologies allowed'),
  url: commonValidators.website,
  github: commonValidators.github,
  startDate: commonValidators.yearMonth,
  endDate: commonValidators.yearMonth.optional(),
});

const customSectionSchema = z.object({
  id: z.string().optional(),
  title: z.string()
    .min(1, 'Section title is required')
    .max(50, 'Section title must be less than 50 characters'),
  content: z.string()
    .min(1, 'Section content is required')
    .max(2000, 'Section content must be less than 2000 characters'),
  type: z.enum(['text', 'list', 'achievements'], {
    invalid_type_error: 'Invalid section type'
  }),
});

// Resume validation schemas - now using direct references instead of z.lazy()
export const resumeSchemas = {
  personalInfo: personalInfoSchema,
  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  project: projectSchema,
  customSection: customSectionSchema,
  
  createResume: z.object({
    title: commonValidators.resumeTitle,
    templateId: commonValidators.uuid.optional(),
    targetRole: commonValidators.targetRole.optional(),
    industry: commonValidators.industry.optional(),
  }),
  
  updateResume: z.object({
    title: commonValidators.resumeTitle.optional(),
    templateId: commonValidators.uuid.optional(),
    personalInfo: personalInfoSchema.optional(),
    professionalSummary: z.string()
      .max(500, 'Professional summary must be less than 500 characters')
      .optional(),
    experience: z.array(experienceSchema).optional(),
    education: z.array(educationSchema).optional(),
    skills: skillsSchema.optional(),
    projects: z.array(projectSchema).optional(),
    customSections: z.array(customSectionSchema).optional(),
    targetRole: commonValidators.targetRole.optional(),
    industry: commonValidators.industry.optional(),
    isPublic: z.boolean().optional(),
  }),
};

// Template validation schemas
export const templateSchemas = {
  create: z.object({
    name: z.string()
      .min(1, 'Template name is required')
      .max(100, 'Template name must be less than 100 characters'),
    category: commonValidators.templateCategory,
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional(),
    htmlTemplate: z.string().min(1, 'HTML template is required'),
    cssStyles: z.string().min(1, 'CSS styles are required'),
    previewImage: z.string().url('Invalid preview image URL').optional(),
    isPremium: z.boolean().default(false),
  }),
  
  update: z.object({
    name: z.string()
      .min(1, 'Template name is required')
      .max(100, 'Template name must be less than 100 characters')
      .optional(),
    category: commonValidators.templateCategory.optional(),
    description: z.string()
      .max(500, 'Description must be less than 500 characters')
      .optional(),
    htmlTemplate: z.string().min(1, 'HTML template is required').optional(),
    cssStyles: z.string().min(1, 'CSS styles are required').optional(),
    previewImage: z.string().url('Invalid preview image URL').optional(),
    isPremium: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
};

// Feedback validation schemas
export const feedbackSchemas = {
  create: z.object({
    type: z.enum(['ai_enhancement', 'template', 'general'], {
      invalid_type_error: 'Invalid feedback type'
    }),
    rating: z.number()
      .min(1, 'Rating must be between 1 and 5')
      .max(5, 'Rating must be between 1 and 5')
      .optional(),
    comment: z.string()
      .min(1, 'Comment is required')
      .max(1000, 'Comment must be less than 1000 characters'),
    resumeId: commonValidators.uuid.optional(),
    enhancementId: commonValidators.uuid.optional(),
    isPublic: z.boolean().default(false),
  }),
};

// Query parameter validation schemas
export const querySchemas = {
  pagination: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .refine(val => val >= 1, 'Page must be at least 1')
      .default('1'),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
      .default('10'),
  }),
  
  resumeFilters: z.object({
    industry: commonValidators.industry.optional(),
    targetRole: commonValidators.targetRole.optional(),
    isPublic: z.string()
      .transform(val => val === 'true')
      .optional(),
    search: z.string()
      .max(100, 'Search query must be less than 100 characters')
      .optional(),
  }),
  
  templateFilters: z.object({
    category: commonValidators.templateCategory.optional(),
    isPremium: z.string()
      .transform(val => val === 'true')
      .optional(),
    isActive: z.string()
      .transform(val => val === 'true')
      .optional(),
  }),
};

// File validation schemas
export const fileSchemas = {
  upload: z.object({
    fileName: z.string()
      .min(1, 'File name is required')
      .max(255, 'File name must be less than 255 characters'),
    fileSize: z.number()
      .min(1, 'File size must be greater than 0')
      .max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB
    mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], {
      invalid_type_error: 'Unsupported file type'
    }),
  }),
};

// Utility functions for validation
export const validationUtils = {
  isValidUUID: (uuid: string): boolean => UUID_REGEX.test(uuid),
  isValidEmail: (email: string): boolean => EMAIL_REGEX.test(email),
  isValidURL: (url: string): boolean => URL_REGEX.test(url),
  isValidPhone: (phone: string): boolean => PHONE_REGEX.test(phone),
  
  sanitizeString: (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
  },
  
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
  
  validateDateRange: (startDate: string, endDate?: string): boolean => {
    if (!endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  },
  
  validateAge: (birthDate: string, minAge: number = 16): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= minAge;
    }
    return age >= minAge;
  },
};

// Type exports for better TypeScript integration
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type Project = z.infer<typeof projectSchema>;
export type CustomSection = z.infer<typeof customSectionSchema>;
export type CreateResume = z.infer<typeof resumeSchemas.createResume>;
export type UpdateResume = z.infer<typeof resumeSchemas.updateResume>;




// validators/resume.validator.ts


// Personal Info Schema
const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal(""))
});

// Experience Schema
const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrentRole: z.boolean(),
  description: z.string(),
  achievements: z.array(z.string())
});

// Education Schema
const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  startDate: z.string(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  achievements: z.array(z.string()).optional()
});

// Skills Schema
const SkillsSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  languages: z.array(z.string()),
  certifications: z.array(z.string())
});

// Projects Schema
const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Project description is required"),
  technologies: z.array(z.string()),
  url: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  startDate: z.string(),
  endDate: z.string().optional()
});

// Custom Sections Schema
const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Section title is required"),
  content: z.string().min(1, "Section content is required"),
  type: z.enum(['text', 'list', 'achievements'])
});

// Main Resume Schema
export const CreateResumeSchema = z.object({
  title: z.string().min(1, "Resume title is required").optional(),
  templateId: z.string().uuid().optional(),
  personalInfo: PersonalInfoSchema.optional(),
  professionalSummary: z.string().optional(),
  experience: z.array(ExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(ProjectSchema).optional(),
  customSections: z.array(CustomSectionSchema).optional(),
  targetRole: z.string().max(100).optional(),
  industry: z.string().max(50).optional(),
  isPublic: z.boolean().default(false)
});

export const UpdateResumeSchema = CreateResumeSchema.partial().extend({
  id: z.string().uuid()
});

export const ResumeQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default("10"),
  search: z.string().optional(),
  industry: z.string().optional(),
  isPublic: z.string().transform(val => val === 'true').optional()
});

export const ShareResumeSchema = z.object({
  isPublic: z.boolean()
});

export const BulkDeleteSchema = z.object({
  resumeIds: z.array(z.string().uuid()).min(1, "At least one resume ID is required")
});

export type CreateResumeInput = z.infer<typeof CreateResumeSchema>;
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>;
export type ResumeQueryInput = z.infer<typeof ResumeQuerySchema>;
export type ShareResumeInput = z.infer<typeof ShareResumeSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;