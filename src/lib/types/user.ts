export interface PublicUserProfile {
	id: string;
	handle: string;
	nickname: string;
	avatar: string | null;
	createdAt: string;
	updatedAt: string;
	lastTodoUpdatedAt?: string | null;
}

export interface UserProfile extends PublicUserProfile {
	email?: string;
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
