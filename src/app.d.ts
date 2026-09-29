import type { Session, User } from 'better-auth';
import type { apiKeys } from '$lib/server/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

type ApiKey = InferSelectModel<typeof apiKeys>;

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
			apiKey?: ApiKey | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

