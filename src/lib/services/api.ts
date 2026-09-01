import type {
	CreateTodoInput,
	DailyCardResponse,
	ReactionDetail,
	ReactionEmoji,
	Todo,
	TodoListQuery,
	TodoListResponse,
	TopicInfoResponse,
	UpdateTodoInput
} from '$lib/types/todo';
import type { UpdateUserInput, UserProfile } from '$lib/types/user';

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

async function request<T>(
	url: string,
	options?: RequestInit,
	customFetch?: typeof fetch
): Promise<T> {
	const fetcher = customFetch || fetch;
	const res = await fetcher(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
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
		if (query?.cursor) params.set('cursor', query.cursor);
		if (query?.limit) params.set('limit', String(query.limit));
		if (query?.startDateFrom) params.set('startDateFrom', query.startDateFrom);
		if (query?.startDateTo) params.set('startDateTo', query.startDateTo);
		if (query?.dueDateFrom) params.set('dueDateFrom', query.dueDateFrom);
		if (query?.dueDateTo) params.set('dueDateTo', query.dueDateTo);

		const qs = params.toString();
		return request<TodoListResponse>(`/api/todos${qs ? `?${qs}` : ''}`, undefined, customFetch);
	},

	async getTodoById(id: string, customFetch?: typeof fetch): Promise<{ todo: Todo }> {
		return request<{ todo: Todo }>(`/api/todos/${id}`, undefined, customFetch);
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
		emoji: ReactionEmoji,
		email: string,
		customFetch?: typeof fetch
	): Promise<{ success: boolean }> {
		return request(
			`/api/todos/${todoId}/reactions`,
			{
				method: 'DELETE',
				body: JSON.stringify({ emoji, email })
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

	async getDailyCards(
		params: {
			date: string;
			category?: string;
			onlyMine?: boolean;
			currentUserId?: string;
			limit?: number;
			offset?: number;
		},
		customFetch?: typeof fetch
	): Promise<DailyCardResponse> {
		const searchParams = new URLSearchParams();
		searchParams.set('date', params.date);
		if (params.category && params.category !== 'all') searchParams.set('category', params.category);
		if (params.onlyMine !== undefined) searchParams.set('onlyMine', String(params.onlyMine));
		if (params.currentUserId) searchParams.set('currentUserId', params.currentUserId);
		if (params.limit) searchParams.set('limit', String(params.limit));
		if (params.offset) searchParams.set('offset', String(params.offset));

		return request<DailyCardResponse>(`/api/daily?${searchParams.toString()}`, undefined, customFetch);
	},

	async getTopicInfo(
		id: string,
		customFetch?: typeof fetch
	): Promise<TopicInfoResponse> {
		return request<TopicInfoResponse>(`/api/todos/${id}/topic`, undefined, customFetch);
	}
};
