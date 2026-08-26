import { browser } from '$app/environment';
import type { CurrentUserSession, UserProfile } from '$lib/types/user';

const STORAGE_KEY = 'public_todo_user_session';

class UserStore {
	current = $state<CurrentUserSession | null>(null);
	initialized = $state(false);

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	private loadFromStorage() {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				this.current = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Failed to load user session from storage:', e);
		} finally {
			this.initialized = true;
		}
	}

	private saveToStorage() {
		if (!browser) return;
		try {
			if (this.current) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch (e) {
			console.error('Failed to save user session to storage:', e);
		}
	}

	setSession(session: CurrentUserSession) {
		const email = session.email.trim().toLowerCase();
		const nickname = session.nickname?.trim() || email.split('@')[0];
		const handle = session.handle?.trim() || nickname.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'user';
		this.current = {
			...session,
			email,
			nickname,
			handle
		};
		this.saveToStorage();
	}

	updateUserFromProfile(user: UserProfile) {
		this.current = {
			email: user.email,
			id: user.id,
			handle: user.handle,
			nickname: user.nickname,
			avatar: user.avatar
		};
		this.saveToStorage();
	}

	clearSession() {
		this.current = null;
		this.saveToStorage();
	}

	get email(): string | undefined {
		return this.current?.email;
	}

	get handle(): string {
		if (!this.current) return 'guest';
		return this.current.handle || this.current.nickname || 'guest';
	}

	get nickname(): string {
		if (!this.current) return '游客';
		return this.current.nickname || this.current.email.split('@')[0];
	}

	get id(): string | undefined {
		return this.current?.id;
	}

	get avatar(): string | null {
		return this.current?.avatar ?? null;
	}

	isAuthor(authorId?: string | null, authorEmail?: string | null, authorHandle?: string | null): boolean {
		if (!this.current) return false;
		if (authorId && this.current.id && this.current.id === authorId) return true;
		if (authorEmail && this.current.email.toLowerCase() === authorEmail.toLowerCase()) return true;
		if (authorHandle && this.current.handle && this.current.handle.toLowerCase() === authorHandle.toLowerCase()) return true;
		return false;
	}
}

export const userStore = new UserStore();
