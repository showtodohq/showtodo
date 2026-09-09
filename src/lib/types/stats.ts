export interface SiteStatsOverview {
	totalTodos: number;
	completedTodos: number;
	inProgressTodos: number;
	completionRate: number;
	totalUsers: number;
	totalReactions: number;
	todayCreated: number;
	todayCompleted: number;
	todayActiveUsers: number;
}

export interface CategoryStatItem {
	category: string;
	total: number;
	completed: number;
	completionRate: number;
	percentage: number;
}

export interface TrendStatItem {
	date: string; // YYYY-MM-DD
	created: number;
	completed: number;
}

export interface HeatmapDayItem {
	date: string; // YYYY-MM-DD
	count: number; // 综合活跃数 (完成 + 新建 + 进展)
	level: 0 | 1 | 2 | 3 | 4; // 0: 无, 1: 1~2, 2: 3~5, 3: 6~9, 4: 10+
	created: number;
	completed: number;
	notes: number;
}

export interface HeatmapData {
	startDate: string;
	endDate: string;
	days: HeatmapDayItem[];
	totalActivities: number;
	maxDayCount: number;
}

export interface TopTopicItem {
	topicHash: string;
	content: string;
	category: string | null;
	totalParticipants: number;
	doneCount: number;
}

export interface TopUserItem {
	id: string;
	nickname: string;
	handle: string;
	avatar: string | null;
	completedCount: number;
}

export interface GlobalStatsData {
	overview: SiteStatsOverview;
	categories: CategoryStatItem[];
	trend: TrendStatItem[];
	heatmap: HeatmapData;
	topTopics: TopTopicItem[];
	topUsers: TopUserItem[];
	updatedAt: string;
}
