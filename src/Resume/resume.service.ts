import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { resumes, userAnalytics, templates } from '../db/schema.js';
import type {
  CreateResumeInput,
  UpdateResumeInput,
  ResumeQueryInput,
  ShareResumeInput,
  BulkDeleteInput
} from '../validator.js';
import { randomUUID } from 'crypto';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export class ResumeService {
  async createResume(userId: string, data: CreateResumeInput) {
    try {
      const [resume] = await db.insert(resumes).values({
        userId,
        templateId: data.templateId ?? null,
        title: data.title ?? 'Untitled Resume',
        personalInfo: data.personalInfo,
        professionalSummary: data.professionalSummary ?? null,
        experience: data.experience ?? [],
        education: data.education ?? [],
        skills: Array.isArray(data.skills)
          ? {
              technical: data.skills,
              soft: [],
              languages: [],
              certifications: []
            }
          : data.skills ?? {
              technical: [],
              soft: [],
              languages: [],
              certifications: []
            },
        projects: data.projects ?? [],
        customSections: data.customSections ?? [],
        targetRole: data.targetRole ?? null,
        industry: data.industry ?? null,
        isPublic: data.isPublic ?? false,
        shareToken: data.isPublic ? randomUUID() : null
      }).returning();

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
      const [result] = await db
        .select({ resume: resumes, template: templates })
        .from(resumes)
        .leftJoin(templates, eq(resumes.templateId, templates.id))
        .where(eq(resumes.id, resumeId));

      if (!result) throw new Error('Resume not found');

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

      const conditions = [eq(resumes.userId, userId)];

      if (search) {
        conditions.push(
          sql`(${resumes.title} ILIKE ${'%' + search + '%'} OR ${resumes.targetRole} ILIKE ${'%' + search + '%'})`
        );
      }

      if (industry) {
        conditions.push(eq(resumes.industry, industry));
      }

      if (isPublic !== undefined) {
        conditions.push(eq(resumes.isPublic, isPublic));
      }

      const [resumeList, countResult] = await Promise.all([
        db
          .select({ resume: resumes, template: templates })
          .from(resumes)
          .leftJoin(templates, eq(resumes.templateId, templates.id))
          .where(and(...conditions))
          .orderBy(desc(resumes.updatedAt))
          .limit(limit)
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)` })
          .from(resumes)
          .where(and(...conditions))
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
      const existingResume = await this.getResumeById(resumeId, userId);
      if (existingResume.userId !== userId) throw new Error('Access denied');

      let updateData: any = { ...data };
      if (data.isPublic === true && !existingResume.shareToken) {
        updateData.shareToken = randomUUID();
      } else if (data.isPublic === false && existingResume.shareToken) {
        updateData.shareToken = null;
      }

      const [updated] = await db
        .update(resumes)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(resumes.id, resumeId))
        .returning();

      await this.logUserAction(userId, resumeId, 'resume_updated', {
        fieldsUpdated: Object.keys(data)
      });

      return updated;
    } catch (error) {
      throw new Error(`Failed to update resume: ${getErrorMessage(error)}`);
    }
  }

  async deleteResume(resumeId: string, userId: string) {
    try {
      const existing = await this.getResumeById(resumeId);
      if (existing.userId !== userId) throw new Error('Access denied');

      await db.delete(resumes).where(eq(resumes.id, resumeId));

      await this.logUserAction(userId, resumeId, 'resume_deleted');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete resume: ${getErrorMessage(error)}`);
    }
  }

  async bulkDeleteResumes(userId: string, data: BulkDeleteInput) {
    try {
      const ids = data.resumeIds;

      const owned = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(and(
          eq(resumes.userId, userId),
          sql`${resumes.id} = ANY(${ids})`
        ));

      if (owned.length !== ids.length) {
        throw new Error('Some resumes not found or not owned by user');
      }

      await db.delete(resumes).where(
        and(
          eq(resumes.userId, userId),
          sql`${resumes.id} = ANY(${ids})`
        )
      );

      await this.logUserAction(userId, null, 'bulk_delete_resumes', {
        deletedCount: ids.length,
        resumeIds: ids
      });

      return { success: true, deletedCount: ids.length };
    } catch (error) {
      throw new Error(`Failed to bulk delete resumes: ${getErrorMessage(error)}`);
    }
  }

  async shareResume(resumeId: string, userId: string, data: ShareResumeInput) {
    try {
      const { isPublic } = data;

      const [updated] = await db
        .update(resumes)
        .set({
          isPublic,
          shareToken: isPublic ? randomUUID() : null,
          updatedAt: new Date()
        })
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
        .returning();

      if (!updated) throw new Error('Resume not found or unauthorized');

      await this.logUserAction(userId, resumeId, 'resume_shared', {
        isPublic,
        shareToken: updated.shareToken
      });

      return updated;
    } catch (error) {
      throw new Error(`Failed to share resume: ${getErrorMessage(error)}`);
    }
  }

  async getResumeByShareToken(token: string) {
    try {
      const [found] = await db
        .select({ resume: resumes, template: templates })
        .from(resumes)
        .leftJoin(templates, eq(resumes.templateId, templates.id))
        .where(and(eq(resumes.shareToken, token), eq(resumes.isPublic, true)));

      if (!found) throw new Error('Public resume not found');

      return {
        ...found.resume,
        template: found.template
      };
    } catch (error) {
      throw new Error(`Failed to get shared resume: ${getErrorMessage(error)}`);
    }
  }

  async duplicateResume(resumeId: string, userId: string, title?: string) {
    try {
      const resume = await this.getResumeById(resumeId, userId);
      if (resume.userId !== userId) throw new Error('Access denied');

      const {
        id, createdAt, updatedAt, template, ...clean
      } = resume;

      const [duplicated] = await db.insert(resumes).values({
        ...clean,
        userId,
        title: title ?? `${resume.title} (Copy)`,
        isPublic: false,
        shareToken: null
      }).returning();

      await this.logUserAction(userId, duplicated.id, 'resume_duplicated', {
        originalResumeId: resumeId
      });

      return duplicated;
    } catch (error) {
      throw new Error(`Failed to duplicate resume: ${getErrorMessage(error)}`);
    }
  }

  async getResumeStats(userId: string) {
    try {
      const [stats] = await db
        .select({
          total: sql<number>`count(*)`,
          public: sql<number>`count(*) filter (where ${resumes.isPublic} = true)`,
          private: sql<number>`count(*) filter (where ${resumes.isPublic} = false)`,
          withTemplate: sql<number>`count(*) filter (where ${resumes.templateId} is not null)`,
          avgAtsScore: sql<number>`avg(${resumes.atsScore})`
        })
        .from(resumes)
        .where(eq(resumes.userId, userId));

      return stats || {
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
      console.error('Failed to log user action:', getErrorMessage(error));
    }
  }
}
