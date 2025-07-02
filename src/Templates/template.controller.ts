
// controllers/templateController.ts
import type  { Context } from 'hono';
import { TemplateService } from './template.service.js';

const templateService = new TemplateService();

export class TemplateController {
  // GET /templates
  async getTemplates(c: Context) {
    try {
      const category = c.req.query('category');
      const templates = await templateService.getActiveTemplates(category);
      
      return c.json({ templates });
    } catch (error) {
      return c.json({ error: 'Failed to fetch templates' }, 500);
    }
  }

  // GET /templates/:id
  async getTemplate(c: Context) {
    try {
      const id = c.req.param('id');
      const template = await templateService.getTemplateById(id);
      
      if (!template) {
        return c.json({ error: 'Template not found' }, 404);
      }

      // Don't expose sensitive data in public endpoint
      const publicTemplate = {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        previewImage: template.previewImage,
        isPremium: template.isPremium,
      };
      
      return c.json({ template: publicTemplate });
    } catch (error) {
      return c.json({ error: 'Failed to fetch template' }, 500);
    }
  }

  // GET /templates/categories
  async getCategories(c: Context) {
    try {
      const categories = await templateService.getCategories();
      return c.json({ categories });
    } catch (error) {
      return c.json({ error: 'Failed to fetch categories' }, 500);
    }
  }

  // GET /templates/:id/full (protected - for actual resume creation)
  async getFullTemplate(c: Context) {
    try {
      const id = c.req.param('id');
      const user = c.get('user'); // From auth middleware
      
      const canAccess = await templateService.canAccessTemplate(id, user.subscriptionTier);
      if (!canAccess) {
        return c.json({ error: 'Access denied to this template' }, 403);
      }

      const template = await templateService.getTemplateById(id);
      return c.json({ template });
    } catch (error) {
      return c.json({ error: 'Failed to fetch template' }, 500);
    }
  }

  // Admin endpoints
  async createTemplate(c: Context) {
    try {
      const templateData = await c.req.json();
      const template = await templateService.createTemplate(templateData);
      return c.json({ template }, 201);
    } catch (error) {
      return c.json({ error: 'Failed to create template' }, 500);
    }
  }

  async updateTemplate(c: Context) {
    try {
      const id = c.req.param('id');
      const updates = await c.req.json();
      const template = await templateService.updateTemplate(id, updates);
      return c.json({ template });
    } catch (error) {
      return c.json({ error: 'Failed to update template' }, 500);
    }
  }

  async toggleTemplate(c: Context) {
    try {
      const id = c.req.param('id');
      const template = await templateService.toggleActive(id);
      return c.json({ template });
    } catch (error) {
      return c.json({ error: 'Failed to toggle template' }, 500);
    }
  }
}
