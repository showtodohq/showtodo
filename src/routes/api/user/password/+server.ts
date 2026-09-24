import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/server/auth';
import { AppError, handleError } from '$lib/server/errors';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user?.id) throw new AppError('FORBIDDEN', 'Authentication required');

		const credentialAccount = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, locals.user.id), eq(accounts.providerId, 'credential')))
			.limit(1);

		return json({ hasPassword: Boolean(credentialAccount[0]) });
	} catch (e) {
		return handleError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user?.id) throw new AppError('FORBIDDEN', 'Authentication required');

		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const { newPassword } = body;
		if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
			throw new AppError('VALIDATION_ERROR', 'Password must be at least 8 characters');
		}

		await auth.api.setPassword({
			body: { newPassword },
			headers: request.headers
		});

		return json({ success: true, message: 'Password created successfully' });
	} catch (e) {
		return handleError(e);
	}
};
