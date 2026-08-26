import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';
import { generateRandomSuffix, sanitizeHandle, isUUID } from '../validation';

export async function findByEmail(db: Database, email: string) {
	const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
	return result[0] ?? null;
}

export async function findById(db: Database, id: string) {
	if (!isUUID(id)) return null;
	const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return result[0] ?? null;
}

export async function findByHandle(db: Database, handle: string) {
	const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
	const result = await db
		.select()
		.from(users)
		.where(eq(users.handle, cleanHandle.toLowerCase()))
		.limit(1);
	return result[0] ?? null;
}

export async function findByIdOrHandle(db: Database, identifier: string) {
	if (!identifier) return null;
	const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;

	if (isUUID(cleanIdentifier)) {
		const byId = await findById(db, cleanIdentifier);
		if (byId) return byId;
	}

	return findByHandle(db, cleanIdentifier);
}

async function generateUniqueHandle(db: Database, email: string): Promise<string> {
	const prefix = email.split('@')[0];
	const base = sanitizeHandle(prefix);

	const existing = await findByHandle(db, base);
	if (!existing) {
		return base;
	}

	// 发生重名，循环追加 4 位短随机后缀直到唯一
	for (let i = 0; i < 10; i++) {
		const candidate = `${base}-${generateRandomSuffix(4)}`;
		const check = await findByHandle(db, candidate);
		if (!check) {
			return candidate;
		}
	}
	return `${base}-${Date.now().toString(36)}`;
}

export async function findOrCreate(db: Database, email: string) {
	const existing = await findByEmail(db, email);
	if (existing) return existing;

	const nickname = email.split('@')[0];
	const handle = await generateUniqueHandle(db, email);

	const result = await db.insert(users).values({ email: email.toLowerCase(), nickname, handle }).returning();
	return result[0];
}

export async function update(
	db: Database,
	id: string,
	email: string,
	data: { nickname?: string; avatar?: string | null; handle?: string }
) {
	const user = await findByIdOrHandle(db, id);
	if (!user) throw new AppError('NOT_FOUND', 'User not found');
	if (user.email.toLowerCase() !== email.toLowerCase()) {
		throw new AppError('FORBIDDEN', 'Not authorized to update this user');
	}

	if (data.handle && data.handle.toLowerCase() !== user.handle.toLowerCase()) {
		const cleanHandle = data.handle.startsWith('@') ? data.handle.slice(1) : data.handle;
		const existingHandle = await findByHandle(db, cleanHandle);
		if (existingHandle && existingHandle.id !== user.id) {
			throw new AppError('VALIDATION_ERROR', 'This handle is already taken');
		}
		data.handle = cleanHandle.toLowerCase();
	}

	const result = await db.update(users).set(data).where(eq(users.id, user.id)).returning();
	return result[0];
}
