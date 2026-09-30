import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { toast } from '../toast.svelte';

describe('ToastStore', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		toast.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should add success toast correctly', () => {
		toast.success('Key created');
		expect(toast.toasts).toHaveLength(1);
		expect(toast.toasts[0].message).toBe('Key created');
		expect(toast.toasts[0].type).toBe('success');
	});

	it('should add error toast correctly', () => {
		toast.error('Operation failed');
		expect(toast.toasts).toHaveLength(1);
		expect(toast.toasts[0].message).toBe('Operation failed');
		expect(toast.toasts[0].type).toBe('error');
	});

	it('should dismiss toast manually', () => {
		const id = toast.info('Notice');
		expect(toast.toasts).toHaveLength(1);
		toast.dismiss(id);
		expect(toast.toasts).toHaveLength(0);
	});

	it('should auto-dismiss toast after duration', () => {
		toast.info('Auto dismiss', 1000);
		expect(toast.toasts).toHaveLength(1);
		vi.advanceTimersByTime(1000);
		expect(toast.toasts).toHaveLength(0);
	});

	it('should clear all toasts', () => {
		toast.info('1');
		toast.info('2');
		expect(toast.toasts).toHaveLength(2);
		toast.clear();
		expect(toast.toasts).toHaveLength(0);
	});
});


