import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
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
		console.error('Error checking password status on server:', e);
	}

	return {
		hasPassword
	};
};
