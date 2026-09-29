import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from '$lib/server/__tests__/setup';
import * as userService from '$lib/server/services/user.service';
import * as apiKeyService from '$lib/server/services/api-key.service';
import { POST, GET } from '../+server';

beforeEach(async () => {
	await cleanDatabase();
});

function createMockEvent(method: string, body?: any, headers: Record<string, string> = {}) {
	const request = new Request('http://localhost:3003/api/mcp', {
		method,
		headers: {
			'Content-Type': 'application/json',
			...headers
		},
		body: body ? JSON.stringify(body) : undefined
	});

	return {
		request,
		url: new URL('http://localhost:3003/api/mcp'),
		locals: {}
	} as any;
}

describe('MCP Endpoint: /api/mcp', () => {
	describe('GET /api/mcp', () => {
		test('returns SSE stream or info endpoint', async () => {
			const event = createMockEvent('GET', undefined, { Accept: 'text/event-stream' });
			const response = await GET(event);
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/event-stream');
		});
	});

	describe('POST /api/mcp', () => {
		test('handles initialize handshake', async () => {
			const event = createMockEvent('POST', {
				jsonrpc: '2.0',
				id: 1,
				method: 'initialize',
				params: {
					protocolVersion: '2024-11-05',
					capabilities: {},
					clientInfo: { name: 'Claude Desktop', version: '1.0.0' }
				}
			});

			const response = await POST(event);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.jsonrpc).toBe('2.0');
			expect(data.id).toBe(1);
			expect(data.result.serverInfo.name).toBe('showtodo-mcp-server');
			expect(data.result.capabilities).toHaveProperty('tools');
			expect(data.result.capabilities).toHaveProperty('resources');
			expect(data.result.capabilities).toHaveProperty('prompts');
		});

		test('handles tools/list without authentication', async () => {
			const event = createMockEvent('POST', {
				jsonrpc: '2.0',
				id: 2,
				method: 'tools/list'
			});

			const response = await POST(event);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.result.tools).toHaveLength(6);
		});

		test('handles tools/call with Bearer token authentication', async () => {
			const user = await userService.findOrCreate(testDb, 'mcp-api@example.com');
			const { rawToken } = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Test Key'
			});

			const event = createMockEvent(
				'POST',
				{
					jsonrpc: '2.0',
					id: 3,
					method: 'tools/call',
					params: {
						name: 'create_todo',
						arguments: {
							content: 'Ship MCP over HTTP',
							category: 'dev'
						}
					}
				},
				{
					Authorization: `Bearer ${rawToken}`
				}
			);

			const response = await POST(event);
			expect(response.status).toBe(200);
			const data = await response.json();
			expect(data.result.isError).toBe(false);
			expect(data.result.content[0].text).toContain('Ship MCP over HTTP');
		});

		test('handles resources/list', async () => {
			const event = createMockEvent('POST', {
				jsonrpc: '2.0',
				id: 4,
				method: 'resources/list'
			});

			const response = await POST(event);
			const data = await response.json();
			expect(data.result.resources.length).toBeGreaterThanOrEqual(4);
		});

		test('handles prompts/list', async () => {
			const event = createMockEvent('POST', {
				jsonrpc: '2.0',
				id: 5,
				method: 'prompts/list'
			});

			const response = await POST(event);
			const data = await response.json();
			expect(data.result.prompts).toHaveLength(3);
		});
	});
});
