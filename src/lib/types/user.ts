export interface UserProfile {
	id: string;
	email: string;
	handle: string;
	nickname: string;
	avatar: string | null;
	createdAt: string;
	updatedAt: string;
	lastTodoUpdatedAt?: string | null;
}

export interface UpdateUserInput {
	email: string;
	nickname?: string;
	handle?: string;
	avatar?: string | null;
}

export interface CurrentUserSession {
	email: string;
	id?: string;
	handle?: string;
	nickname?: string;
	avatar?: string | null;
}
