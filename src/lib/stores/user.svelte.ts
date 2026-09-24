import { browser } from '$app/environment';
import { authClient } from '$lib/auth-client';
import type { CurrentUserSession, UserProfile } from '$lib/types/user';

const STORAGE_KEY = 'public_todo_user_session';

class UserStore {
	private session = authClient.useSession();
	private legacySession = $state<CurrentUserSession | null>(null);

	constructor() {
		if (browser) {
			this.loadLegacyStorage();
		}
	}

	private loadLegacyStorage() {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				this.legacySession = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Failed to load user session from storage:', e);
		}
	}

	private saveLegacyStorage() {
		if (!browser) return;
		try {
			if (this.legacySession) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.legacySession));
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}
		} catch (e) {
			console.error('Failed to save user session to storage:', e);
		}
	}

	/**
	 * 当前用户数据：优先响应 Better Auth 真实会话，回退至 legacy 客户端缓存
	 */
	get current(): CurrentUserSession | null {
		const sessionState = this.session?.get();
		const authUser = sessionState?.data?.user;
		if (authUser) {
			const email = authUser.email.trim().toLowerCase();
			const nickname = authUser.name?.trim() || email.split('@')[0];
			const handle = (authUser as any).handle?.trim() || nickname.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'user';
			return {
				id: authUser.id,
				email,
				nickname,
				handle,
				avatar: authUser.image ?? null
			};
		}
		return this.legacySession;
	}

	get initialized(): boolean {
		const sessionState = this.session?.get();
		return Boolean(!sessionState?.isPending);
	}

	get email(): string | undefined {
		return this.current?.email;
	}

	get handle(): string {
		if (!this.current) return 'guest';
		return this.current.handle || this.current.nickname || 'guest';
	}

	get nickname(): string {
		if (!this.current) return 'Guest';
		return this.current.nickname || this.current.email.split('@')[0];
	}

	get id(): string | undefined {
		return this.current?.id;
	}

	get avatar(): string | null {
		return this.current?.avatar ?? null;
	}

	setSession(session: CurrentUserSession) {
		const email = session.email.trim().toLowerCase();
		const nickname = session.nickname?.trim() || email.split('@')[0];
		const handle = session.handle?.trim() || nickname.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'user';
		this.legacySession = {
			...session,
			email,
			nickname,
			handle
		};
		this.saveLegacyStorage();
	}

	updateUserFromProfile(user: UserProfile) {
		const email = user.email || this.current?.email || '';
		if (!email) return;
		this.legacySession = {
			email,
			id: user.id,
			handle: user.handle,
			nickname: user.nickname,
			avatar: user.avatar
		};
		this.saveLegacyStorage();
	}

	clearSession() {
		this.legacySession = null;
		this.saveLegacyStorage();
	}

	async signOut() {
		this.clearSession();
		try {
			await authClient.signOut();
		} catch (e) {
			console.error('Error signing out from Better Auth:', e);
		}
	}

	isAuthor(authorId?: string | null, authorEmail?: string | null, authorHandle?: string | null): boolean {
		if (!this.current) return false;
		const clean = (val: string) => (val.startsWith('@') ? val.slice(1).toLowerCase() : val.toLowerCase());
		if (authorId) {
			const norm = clean(authorId);
			if (this.current.id && this.current.id.toLowerCase() === norm) return true;
			if (this.current.handle && clean(this.current.handle) === norm) return true;
			if (this.current.email && clean(this.current.email) === norm) return true;
		}
		if (authorEmail && this.current.email.toLowerCase() === clean(authorEmail)) return true;
		if (authorHandle && this.current.handle && clean(this.current.handle) === clean(authorHandle)) return true;
		return false;
	}
}

export const userStore = new UserStore();
