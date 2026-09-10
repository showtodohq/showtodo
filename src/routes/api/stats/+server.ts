import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as statsService from '$lib/server/services/stats.service';
import { resolveTimezone } from '$lib/server/utils/timezone';
import { handleError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ url, request, setHeaders }) => {
	try {
		const heatmapDaysParam = url.searchParams.get('heatmapDays');
		let heatmapDays = 365;
		if (heatmapDaysParam) {
			const parsed = parseInt(heatmapDaysParam, 10);
			if (!isNaN(parsed) && parsed >= 7 && parsed <= 366) {
				heatmapDays = parsed;
			}
		}

		const tzParam = url.searchParams.get('tz');
		const headerTz = request.headers.get('x-timezone');
		const tz = resolveTimezone(tzParam, headerTz);

		const data = await statsService.getGlobalStats(db, heatmapDays, tz);

		// 设置温和缓存，防止突发流量刷库，同时保证秒级新鲜度
		setHeaders({
			'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
		});

		return json(data);
	} catch (e) {
		return handleError(e);
	}
};
