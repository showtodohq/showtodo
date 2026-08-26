import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import { validateEmail } from '$lib/server/validation';

export const POST: RequestHandler = async ({ request }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const email = validateEmail(body.email);
		const user = await userService.findOrCreate(db, email);

		return json({ user });
	} catch (e) {
		return handleError(e);
	}
};
