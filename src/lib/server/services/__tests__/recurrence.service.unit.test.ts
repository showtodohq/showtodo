import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as recurrenceService from '../recurrence.service';
import { AppError } from '../../errors';

describe('recurrenceService.updateRule', () => {
	const validRuleId = 'a0000000-0000-0000-0000-000000000001';
	const validAuthorId = 'b0000000-0000-0000-0000-000000000002';
	const otherAuthorId = 'c0000000-0000-0000-0000-000000000003';

	const existingRule: any = {
		id: validRuleId,
		authorId: validAuthorId,
		content: 'Read documentation',
		topicHash: 'topic-hash-1',
		note: 'Initial note',
		isNotePublic: true,
		category: 'study',
		frequency: 'daily',
		interval: 1,
		daysOfWeek: null,
		dayOfMonth: null,
		cronExpression: null,
		status: 'active',
		currentStreak: 3,
		maxStreak: 5,
		totalCycles: 3,
		completedCycles: 3,
		consecutiveMisses: 0,
		endCondition: 'never',
		endAfterOccurrences: null,
		endDate: null,
		nextRunAt: new Date('2026-10-02T00:00:00.000Z'),
		lastRunAt: new Date('2026-10-01T00:00:00.000Z'),
		timezone: 'Asia/Shanghai'
	};

	let mockDb: any;

	beforeEach(() => {
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([existingRule]),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([{ ...existingRule, frequency: 'weekly', daysOfWeek: [1, 3, 5] }])
		};
	});

	it('throws NOT_FOUND when rule does not exist', async () => {
		mockDb.limit.mockResolvedValueOnce([]);

		await expect(
			recurrenceService.updateRule(mockDb, validRuleId, validAuthorId, { frequency: 'weekly' })
		).rejects.toThrow('Recurring rule not found');
	});

	it('throws FORBIDDEN when user does not own the recurring rule', async () => {
		await expect(
			recurrenceService.updateRule(mockDb, validRuleId, otherAuthorId, { frequency: 'weekly' })
		).rejects.toThrow('You do not own this recurring rule');
	});

	it('throws VALIDATION_ERROR when frequency is invalid', async () => {
		await expect(
			recurrenceService.updateRule(mockDb, validRuleId, validAuthorId, { frequency: 'yearly' as any })
		).rejects.toThrow(AppError);
	});

	it('updates rule with weekly frequency and daysOfWeek successfully', async () => {
		const updated = await recurrenceService.updateRule(mockDb, validRuleId, validAuthorId, {
			frequency: 'weekly',
			daysOfWeek: [1, 3, 5],
			endCondition: 'by_count',
			endAfterOccurrences: 20
		});

		expect(mockDb.update).toHaveBeenCalled();
		expect(mockDb.set).toHaveBeenCalledWith(
			expect.objectContaining({
				frequency: 'weekly',
				daysOfWeek: [1, 3, 5],
				endCondition: 'by_count',
				endAfterOccurrences: 20
			})
		);
		expect(updated).toBeDefined();
	});

	it('recalculates nextRunAt when schedule properties are modified', async () => {
		await recurrenceService.updateRule(mockDb, validRuleId, validAuthorId, {
			frequency: 'weekly',
			daysOfWeek: [1, 3, 5]
		});

		expect(mockDb.set).toHaveBeenCalledWith(
			expect.objectContaining({
				nextRunAt: expect.any(Date)
			})
		);
	});
});
