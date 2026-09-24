import { eq, desc, and, gte, lte, lt, sql } from 'drizzle-orm';
import { users, todos } from '../db/schema';
import type { Database } from '../db';
import { AppError } from '../errors';
import { generateRandomSuffix, sanitizeHandle, isUUID } from '../validation';
import type { PublicUserProfile, UserProfile } from '$lib/types/user';

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
	authIdentifier: { userId?: string; email?: string } | string,
	data: { nickname?: string; avatar?: string | null; handle?: string }
) {
	const user = await findByIdOrHandle(db, id);
	if (!user) throw new AppError('NOT_FOUND', 'User not found');

	let isAuthorized = false;
	if (typeof authIdentifier === 'string') {
		isAuthorized = user.email.toLowerCase() === authIdentifier.toLowerCase();
	} else if (authIdentifier.userId && user.id === authIdentifier.userId) {
		isAuthorized = true;
	} else if (authIdentifier.email && user.email.toLowerCase() === authIdentifier.email.toLowerCase()) {
		isAuthorized = true;
	}

	if (!isAuthorized) {
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

export async function listActiveUsers(
	db: Database,
	options: { limit?: number; offset?: number } = {}
) {
	const limit = options.limit ?? 5;
	const offset = options.offset ?? 0;

	const result = await db
		.select()
		.from(users)
		.orderBy(desc(users.lastTodoUpdatedAt), desc(users.createdAt))
		.limit(limit + 1)
		.offset(offset);

	const hasMore = result.length > limit;
	const items = hasMore ? result.slice(0, limit) : result;

	return {
		users: items,
		hasMore
	};
}

export async function listUsersWithTodosInWeek(
	db: Database,
	options: {
		startDateFrom: string;
		startDateTo: string;
		category?: string;
		limit?: number;
		offset?: number;
	}
) {
	const limit = options.limit ?? 20;
	const offset = options.offset ?? 0;
	const fromDate =
		options.startDateFrom.length === 10
			? new Date(`${options.startDateFrom}T00:00:00.000Z`)
			: new Date(options.startDateFrom);
	const toDate =
		options.startDateTo.length === 10
			? new Date(`${options.startDateTo}T23:59:59.999Z`)
			: new Date(options.startDateTo);

	const todoConditions = [
		gte(todos.startDate, fromDate),
		lte(todos.startDate, toDate)
	];

	if (options.category && options.category !== 'all') {
		todoConditions.push(eq(todos.category, options.category));
	}

	const result = await db
		.selectDistinct({
			id: users.id,
			email: users.email,
			handle: users.handle,
			nickname: users.nickname,
			avatar: users.avatar,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
			lastTodoUpdatedAt: users.lastTodoUpdatedAt
		})
		.from(users)
		.innerJoin(todos, and(eq(users.id, todos.authorId), ...todoConditions))
		.orderBy(desc(users.lastTodoUpdatedAt), desc(users.createdAt))
		.limit(limit + 1)
		.offset(offset);

	const hasMore = result.length > limit;
	const items = hasMore ? result.slice(0, limit) : result;

	return {
		users: items,
		hasMore
	};
}

export type UserRecord = {
	id: string;
	email: string;
	handle: string;
	nickname: string;
	avatar: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	lastTodoUpdatedAt?: Date | string | null;
};

function formatIso(val: Date | string | null | undefined): string | null {
	if (!val) return null;
	if (val instanceof Date) return val.toISOString();
	return String(val);
}

/**
 * DDD 领域模型投影器：安全转换为面向公众展示的用户数据契约
 * 彻底剔除 email 等私密身份凭据，防止敏感数据过度暴露 (PII Data Exposure)
 */
export function toPublicProfile(user: UserRecord): PublicUserProfile {
	return {
		id: user.id,
		handle: user.handle,
		nickname: user.nickname,
		avatar: user.avatar,
		createdAt: formatIso(user.createdAt) || new Date().toISOString(),
		updatedAt: formatIso(user.updatedAt) || new Date().toISOString(),
		lastTodoUpdatedAt: formatIso(user.lastTodoUpdatedAt)
	};
}

/**
 * DDD 领域模型投影器：根据查看者权限受限返回用户画像
 * 仅当 isSelf 为 true（用户本人访问自身资源）时才携带 email，否则输出脱敏后的公开展现资料
 */
export function toUserProfile(
	user: UserRecord,
	options?: { isSelf?: boolean }
): UserProfile {
	const publicProfile = toPublicProfile(user);
	if (options?.isSelf) {
		return {
			...publicProfile,
			email: user.email
		};
	}
	return publicProfile;
}



