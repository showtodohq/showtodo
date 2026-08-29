import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

function normalizeContent(content) {
	if (!content) return '';
	let normalized = content
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');
	normalized = normalized.replace(/[.,!?;:。，！？；：…~～、]+$/g, '').trim();
	return normalized;
}

function computeTopicHash(category, content) {
	const catKey = (category ?? '').trim().toLowerCase();
	const normalizedContent = normalizeContent(content);
	const raw = `${catKey}:${normalizedContent}`;
	return createHash('sha256').update(raw, 'utf8').digest('hex').substring(0, 16);
}

async function backfill() {
	const sql = neon(DATABASE_URL);
	console.log('Fetching todos to backfill...');

	const todos = await sql`SELECT id, content, category, topic_hash FROM todos`;
	console.log(`Found ${todos.length} todos.`);

	let updated = 0;
	for (const todo of todos) {
		const newHash = computeTopicHash(todo.category, todo.content);
		if (todo.topic_hash !== newHash) {
			await sql`UPDATE todos SET topic_hash = ${newHash} WHERE id = ${todo.id}`;
			updated++;
		}
	}

	console.log(`Backfill complete. Updated ${updated} of ${todos.length} todos.`);
}

backfill().catch((err) => {
	console.error('Backfill failed:', err);
	process.exit(1);
});
