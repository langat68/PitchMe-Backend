// controllers/resume.controller.ts
import type { Context } from 'hono';
import { ResumeService } from './resume.service.js';
import { 
  CreateResumeSchema, 
  UpdateResumeSchema, 
  ResumeQuerySchema,
  ShareResumeSchema,
  BulkDeleteSchema
} from '../validator.js';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

// Helper function to handle unknown errors
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Helper function to check if error is a ZodError
function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export class ResumeController {
  private resumeService: ResumeService;

  constructor() {
    this.resumeService = new ResumeService();
  }

  // Create a new resume
  createResume = async (c: Context) => {
    try {
      const userId = c.get('userId'); // Assuming auth middleware sets this
      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const body = await c.req.json();
      const validatedData = CreateResumeSchema.parse(body);

      const resume = await this.resumeService.createResume(userId, validatedData);

      return c.json({
        success: true,
        data: resume,
        message: 'Resume created successfully'
      }, 201);
    } catch (error) {
      if (isZodError(error)) {
        throw new HTTPException(400, { 
          message: 'Validation error', 
          cause: error.errors 
        });
      }
      throw new HTTPException(500, { message: getErrorMessage(error) });
    }
  };

  // Get resume by ID
  getResume = async (c: Context) => {
    try {
      const resumeId = c.req.param('id');
      const userId = c.get('userId'); // Optional for public resumes

      if (!resumeId) {
        throw new HTTPException(400, { message: 'Resume ID is required' });
      }

      const resume = await this.resumeService.getResumeById(resumeId, userId);

      return c.json({
        success: true,
        data: resume
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Resume not found') {
        throw new HTTPException(404, { message: 'Resume not found' });
      }
      if (errorMessage === 'Access denied') {
        throw new HTTPException(403, { message: 'Access denied' });
      }
      throw new HTTPException(500, { message: errorMessage });
    }
  };

  // Get user's resumes
  getUserResumes = async (c: Context) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const query = ResumeQuerySchema.parse({
        page: c.req.query('page'),
        limit: c.req.query('limit'),
        search: c.req.query('search'),
        industry: c.req.query('industry'),
        isPublic: c.req.query('isPublic')
      });

      const result = await this.resumeService.getUserResumes(userId, query);

      return c.json({
        success: true,
        data: result.resumes,
        pagination: result.pagination
      });
    } catch (error) {
      if (isZodError(error)) {
        throw new HTTPException(400, { 
          message: 'Invalid query parameters', 
          cause: error.errors 
        });
      }
      throw new HTTPException(500, { message: getErrorMessage(error) });
    }
  };

  // Update resume
  updateResume = async (c: Context) => {
    try {
      const userId = c.get('userId');
      const resumeId = c.req.param('id');

      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      if (!resumeId) {
        throw new HTTPException(400, { message: 'Resume ID is required' });
      }

      const body = await c.req.json();
      const validatedData = UpdateResumeSchema.parse({ ...body, id: resumeId });

      const resume = await this.resumeService.updateResume(resumeId, userId, validatedData);

      return c.json({
        success: true,
        data: resume,
        message: 'Resume updated successfully'
      });
    } catch (error) {
      if (isZodError(error)) {
        throw new HTTPException(400, { 
          message: 'Validation error', 
          cause: error.errors 
        });
      }
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Access denied') {
        throw new HTTPException(403, { message: 'Access denied' });
      }
      throw new HTTPException(500, { message: errorMessage });
    }
  };

  // Delete resume
  deleteResume = async (c: Context) => {
    try {
      const userId = c.get('userId');
      const resumeId = c.req.param('id');

      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      if (!resumeId) {
        throw new HTTPException(400, { message: 'Resume ID is required' });
      }

      await this.resumeService.deleteResume(resumeId, userId);

      return c.json({
        success: true,
        message: 'Resume deleted successfully'
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Access denied') {
        throw new HTTPException(403, { message: 'Access denied' });
      }
      throw new HTTPException(500, { message: errorMessage });
    }
  };

  // Bulk delete resumes
  bulkDeleteResumes = async (c: Context) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const body = await c.req.json();
      const validatedData = BulkDeleteSchema.parse(body);

      const result = await this.resumeService.bulkDeleteResumes(userId, validatedData);

      return c.json({
        success: true,
        data: result,
        message: `${result.deletedCount} resumes deleted successfully`
      });
    } catch (error) {
      if (isZodError(error)) {
        throw new HTTPException(400, { 
          message: 'Validation error', 
          cause: error.errors 
        });
      }
      throw new HTTPException(500, { message: getErrorMessage(error) });
    }
  };

  // Share/unshare resume
  shareResume = async (c: Context) => {
    try {
      const userId = c.get('userId');
      const resumeId = c.req.param('id');

      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      if (!resumeId) {
        throw new HTTPException(400, { message: 'Resume ID is required' });
      }

      const body = await c.req.json();
      const validatedData = ShareResumeSchema.parse(body);

      const resume = await this.resumeService.shareResume(resumeId, userId, validatedData);

      return c.json({
        success: true,
        data: resume,
        message: validatedData.isPublic ? 'Resume shared successfully' : 'Resume made private successfully'
      });
    } catch (error) {
      if (isZodError(error)) {
        throw new HTTPException(400, { 
          message: 'Validation error', 
          cause: error.errors 
        });
      }
      throw new HTTPException(500, { message: getErrorMessage(error) });
    }
  };

  // Get shared resume by token
  getSharedResume = async (c: Context) => {
    try {
      const shareToken = c.req.param('token');

      if (!shareToken) {
        throw new HTTPException(400, { message: 'Share token is required' });
      }

      const resume = await this.resumeService.getResumeByShareToken(shareToken);

      return c.json({
        success: true,
        data: resume
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Public resume not found') {
        throw new HTTPException(404, { message: 'Shared resume not found' });
      }
      throw new HTTPException(500, { message: errorMessage });
    }
  };

  // Duplicate resume
  duplicateResume = async (c: Context) => {
    try {
      const userId = c.get('userId');
      const resumeId = c.req.param('id');

      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      if (!resumeId) {
        throw new HTTPException(400, { message: 'Resume ID is required' });
      }

      const body = await c.req.json().catch(() => ({}));
      const title = body.title;

      const resume = await this.resumeService.duplicateResume(resumeId, userId, title);

      return c.json({
        success: true,
        data: resume,
        message: 'Resume duplicated successfully'
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage === 'Access denied') {
        throw new HTTPException(403, { message: 'Access denied' });
      }
      throw new HTTPException(500, { message: errorMessage });
    }
  };

  // Get resume statistics
  getResumeStats = async (c: Context) => {
    try {
      const userId = c.get('userId');
      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      const stats = await this.resumeService.getResumeStats(userId);

      return c.json({
        success: true,
        data: stats
      });
    } catch (error) {
      throw new HTTPException(500, { message: getErrorMessage(error) });
    }
  };
}