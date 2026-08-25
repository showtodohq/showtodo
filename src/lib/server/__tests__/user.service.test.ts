import { describe, test, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase } from './setup';
import * as userService from '../services/user.service';
import { AppError } from '../errors';

beforeEach(async () => {
	await cleanDatabase();
});

describe('findOrCreate', () => {
	test('creates new user for unknown email', async () => {
		const user = await userService.findOrCreate(testDb, 'new@example.com');
		expect(user.email).toBe('new@example.com');
		expect(user.nickname).toBe('new');
		expect(user.avatar).toBeNull();
		expect(user.id).toBeTruthy();
	});

	test('returns existing user for known email', async () => {
		const user1 = await userService.findOrCreate(testDb, 'existing@example.com');
		const user2 = await userService.findOrCreate(testDb, 'existing@example.com');
		expect(user1.id).toBe(user2.id);
	});

	test('uses email prefix as nickname', async () => {
		const user = await userService.findOrCreate(testDb, 'john.doe+test@example.com');
		expect(user.nickname).toBe('john.doe+test');
	});

	test('sets createdAt and updatedAt', async () => {
		const user = await userService.findOrCreate(testDb, 'time@example.com');
		expect(user.createdAt).toBeInstanceOf(Date);
		expect(user.updatedAt).toBeInstanceOf(Date);
	});
});

describe('findById', () => {
	test('returns user for existing id', async () => {
		const created = await userService.findOrCreate(testDb, 'find@example.com');
		const found = await userService.findById(testDb, created.id);
		expect(found).not.toBeNull();
		expect(found!.email).toBe('find@example.com');
	});

	test('returns null for non-existing id', async () => {
		const found = await userService.findById(testDb, '00000000-0000-0000-0000-000000000000');
		expect(found).toBeNull();
	});
});

describe('findByEmail', () => {
	test('returns user for existing email', async () => {
		await userService.findOrCreate(testDb, 'findme@example.com');
		const found = await userService.findByEmail(testDb, 'findme@example.com');
		expect(found).not.toBeNull();
		expect(found!.email).toBe('findme@example.com');
	});

	test('returns null for non-existing email', async () => {
		const found = await userService.findByEmail(testDb, 'nonexist@example.com');
		expect(found).toBeNull();
	});
});

describe('update', () => {
	test('updates nickname', async () => {
		const user = await userService.findOrCreate(testDb, 'update@example.com');
		const updated = await userService.update(testDb, user.id, 'update@example.com', {
			nickname: 'New Name'
		});
		expect(updated.nickname).toBe('New Name');
	});

	test('updates avatar', async () => {
		const user = await userService.findOrCreate(testDb, 'avatar@example.com');
		const updated = await userService.update(testDb, user.id, 'avatar@example.com', {
			avatar: 'https://example.com/avatar.png'
		});
		expect(updated.avatar).toBe('https://example.com/avatar.png');
	});

	test('clears avatar to null', async () => {
		const user = await userService.findOrCreate(testDb, 'clear@example.com');
		await userService.update(testDb, user.id, 'clear@example.com', {
			avatar: 'https://example.com/old.png'
		});
		const updated = await userService.update(testDb, user.id, 'clear@example.com', {
			avatar: null
		});
		expect(updated.avatar).toBeNull();
	});

	test('throws NOT_FOUND for non-existing user', async () => {
		await expect(
			userService.update(testDb, '00000000-0000-0000-0000-000000000000', 'x@x.com', {
				nickname: 'test'
			})
		).rejects.toThrow(AppError);
	});

	test('throws FORBIDDEN when email does not match', async () => {
		const user = await userService.findOrCreate(testDb, 'owner@example.com');
		try {
			await userService.update(testDb, user.id, 'other@example.com', { nickname: 'hacked' });
			expect.unreachable('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(AppError);
			expect((e as AppError).code).toBe('FORBIDDEN');
		}
	});
});
