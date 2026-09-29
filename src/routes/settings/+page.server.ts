import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import * as apiKeyService from '$lib/server/services/api-key.service';
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

	const apiKeys = await apiKeyService.listByUser(db, locals.user.id);

	return {
		hasPassword,
		apiKeys
	};
};

export const actions: Actions = {
	createApiKey: async ({ request, locals }) => {
		if (!locals.user?.id) {
			throw redirect(302, '/');
		}

		const data = await request.formData();
		const name = String(data.get('name') || '').trim();

		if (!name) {
			return fail(400, { createError: 'Please provide a name for this API key' });
		}

		try {
			const result = await apiKeyService.createApiKey(db, {
				userId: locals.user.id,
				name
			});

			return {
				success: true,
				action: 'created',
				rawToken: result.rawToken,
				keyName: result.apiKey.name
			};
		} catch (e: any) {
			return fail(400, { createError: e?.message || 'Failed to create API key' });
		}
	},

	revokeApiKey: async ({ request, locals }) => {
		if (!locals.user?.id) {
			throw redirect(302, '/');
		}

		const data = await request.formData();
		const id = String(data.get('id') || '').trim();

		if (!id) {
			return fail(400, { revokeError: 'Key ID is required' });
		}

		try {
			await apiKeyService.revokeApiKey(db, {
				id,
				userId: locals.user.id
			});

			return {
				success: true,
				action: 'revoked'
			};
		} catch (e: any) {
			return fail(400, { revokeError: e?.message || 'Failed to revoke API key' });
		}
	}
};
