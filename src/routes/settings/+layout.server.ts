import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import * as apiKeyService from '$lib/server/services/api-key.service';
import { eq, and } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user?.id) {
		throw redirect(302, '/');
	}

	let hasPassword = false;
	try {
		const credentialAccount = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, locals.user.id), eq(accounts.providerId, 'credential')))
			.limit(1);
		hasPassword = Boolean(credentialAccount[0]);
	} catch (e) {
		console.error('Error checking password status in settings layout:', e);
	}

	const apiKeys = await apiKeyService.listByUser(db, locals.user.id);

	return {
		user: locals.user,
		hasPassword,
		apiKeys
	};
};
