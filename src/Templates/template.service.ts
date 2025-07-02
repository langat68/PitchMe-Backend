// services/templateService.ts
import { db } from '../db/db.js';
import { templates } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class TemplateService {
  // Get all active templates (public endpoint)
  async getActiveTemplates(category?: string) {
    const whereClause = category 
      ? and(eq(templates.isActive, true), eq(templates.category, category))
      : eq(templates.isActive, true);
    
    return await db
      .select({
        id: templates.id,
        name: templates.name,
        category: templates.category,
        description: templates.description,
        previewImage: templates.previewImage,
        isPremium: templates.isPremium,
      })
      .from(templates)
      .where(whereClause)
      .orderBy(templates.createdAt);
  }

  // Get template by ID (for resume creation)
  async getTemplateById(id: string) {
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);
    
    return template[0] || null;
  }

  // Get template categories
  async getCategories() {
    const categories = await db
      .selectDistinct({ category: templates.category })
      .from(templates)
      .where(eq(templates.isActive, true));
    
    return categories.map(c => c.category);
  }

  // Admin: Create template
  async createTemplate(templateData: {
    name: string;
    category: string;
    description?: string;
    htmlTemplate: string;
    cssStyles: string;
    previewImage?: string;
    isPremium?: boolean;
  }) {
    const [template] = await db
      .insert(templates)
      .values(templateData)
      .returning();
    
    return template;
  }

  // Admin: Update template
  async updateTemplate(id: string, updates: Partial<{
    name: string;
    category: string;
    description?: string;
    htmlTemplate: string;
    cssStyles: string;
    previewImage?: string;
    isPremium?: boolean;
    isActive?: boolean;
  }>) {
    const [updated] = await db
      .update(templates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    
    return updated;
  }

  // Admin: Toggle template active status
  async toggleActive(id: string) {
    const template = await this.getTemplateById(id);
    if (!template) throw new Error('Template not found');
    
    const [updated] = await db
      .update(templates)
      .set({ isActive: !template.isActive, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    
    return updated;
  }

  // Check if user can access premium template
  async canAccessTemplate(templateId: string, userSubscriptionTier: string) {
    const template = await this.getTemplateById(templateId);
    if (!template) return false;
    
    // Free users can't access premium templates
    if (template.isPremium && userSubscriptionTier === 'free') {
      return false;
    }
    
    return template.isActive;
  }
}