/**
 * 周期性待办服务 (Recurrence Domain Service)
 *
 * 遵循 DDD 原则与单一信源：
 * - 访问驱动的惰性即时物化 (JIT Materialization)
 * - 物理槽位 (slotKey) 确定性幂等
 * - Postgres Advisory Lock 并发防御
 * - 连击打卡状态机与连续缺席自动冷休眠 (Auto-Freeze)
 */

import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { recurringRules, todos, users } from '../db/schema';
import type { Database } from '../db';
import {
	RECURRENCE_CONFIG,
	type RecurrenceFrequency,
	type RecurrenceStatus,
	type RecurrenceEndCondition
} from '$lib/constants/recurrence';
import {
	validateContent,
	validateNote,
	validateCategory,
	validateRecurrenceFrequency,
	validateRecurrenceStatus,
	validateDaysOfWeek,
	validateDayOfMonth,
	validateInterval,
	isUUID
} from '../validation';
import { computeTopicHash } from '../topic-hash';
import { DEFAULT_TIMEZONE, isValidTimezone, resolveTimezone, formatDateInTimezone, createDateInTimezone } from '../utils/timezone';
import {
	formatSlotKey,
	calculateNextOccurrence,
	isWithinGracePeriod,
	expandVirtualOccurrences,
	type VirtualOccurrence
} from '../utils/recurrence-calc';
import {
	evaluateStreakTransition,
	evaluateMissedCycles
} from '../utils/streak-machine';
import * as activityService from './activity.service';
import { generateUniqueShortId } from './short-id';
import { AppError } from '../errors';
import type { TodoStatus } from '$lib/constants/status';

export interface CreateRecurringRuleData {
	authorId: string;
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	startDate?: string | null;
	dueDate?: string | null;
	frequency: RecurrenceFrequency;
	interval?: number;
	daysOfWeek?: number[];
	dayOfMonth?: number;
	cronExpression?: string;
	endCondition?: RecurrenceEndCondition;
	endAfterOccurrences?: number;
	endDate?: string;
	timezone?: string;
}

export type RecurringRuleRecord = typeof recurringRules.$inferSelect;

/**
 * 创建周期性规则模板，并立即为当前周期进行首次物化
 */
export async function createRule(
	db: Database,
	data: CreateRecurringRuleData
): Promise<RecurringRuleRecord> {
	if (!isUUID(data.authorId)) {
		throw new AppError('VALIDATION_ERROR', 'Invalid authorId');
	}

	const content = validateContent(data.content);
	const note = validateNote(data.note);
	const category = validateCategory(data.category);
	const frequency = validateRecurrenceFrequency(data.frequency);
	const interval = validateInterval(data.interval);
	const daysOfWeek = validateDaysOfWeek(data.daysOfWeek);
	const dayOfMonth = validateDayOfMonth(data.dayOfMonth);
	const timezone = resolveTimezone(data.timezone, null, DEFAULT_TIMEZONE);
	const topicHash = computeTopicHash(content);

	const now = new Date();
	const userStartDate = data.startDate ? new Date(data.startDate) : null;
	const userDueDate = data.dueDate ? new Date(data.dueDate) : null;

	// 若用户指定了未来的起始时间，则以该时间作为 nextRunAt 调度起点；否则以 now 为起点
	const nextRunAt = userStartDate && userStartDate.getTime() > now.getTime() ? userStartDate : now;

	const values: typeof recurringRules.$inferInsert = {
		authorId: data.authorId,
		content,
		topicHash,
		note: note ?? null,
		isNotePublic: data.isNotePublic ?? true,
		category: category ?? null,
		frequency,
		interval,
		daysOfWeek: daysOfWeek ?? null,
		dayOfMonth: dayOfMonth ?? null,
		cronExpression: data.cronExpression ?? null,
		status: 'active',
		currentStreak: 0,
		maxStreak: 0,
		totalCycles: 0,
		completedCycles: 0,
		consecutiveMisses: 0,
		endCondition: data.endCondition ?? 'never',
		endAfterOccurrences: data.endAfterOccurrences ?? null,
		endDate: data.endDate ? new Date(data.endDate) : null,
		nextRunAt,
		timezone
	};

	const [createdRule] = await db.insert(recurringRules).values(values).returning();

	// 若调度起点在当前时间之前或当前（即当期已生效），立即物化当期待办实体 (JIT)
	if (nextRunAt.getTime() <= now.getTime()) {
		await materializeSingleRuleSlot(db, createdRule, now, {
			startDate: userStartDate,
			dueDate: userDueDate
		});
	}

	return createdRule;
}

/**
 * 根据 ID 查询单条周期规则
 */
export async function findById(
	db: Database,
	ruleId: string
): Promise<RecurringRuleRecord | null> {
	if (!isUUID(ruleId)) return null;
	const [rule] = await db
		.select()
		.from(recurringRules)
		.where(eq(recurringRules.id, ruleId))
		.limit(1);
	return rule ?? null;
}

/**
 * 获取指定用户下的所有周期规则
 */
export async function listByAuthor(
	db: Database,
	authorId: string,
	status?: RecurrenceStatus
): Promise<RecurringRuleRecord[]> {
	if (!isUUID(authorId)) return [];

	const conditions = [eq(recurringRules.authorId, authorId)];
	if (status) {
		conditions.push(eq(recurringRules.status, status));
	}

	return db
		.select()
		.from(recurringRules)
		.where(and(...conditions))
		.orderBy(desc(recurringRules.createdAt));
}

/**
 * 更新周期规则状态 (支持 active, paused, archived, dormant 唤醒)
 */
export async function updateStatus(
	db: Database,
	ruleId: string,
	authorId: string,
	newStatus: RecurrenceStatus
): Promise<RecurringRuleRecord> {
	const validStatus = validateRecurrenceStatus(newStatus);
	const rule = await findById(db, ruleId);

	if (!rule) {
		throw new AppError('NOT_FOUND', 'Recurring rule not found');
	}
	if (rule.authorId !== authorId) {
		throw new AppError('FORBIDDEN', 'You do not own this recurring rule');
	}

	const updatePayload: Partial<typeof recurringRules.$inferInsert> = {
		status: validStatus,
		updatedAt: new Date()
	};

	// 若从休眠/暂停唤醒为 active，清零连续缺席计数并重置调度起点
	if (validStatus === 'active' && (rule.status === 'dormant' || rule.status === 'paused')) {
		updatePayload.consecutiveMisses = 0;
		updatePayload.nextRunAt = new Date();
	}

	const [updated] = await db
		.update(recurringRules)
		.set(updatePayload)
		.where(eq(recurringRules.id, ruleId))
		.returning();

	return updated;
}

/**
 * 删除周期规则
 * @param options.deleteHistory 是否连同历史已生成的待办实体一起级联删除。默认 false（保留历史实体，解除外键关联）
 */
export async function deleteRule(
	db: Database,
	ruleId: string,
	authorId: string,
	options: { deleteHistory?: boolean } = {}
): Promise<{ success: boolean; ruleId: string }> {
	const rule = await findById(db, ruleId);
	if (!rule) {
		throw new AppError('NOT_FOUND', 'Recurring rule not found');
	}
	if (rule.authorId !== authorId) {
		throw new AppError('FORBIDDEN', 'You do not own this recurring rule');
	}

	if (options.deleteHistory) {
		await db.delete(todos).where(eq(todos.recurringRuleId, ruleId));
	}

	await db.delete(recurringRules).where(eq(recurringRules.id, ruleId));

	return { success: true, ruleId };
}

/**
 * 核心私有：为单个规则在指定时间戳落地物理待办槽位 (幂等)
 */
async function materializeSingleRuleSlot(
	db: Database,
	rule: RecurringRuleRecord,
	slotTimestamp: Date,
	customTime?: { startDate?: Date | null; dueDate?: Date | null }
): Promise<boolean> {
	const slotKey = formatSlotKey(slotTimestamp, rule.frequency, rule.timezone);

	// 幂等防重：检查是否已经存在该 slotKey 的待办
	const existing = await db
		.select({ id: todos.id })
		.from(todos)
		.where(and(eq(todos.recurringRuleId, rule.id), eq(todos.slotKey, slotKey)))
		.limit(1);

	if (existing.length > 0) {
		return false; // 已物化过，直接跳过
	}

	const shortId = await generateUniqueShortId(db);
	const safeTz = isValidTimezone(rule.timezone) ? rule.timezone : DEFAULT_TIMEZONE;
	const slotDayStr = formatDateInTimezone(slotTimestamp, safeTz);
	const [sYear, sMonth, sDay] = slotDayStr.split('-').map(Number);
	const defaultDayStart = createDateInTimezone(sYear, sMonth, sDay, 0, 0, 0, safeTz);
	const defaultDayEnd = new Date(
		createDateInTimezone(sYear, sMonth, sDay, 23, 59, 59, safeTz).getTime() + 999
	);

	const targetStartDate = customTime?.startDate || defaultDayStart;
	const targetDueDate = customTime?.dueDate || defaultDayEnd;

	const [insertedTodo] = await db
		.insert(todos)
		.values({
			shortId,
			topicHash: rule.topicHash,
			content: rule.content,
			note: rule.note,
			isNotePublic: rule.isNotePublic,
			category: rule.category,
			authorId: rule.authorId,
			recurringRuleId: rule.id,
			slotKey,
			cycleIndex: rule.totalCycles + 1,
			status: 'pending',
			startDate: targetStartDate,
			dueDate: targetDueDate
		})
		.onConflictDoNothing()
		.returning();

	if (!insertedTodo) {
		return false; // 并发插入发生 conflict
	}

	// 记录创建动态日志
	await activityService.recordActivity(db, {
		todoId: insertedTodo.id,
		authorId: rule.authorId,
		type: 'created',
		toStatus: 'pending'
	});

	// 计算下一周期指针
	const nextOccurrence = calculateNextOccurrence(slotTimestamp, {
		frequency: rule.frequency,
		interval: rule.interval,
		daysOfWeek: rule.daysOfWeek ?? undefined,
		dayOfMonth: rule.dayOfMonth ?? undefined,
		cronExpression: rule.cronExpression ?? undefined,
		timezone: rule.timezone
	});

	// 更新规则指标
	await db
		.update(recurringRules)
		.set({
			totalCycles: rule.totalCycles + 1,
			lastRunAt: slotTimestamp,
			nextRunAt: nextOccurrence,
			updatedAt: new Date()
		})
		.where(eq(recurringRules.id, rule.id));

	return true;
}

/**
 * 访问驱动的惰性即时物化 (JIT Materialization for User)
 * 当用户登录、访问个人面板或请求自身待办时触发
 */
export async function ensureActiveTodosMaterialized(
	db: Database,
	authorId: string,
	_clientTz?: string
): Promise<void> {
	if (!isUUID(authorId)) return;

	const now = new Date();
	const activeRules = await db
		.select()
		.from(recurringRules)
		.where(and(eq(recurringRules.authorId, authorId), eq(recurringRules.status, 'active')));

	for (const rule of activeRules) {
		const ruleTz = isValidTimezone(rule.timezone) ? rule.timezone : DEFAULT_TIMEZONE;
		const todayStr = formatDateInTimezone(now, ruleTz);
		const nextRunDayStr = formatDateInTimezone(rule.nextRunAt, ruleTz);

		// 若未到下一次执行日期且绝对时间戳也未到，安全跳过
		if (todayStr < nextRunDayStr && rule.nextRunAt.getTime() > now.getTime()) {
			continue; // 未到下一次执行时间
		}

		// 检查是否有漏掉的周期 (跨天/跨周期)
		let cursor = new Date(rule.nextRunAt.getTime());
		let missedCount = 0;

		// 模拟计算错过的周期数
		while (cursor.getTime() + 86400000 <= now.getTime() && missedCount < 30) {
			cursor = calculateNextOccurrence(cursor, {
				frequency: rule.frequency,
				interval: rule.interval,
				daysOfWeek: rule.daysOfWeek ?? undefined,
				dayOfMonth: rule.dayOfMonth ?? undefined,
				timezone: rule.timezone
			});
			missedCount++;
		}

		// 连击状态机评估
		if (missedCount > 0) {
			const missedEval = evaluateMissedCycles({
				currentStreak: rule.currentStreak,
				consecutiveMisses: rule.consecutiveMisses,
				missedPeriodsCount: missedCount
			});

			// 若触发冷休眠，则置为 dormant 并停止物化
			if (missedEval.isDormant) {
				await db
					.update(recurringRules)
					.set({
						status: 'dormant',
						currentStreak: 0,
						consecutiveMisses: missedEval.consecutiveMisses,
						updatedAt: new Date()
					})
					.where(eq(recurringRules.id, rule.id));
				continue;
			}

			// 更新断卡状态
			await db
				.update(recurringRules)
				.set({
					currentStreak: 0,
					consecutiveMisses: missedEval.consecutiveMisses,
					updatedAt: new Date()
				})
				.where(eq(recurringRules.id, rule.id));
		}

		// 为当前最新周期物化 1 条待办
		await materializeSingleRuleSlot(db, rule, now);
	}
}

/**
 * 基于话题作用域的即时预物化 (Topic-Level JIT Materialization)
 * 解决热门同行中"未登录者在公共看板看不见"的可见性裂痕
 * 采用 Postgres Advisory Lock 防御高并发下的惊群写放大
 */
export async function ensureTopicRecurringTodosMaterialized(
	db: Database,
	topicHash: string,
	_targetDate?: string,
	_clientTz?: string
): Promise<void> {
	if (!topicHash) return;

	// 1. 获取轻量级事务咨询锁 (防惊群争抢)
	try {
		const lockResult = await db.execute<{ locked: boolean }>(
			sql`SELECT pg_try_advisory_xact_lock(hashtext(${topicHash})) as locked`
		);
		const rows = (lockResult as any)?.rows ?? (Array.isArray(lockResult) ? lockResult : []);
		const isLocked = rows[0]?.locked ?? true;

		if (!isLocked) {
			return; // 已有其他工作协程正在物化该话题，当前请求安全退出
		}
	} catch {
		// 环境若不支持咨询锁，降级执行
	}

	const now = new Date();
	const activeRules = await db
		.select()
		.from(recurringRules)
		.where(
			and(
				eq(recurringRules.topicHash, topicHash),
				eq(recurringRules.status, 'active')
			)
		);

	for (const rule of activeRules) {
		const slotKey = formatSlotKey(now, rule.frequency, rule.timezone);
		const existing = await db
			.select({ id: todos.id })
			.from(todos)
			.where(and(eq(todos.recurringRuleId, rule.id), eq(todos.slotKey, slotKey)))
			.limit(1);

		if (existing.length === 0) {
			await materializeSingleRuleSlot(db, rule, now);
		}
	}
}

/**
 * 待办状态流转联动：自动更新关联周期规则的 Streak 与履约统计
 */
export async function onTodoStatusChanged(
	db: Database,
	todoId: string,
	fromStatus: TodoStatus,
	toStatus: TodoStatus,
	checkTime: Date = new Date()
): Promise<void> {
	const [todo] = await db
		.select()
		.from(todos)
		.where(eq(todos.id, todoId))
		.limit(1);

	if (!todo || !todo.recurringRuleId) {
		return; // 非周期性任务，无需联动
	}

	const rule = await findById(db, todo.recurringRuleId);
	if (!rule) return;

	const dueDate = todo.dueDate || new Date(todo.startDate.getTime() + 86400000);
	const isWithinGrace = isWithinGracePeriod(
		dueDate,
		checkTime,
		RECURRENCE_CONFIG.GRACE_PERIOD_HOURS
	);

	const streakResult = evaluateStreakTransition(
		{
			currentStreak: rule.currentStreak,
			maxStreak: rule.maxStreak,
			completedCycles: rule.completedCycles,
			consecutiveMisses: rule.consecutiveMisses
		},
		{
			fromStatus,
			toStatus,
			isWithinGraceWindow: isWithinGrace
		}
	);

	await db
		.update(recurringRules)
		.set({
			currentStreak: streakResult.currentStreak,
			maxStreak: streakResult.maxStreak,
			completedCycles: streakResult.completedCycles,
			consecutiveMisses: streakResult.consecutiveMisses,
			updatedAt: new Date()
		})
		.where(eq(recurringRules.id, rule.id));
}

/**
 * 日历端未来虚拟展开投影服务 (纯内存计算，零数据库垃圾写入)
 */
export async function getVirtualOccurrencesForCalendar(
	db: Database,
	authorId: string,
	windowStart: Date,
	windowEnd: Date,
	tz: string = DEFAULT_TIMEZONE
): Promise<VirtualOccurrence[]> {
	if (!isUUID(authorId)) return [];

	const rules = await db
		.select()
		.from(recurringRules)
		.where(
			and(
				eq(recurringRules.authorId, authorId),
				eq(recurringRules.status, 'active')
			)
		);

	return expandVirtualOccurrences(rules, windowStart, windowEnd, tz);
}
