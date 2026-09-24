import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	throw redirect(308, `/trending/${params.hash}${url.search}`);
};
