import { sql, desc } from 'drizzle-orm';
import { todos, users, reactions, todoActivities } from '../db/schema';
import type { Database } from '../db';
import type {
	SiteStatsOverview,
	CategoryStatItem,
	TrendStatItem,
	HeatmapDayItem,
	HeatmapData,
	TopTopicItem,
	TopUserItem,
	GlobalStatsData
} from '$lib/types/stats';

function extractRows<T>(result: any): T[] {
	if (Array.isArray(result)) return result as T[];
	if (result && Array.isArray(result.rows)) return result.rows as T[];
	return [];
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/**
 * 纯函数：根据当日活跃数计算 GitHub 热力图的 0~4 级色阶
 */
export function calculateHeatmapLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
	if (count <= 0) return 0;
	if (maxCount <= 4) {
		if (count === 1) return 1;
		if (count === 2) return 2;
		if (count === 3) return 3;
		return 4;
	}

	// 动态四等分阈值
	const q1 = Math.max(1, Math.round(maxCount * 0.25));
	const q2 = Math.max(2, Math.round(maxCount * 0.5));
	const q3 = Math.max(3, Math.round(maxCount * 0.75));

	if (count <= q1) return 1;
	if (count <= q2) return 2;
	if (count <= q3) return 3;
	return 4;
}

/**
 * 纯函数：补齐连续日期的趋势数据（缺失天填充 0）
 */
export function fillTrendDays(
	rawMap: Map<string, { created: number; completed: number }>,
	daysCount: number,
	endDate: Date = new Date()
): TrendStatItem[] {
	const result: TrendStatItem[] = [];
	for (let i = daysCount - 1; i >= 0; i--) {
		const d = new Date(endDate);
		d.setDate(d.getDate() - i);
		const key = formatDateKey(d);
		const data = rawMap.get(key) || { created: 0, completed: 0 };
		result.push({
			date: key,
			created: data.created,
			completed: data.completed
		});
	}
	return result;
}

/**
 * 纯函数：补齐连续日期的 GitHub 热力图网格
 */
export function fillHeatmapDays(
	rawMap: Map<string, { created: number; completed: number; notes: number }>,
	daysCount: number,
	endDate: Date = new Date()
): HeatmapData {
	const days: HeatmapDayItem[] = [];
	let totalActivities = 0;
	let maxDayCount = 0;

	// 先确定实际每一天的数字与全局最大值
	for (let i = daysCount - 1; i >= 0; i--) {
		const d = new Date(endDate);
		d.setDate(d.getDate() - i);
		const key = formatDateKey(d);
		const raw = rawMap.get(key) || { created: 0, completed: 0, notes: 0 };
		const count = raw.created + raw.completed + raw.notes;

		if (count > maxDayCount) {
			maxDayCount = count;
		}
		totalActivities += count;
	}

	// 再分配 level
	for (let i = daysCount - 1; i >= 0; i--) {
		const d = new Date(endDate);
		d.setDate(d.getDate() - i);
		const key = formatDateKey(d);
		const raw = rawMap.get(key) || { created: 0, completed: 0, notes: 0 };
		const count = raw.created + raw.completed + raw.notes;

		days.push({
			date: key,
			count,
			level: calculateHeatmapLevel(count, maxDayCount),
			created: raw.created,
			completed: raw.completed,
			notes: raw.notes
		});
	}

	const startD = new Date(endDate);
	startD.setDate(startD.getDate() - (daysCount - 1));

	return {
		startDate: formatDateKey(startD),
		endDate: formatDateKey(endDate),
		days,
		totalActivities,
		maxDayCount
	};
}

/**
 * 聚合全站宏观核心概览
 */
export async function getSiteOverview(db: Database): Promise<SiteStatsOverview> {
	const [todoStats] = await db
		.select({
			totalTodos: sql<number>`count(*)::int`,
			completedTodos: sql<number>`count(*) filter (where ${todos.status} = 'done')::int`,
			inProgressTodos: sql<number>`count(*) filter (where ${todos.status} = 'in_progress')::int`,
			todayCreated: sql<number>`count(*) filter (where ${todos.createdAt} >= CURRENT_DATE)::int`
		})
		.from(todos);

	const [userStats] = await db
		.select({
			totalUsers: sql<number>`count(*)::int`
		})
		.from(users);

	const [reactionStats] = await db
		.select({
			totalReactions: sql<number>`count(*)::int`
		})
		.from(reactions);

	const [activityStats] = await db
		.select({
			todayCompleted: sql<number>`count(*) filter (where ${todoActivities.toStatus} = 'done' and ${todoActivities.createdAt} >= CURRENT_DATE)::int`
		})
		.from(todoActivities);

	// 今日活跃用户数 (今日有发待办、状态流转或互动的不同用户)
	const activeUsersRaw = await db.execute<{ todayActiveUsers: number }>(sql`
		select count(distinct uid)::int as "todayActiveUsers" from (
			select author_id as uid from todos where created_at >= CURRENT_DATE or updated_at >= CURRENT_DATE
			union
			select author_id as uid from todo_activities where created_at >= CURRENT_DATE
			union
			select user_id as uid from reactions where created_at >= CURRENT_DATE
		) sub
	`);
	const activeUsersRows = extractRows<{ todayActiveUsers: number }>(activeUsersRaw);
	const todayActiveUsers = activeUsersRows[0]?.todayActiveUsers ?? 0;

	const total = todoStats?.totalTodos ?? 0;
	const completed = todoStats?.completedTodos ?? 0;
	const inProgress = todoStats?.inProgressTodos ?? 0;
	const completionRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

	return {
		totalTodos: total,
		completedTodos: completed,
		inProgressTodos: inProgress,
		completionRate,
		totalUsers: userStats?.totalUsers ?? 0,
		totalReactions: reactionStats?.totalReactions ?? 0,
		todayCreated: todoStats?.todayCreated ?? 0,
		todayCompleted: activityStats?.todayCompleted ?? 0,
		todayActiveUsers
	};
}

/**
 * 聚合分类分布与各分类完成率
 */
export async function getCategoryStats(db: Database): Promise<CategoryStatItem[]> {
	const raw = await db
		.select({
			category: sql<string>`coalesce(${todos.category}, 'other')`,
			total: sql<number>`count(*)::int`,
			completed: sql<number>`count(*) filter (where ${todos.status} = 'done')::int`
		})
		.from(todos)
		.groupBy(sql`coalesce(${todos.category}, 'other')`)
		.orderBy(desc(sql`count(*)`));

	const totalAll = raw.reduce((sum, item) => sum + item.total, 0);

	return raw.map((item) => {
		const compRate = item.total > 0 ? Number(((item.completed / item.total) * 100).toFixed(1)) : 0;
		const pct = totalAll > 0 ? Number(((item.total / totalAll) * 100).toFixed(1)) : 0;
		return {
			category: item.category,
			total: item.total,
			completed: item.completed,
			completionRate: compRate,
			percentage: pct
		};
	});
}

/**
 * 聚合近 N 天趋势数据 (新建 vs 达成)
 */
export async function getTrendStats(db: Database, days: number = 14): Promise<TrendStatItem[]> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - (days - 1));
	startDate.setHours(0, 0, 0, 0);

	const createdRaw = await db.execute<{ day: string; count: number }>(sql`
		select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as count
		from todos
		where created_at >= ${startDate.toISOString()}::timestamptz
		group by 1
	`);
	const createdRows = extractRows<{ day: string; count: number }>(createdRaw);

	const completedRaw = await db.execute<{ day: string; count: number }>(sql`
		select to_char(created_at, 'YYYY-MM-DD') as day, count(*)::int as count
		from todo_activities
		where to_status = 'done' and created_at >= ${startDate.toISOString()}::timestamptz
		group by 1
	`);
	const completedRows = extractRows<{ day: string; count: number }>(completedRaw);

	const rawMap = new Map<string, { created: number; completed: number }>();

	for (const row of createdRows) {
		const existing = rawMap.get(row.day) || { created: 0, completed: 0 };
		existing.created = row.count;
		rawMap.set(row.day, existing);
	}

	for (const row of completedRows) {
		const existing = rawMap.get(row.day) || { created: 0, completed: 0 };
		existing.completed = row.count;
		rawMap.set(row.day, existing);
	}

	return fillTrendDays(rawMap, days);
}

/**
 * 聚合全站 GitHub 式热力图数据
 */
export async function getHeatmapStats(db: Database, days: number = 365): Promise<HeatmapData> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - (days - 1));
	startDate.setHours(0, 0, 0, 0);

	const activitiesRaw = await db.execute<{ day: string; created: number; completed: number; notes: number }>(sql`
		select 
			to_char(created_at, 'YYYY-MM-DD') as day,
			count(*) filter (where type = 'created')::int as created,
			count(*) filter (where to_status = 'done')::int as completed,
			count(*) filter (where type = 'progress_note')::int as notes
		from todo_activities
		where created_at >= ${startDate.toISOString()}::timestamptz
		group by 1
	`);
	const activitiesRows = extractRows<{ day: string; created: number; completed: number; notes: number }>(activitiesRaw);

	const rawMap = new Map<string, { created: number; completed: number; notes: number }>();
	for (const row of activitiesRows) {
		rawMap.set(row.day, {
			created: row.created,
			completed: row.completed,
			notes: row.notes
		});
	}

	return fillHeatmapDays(rawMap, days);
}

/**
 * 热门多人协同 Todo TOP 5
 */
export async function getTopTopics(db: Database, limit: number = 5): Promise<TopTopicItem[]> {
	const resultRaw = await db.execute<{
		topic_hash: string;
		content: string;
		category: string | null;
		total_participants: number;
		done_count: number;
	}>(sql`
		select 
			topic_hash,
			min(content) as content,
			min(category) as category,
			count(distinct author_id)::int as total_participants,
			count(distinct author_id) filter (where status = 'done')::int as done_count
		from todos
		group by topic_hash
		having count(distinct author_id) > 1
		order by total_participants desc, done_count desc
		limit ${limit}
	`);
	const rows = extractRows<{
		topic_hash: string;
		content: string;
		category: string | null;
		total_participants: number;
		done_count: number;
	}>(resultRaw);

	return rows.map((r) => ({
		topicHash: r.topic_hash,
		content: r.content,
		category: r.category,
		totalParticipants: r.total_participants,
		doneCount: r.done_count
	}));
}

/**
 * 达成先锋榜 TOP 5 (累计完成待办最多的用户)
 */
export async function getTopUsers(db: Database, limit: number = 5): Promise<TopUserItem[]> {
	const result = await db
		.select({
			id: users.id,
			nickname: users.nickname,
			handle: users.handle,
			avatar: users.avatar,
			completedCount: sql<number>`count(${todos.id})::int`
		})
		.from(users)
		.innerJoin(todos, sql`${todos.authorId} = ${users.id} and ${todos.status} = 'done'`)
		.groupBy(users.id, users.nickname, users.handle, users.avatar)
		.orderBy(desc(sql`count(${todos.id})`))
		.limit(limit);

	return result;
}

/**
 * 聚合全站完整统计大盘 (高并发并行查询)
 */
export async function getGlobalStats(db: Database, heatmapDays: number = 365): Promise<GlobalStatsData> {
	const [overview, categories, trend, heatmap, topTopics, topUsers] = await Promise.all([
		getSiteOverview(db),
		getCategoryStats(db),
		getTrendStats(db, 14),
		getHeatmapStats(db, heatmapDays),
		getTopTopics(db, 5),
		getTopUsers(db, 5)
	]);

	return {
		overview,
		categories,
		trend,
		heatmap,
		topTopics,
		topUsers,
		updatedAt: new Date().toISOString()
	};
}
