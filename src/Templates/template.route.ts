// routes/templateRoutes.ts
import { Hono } from 'hono';
import { TemplateController } from '../Templates/template.controller.js';
import { authMiddleware } from '../middleware.js';

const templateController = new TemplateController();

export const templateRoutes = new Hono()
  // Public routes - no authentication required
  .get('/templates', templateController.getTemplates.bind(templateController))
  .get('/templates/categories', templateController.getCategories.bind(templateController))
  .get('/templates/:id', templateController.getTemplate.bind(templateController))
  
  // Protected routes - require user authentication
  .get('/templates/:id/full', authMiddleware, templateController.getFullTemplate.bind(templateController))
  
  // Admin routes - require user authentication (add admin role check in controller)
  .post('/admin/templates', authMiddleware, templateController.createTemplate.bind(templateController))
  .put('/admin/templates/:id', authMiddleware, templateController.updateTemplate.bind(templateController))
  .patch('/admin/templates/:id/toggle', authMiddleware, templateController.toggleTemplate.bind(templateController));

// If you want to export individual route handlers for more granular control:
export const publicTemplateRoutes = new Hono()
  .get('/templates', templateController.getTemplates.bind(templateController))
  .get('/templates/categories', templateController.getCategories.bind(templateController))
  .get('/templates/:id', templateController.getTemplate.bind(templateController));

export const protectedTemplateRoutes = new Hono()
  .get('/templates/:id/full', authMiddleware, templateController.getFullTemplate.bind(templateController));

export const adminTemplateRoutes = new Hono()
  .post('/templates', authMiddleware, templateController.createTemplate.bind(templateController))
  .put('/templates/:id', authMiddleware, templateController.updateTemplate.bind(templateController))
  .patch('/templates/:id/toggle', authMiddleware, templateController.toggleTemplate.bind(templateController));

// Alternative: If you prefer a more explicit routing structure
export const createTemplateRoutes = () => {
  const routes = new Hono();

  // Public endpoints
  routes.get('/templates', async (c) => {
    return await templateController.getTemplates(c);
  });

  routes.get('/templates/categories', async (c) => {
    return await templateController.getCategories(c);
  });

  routes.get('/templates/:id', async (c) => {
    return await templateController.getTemplate(c);
  });

  // Protected endpoints
  routes.get('/templates/:id/full', authMiddleware, async (c) => {
    return await templateController.getFullTemplate(c);
  });

  // Admin endpoints
  routes.post('/admin/templates', authMiddleware, async (c) => {
    return await templateController.createTemplate(c);
  });

  routes.put('/admin/templates/:id', authMiddleware, async (c) => {
    return await templateController.updateTemplate(c);
  });

  routes.patch('/admin/templates/:id/toggle', authMiddleware, async (c) => {
    return await templateController.toggleTemplate(c);
  });

  return routes;
};

// Usage in your main app file would be:
// import { templateRoutes } from './routes/templateRoutes';
// app.route('/', templateRoutes);

// Or if using the factory function:
// import { createTemplateRoutes } from './routes/templateRoutes';
// app.route('/', createTemplateRoutes());