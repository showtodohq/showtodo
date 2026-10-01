import { describe, it, expect } from 'vitest';
import {
	evaluateStreakTransition,
	evaluateMissedCycles,
	type StreakState
} from '../streak-machine';
import { RECURRENCE_CONFIG } from '$lib/constants/recurrence';

describe('Streak Engine & State Machine (TDD)', () => {
	describe('evaluateStreakTransition', () => {
		it('increments streak when transitioning from pending to done in valid window', () => {
			const current: StreakState = {
				currentStreak: 3,
				maxStreak: 5,
				completedCycles: 3,
				consecutiveMisses: 0
			};

			const result = evaluateStreakTransition(current, {
				fromStatus: 'pending',
				toStatus: 'done',
				isWithinGraceWindow: true
			});

			expect(result.currentStreak).toBe(4);
			expect(result.maxStreak).toBe(5);
			expect(result.completedCycles).toBe(4);
			expect(result.consecutiveMisses).toBe(0);
			expect(result.shouldIncrement).toBe(true);
		});

		it('updates maxStreak when currentStreak surpasses previous max', () => {
			const current: StreakState = {
				currentStreak: 5,
				maxStreak: 5,
				completedCycles: 10,
				consecutiveMisses: 0
			};

			const result = evaluateStreakTransition(current, {
				fromStatus: 'pending',
				toStatus: 'done',
				isWithinGraceWindow: true
			});

			expect(result.currentStreak).toBe(6);
			expect(result.maxStreak).toBe(6);
		});

		it('is strictly idempotent if already done', () => {
			const current: StreakState = {
				currentStreak: 3,
				maxStreak: 5,
				completedCycles: 3,
				consecutiveMisses: 0
			};

			const result = evaluateStreakTransition(current, {
				fromStatus: 'done',
				toStatus: 'done',
				isWithinGraceWindow: true
			});

			expect(result.currentStreak).toBe(3);
			expect(result.completedCycles).toBe(3);
			expect(result.shouldIncrement).toBe(false);
		});

		it('does not increment streak if transitioned to in_progress or pending', () => {
			const current: StreakState = {
				currentStreak: 3,
				maxStreak: 5,
				completedCycles: 3,
				consecutiveMisses: 0
			};

			const result = evaluateStreakTransition(current, {
				fromStatus: 'pending',
				toStatus: 'in_progress',
				isWithinGraceWindow: true
			});

			expect(result.currentStreak).toBe(3);
			expect(result.shouldIncrement).toBe(false);
		});

		it('resets current streak to 1 if completed outside grace window (late catch-up)', () => {
			const current: StreakState = {
				currentStreak: 5,
				maxStreak: 10,
				completedCycles: 5,
				consecutiveMisses: 1
			};

			const result = evaluateStreakTransition(current, {
				fromStatus: 'pending',
				toStatus: 'done',
				isWithinGraceWindow: false // Missed window!
			});

			expect(result.currentStreak).toBe(1); // restarts from 1
			expect(result.maxStreak).toBe(10); // preserves history
			expect(result.completedCycles).toBe(6);
			expect(result.consecutiveMisses).toBe(0);
		});
	});

	describe('evaluateMissedCycles & Auto-Dormant Trigger', () => {
		it('detects 0 missed cycles when on schedule', () => {
			const result = evaluateMissedCycles({
				currentStreak: 4,
				consecutiveMisses: 0,
				missedPeriodsCount: 0
			});

			expect(result.currentStreak).toBe(4);
			expect(result.consecutiveMisses).toBe(0);
			expect(result.isDormant).toBe(false);
		});

		it('breaks streak and accumulates misses when periods are missed', () => {
			const result = evaluateMissedCycles({
				currentStreak: 4,
				consecutiveMisses: 0,
				missedPeriodsCount: 1
			});

			expect(result.currentStreak).toBe(0); // streak broken
			expect(result.consecutiveMisses).toBe(1);
			expect(result.isDormant).toBe(false);
		});

		it('triggers auto-dormant state when consecutive misses reach threshold (7)', () => {
			const result = evaluateMissedCycles({
				currentStreak: 0,
				consecutiveMisses: 6,
				missedPeriodsCount: 1 // 6 + 1 = 7
			});

			expect(result.consecutiveMisses).toBe(7);
			expect(result.isDormant).toBe(true);
			expect(result.newStatus).toBe('dormant');
		});
	});
});
