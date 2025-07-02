import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { auth } from './Auth/auth.route.js';
import { resumeRoutes } from './Resume/resume.route.js';


const app = new Hono();

app.get('/', (c) => c.text('Resume Builder Backend Running 🚀'));

// ✅ Mount routes
app.route('/auth', auth);
app.route('/resumes', resumeRoutes); // -> POST /resumes works

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
});
