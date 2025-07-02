// src/db/db.ts (or just db.ts depending on your structure)
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js'; // your schema file with `pgTable(...)`

// Your DATABASE_URL from .env or directly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
