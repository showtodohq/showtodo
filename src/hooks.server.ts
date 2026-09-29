import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import * as apiKeyService from '$lib/server/services/api-key.service';

export async function handle({ event, resolve }: { event: any; resolve: any }) {
	const origin = event.request.headers.get('origin') || '';
	const isAllowedOrigin =
		origin.startsWith('chrome-extension://') ||
		origin.includes('localhost') ||
		origin.includes('127.0.0.1');

	// Handle CORS preflight requests for Chrome extension
	if (event.request.method === 'OPTIONS' && isAllowedOrigin) {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '86400'
			}
		});
	}

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
			nickname: (session.user as any).nickname ?? session.user.name,
			avatar: session.user.image ?? null,
			handle: (session.user as any).handle
		};
		event.locals.apiKey = null;
	} else {
		event.locals.session = null;
		event.locals.user = null;
		event.locals.apiKey = null;

		const authHeader = event.request.headers.get('authorization') || '';
		if (authHeader.startsWith('Bearer ')) {
			const rawToken = authHeader.slice(7).trim();
			if (rawToken) {
				const verified = await apiKeyService.verifyApiKey(db, rawToken);
				if (verified) {
					event.locals.apiKey = verified.apiKey;
					event.locals.user = {
						...verified.user,
						name: verified.user.nickname,
						nickname: verified.user.nickname,
						avatar: verified.user.avatar,
						image: verified.user.avatar
					};
				}
			}
		}
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	if (isAllowedOrigin) {
		response.headers.set('Access-Control-Allow-Origin', origin);
		response.headers.set('Access-Control-Allow-Credentials', 'true');
	}

	return response;
}
