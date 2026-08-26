export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'abandoned';

export type CategoryId = 'study' | 'fitness' | 'finance' | 'dev' | 'life' | 'other';

export type ReactionEmoji = '👀' | '🔥' | '💪' | '👏';

export interface Author {
	id: string;
	nickname: string;
	avatar: string | null;
	email?: string;
}

export interface Todo {
	id: string;
	content: string;
	note: string | null;
	isNotePublic: boolean;
	category: CategoryId | string | null;
	authorId: string;
	status: TodoStatus;
	startDate: string;
	dueDate: string | null;
	createdAt: string;
	updatedAt: string;
	author?: Author;
	reactions?: Record<string, number>;
}

export interface ReactionDetail {
	emoji: ReactionEmoji | string;
	count: number;
	users: Array<{
		id: string;
		nickname: string;
		avatar?: string | null;
	}>;
}

export interface CreateTodoInput {
	email: string;
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	startDate?: string;
	dueDate?: string | null;
}

export interface UpdateTodoInput {
	email: string;
	content?: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	status?: TodoStatus;
	startDate?: string;
	dueDate?: string | null;
}

export interface TodoListQuery {
	status?: TodoStatus;
	category?: string;
	authorId?: string;
	cursor?: string;
	limit?: number;
}

export interface TodoListResponse {
	todos: Todo[];
	nextCursor: string | null;
}
