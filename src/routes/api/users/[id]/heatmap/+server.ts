import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import * as statsService from '$lib/server/services/stats.service';
import { handleError, AppError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const user = await userService.findByIdOrHandle(db, params.id);
		if (!user) throw new AppError('NOT_FOUND', 'User not found');

		const daysParam = url.searchParams.get('days');
		const days = daysParam ? Math.min(365, Math.max(7, parseInt(daysParam, 10) || 365)) : 365;

		const heatmap = await statsService.getUserHeatmapStats(db, user.id, days);

		return json(
			{ heatmap },
			{
				headers: {
					'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
				}
			}
		);
	} catch (e) {
		return handleError(e);
	}
};
