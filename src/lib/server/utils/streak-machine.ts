/**
 * 连击打卡状态机与冷休眠判定纯函数 (Streak Engine & State Machine)
 *
 * 遵循 DDD 原则，纯函数、绝对幂等、零外部副作用。
 */

import type { TodoStatus } from '$lib/constants/status';
import { RECURRENCE_CONFIG } from '$lib/constants/recurrence';

export interface StreakState {
	currentStreak: number;
	maxStreak: number;
	completedCycles: number;
	consecutiveMisses: number;
}

export interface TransitionInput {
	fromStatus: TodoStatus | string;
	toStatus: TodoStatus | string;
	isWithinGraceWindow: boolean;
}

export interface TransitionResult extends StreakState {
	shouldIncrement: boolean;
}

export interface MissedCyclesInput {
	currentStreak: number;
	consecutiveMisses: number;
	missedPeriodsCount: number;
}

export interface MissedCyclesResult {
	currentStreak: number;
	consecutiveMisses: number;
	isDormant: boolean;
	newStatus?: 'dormant';
}

/**
 * 评估单期待办状态改变对 Streak 的流转影响 (幂等)
 */
export function evaluateStreakTransition(
	current: StreakState,
	transition: TransitionInput
): TransitionResult {
	const { currentStreak, maxStreak, completedCycles, consecutiveMisses } = current;
	const { fromStatus, toStatus, isWithinGraceWindow } = transition;

	// 幂等守卫：如果原本已是 done，再次设置为 done 不产生任何连击累加
	if (fromStatus === 'done' || toStatus !== 'done') {
		return {
			currentStreak,
			maxStreak,
			completedCycles,
			consecutiveMisses,
			shouldIncrement: false
		};
	}

	// 首次进入 done：
	if (isWithinGraceWindow) {
		// 在正常时间窗口或宽限期内完成
		const nextStreak = currentStreak + 1;
		return {
			currentStreak: nextStreak,
			maxStreak: Math.max(maxStreak, nextStreak),
			completedCycles: completedCycles + 1,
			consecutiveMisses: 0, // 成功履约，清零连续缺席计数
			shouldIncrement: true
		};
	}

	// 超过宽限期后补打卡：允许补齐历史为 done，但无法继承之前连胜，重新自 1 累计
	return {
		currentStreak: 1,
		maxStreak,
		completedCycles: completedCycles + 1,
		consecutiveMisses: 0,
		shouldIncrement: false
	};
}

/**
 * 评估周期错过对连续打卡与休眠状态的影响
 */
export function evaluateMissedCycles(input: MissedCyclesInput): MissedCyclesResult {
	const { currentStreak, consecutiveMisses, missedPeriodsCount } = input;

	if (missedPeriodsCount <= 0) {
		return {
			currentStreak,
			consecutiveMisses,
			isDormant: false
		};
	}

	// 存在错过的周期：打卡断开，重置为 0
	const newConsecutiveMisses = consecutiveMisses + missedPeriodsCount;
	const isDormant =
		newConsecutiveMisses >= RECURRENCE_CONFIG.CONSECUTIVE_MISSES_DORMANT_THRESHOLD;

	return {
		currentStreak: 0,
		consecutiveMisses: newConsecutiveMisses,
		isDormant,
		newStatus: isDormant ? 'dormant' : undefined
	};
}
