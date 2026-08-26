import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import { validateEmail, validateHandle } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const user = await userService.findByIdOrHandle(db, params.id);
		if (!user) throw new AppError('NOT_FOUND', 'User not found');

		return json({ user });
	} catch (e) {
		return handleError(e);
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		const email = validateEmail(body.email);

		const data: { nickname?: string; avatar?: string | null; handle?: string } = {};
		if (body.nickname !== undefined) {
			if (typeof body.nickname !== 'string' || body.nickname.trim().length === 0) {
				throw new AppError('VALIDATION_ERROR', 'nickname must be a non-empty string');
			}
			data.nickname = body.nickname.trim();
		}
		if (body.handle !== undefined) {
			data.handle = validateHandle(body.handle);
		}
		if (body.avatar !== undefined) {
			data.avatar = body.avatar === null ? null : String(body.avatar);
		}

		const targetUser = await userService.findByIdOrHandle(db, params.id);
		if (!targetUser) throw new AppError('NOT_FOUND', 'User not found');

		const updated = await userService.update(db, targetUser.id, email, data);

		return json({ user: updated });
	} catch (e) {
		return handleError(e);
	}
};
