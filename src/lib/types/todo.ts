export type TodoStatus = 'pending' | 'in_progress' | 'done' | 'abandoned';

export type CategoryId = 'study' | 'fitness' | 'finance' | 'dev' | 'life' | 'other';

export type ReactionEmoji = '❤️' | '👍' | '🔥' | '💪' | '👏' | '🚀' | '🎉' | '👀';

export type TodoActivityType = 'created' | 'status_change' | 'progress_note';

export interface TodoActivity {
	id: string;
	todoId: string;
	authorId: string;
	type: TodoActivityType;
	fromStatus: TodoStatus | null;
	toStatus: TodoStatus | null;
	content: string | null;
	createdAt: string;
}

export interface Author {
	id: string;
	handle: string;
	nickname: string;
	avatar: string | null;
	email?: string;
}

export interface Todo {
	id: string;
	shortId: string;
	topicHash: string;
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
	activities?: TodoActivity[];
}

export interface ReactionDetail {
	emoji: ReactionEmoji | string;
	count: number;
	users: Array<{
		id: string;
		handle?: string;
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
	activityNote?: string | null;
}

export interface TodoListQuery {
	status?: TodoStatus;
	category?: string;
	authorId?: string;
	cursor?: string;
	limit?: number;
	startDateFrom?: string;
	startDateTo?: string;
	dueDateFrom?: string;
	dueDateTo?: string;
}

export interface TodoListResponse {
	todos: Todo[];
	nextCursor: string | null;
}

export interface CardParticipant {
	todoId: string;
	shortId: string;
	status: TodoStatus;
	note?: string | null;
	createdAt: string;
	isMe: boolean;
	user: {
		id: string;
		nickname: string;
		handle: string;
		avatar: string | null;
	};
}

export interface DailyCard {
	topicHash: string;
	content: string;
	category: string | null;
	isMultiplayer: boolean;
	totalParticipants: number;
	doneCount: number;
	participants: CardParticipant[];
}

export interface DailyCardResponse {
	date: string;
	totalCards: number;
	cards: DailyCard[];
}

export interface TopicInfoResponse {
	topicHash: string;
	participantCount: number;
}

