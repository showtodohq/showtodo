import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export async function handle({ event, resolve }: { event: any; resolve: any }) {
	// Canonical domain enforcement: 308 Permanent Redirect showtodo.com to www.showtodo.com
	if (event.url.hostname === 'showtodo.com') {
		const targetUrl = new URL(event.request.url);
		targetUrl.hostname = 'www.showtodo.com';
		return new Response(null, {
			status: 308,
			headers: {
				Location: targetUrl.toString()
			}
		});
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = {
			...session.user,
			nickname: session.user.name,
			avatar: session.user.image ?? null
		};
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
