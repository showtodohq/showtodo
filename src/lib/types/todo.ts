import type { TodoStatus } from '$lib/constants/status';
import type {
	RecurrenceFrequency,
	RecurrenceStatus,
	RecurrenceEndCondition
} from '$lib/constants/recurrence';

export type { TodoStatus, RecurrenceFrequency, RecurrenceStatus, RecurrenceEndCondition };

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

export interface RecurringRuleSummary {
	id: string;
	frequency: RecurrenceFrequency;
	interval: number;
	currentStreak: number;
	maxStreak: number;
	status: RecurrenceStatus;
}

export interface RecurringRule {
	id: string;
	authorId: string;
	content: string;
	topicHash: string;
	note: string | null;
	isNotePublic: boolean;
	category: string | null;
	frequency: RecurrenceFrequency;
	interval: number;
	daysOfWeek?: number[] | null;
	dayOfMonth?: number | null;
	cronExpression?: string | null;
	status: RecurrenceStatus;
	currentStreak: number;
	maxStreak: number;
	totalCycles: number;
	completedCycles: number;
	consecutiveMisses: number;
	endCondition: RecurrenceEndCondition;
	endAfterOccurrences?: number | null;
	endDate?: string | null;
	nextRunAt: string;
	lastRunAt?: string | null;
	timezone: string;
	createdAt: string;
	updatedAt: string;
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
	recurringRuleId?: string | null;
	slotKey?: string | null;
	cycleIndex?: number | null;
	status: TodoStatus;
	startDate: string;
	dueDate: string | null;
	createdAt: string;
	updatedAt: string;
	author?: Author;
	recurringRule?: RecurringRuleSummary | null;
	reactions?: Record<string, number>;
	myReactions?: ReactionEmoji[];
	activities?: TodoActivity[];
	topicParticipantCount?: number;
	myJoinedTodo?: {
		id: string;
		shortId?: string | null;
		status: TodoStatus;
	} | null;
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
	email?: string;
	content: string;
	note?: string | null;
	isNotePublic?: boolean;
	category?: string | null;
	startDate?: string;
	dueDate?: string | null;
	isRecurring?: boolean;
	frequency?: RecurrenceFrequency;
	interval?: number;
	daysOfWeek?: number[];
	dayOfMonth?: number;
	cronExpression?: string;
	endCondition?: RecurrenceEndCondition;
	endAfterOccurrences?: number;
	endDate?: string;
	timezone?: string;
}

export interface CreateRecurringRuleInput {
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

export interface VirtualTodoItem {
	id?: string;
	ruleId: string;
	slotKey: string;
	content: string;
	topicHash: string;
	category: string | null;
	isVirtual: true;
	startDate: string;
	dueDate: string | null;
	status: 'pending';
}

export interface UpdateTodoInput {
	email?: string;
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
	currentUserId?: string;
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
	totalTodos?: number;
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

export interface TopicParticipant {
	todoId: string;
	shortId: string;
	status: TodoStatus;
	note?: string | null;
	startDate?: string;
	dueDate?: string | null;
	createdAt: string;
	isMe?: boolean;
	totalTodos?: number;
	doneCount?: number;
	reactions?: Record<string, number>;
	myReactions?: ReactionEmoji[];
	user: {
		id: string;
		nickname: string;
		handle: string;
		avatar: string | null;
	};
}

export interface TopicDetail {
	topicHash: string;
	content: string;
	category: string | null;
	firstCreatedAt: string;
	targetDate?: string;
	todayParticipants: number;
	todayTotalTodos?: number;
	todayDoneCount: number;
	todayInProgressCount: number;
	isTodayAllDone: boolean;
	totalParticipants: number;
	totalTodos?: number;
	allDoneCount?: number;
	doneCount: number;
	inProgressCount: number;
	isAllDone: boolean;
	participants: TopicParticipant[];
	allParticipants?: TopicParticipant[];
}

export interface TopicDetailResponse {
	topic: TopicDetail;
}

export interface TopicItem {
	topicHash: string;
	content: string;
	category: string | null;
	isMultiplayer: boolean;
	totalParticipants: number;
	totalTodos?: number;
	doneCount: number;
	completionRate: number;
	isAllDone: boolean;
	firstCreatedAt: string;
	lastUpdatedAt: string;
	participants: CardParticipant[];
}

export interface TopicListResponse {
	total: number;
	topics: TopicItem[];
	hasMore: boolean;
}

export interface ListTopicsOptions {
	category?: string;
	scope?: 'all' | 'mine';
	sortBy?: 'participants' | 'recent' | 'completion';
	timeRange?: 'today' | 'all';
	targetDate?: string;
	startDateFrom?: string;
	startDateTo?: string;
	search?: string;
	minParticipants?: number;
	currentUserId?: string;
	limit?: number;
	offset?: number;
}

