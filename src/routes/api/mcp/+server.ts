import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as apiKeyService from '$lib/server/services/api-key.service';
import {
	getToolDefinitions,
	handleToolCall,
	getResourceDefinitions,
	handleResourceRead,
	getPromptDefinitions,
	handlePromptGet
} from '$lib/server/mcp';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
	'Access-Control-Max-Age': '86400'
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS
	});
};

export const GET: RequestHandler = async ({ request }) => {
	const accept = request.headers.get('accept') || '';
	if (accept.includes('text/event-stream')) {
		const stream = new ReadableStream({
			start(controller) {
				const encoder = new TextEncoder();
				controller.enqueue(encoder.encode(`event: endpoint\ndata: /api/mcp\n\n`));
			}
		});

		return new Response(stream, {
			headers: {
				...CORS_HEADERS,
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	}

	return json(
		{
			status: 'ok',
			service: 'showtodo-mcp-server',
			version: '1.0.0',
			protocol: 'Model Context Protocol (MCP)',
			transports: ['streamable-http', 'sse']
		},
		{ headers: CORS_HEADERS }
	);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: any;
	try {
		body = await request.json();
	} catch {
		return json(
			{
				jsonrpc: '2.0',
				id: null,
				error: { code: -32700, message: 'Parse error: Invalid JSON' }
			},
			{ status: 400, headers: CORS_HEADERS }
		);
	}

	const { jsonrpc, id, method, params } = body;
	if (jsonrpc !== '2.0') {
		return json(
			{
				jsonrpc: '2.0',
				id: id ?? null,
				error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
			},
			{ status: 400, headers: CORS_HEADERS }
		);
	}

	// 提取并校验认证凭据
	let currentUser = locals?.user ?? null;
	const authHeader = request.headers.get('authorization') || '';
	if (!currentUser && authHeader.startsWith('Bearer ')) {
		const rawToken = authHeader.slice(7).trim();
		const verified = await apiKeyService.verifyApiKey(db, rawToken);
		if (verified) {
			currentUser = {
				...verified.user,
				name: verified.user.nickname,
				image: verified.user.avatar
			};
		}
	}

	try {
		switch (method) {
			case 'initialize': {
				return json(
					{
						jsonrpc: '2.0',
						id,
						result: {
							protocolVersion: params?.protocolVersion || '2024-11-05',
							capabilities: {
								tools: {},
								resources: {},
								prompts: {}
							},
							serverInfo: {
								name: 'showtodo-mcp-server',
								version: '1.0.0'
							}
						}
					},
					{ headers: CORS_HEADERS }
				);
			}

			case 'notifications/initialized': {
				return new Response(null, { status: 204, headers: CORS_HEADERS });
			}

			case 'ping': {
				return json({ jsonrpc: '2.0', id, result: {} }, { headers: CORS_HEADERS });
			}

			case 'tools/list': {
				const tools = getToolDefinitions();
				return json({ jsonrpc: '2.0', id, result: { tools } }, { headers: CORS_HEADERS });
			}

			case 'tools/call': {
				const toolName = params?.name;
				const toolArgs = params?.arguments ?? {};
				if (!toolName) {
					return json(
						{
							jsonrpc: '2.0',
							id,
							error: { code: -32602, message: 'Invalid params: tool name is required' }
						},
						{ headers: CORS_HEADERS }
					);
				}

				const result = await handleToolCall(db, toolName, toolArgs, currentUser);
				return json({ jsonrpc: '2.0', id, result }, { headers: CORS_HEADERS });
			}

			case 'resources/list': {
				const resources = getResourceDefinitions();
				return json({ jsonrpc: '2.0', id, result: { resources } }, { headers: CORS_HEADERS });
			}

			case 'resources/templates/list': {
				const templates = getResourceDefinitions().filter((r) => r.uriTemplate);
				return json(
					{ jsonrpc: '2.0', id, result: { resourceTemplates: templates } },
					{ headers: CORS_HEADERS }
				);
			}

			case 'resources/read': {
				const uri = params?.uri;
				if (!uri) {
					return json(
						{
							jsonrpc: '2.0',
							id,
							error: { code: -32602, message: 'Invalid params: uri is required' }
						},
						{ headers: CORS_HEADERS }
					);
				}

				const result = await handleResourceRead(db, uri, currentUser);
				return json({ jsonrpc: '2.0', id, result }, { headers: CORS_HEADERS });
			}

			case 'prompts/list': {
				const prompts = getPromptDefinitions();
				return json({ jsonrpc: '2.0', id, result: { prompts } }, { headers: CORS_HEADERS });
			}

			case 'prompts/get': {
				const promptName = params?.name;
				const promptArgs = params?.arguments ?? {};
				if (!promptName) {
					return json(
						{
							jsonrpc: '2.0',
							id,
							error: { code: -32602, message: 'Invalid params: prompt name is required' }
						},
						{ headers: CORS_HEADERS }
					);
				}

				const result = handlePromptGet(promptName, promptArgs);
				if (!result) {
					return json(
						{
							jsonrpc: '2.0',
							id,
							error: { code: -32602, message: `Prompt not found: ${promptName}` }
						},
						{ headers: CORS_HEADERS }
					);
				}

				return json({ jsonrpc: '2.0', id, result }, { headers: CORS_HEADERS });
			}

			default: {
				return json(
					{
						jsonrpc: '2.0',
						id,
						error: { code: -32601, message: `Method not found: ${method}` }
					},
					{ headers: CORS_HEADERS }
				);
			}
		}
	} catch (err: any) {
		console.error('Unhandled MCP error:', err);
		return json(
			{
				jsonrpc: '2.0',
				id,
				error: { code: -32603, message: err?.message || 'Internal error' }
			},
			{ headers: CORS_HEADERS }
		);
	}
};
