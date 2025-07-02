import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { auth } from './Auth/auth.route.js';
import { resumeRoutes } from './Resume/resume.route.js';
import { templateRoutes } from './Templates/template.route.js';

const app = new Hono();

app.get('/', (c) => c.text('Resume Builder Backend Running 🚀'));

// ✅ Mount routes
app.route('/auth', auth);
app.route('/resumes', resumeRoutes);
app.route('/api', templateRoutes); // Templates will be available at /api/templates

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
});

console.log(`🚀 Server running on port ${Number(process.env.PORT) || 3000}`);
console.log('📚 Available routes:');
console.log('  - GET  /');
console.log('  - POST /auth/login');
console.log('  - POST /auth/register');
console.log('  - GET  /resumes');
console.log('  - POST /resumes');
console.log('  - GET  /api/templates');
console.log('  - GET  /api/templates/categories');
console.log('  - GET  /api/templates/:id');
console.log('  - GET  /api/templates/:id/full (protected)');
console.log('  - POST /api/admin/templates (admin)');
console.log('  - PUT  /api/admin/templates/:id (admin)');
console.log('  - PATCH /api/admin/templates/:id/toggle (admin)');