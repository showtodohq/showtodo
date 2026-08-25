import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';

export async function findByEmail(db: Database, email: string) {
	const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
	return result[0] ?? null;
}

export async function findById(db: Database, id: string) {
	const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return result[0] ?? null;
}

export async function findOrCreate(db: Database, email: string) {
	const existing = await findByEmail(db, email);
	if (existing) return existing;

	const nickname = email.split('@')[0];
	const result = await db.insert(users).values({ email, nickname }).returning();
	return result[0];
}

export async function update(
	db: Database,
	id: string,
	email: string,
	data: { nickname?: string; avatar?: string | null }
) {
	const user = await findById(db, id);
	if (!user) throw new AppError('NOT_FOUND', 'User not found');
	if (user.email !== email) throw new AppError('FORBIDDEN', 'Not authorized to update this user');

	const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
	return result[0];
}
