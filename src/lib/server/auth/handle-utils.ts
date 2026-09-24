import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Database } from '../db';
import { sanitizeHandle, generateRandomSuffix } from '../validation';

export async function generateUniqueHandleForAuth(db: Database, seed: string): Promise<string> {
	const base = sanitizeHandle(seed);
	const existing = await db.select({ id: users.id }).from(users).where(eq(users.handle, base)).limit(1);
	if (!existing[0]) return base;

	for (let i = 0; i < 10; i++) {
		const candidate = `${base}-${generateRandomSuffix(4)}`;
		const check = await db.select({ id: users.id }).from(users).where(eq(users.handle, candidate)).limit(1);
		if (!check[0]) return candidate;
	}
	return `${base}-${Date.now().toString(36)}`;
}
