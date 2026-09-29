import { randomBytes, createHash } from 'node:crypto';
import { eq, and, desc, gt, or, isNull } from 'drizzle-orm';
import { apiKeys, users } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';
import { isUUID } from '../validation';

export interface CreateApiKeyOptions {
	userId: string;
	name: string;
	scopes?: string;
	expiresAt?: Date | null;
}

export interface RevokeApiKeyOptions {
	id: string;
	userId: string;
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
	const bytes = randomBytes(24).toString('base64url');
	return `st_live_${bytes}`;
}

export async function createApiKey(db: Database, options: CreateApiKeyOptions) {
	const name = options.name?.trim();
	if (!name) {
		throw new AppError('VALIDATION_ERROR', 'API Key name is required and cannot be empty');
	}

	if (!options.userId || !isUUID(options.userId)) {
		throw new AppError('NOT_FOUND', 'User not found');
	}

	const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.id, options.userId)).limit(1);
	if (!existingUser) {
		throw new AppError('NOT_FOUND', 'User not found');
	}

	const rawToken = generateToken();
	const keyHash = hashToken(rawToken);
	const prefix = `${rawToken.slice(0, 16)}...`;

	const [apiKey] = await db
		.insert(apiKeys)
		.values({
			userId: options.userId,
			name,
			keyHash,
			prefix,
			scopes: options.scopes ?? 'all',
			expiresAt: options.expiresAt ?? null
		})
		.returning();

	return {
		apiKey,
		rawToken
	};
}

export async function verifyApiKey(db: Database, rawToken: string) {
	if (!rawToken || typeof rawToken !== 'string' || !rawToken.startsWith('st_live_')) {
		return null;
	}

	const keyHash = hashToken(rawToken);
	const now = new Date();

	const records = await db
		.select({
			apiKey: apiKeys,
			user: users
		})
		.from(apiKeys)
		.innerJoin(users, eq(apiKeys.userId, users.id))
		.where(
			and(
				eq(apiKeys.keyHash, keyHash),
				or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, now))
			)
		)
		.limit(1);

	const match = records[0];
	if (!match) {
		return null;
	}

	// 更新 lastUsedAt 审计时间
	try {
		await db
			.update(apiKeys)
			.set({ lastUsedAt: now })
			.where(eq(apiKeys.id, match.apiKey.id));
	} catch (err) {
		console.error('Failed to update apiKey lastUsedAt:', err);
	}

	return {
		apiKey: {
			...match.apiKey,
			lastUsedAt: now
		},
		user: match.user
	};
}

export async function listByUser(db: Database, userId: string) {
	if (!userId || !isUUID(userId)) {
		return [];
	}

	const records = await db
		.select({
			id: apiKeys.id,
			userId: apiKeys.userId,
			name: apiKeys.name,
			prefix: apiKeys.prefix,
			scopes: apiKeys.scopes,
			lastUsedAt: apiKeys.lastUsedAt,
			expiresAt: apiKeys.expiresAt,
			createdAt: apiKeys.createdAt
		})
		.from(apiKeys)
		.where(eq(apiKeys.userId, userId))
		.orderBy(desc(apiKeys.createdAt));

	return records;
}

export async function revokeApiKey(db: Database, options: RevokeApiKeyOptions) {
	if (!options.id || !isUUID(options.id) || !options.userId || !isUUID(options.userId)) {
		throw new AppError('NOT_FOUND', 'API Key not found');
	}

	const deleted = await db
		.delete(apiKeys)
		.where(and(eq(apiKeys.id, options.id), eq(apiKeys.userId, options.userId)))
		.returning({ id: apiKeys.id });

	if (!deleted.length) {
		throw new AppError('NOT_FOUND', 'API Key not found');
	}

	return { success: true };
}
