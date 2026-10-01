/**
 * 短 ID 生成与唯一性校验单一信源
 */

import { eq } from 'drizzle-orm';
import { todos } from '../db/schema';
import type { Database } from '../db';
import { generateShortId } from '../validation';

export async function generateUniqueShortId(db: Database): Promise<string> {
	for (let i = 0; i < 10; i++) {
		const shortId = generateShortId(8);
		const existing = await db
			.select({ id: todos.id })
			.from(todos)
			.where(eq(todos.shortId, shortId))
			.limit(1);
		if (!existing[0]) {
			return shortId;
		}
	}
	return `${generateShortId(6)}${Date.now().toString(36).slice(-2)}`;
}
