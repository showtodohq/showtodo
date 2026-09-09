import { describe, it, expect } from 'vitest';
import { calculateDonutSlices, createArcPath } from '../chart';

describe('chart utils (TDD)', () => {
	it('creates valid SVG donut arc path data', () => {
		// 0 to pi/2 (first quadrant)
		const path = createArcPath(100, 100, 80, 50, 0, Math.PI / 2);
		expect(path).toContain('M');
		expect(path).toContain('A');
		expect(path).toContain('Z');
	});

	it('handles empty items gracefully', () => {
		const slices = calculateDonutSlices([]);
		expect(slices).toEqual([]);
	});

	it('handles single item (100% full circle)', () => {
		const items = [{ id: 'study', total: 100 }];
		const slices = calculateDonutSlices(items, { cx: 100, cy: 100, outerRadius: 80, innerRadius: 50 });

		expect(slices).toHaveLength(1);
		expect(slices[0].percentage).toBe(100);
		expect(slices[0].pathData).toBeDefined();
	});

	it('calculates proportional slice angles for multiple items summing to 2*PI', () => {
		const items = [
			{ category: 'study', total: 50 },
			{ category: 'fitness', total: 30 },
			{ category: 'dev', total: 20 }
		];

		const slices = calculateDonutSlices(items, {
			cx: 100,
			cy: 100,
			outerRadius: 80,
			innerRadius: 50,
			padAngle: 0
		});

		expect(slices).toHaveLength(3);
		expect(slices[0].percentage).toBe(50);
		expect(slices[1].percentage).toBe(30);
		expect(slices[2].percentage).toBe(20);

		// Angles should cover 2*PI radians
		const totalAngleSpan = slices.reduce((acc, s) => acc + (s.endAngle - s.startAngle), 0);
		expect(totalAngleSpan).toBeCloseTo(Math.PI * 2, 5);
	});

	it('preserves small gap between slices when padAngle is specified', () => {
		const items = [
			{ category: 'study', total: 50 },
			{ category: 'fitness', total: 50 }
		];

		const padAngle = 0.05;
		const slices = calculateDonutSlices(items, {
			cx: 100,
			cy: 100,
			outerRadius: 80,
			innerRadius: 50,
			padAngle
		});

		expect(slices).toHaveLength(2);
		// With padAngle, slice angle span should be (PI - padAngle)
		expect(slices[0].endAngle - slices[0].startAngle).toBeCloseTo(Math.PI - padAngle, 5);
	});

	it('computes radial pop displacement vector dx and dy correctly', () => {
		// Single item at top (-PI/2)
		const items = [
			{ category: 'top', total: 50 },
			{ category: 'bottom', total: 50 }
		];
		const slices = calculateDonutSlices(items, { popDistance: 6 });

		expect(slices[0].midAngle).toBeCloseTo(0, 2); // -PI/2 + PI/2 = 0 (points right)
		expect(slices[0].dx).toBeCloseTo(6, 1);
		expect(slices[0].dy).toBeCloseTo(0, 1);
	});
});
