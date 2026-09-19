import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as statsService from '$lib/server/services/stats.service';

export const load: PageServerLoad = async ({ setHeaders }) => {
	const stats = await statsService.getGlobalStats(db, 365);

	setHeaders({
		'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60'
	});

	return {
		stats
	};
};
