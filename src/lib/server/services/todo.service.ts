import { eq, desc, lt, and, inArray, gte, lte, sql } from 'drizzle-orm';
import { todos, users } from '../db/schema';
import type { Database } from '../db';
import type { Category, TodoStatus } from '../validation';
import { validateStatusTransition, generateShortId, isUUID } from '../validation';
import * as reactionService from './reaction.service';
import * as activityService from './activity.service';
import { AppError } from '../errors';
import { computeTopicHash } from '../topic-hash';
import type { DailyCardResponse, DailyCard, CardParticipant, TopicDetail, ReactionEmoji } from '$lib/types/todo';

export interface CreateTodoData {
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: Category | null;
	authorId: string;
	startDate?: string;
	dueDate?: string | null;
}

export interface UpdateTodoData {
	content?: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: Category | null;
	status?: TodoStatus;
	startDate?: string;
	dueDate?: string | null;
	activityNote?: string | null;
}

export interface ListTodosFilters {
	status?: TodoStatus;
	category?: string;
	authorId?: string;
	currentUserId?: string;
	cursor?: string;
	limit?: number;
	startDateFrom?: string;
	startDateTo?: string;
	dueDateFrom?: string;
	dueDateTo?: string;
}

export interface ListDailyCardsOptions {
	targetDate: string;
	category?: string;
	onlyMine?: boolean;
	currentUserId?: string;
	limit?: number;
	offset?: number;
	sortBy?: 'time' | 'participants';
}

function sanitizeNote(todo: typeof todos.$inferSelect) {
	if (!todo.isNotePublic) {
		return { ...todo, note: null };
	}
	return todo;
}

async function generateUniqueShortId(db: Database): Promise<string> {
	for (let i = 0; i < 10; i++) {
		const shortId = generateShortId(8);
		const existing = await db.select().from(todos).where(eq(todos.shortId, shortId)).limit(1);
		if (!existing[0]) {
			return shortId;
		}
	}
	return `${generateShortId(6)}${Date.now().toString(36).slice(-2)}`;
}

export async function create(db: Database, data: CreateTodoData) {
	const shortId = await generateUniqueShortId(db);
	const topicHash = computeTopicHash(data.content);

	const values: Record<string, unknown> = {
		shortId,
		topicHash,
		content: data.content,
		note: data.note ?? null,
		isNotePublic: data.isNotePublic ?? true,
		category: data.category ?? null,
		authorId: data.authorId,
		dueDate: data.dueDate ? new Date(data.dueDate) : null
	};
	if (data.startDate !== undefined) {
		values.startDate = new Date(data.startDate);
	}

	const result = await db
		.insert(todos)
		.values(values as typeof todos.$inferInsert)
		.returning();

	const createdTodo = result[0];

	// 记录初始创建动态
	await activityService.recordActivity(db, {
		todoId: createdTodo.id,
		authorId: data.authorId,
		type: 'created',
		toStatus: createdTodo.status as TodoStatus
	});

	await db
		.update(users)
		.set({ lastTodoUpdatedAt: new Date() })
		.where(eq(users.id, data.authorId));

	return createdTodo;
}

export async function findById(db: Database, id: string, currentUserId?: string) {
	return findByIdOrShortId(db, id, currentUserId);
}

export async function findByIdOrShortId(db: Database, identifier: string, currentUserId?: string) {
	if (!identifier) return null;

	const condition = isUUID(identifier)
		? eq(todos.id, identifier)
		: eq(todos.shortId, identifier);

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(condition)
		.limit(1);

	if (!result[0]) return null;

	const { todos: todo, users: author } = result[0];
	const shouldQueryMyJoined = Boolean(
		todo.topicHash &&
			currentUserId &&
			isUUID(currentUserId) &&
			currentUserId !== todo.authorId
	);

	const [reactionCounts, activities, topicCountResult, myJoinedResult] = await Promise.all([
		reactionService.getCountsByTodoIds(db, [todo.id]),
		activityService.listByTodoId(db, todo.id),
		todo.topicHash
			? db
					.select({ count: sql<number>`count(*)::int` })
					.from(todos)
					.where(eq(todos.topicHash, todo.topicHash))
			: Promise.resolve([]),
		shouldQueryMyJoined
			? db
					.select({
						id: todos.id,
						shortId: todos.shortId,
						status: todos.status
					})
					.from(todos)
					.where(and(eq(todos.topicHash, todo.topicHash!), eq(todos.authorId, currentUserId!)))
					.orderBy(desc(todos.createdAt))
					.limit(1)
			: Promise.resolve([])
	]);

	const participantCount = topicCountResult[0]?.count ?? 0;
	const myJoinedTodo = myJoinedResult[0]
		? {
				id: myJoinedResult[0].id,
				shortId: myJoinedResult[0].shortId,
				status: myJoinedResult[0].status as TodoStatus
			}
		: null;

	return {
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: reactionCounts[todo.id] ?? { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
		activities,
		topicParticipantCount: participantCount,
		myJoinedTodo
	};
}

export async function list(db: Database, filters: ListTodosFilters) {
	const limit = filters.limit ?? 20;
	const conditions = [];

	if (filters.status) {
		conditions.push(eq(todos.status, filters.status));
	}
	if (filters.category) {
		conditions.push(eq(todos.category, filters.category));
	}
	if (filters.authorId) {
		if (isUUID(filters.authorId)) {
			conditions.push(eq(todos.authorId, filters.authorId));
		} else {
			const cleanHandle = filters.authorId.startsWith('@')
				? filters.authorId.slice(1)
				: filters.authorId;
			conditions.push(eq(users.handle, cleanHandle.toLowerCase()));
		}
	}
	if (filters.startDateFrom) {
		conditions.push(gte(todos.startDate, new Date(filters.startDateFrom)));
	}
	if (filters.startDateTo) {
		conditions.push(lte(todos.startDate, new Date(filters.startDateTo)));
	}
	if (filters.dueDateFrom) {
		conditions.push(gte(todos.dueDate, new Date(filters.dueDateFrom)));
	}
	if (filters.dueDateTo) {
		conditions.push(lte(todos.dueDate, new Date(filters.dueDateTo)));
	}
	if (filters.cursor && isUUID(filters.cursor)) {
		const cursorTodo = await db
			.select({ createdAt: todos.createdAt })
			.from(todos)
			.where(eq(todos.id, filters.cursor))
			.limit(1);
		if (cursorTodo[0]) {
			conditions.push(lt(todos.createdAt, cursorTodo[0].createdAt));
		}
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(where)
		.orderBy(desc(todos.createdAt))
		.limit(limit + 1);

	const hasMore = result.length > limit;
	const items = hasMore ? result.slice(0, limit) : result;

	const todoIds = items.map((r) => r.todos.id);
	const [allReactionCounts, myReactionsMap] = await Promise.all([
		todoIds.length > 0
			? reactionService.getCountsByTodoIds(db, todoIds)
			: ({} as Record<string, Record<string, number>>),
		todoIds.length > 0 && filters.currentUserId
			? reactionService.getMyReactionsByTodoIds(db, todoIds, filters.currentUserId)
			: ({} as Record<string, string[]>)
	]);

	const todoList = items.map(({ todos: todo, users: author }) => ({
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: allReactionCounts[todo.id] ?? { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 },
		myReactions: myReactionsMap[todo.id] ?? []
	}));

	return {
		todos: todoList,
		nextCursor: hasMore ? items[items.length - 1].todos.id : null
	};
}

export async function update(db: Database, idOrShortId: string, authorEmail: string, data: UpdateTodoData) {
	const condition = isUUID(idOrShortId)
		? eq(todos.id, idOrShortId)
		: eq(todos.shortId, idOrShortId);

	const existing = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(condition)
		.limit(1);

	if (!existing[0]) throw new AppError('NOT_FOUND', 'Todo not found');

	const { todos: todo, users: author } = existing[0];
	if (author.email.toLowerCase() !== authorEmail.toLowerCase()) {
		throw new AppError('FORBIDDEN', 'Only the author can update this todo');
	}

	const isStatusChanged = Boolean(data.status && data.status !== todo.status);
	if (isStatusChanged) {
		validateStatusTransition(todo.status as TodoStatus, data.status!);
	}

	const updateData: Record<string, unknown> = {};
	if (data.content !== undefined) updateData.content = data.content;
	if (data.note !== undefined) updateData.note = data.note;
	if (data.isNotePublic !== undefined) updateData.isNotePublic = data.isNotePublic;
	if (data.category !== undefined) updateData.category = data.category;
	if (data.status !== undefined) updateData.status = data.status;
	if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
	if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

	// 若 content 发生变化，重新计算 topicHash
	if (data.content !== undefined) {
		updateData.topicHash = computeTopicHash(data.content);
	}

	const result = Object.keys(updateData).length > 0
		? await db.update(todos).set(updateData).where(eq(todos.id, todo.id)).returning()
		: [todo];

	const updatedTodo = result[0];

	// 记录活动日志
	if (isStatusChanged) {
		await activityService.recordActivity(db, {
			todoId: todo.id,
			authorId: todo.authorId,
			type: 'status_change',
			fromStatus: todo.status as TodoStatus,
			toStatus: data.status!,
			content: data.activityNote ?? null
		});
	} else if (data.activityNote && data.activityNote.trim().length > 0) {
		await activityService.recordActivity(db, {
			todoId: todo.id,
			authorId: todo.authorId,
			type: 'progress_note',
			fromStatus: todo.status as TodoStatus,
			toStatus: todo.status as TodoStatus,
			content: data.activityNote.trim()
		});
	}

	await db
		.update(users)
		.set({ lastTodoUpdatedAt: new Date() })
		.where(eq(users.id, todo.authorId));

	return updatedTodo;
}

export async function getTopicInfoByTodoId(db: Database, idOrShortId: string) {
	const condition = isUUID(idOrShortId)
		? eq(todos.id, idOrShortId)
		: eq(todos.shortId, idOrShortId);

	const result = await db
		.select({
			topicHash: todos.topicHash
		})
		.from(todos)
		.where(condition)
		.limit(1);

	if (!result[0]) {
		throw new AppError('NOT_FOUND', 'Todo not found');
	}

	const topicHash = result[0].topicHash;
	const countResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(todos)
		.where(eq(todos.topicHash, topicHash));

	const participantCount = countResult[0]?.count ?? 0;

	return {
		topicHash,
		participantCount
	};
}

export async function getTopicByHash(
	db: Database,
	topicHash: string,
	currentUserId?: string,
	targetDate?: string
): Promise<TopicDetail> {
	if (!topicHash) {
		throw new AppError('VALIDATION_ERROR', 'topicHash is required');
	}

	const orderByClauses =
		currentUserId && isUUID(currentUserId)
			? [sql`(${todos.authorId} = ${currentUserId}::uuid) DESC`, todos.createdAt]
			: [todos.createdAt];

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(eq(todos.topicHash, topicHash))
		.orderBy(...orderByClauses);

	if (result.length === 0) {
		throw new AppError('NOT_FOUND', 'Topic not found');
	}

	const todoIds = result.map((r) => r.todos.id);
	const [allReactionCounts, myReactionsMap] = await Promise.all([
		reactionService.getCountsByTodoIds(db, todoIds),
		currentUserId && isUUID(currentUserId)
			? reactionService.getMyReactionsByTodoIds(db, todoIds, currentUserId)
			: ({} as Record<string, string[]>)
	]);

	// 找到最早发起/立项的待办，作为话题元信息的基准（内容、分类、立项时间）
	const earliestTodo = result.reduce((earliest, curr) => {
		const currTime =
			curr.todos.createdAt instanceof Date
				? curr.todos.createdAt.getTime()
				: new Date(curr.todos.createdAt).getTime();
		const earliestTime =
			earliest.todos.createdAt instanceof Date
				? earliest.todos.createdAt.getTime()
				: new Date(earliest.todos.createdAt).getTime();
		return currTime < earliestTime ? curr : earliest;
	}, result[0]).todos;

	const content = earliestTodo.content;
	const category = earliestTodo.category;
	const firstCreatedAt =
		earliestTodo.createdAt instanceof Date
			? earliestTodo.createdAt.toISOString()
			: new Date(earliestTodo.createdAt).toISOString();

	// 映射全量 participant 结构
	const allRawParticipants = result.map(({ todos: t, users: u }) => ({
		todoId: t.id,
		shortId: t.shortId,
		status: t.status as TodoStatus,
		note: t.isNotePublic ? t.note : null,
		startDate: t.startDate
			? t.startDate instanceof Date
				? t.startDate.toISOString()
				: String(t.startDate)
			: undefined,
		dueDate: t.dueDate
			? t.dueDate instanceof Date
				? t.dueDate.toISOString()
				: String(t.dueDate)
			: null,
		createdAt:
			t.createdAt instanceof Date
				? t.createdAt.toISOString()
				: new Date(t.createdAt).toISOString(),
		isMe: Boolean(currentUserId && isUUID(currentUserId) && u.id === currentUserId),
		reactions:
			allReactionCounts[t.id] ?? {
				'❤️': 0,
				'👍': 0,
				'🔥': 0,
				'💪': 0,
				'👏': 0,
				'🚀': 0,
				'🎉': 0,
				'👀': 0
			},
		myReactions: (myReactionsMap[t.id] ?? []) as ReactionEmoji[],
		user: {
			id: u.id,
			nickname: u.nickname,
			handle: u.handle,
			avatar: u.avatar
		}
	}));

	// 辅助去重函数：按 user.id 归集自然人伙伴，优先保留已达成 (done) 状态
	function deduplicateParticipants(list: typeof allRawParticipants) {
		const map = new Map<string, (typeof allRawParticipants)[0]>();
		for (const item of list) {
			const existing = map.get(item.user.id);
			if (!existing) {
				map.set(item.user.id, item);
			} else if (item.status === 'done' && existing.status !== 'done') {
				map.set(item.user.id, item);
			}
		}
		return Array.from(map.values());
	}

	const effectiveDate = targetDate || new Date().toISOString().slice(0, 10);

	// 判定待办是否落在指定的 targetDate 当天
	function isDateMatch(dateVal?: string | Date | null, targetStr?: string): boolean {
		if (!dateVal || !targetStr) return false;
		const dStr = dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal).slice(0, 10);
		return dStr === targetStr;
	}

	// 1. 全周期历史去重伙伴列表
	const allParticipantsList = deduplicateParticipants(allRawParticipants);
	const totalParticipants = allParticipantsList.length;
	const allDoneCount = allParticipantsList.filter((p) => p.status === 'done').length;

	// 2. 今日切片去重伙伴列表
	const todayRawParticipants = allRawParticipants.filter((p) =>
		isDateMatch(p.startDate, effectiveDate)
	);
	const todayParticipantsList = deduplicateParticipants(todayRawParticipants);
	const todayParticipants = todayParticipantsList.length;
	const todayDoneCount = todayParticipantsList.filter((p) => p.status === 'done').length;
	const todayInProgressCount = todayParticipantsList.filter((p) => p.status === 'in_progress').length;
	const isTodayAllDone = todayParticipants > 0 && todayDoneCount >= todayParticipants;

	// 若今日有同行伙伴，默认展示今日伙伴；若今日暂无伙伴，展示历史全量伙伴保证页面不为空
	const activeParticipants = todayParticipants > 0 ? todayParticipantsList : allParticipantsList;
	const doneCount = todayParticipants > 0 ? todayDoneCount : allDoneCount;
	const inProgressCount =
		todayParticipants > 0
			? todayInProgressCount
			: allParticipantsList.filter((p) => p.status === 'in_progress').length;
	const isAllDone =
		todayParticipants > 0
			? isTodayAllDone
			: totalParticipants > 0 && allDoneCount >= totalParticipants;

	return {
		topicHash,
		content,
		category,
		firstCreatedAt,
		targetDate: effectiveDate,
		todayParticipants,
		todayDoneCount,
		todayInProgressCount,
		isTodayAllDone,
		totalParticipants,
		allDoneCount,
		doneCount,
		inProgressCount,
		isAllDone,
		participants: activeParticipants,
		allParticipants: allParticipantsList
	};
}

export async function listDailyCards(
	db: Database,
	options: ListDailyCardsOptions
): Promise<DailyCardResponse> {
	const limit = Math.min(Math.max(options.limit ?? 1000, 1), 1000);
	const offset = Math.max(options.offset ?? 0, 0);
	const currentUserId = options.currentUserId && isUUID(options.currentUserId) ? options.currentUserId : null;
	const onlyMine = Boolean(options.onlyMine);

	const categoryFilter =
		options.category && options.category !== 'all'
			? sql`AND t.category = ${options.category}`
			: sql``;

	const havingClause = onlyMine
		? currentUserId
			? sql`HAVING bool_or(u.id = ${currentUserId}::uuid)`
			: sql`HAVING FALSE`
		: sql``;

	const isMeSql = currentUserId ? sql`(u.id = ${currentUserId}::uuid)` : sql`FALSE`;
	const isMeOrderSql = currentUserId ? sql`(u.id = ${currentUserId}::uuid)` : sql`FALSE`;

	// 1. 查询符合条件的总卡片数 (使用 TIMESTAMPTZ 开闭范围比较)
	const countQuery = sql`
		SELECT COUNT(*)::int AS total
		FROM (
			SELECT t.topic_hash
			FROM todos t
			JOIN users u ON t.author_id = u.id
			WHERE t.start_date >= ${options.targetDate}::date 
				AND t.start_date < (${options.targetDate}::date + INTERVAL '1 day')
				${categoryFilter}
			GROUP BY t.topic_hash
			${havingClause}
		) sub
	`;

	const countRaw = await db.execute(countQuery);
	const countRows = Array.isArray(countRaw) ? countRaw : (countRaw as any).rows || [];
	const totalCards = Number(countRows[0]?.total || 0);

	if (totalCards === 0) {
		return {
			date: options.targetDate,
			totalCards: 0,
			cards: []
		};
	}

	const orderBySql =
		options.sortBy === 'participants'
			? sql`COUNT(DISTINCT t.author_id)::int DESC, MIN(t.created_at) ASC`
			: sql`COALESCE(
				MAX(CASE WHEN ${isMeSql} THEN t.created_at ELSE NULL END),
				MIN(t.created_at)
			) DESC`;

	// 2. 查询卡片明细 (使用 COUNT(DISTINCT t.author_id) 按自然人去重)
	const cardsQuery = sql`
		SELECT
			t.topic_hash,
			MAX(t.content) AS content,
			MAX(t.category) AS category,
			MIN(t.created_at) AS first_created_at,
			COUNT(DISTINCT t.author_id)::int AS total_participants,
			COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.author_id ELSE NULL END)::int AS done_count,
			json_agg(
				json_build_object(
					'todoId', t.id,
					'shortId', t.short_id,
					'status', t.status,
					'note', CASE WHEN t.is_note_public OR ${isMeSql} THEN t.note ELSE NULL END,
					'createdAt', t.created_at,
					'isMe', ${isMeSql},
					'user', json_build_object(
						'id', u.id,
						'nickname', u.nickname,
						'handle', u.handle,
						'avatar', u.avatar
					)
				) ORDER BY ${isMeOrderSql} DESC, t.created_at ASC
			) AS participants
		FROM todos t
		JOIN users u ON t.author_id = u.id
		WHERE t.start_date >= ${options.targetDate}::date 
			AND t.start_date < (${options.targetDate}::date + INTERVAL '1 day')
			${categoryFilter}
		GROUP BY t.topic_hash
		${havingClause}
		ORDER BY ${orderBySql}
		LIMIT ${limit} OFFSET ${offset}
	`;

	const cardsRaw = await db.execute(cardsQuery);
	const cardRows = Array.isArray(cardsRaw) ? cardsRaw : (cardsRaw as any).rows || [];

	const cards: DailyCard[] = cardRows.map((row: any) => {
		const rawParticipants = Array.isArray(row.participants)
			? row.participants
			: typeof row.participants === 'string'
				? JSON.parse(row.participants)
				: [];

		// 自然人去重归集，同一用户保留最优状态
		const userMap = new Map<string, any>();
		for (const p of rawParticipants) {
			const existing = userMap.get(p.user?.id);
			if (!existing) {
				userMap.set(p.user?.id, p);
			} else if (p.status === 'done' && existing.status !== 'done') {
				userMap.set(p.user?.id, p);
			}
		}
		const uniqueParticipants = Array.from(userMap.values());

		const totalParticipants = Number(row.total_participants || uniqueParticipants.length);
		const participants: CardParticipant[] = uniqueParticipants.map((p: any) => ({
			todoId: p.todoId,
			shortId: p.shortId,
			status: p.status,
			note: p.note ?? null,
			createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString(),
			isMe: Boolean(p.isMe),
			user: {
				id: p.user.id,
				nickname: p.user.nickname,
				handle: p.user.handle,
				avatar: p.user.avatar ?? null
			}
		}));

		return {
			topicHash: row.topic_hash,
			content: row.content,
			category: row.category ?? null,
			isMultiplayer: totalParticipants > 1,
			totalParticipants,
			doneCount: Number(row.done_count || 0),
			participants
		};
	});

	return {
		date: options.targetDate,
		totalCards,
		cards
	};
}

export async function listForCalendar(
	db: Database,
	options: {
		authorIds: string[];
		startDateFrom: string;
		startDateTo: string;
		category?: string;
	}
) {
	if (!options.authorIds || options.authorIds.length === 0) {
		return [];
	}

	const conditions = [
		inArray(todos.authorId, options.authorIds),
		gte(todos.startDate, sql`${options.startDateFrom}::date`),
		lt(todos.startDate, sql`(${options.startDateTo}::date + INTERVAL '1 day')`)
	];

	if (options.category && options.category !== 'all') {
		conditions.push(eq(todos.category, options.category));
	}

	const result = await db
		.select()
		.from(todos)
		.innerJoin(users, eq(todos.authorId, users.id))
		.where(and(...conditions))
		.orderBy(desc(todos.createdAt));

	const todoIds = result.map((r) => r.todos.id);
	const allReactionCounts =
		todoIds.length > 0 ? await reactionService.getCountsByTodoIds(db, todoIds) : {};

	return result.map(({ todos: todo, users: author }) => ({
		...sanitizeNote(todo),
		author: { id: author.id, nickname: author.nickname, handle: author.handle, avatar: author.avatar },
		reactions: allReactionCounts[todo.id] ?? { '❤️': 0, '👍': 0, '🔥': 0, '💪': 0, '👏': 0, '🚀': 0, '🎉': 0, '👀': 0 }
	}));
}


