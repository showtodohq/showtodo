import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import { handleError, AppError } from '$lib/server/errors';
import { validateEmail, validateHandle } from '$lib/server/validation';

export const GET: RequestHandler = async ({ params, url, request }) => {
	try {
		const user = await userService.findByIdOrHandle(db, params.id);
		if (!user) throw new AppError('NOT_FOUND', 'User not found');

		const currentUserId =
			url.searchParams.get('currentUserId') || request.headers.get('x-user-id') || undefined;
		const isSelf = Boolean(currentUserId && currentUserId === user.id);

		return json({ user: userService.toUserProfile(user, { isSelf }) });
	} catch (e) {
		return handleError(e);
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		let body;
		try {
			body = await request.json();
		} catch {
			throw new AppError('VALIDATION_ERROR', 'Invalid JSON body');
		}

		let authIdentifier: { userId?: string; email?: string } | undefined;
		if (locals?.user?.id) {
			authIdentifier = { userId: locals.user.id };
		} else if (body.email) {
			authIdentifier = { email: validateEmail(body.email) };
		}

		if (!authIdentifier) {
			throw new AppError('FORBIDDEN', 'Authentication required to update profile');
		}

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

		const updated = await userService.update(db, targetUser.id, authIdentifier, data);

		return json({ user: userService.toUserProfile(updated, { isSelf: true }) });
	} catch (e) {
		return handleError(e);
	}
};
