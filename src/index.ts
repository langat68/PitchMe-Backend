import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 👈 import cors middleware
import { auth } from './Auth/auth.route.js';
import { resumeRoutes } from './Resume/resume.route.js';
import { templateRoutes } from './Templates/template.route.js';

const app = new Hono();

// 🌐 Enable CORS
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || '*', // allow all or set specific origin
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/', (c) => c.text('Resume Builder Backend Running 🚀'));

// ✅ Mount routes
app.route('/auth', auth);
app.route('/resumes', resumeRoutes);
app.route('/api', templateRoutes); // Templates available at /api/templates

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
});

console.log(`🚀 Server running on port ${Number(process.env.PORT) || 3000}`);

