// routes/resume.routes.ts
import { Hono } from 'hono';
import { ResumeController } from './resume.controller.js';
import { authMiddleware } from '../middleware.js'; // Adjust path as needed
import { rateLimitMiddleware } from '../rate.middleware.js'; // Adjust path as needed

const resumeRoutes = new Hono();
const resumeController = new ResumeController();

// Public routes (no auth required)
resumeRoutes.get('/shared/:token', resumeController.getSharedResume);

// Protected routes (require authentication)
resumeRoutes.use('/*', authMiddleware);

// Resume CRUD operations
resumeRoutes.post('/', rateLimitMiddleware({ max: 10, windowMs: 60000 }), resumeController.createResume);
resumeRoutes.get('/', resumeController.getUserResumes);
resumeRoutes.get('/stats', resumeController.getResumeStats);
resumeRoutes.get('/:id', resumeController.getResume);
resumeRoutes.put('/:id', rateLimitMiddleware({ max: 20, windowMs: 60000 }), resumeController.updateResume);
resumeRoutes.delete('/:id', resumeController.deleteResume);

// Bulk operations
resumeRoutes.post('/bulk-delete', resumeController.bulkDeleteResumes);

// Resume sharing
resumeRoutes.post('/:id/share', resumeController.shareResume);

// Resume duplication
resumeRoutes.post('/:id/duplicate', resumeController.duplicateResume);

export { resumeRoutes };