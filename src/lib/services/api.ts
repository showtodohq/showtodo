import type {
	CreateTodoInput,
	DailyCardResponse,
	ReactionDetail,
	ReactionEmoji,
	Todo,
	TodoListQuery,
	TodoListResponse,
	TopicInfoResponse,
	TopicDetailResponse,
	TopicListResponse,
	ListTopicsOptions,
	UpdateTodoInput
} from '$lib/types/todo';
import type { UpdateUserInput, UserProfile } from '$lib/types/user';
import type { GlobalStatsData, HeatmapData } from '$lib/types/stats';

import { progressStore } from '$lib/stores/progress.svelte';

export class ApiError extends Error {
	code: string;
	status: number;

	constructor(code: string, message: string, status: number) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.status = status;
	}
}

const ERROR_MESSAGE_MAP: Record<string, string> = {
	VALIDATION_ERROR: '输入内容有误，请检查后重试',
	INVALID_STATUS_TRANSITION: '当前状态不可进行该流转变更',
	FORBIDDEN: '无权操作：只有创建者可以修改此内容',
	NOT_FOUND: '请求的内容或用户不存在',
	DUPLICATE_REACTION: '您已经对该条 Todo 表态过了',
	INTERNAL_ERROR: '服务器繁忙，请稍后再试'
};

export function getClientTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
	} catch {
		return 'Asia/Shanghai';
	}
}

async function request<T>(
	url: string,
	options?: RequestInit,
	customFetch?: typeof fetch
): Promise<T> {
	progressStore.start();
	try {
		const fetcher = customFetch || fetch;
		const tz = getClientTimezone();
		const res = await fetcher(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'x-timezone': tz,
				...(options?.headers || {})
			}
		});

		if (!res.ok) {
			let code = 'INTERNAL_ERROR';
			let message = '请求失败，请稍后重试';
			try {
				const data = await res.json();
				if (data?.error) {
					code = data.error.code || code;
					message = data.error.message || ERROR_MESSAGE_MAP[code] || message;
				}
			} catch {
				// ignore json parse error
			}
			throw new ApiError(code, message, res.status);
		}

		return (await res.json()) as T;
	} finally {
		progressStore.done();
	}
}

export const api = {
	async getCalendarWeekData(
		params: {
			startDateFrom: string;
			startDateTo: string;
			limit?: number;
			offset?: number;
			currentUserId?: string;
			category?: string;
		},
		customFetch?: typeof fetch
	): Promise<{ users: UserProfile[]; todos: Todo[]; hasMoreUsers: boolean }> {
		const searchParams = new URLSearchParams();
		searchParams.set('startDateFrom', params.startDateFrom);
		searchParams.set('startDateTo', params.startDateTo);
		if (params.limit) searchParams.set('limit', String(params.limit));
		if (params.offset) searchParams.set('offset', String(params.offset));
		if (params.currentUserId) searchParams.set('currentUserId', params.currentUserId);
		if (params.category && params.category !== 'all') searchParams.set('category', params.category);

		return request<{ users: UserProfile[]; todos: Todo[]; hasMoreUsers: boolean }>(
			`/api/calendar?${searchParams.toString()}`,
			undefined,
			customFetch
		);
	},

	async getTodos(query?: TodoListQuery, customFetch?: typeof fetch): Promise<TodoListResponse> {
		const params = new URLSearchParams();
		if (query?.status) params.set('status', query.status);
		if (query?.category) params.set('category', query.category);
		if (query?.authorId) params.set('authorId', query.authorId);
		if (query?.currentUserId) params.set('currentUserId', query.currentUserId);
		if (query?.cursor) params.set('cursor', query.cursor);
		if (query?.limit) params.set('limit', String(query.limit));
		if (query?.startDateFrom) params.set('startDateFrom', query.startDateFrom);
		if (query?.startDateTo) params.set('startDateTo', query.startDateTo);
		if (query?.dueDateFrom) params.set('dueDateFrom', query.dueDateFrom);
		if (query?.dueDateTo) params.set('dueDateTo', query.dueDateTo);

		const qs = params.toString();
		return request<TodoListResponse>(`/api/todos${qs ? `?${qs}` : ''}`, undefined, customFetch);
	},

	async getTodoById(id: string, currentUserId?: string, customFetch?: typeof fetch): Promise<{ todo: Todo }> {
		const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : '';
		return request<{ todo: Todo }>(`/api/todos/${id}${query}`, undefined, customFetch);
	},

	async createTodo(
		input: CreateTodoInput,
		customFetch?: typeof fetch
	): Promise<{ todo: Todo; author: UserProfile }> {
		return request<{ todo: Todo; author: UserProfile }>(
			'/api/todos',
			{
				method: 'POST',
				body: JSON.stringify(input)
			},
			customFetch
		);
	},

	async updateTodo(
		id: string,
		input: UpdateTodoInput,
		customFetch?: typeof fetch
	): Promise<{ todo: Todo }> {
		return request<{ todo: Todo }>(
			`/api/todos/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(input)
			},
			customFetch
		);
	},

	async addReaction(
		todoId: string,
		emoji: ReactionEmoji,
		email: string,
		customFetch?: typeof fetch
	): Promise<{ reaction: { id: string; todoId: string; userId: string; emoji: string } }> {
		return request(
			`/api/todos/${todoId}/reactions`,
			{
				method: 'POST',
				body: JSON.stringify({ emoji, email })
			},
			customFetch
		);
	},

	async removeReaction(
		todoId: string,
		emoji: ReactionEmoji | undefined,
		email: string,
		customFetch?: typeof fetch
	): Promise<{ success: boolean }> {
		return request(
			`/api/todos/${todoId}/reactions`,
			{
				method: 'DELETE',
				body: JSON.stringify({ email, ...(emoji ? { emoji } : {}) })
			},
			customFetch
		);
	},

	async getReactions(
		todoId: string,
		customFetch?: typeof fetch
	): Promise<{ reactions: ReactionDetail[] }> {
		return request<{ reactions: ReactionDetail[] }>(
			`/api/todos/${todoId}/reactions`,
			undefined,
			customFetch
		);
	},

	async getUserById(id: string, customFetch?: typeof fetch): Promise<{ user: UserProfile }> {
		return request<{ user: UserProfile }>(`/api/users/${id}`, undefined, customFetch);
	},

	async syncUser(email: string, customFetch?: typeof fetch): Promise<{ user: UserProfile }> {
		return request<{ user: UserProfile }>(
			'/api/users',
			{
				method: 'POST',
				body: JSON.stringify({ email })
			},
			customFetch
		);
	},

	async updateUser(
		id: string,
		input: UpdateUserInput,
		customFetch?: typeof fetch
	): Promise<{ user: UserProfile }> {
		return request<{ user: UserProfile }>(
			`/api/users/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(input)
			},
			customFetch
		);
	},

	async getUserHeatmap(
		id: string,
		days: number = 365,
		tz?: string,
		customFetch?: typeof fetch
	): Promise<{ heatmap: HeatmapData }> {
		const targetTz = tz || getClientTimezone();
		const qs = new URLSearchParams({ days: String(days), tz: targetTz }).toString();
		return request<{ heatmap: HeatmapData }>(
			`/api/users/${id}/heatmap?${qs}`,
			undefined,
			customFetch
		);
	},

	async getDailyCards(
		params: {
			date: string;
			startDateFrom?: string;
			startDateTo?: string;
			category?: string;
			onlyMine?: boolean;
			currentUserId?: string;
			limit?: number;
			offset?: number;
			sortBy?: 'time' | 'participants';
		},
		customFetch?: typeof fetch
	): Promise<DailyCardResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('date', params.date);
		if (params.startDateFrom) searchParams.set('startDateFrom', params.startDateFrom);
		if (params.startDateTo) searchParams.set('startDateTo', params.startDateTo);
		if (params.category && params.category !== 'all') searchParams.set('category', params.category);
		if (params.onlyMine !== undefined) searchParams.set('onlyMine', String(params.onlyMine));
		if (params.currentUserId) searchParams.set('currentUserId', params.currentUserId);
		if (params.limit) searchParams.set('limit', String(params.limit));
		if (params.offset) searchParams.set('offset', String(params.offset));
		if (params.sortBy) searchParams.set('sortBy', params.sortBy);

		return request<DailyCardResponse>(`/api/daily?${searchParams.toString()}`, undefined, customFetch);
	},

	async getTopicInfo(
		id: string,
		customFetch?: typeof fetch
	): Promise<TopicInfoResponse> {
		return request<TopicInfoResponse>(`/api/todos/${id}/topic`, undefined, customFetch);
	},

	async getTopicByHash(
		hash: string,
		currentUserId?: string,
		dateOrOptions?: string | { date?: string; startDateFrom?: string; startDateTo?: string; tz?: string },
		customFetch?: typeof fetch
	): Promise<TopicDetailResponse> {
		const searchParams = new URLSearchParams();
		if (currentUserId) searchParams.set('currentUserId', currentUserId);
		const targetTz = (typeof dateOrOptions === 'object' && dateOrOptions?.tz) || getClientTimezone();
		if (targetTz) searchParams.set('tz', targetTz);
		if (typeof dateOrOptions === 'string') {
			if (dateOrOptions) searchParams.set('date', dateOrOptions);
		} else if (dateOrOptions) {
			if (dateOrOptions.date) searchParams.set('date', dateOrOptions.date);
			if (dateOrOptions.startDateFrom) searchParams.set('startDateFrom', dateOrOptions.startDateFrom);
			if (dateOrOptions.startDateTo) searchParams.set('startDateTo', dateOrOptions.startDateTo);
		}
		const qs = searchParams.toString();
		return request<TopicDetailResponse>(
			`/api/topics/${hash}${qs ? `?${qs}` : ''}`,
			undefined,
			customFetch
		);
	},

	async getTopics(
		options?: ListTopicsOptions,
		customFetch?: typeof fetch
	): Promise<TopicListResponse> {
		const searchParams = new URLSearchParams();
		if (options?.category && options.category !== 'all') searchParams.set('category', options.category);
		if (options?.scope) searchParams.set('scope', options.scope);
		if (options?.sortBy) searchParams.set('sortBy', options.sortBy);
		if (options?.timeRange) searchParams.set('timeRange', options.timeRange);
		if (options?.targetDate) searchParams.set('date', options.targetDate);
		if (options?.startDateFrom) searchParams.set('startDateFrom', options.startDateFrom);
		if (options?.startDateTo) searchParams.set('startDateTo', options.startDateTo);
		if (options?.search) searchParams.set('search', options.search);
		if (options?.minParticipants) searchParams.set('minParticipants', String(options.minParticipants));
		if (options?.currentUserId) searchParams.set('currentUserId', options.currentUserId);
		if (options?.limit) searchParams.set('limit', String(options.limit));
		if (options?.offset) searchParams.set('offset', String(options.offset));

		const qs = searchParams.toString();
		return request<TopicListResponse>(`/api/topics${qs ? `?${qs}` : ''}`, undefined, customFetch);
	},

	async getGlobalStats(
		heatmapDays?: number,
		tz?: string,
		customFetch?: typeof fetch
	): Promise<GlobalStatsData> {
		const targetTz = tz || getClientTimezone();
		const params = new URLSearchParams({ tz: targetTz });
		if (heatmapDays) params.set('heatmapDays', String(heatmapDays));
		return request<GlobalStatsData>(`/api/stats?${params.toString()}`, undefined, customFetch);
	}
};
