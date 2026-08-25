import { loadEnv } from 'vite';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../db/schema';

// Load .env variables for test environment
Object.assign(process.env, loadEnv('', process.cwd(), ''));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = neon(DATABASE_URL);
export const testDb = drizzle(client, { schema });

export async function cleanDatabase() {
	await testDb.execute(sql`TRUNCATE TABLE reactions, todos, users CASCADE`);
}
