import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from './setup';
import * as apiKeyService from '../services/api-key.service';
import * as userService from '../services/user.service';
import { AppError } from '../errors';

beforeEach(async () => {
	await cleanDatabase();
});

describe('ApiKeyService', () => {
	describe('createApiKey', () => {
		test('successfully creates an API key for a user and returns rawToken', async () => {
			const user = await userService.findOrCreate(testDb, 'alice@example.com');
			const result = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Claude Desktop'
			});

			expect(result.rawToken).toMatch(/^st_live_[A-Za-z0-9_-]{24,}$/);
			expect(result.apiKey.id).toBeTruthy();
			expect(result.apiKey.userId).toBe(user.id);
			expect(result.apiKey.name).toBe('Claude Desktop');
			expect(result.apiKey.prefix).toBe(result.rawToken.slice(0, 16) + '...');
			expect(result.apiKey.lastUsedAt).toBeNull();
			// Ensure hash is not the raw token
			expect((result.apiKey as any).keyHash).not.toBe(result.rawToken);
		});

		test('supports 1:N multiple API keys for the same user', async () => {
			const user = await userService.findOrCreate(testDb, 'bob@example.com');
			const key1 = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Work Laptop'
			});
			const key2 = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Home Desktop'
			});

			expect(key1.rawToken).not.toBe(key2.rawToken);
			expect(key1.apiKey.id).not.toBe(key2.apiKey.id);

			const list = await apiKeyService.listByUser(testDb, user.id);
			expect(list).toHaveLength(2);
			const names = list.map((k) => k.name);
			expect(names).toContain('Work Laptop');
			expect(names).toContain('Home Desktop');
		});

		test('throws VALIDATION_ERROR when name is empty or missing', async () => {
			const user = await userService.findOrCreate(testDb, 'charlie@example.com');
			await expect(
				apiKeyService.createApiKey(testDb, {
					userId: user.id,
					name: '   '
				})
			).rejects.toThrow(AppError);
		});

		test('throws NOT_FOUND when userId does not exist', async () => {
			await expect(
				apiKeyService.createApiKey(testDb, {
					userId: '00000000-0000-0000-0000-000000000000',
					name: 'Test'
				})
			).rejects.toThrow(AppError);
		});
	});

	describe('verifyApiKey', () => {
		test('validates a correct raw token and returns user and apiKey', async () => {
			const user = await userService.findOrCreate(testDb, 'david@example.com');
			const { rawToken, apiKey } = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Cursor Agent'
			});

			const verified = await apiKeyService.verifyApiKey(testDb, rawToken);
			expect(verified).not.toBeNull();
			expect(verified!.user.id).toBe(user.id);
			expect(verified!.user.email).toBe('david@example.com');
			expect(verified!.apiKey.id).toBe(apiKey.id);
		});

		test('updates lastUsedAt timestamp on successful verification', async () => {
			const user = await userService.findOrCreate(testDb, 'eve@example.com');
			const { rawToken, apiKey } = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Audit Test'
			});

			expect(apiKey.lastUsedAt).toBeNull();
			await apiKeyService.verifyApiKey(testDb, rawToken);

			const keys = await apiKeyService.listByUser(testDb, user.id);
			expect(keys[0].lastUsedAt).toBeInstanceOf(Date);
		});

		test('returns null for an invalid or non-existent token', async () => {
			const verified = await apiKeyService.verifyApiKey(testDb, 'st_live_invalidtoken1234567890');
			expect(verified).toBeNull();
		});

		test('returns null for empty or non-string input', async () => {
			expect(await apiKeyService.verifyApiKey(testDb, '')).toBeNull();
			expect(await apiKeyService.verifyApiKey(testDb, null as any)).toBeNull();
		});

		test('returns null if token is expired', async () => {
			const user = await userService.findOrCreate(testDb, 'frank@example.com');
			const pastDate = new Date(Date.now() - 1000 * 60 * 60);
			const { rawToken } = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'Expired Key',
				expiresAt: pastDate
			});

			const verified = await apiKeyService.verifyApiKey(testDb, rawToken);
			expect(verified).toBeNull();
		});
	});

	describe('listByUser', () => {
		test('returns sanitized keys without keyHash ordered by createdAt desc', async () => {
			const user = await userService.findOrCreate(testDb, 'grace@example.com');
			await apiKeyService.createApiKey(testDb, { userId: user.id, name: 'Key 1' });
			await apiKeyService.createApiKey(testDb, { userId: user.id, name: 'Key 2' });

			const list = await apiKeyService.listByUser(testDb, user.id);
			expect(list).toHaveLength(2);
			expect((list[0] as any).keyHash).toBeUndefined();
			expect(list[0].prefix).toContain('...');
			expect(list[0].name).toBe('Key 2');
			expect(list[1].name).toBe('Key 1');
		});
	});

	describe('revokeApiKey', () => {
		test('successfully revokes an existing API key belonging to the user', async () => {
			const user = await userService.findOrCreate(testDb, 'heidi@example.com');
			const { rawToken, apiKey } = await apiKeyService.createApiKey(testDb, {
				userId: user.id,
				name: 'To Revoke'
			});

			await apiKeyService.revokeApiKey(testDb, { id: apiKey.id, userId: user.id });

			const list = await apiKeyService.listByUser(testDb, user.id);
			expect(list).toHaveLength(0);

			const verified = await apiKeyService.verifyApiKey(testDb, rawToken);
			expect(verified).toBeNull();
		});

		test('throws NOT_FOUND when revoking key belonging to another user', async () => {
			const user1 = await userService.findOrCreate(testDb, 'user1@example.com');
			const user2 = await userService.findOrCreate(testDb, 'user2@example.com');
			const { apiKey } = await apiKeyService.createApiKey(testDb, {
				userId: user1.id,
				name: 'User1 Key'
			});

			await expect(
				apiKeyService.revokeApiKey(testDb, { id: apiKey.id, userId: user2.id })
			).rejects.toThrow(AppError);
		});
	});
});
