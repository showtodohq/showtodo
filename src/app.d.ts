import type { Session, User } from 'better-auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session | null;
			user: (User & {
				nickname: string;
				avatar: string | null;
				handle?: string;
			}) | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
