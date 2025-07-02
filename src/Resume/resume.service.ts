// services/resume.service.ts
import { eq, and, desc, asc, ilike, sql } from 'drizzle-orm';
import { db } from '../db/db.js'; // Adjust path as needed
import { resumes, userAnalytics, templates } from '../db/schema.js'; // Adjust path as needed
import type  { 
  CreateResumeInput, 
  UpdateResumeInput, 
  ResumeQueryInput,
  ShareResumeInput,
  BulkDeleteInput 
} from '../validator.js';
import { randomUUID } from 'crypto';

// Helper function to handle unknown errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export class ResumeService {
  
  async createResume(userId: string, data: CreateResumeInput) {
    try {
      const [resume] = await db.insert(resumes).values({
        ...data,
        userId,
        shareToken: data.isPublic ? randomUUID() : null,
      }).returning();

      // Log analytics
      await this.logUserAction(userId, resume.id, 'resume_created', {
        templateId: data.templateId,
        targetRole: data.targetRole,
        industry: data.industry
      });

      return resume;
    } catch (error) {
      throw new Error(`Failed to create resume: ${getErrorMessage(error)}`);
    }
  }

  async getResumeById(resumeId: string, userId?: string) {
    try {
      const query = db
        .select({
          resume: resumes,
          template: templates
        })
        .from(resumes)
        .leftJoin(templates, eq(resumes.templateId, templates.id))
        .where(eq(resumes.id, resumeId));

      const [result] = await query;
      
      if (!result) {
        throw new Error('Resume not found');
      }

      // Check access rights
      if (userId && result.resume.userId !== userId && !result.resume.isPublic) {
        throw new Error('Access denied');
      }

      return {
        ...result.resume,
        template: result.template
      };
    } catch (error) {
      throw new Error(`Failed to get resume: ${getErrorMessage(error)}`);
    }
  }

  async getUserResumes(userId: string, query: ResumeQueryInput) {
    try {
      const { page, limit, search, industry, isPublic } = query;
      const offset = (page - 1) * limit;

      let whereConditions = [eq(resumes.userId, userId)];

      if (search) {
        whereConditions.push(
          sql`(${resumes.title} ILIKE ${'%' + search + '%'} OR ${resumes.targetRole} ILIKE ${'%' + search + '%'})`
        );
      }

      if (industry) {
        whereConditions.push(eq(resumes.industry, industry));
      }

      if (isPublic !== undefined) {
        whereConditions.push(eq(resumes.isPublic, isPublic));
      }

      const [resumeList, countResult] = await Promise.all([
        db
          .select({
            resume: resumes,
            template: templates
          })
          .from(resumes)
          .leftJoin(templates, eq(resumes.templateId, templates.id))
          .where(and(...whereConditions))
          .orderBy(desc(resumes.updatedAt))
          .limit(limit)
          .offset(offset),
        
        db
          .select({ count: sql<number>`count(*)` })
          .from(resumes)
          .where(and(...whereConditions))
      ]);

      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        resumes: resumeList.map(r => ({
          ...r.resume,
          template: r.template
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user resumes: ${getErrorMessage(error)}`);
    }
  }

  async updateResume(resumeId: string, userId: string, data: UpdateResumeInput) {
    try {
      // Verify ownership
      const existingResume = await this.getResumeById(resumeId, userId);
      if (existingResume.userId !== userId) {
        throw new Error('Access denied');
      }

      // Generate share token if making public
      let updateData: any = { ...data };
      if (data.isPublic === true && !existingResume.shareToken) {
        updateData.shareToken = randomUUID();
      } else if (data.isPublic === false && existingResume.shareToken) {
        updateData.shareToken = null;
      }

      const [updatedResume] = await db
        .update(resumes)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(resumes.id, resumeId))
        .returning();

      // Log analytics
      await this.logUserAction(userId, resumeId, 'resume_updated', {
        fieldsUpdated: Object.keys(data)
      });

      return updatedResume;
    } catch (error) {
      throw new Error(`Failed to update resume: ${getErrorMessage(error)}`);
    }
  }

  async deleteResume(resumeId: string, userId: string) {
    try {
      // Verify ownership
      const existingResume = await this.getResumeById(resumeId);
      if (existingResume.userId !== userId) {
        throw new Error('Access denied');
      }

      await db.delete(resumes).where(eq(resumes.id, resumeId));

      // Log analytics
      await this.logUserAction(userId, resumeId, 'resume_deleted');

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete resume: ${getErrorMessage(error)}`);
    }
  }

  async bulkDeleteResumes(userId: string, data: BulkDeleteInput) {
    try {
      const { resumeIds } = data;

      // Verify ownership of all resumes
      const userResumes = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(
          eq(resumes.userId, userId),
          sql`${resumes.id} = ANY(${resumeIds})`
        ));

      if (userResumes.length !== resumeIds.length) {
        throw new Error('Some resumes not found or access denied');
      }

      await db.delete(resumes).where(
        and(
          eq(resumes.userId, userId),
          sql`${resumes.id} = ANY(${resumeIds})`
        )
      );

      // Log analytics
      await this.logUserAction(userId, null, 'bulk_delete_resumes', {
        deletedCount: resumeIds.length,
        resumeIds
      });

      return { success: true, deletedCount: resumeIds.length };
    } catch (error) {
      throw new Error(`Failed to bulk delete resumes: ${getErrorMessage(error)}`);
    }
  }

  async shareResume(resumeId: string, userId: string, data: ShareResumeInput) {
    try {
      const { isPublic } = data;
      
      let shareToken = null;
      if (isPublic) {
        shareToken = randomUUID();
      }

      const [updatedResume] = await db
        .update(resumes)
        .set({
          isPublic,
          shareToken,
          updatedAt: new Date()
        })
        .where(and(
          eq(resumes.id, resumeId),
          eq(resumes.userId, userId)
        ))
        .returning();

      if (!updatedResume) {
        throw new Error('Resume not found or access denied');
      }

      // Log analytics
      await this.logUserAction(userId, resumeId, 'resume_shared', {
        isPublic,
        shareToken
      });

      return updatedResume;
    } catch (error) {
      throw new Error(`Failed to share resume: ${getErrorMessage(error)}`);
    }
  }

  async getResumeByShareToken(shareToken: string) {
    try {
      const [resume] = await db
        .select({
          resume: resumes,
          template: templates
        })
        .from(resumes)
        .leftJoin(templates, eq(resumes.templateId, templates.id))
        .where(and(
          eq(resumes.shareToken, shareToken),
          eq(resumes.isPublic, true)
        ));

      if (!resume) {
        throw new Error('Public resume not found');
      }

      return {
        ...resume.resume,
        template: resume.template
      };
    } catch (error) {
      throw new Error(`Failed to get shared resume: ${getErrorMessage(error)}`);
    }
  }

  async duplicateResume(resumeId: string, userId: string, title?: string) {
    try {
      const originalResume = await this.getResumeById(resumeId, userId);
      
      if (originalResume.userId !== userId) {
        throw new Error('Access denied');
      }

      const duplicateData: any = {
        ...originalResume,
        title: title || `${originalResume.title} (Copy)`,
        isPublic: false,
        shareToken: null
      };

      // Remove id and timestamps - create a clean object for insertion
      const {
        id,
        createdAt,
        updatedAt,
        template,
        ...cleanData
      } = duplicateData;

      const [duplicatedResume] = await db.insert(resumes).values(cleanData).returning();

      // Log analytics
      await this.logUserAction(userId, duplicatedResume.id, 'resume_duplicated', {
        originalResumeId: resumeId
      });

      return duplicatedResume;
    } catch (error) {
      throw new Error(`Failed to duplicate resume: ${getErrorMessage(error)}`);
    }
  }

  async getResumeStats(userId: string) {
    try {
      const stats = await db
        .select({
          total: sql<number>`count(*)`,
          public: sql<number>`count(*) filter (where ${resumes.isPublic} = true)`,
          private: sql<number>`count(*) filter (where ${resumes.isPublic} = false)`,
          withTemplate: sql<number>`count(*) filter (where ${resumes.templateId} is not null)`,
          avgAtsScore: sql<number>`avg(${resumes.atsScore})`
        })
        .from(resumes)
        .where(eq(resumes.userId, userId));

      return stats[0] || {
        total: 0,
        public: 0,
        private: 0,
        withTemplate: 0,
        avgAtsScore: null
      };
    } catch (error) {
      throw new Error(`Failed to get resume stats: ${getErrorMessage(error)}`);
    }
  }

  private async logUserAction(
    userId: string, 
    resumeId: string | null, 
    actionType: string, 
    metadata?: Record<string, any>
  ) {
    try {
      await db.insert(userAnalytics).values({
        userId,
        resumeId,
        actionType,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      // Log error but don't throw - analytics failure shouldn't break main functionality
      console.error('Failed to log user action:', getErrorMessage(error));
    }
  }
}