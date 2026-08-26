export interface UserProfile {
	id: string;
	email: string;
	nickname: string;
	avatar: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateUserInput {
	email: string;
	nickname?: string;
	avatar?: string | null;
}

export interface CurrentUserSession {
	email: string;
	id?: string;
	nickname?: string;
	avatar?: string | null;
}
