import { describe, it, expect, vi } from 'vitest';
import { insertItem, updateItem, removeItem, upsertItem, optimisticAction } from '../mutation';

interface TestItem {
	id: string;
	title: string;
	done: boolean;
	count: number;
}

describe('mutation utilities', () => {
	it('insertItem inserts at start by default', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 0 }
		];
		const newItem: TestItem = { id: '2', title: 'B', done: true, count: 5 };
		insertItem(list, newItem);
		expect(list.length).toBe(2);
		expect(list[0].id).toBe('2');
	});

	it('insertItem inserts at end when specified', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 0 }
		];
		const newItem: TestItem = { id: '2', title: 'B', done: true, count: 5 };
		insertItem(list, newItem, 'end');
		expect(list.length).toBe(2);
		expect(list[1].id).toBe('2');
	});

	it('updateItem updates properties in place by ID', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 1 },
			{ id: '2', title: 'B', done: false, count: 2 }
		];
		const success = updateItem(list, '2', { done: true, count: 10 });
		expect(success).toBe(true);
		expect(list[1].done).toBe(true);
		expect(list[1].count).toBe(10);
		expect(list[1].title).toBe('B');
	});

	it('updateItem supports function updater', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 5 }
		];
		const success = updateItem(list, '1', (prev) => ({ count: prev.count + 1 }));
		expect(success).toBe(true);
		expect(list[0].count).toBe(6);
	});

	it('updateItem returns false when item not found', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 1 }
		];
		const success = updateItem(list, '999', { done: true });
		expect(success).toBe(false);
	});

	it('removeItem removes item and returns it', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 1 },
			{ id: '2', title: 'B', done: false, count: 2 }
		];
		const removed = removeItem(list, '1');
		expect(removed?.id).toBe('1');
		expect(list.length).toBe(1);
		expect(list[0].id).toBe('2');
	});

	it('removeItem returns null if not found', () => {
		const list: TestItem[] = [{ id: '1', title: 'A', done: false, count: 1 }];
		const removed = removeItem(list, 'nonexistent');
		expect(removed).toBeNull();
		expect(list.length).toBe(1);
	});

	it('upsertItem updates if exists, inserts if not', () => {
		const list: TestItem[] = [
			{ id: '1', title: 'A', done: false, count: 1 }
		];
		// Update existing
		upsertItem(list, { id: '1', title: 'A_modified', done: true, count: 2 });
		expect(list.length).toBe(1);
		expect(list[0].title).toBe('A_modified');

		// Insert new
		upsertItem(list, { id: '2', title: 'New', done: false, count: 0 });
		expect(list.length).toBe(2);
		expect(list[0].id).toBe('2');
	});

	it('optimisticAction applies immediately and returns result on success', async () => {
		let state = 'initial';
		const apply = vi.fn(() => {
			state = 'optimistic';
		});
		const rollback = vi.fn(() => {
			state = 'initial';
		});
		const action = vi.fn(async () => {
			return { ok: true };
		});

		const result = await optimisticAction({ apply, rollback, action });

		expect(apply).toHaveBeenCalledTimes(1);
		expect(rollback).not.toHaveBeenCalled();
		expect(state).toBe('optimistic');
		expect(result).toEqual({ ok: true });
	});

	it('optimisticAction rolls back on failure', async () => {
		let state = 'initial';
		const apply = vi.fn(() => {
			state = 'optimistic';
		});
		const rollback = vi.fn(() => {
			state = 'initial';
		});
		const action = vi.fn(async () => {
			throw new Error('Network error');
		});
		const onError = vi.fn();

		await expect(
			optimisticAction({ apply, rollback, action, onError })
		).rejects.toThrow('Network error');

		expect(apply).toHaveBeenCalledTimes(1);
		expect(rollback).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledTimes(1);
		expect(state).toBe('initial');
	});
});
