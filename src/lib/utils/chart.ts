export interface DonutSlice<T> {
	data: T;
	startAngle: number; // 弧度
	endAngle: number; // 弧度
	midAngle: number; // 扇区角平分线弧度
	dx: number; // 径向外弹 X 偏移像素
	dy: number; // 径向外弹 Y 偏移像素
	pathData: string; // SVG path 'd' 指令
	percentage: number; // 0 ~ 100
}

export interface DonutOptions {
	cx?: number;
	cy?: number;
	outerRadius?: number;
	innerRadius?: number;
	padAngle?: number; // 扇区之间的间隙弧度
	popDistance?: number; // 活跃悬浮时的径向外扩平移像素，默认 6
}

/**
 * 构建环形扇区的 SVG Path 'd' 属性字符串
 */
export function createArcPath(
	cx: number,
	cy: number,
	outerRadius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number
): string {
	const angleDiff = endAngle - startAngle;

	// 处理近似或等于整圆情况 (SVG 弧线在起终点重合时无法绘制，需拆分成两个半圆)
	if (angleDiff >= Math.PI * 2 - 0.001) {
		const midAngle = startAngle + Math.PI;
		const path1 = createArcPath(cx, cy, outerRadius, innerRadius, startAngle, midAngle);
		const path2 = createArcPath(cx, cy, outerRadius, innerRadius, midAngle, endAngle);
		// 直接组合两个连续半圆或使用更平滑的闭合环
		return `${path1} ${path2}`;
	}

	const cosStart = Math.cos(startAngle);
	const sinStart = Math.sin(startAngle);
	const cosEnd = Math.cos(endAngle);
	const sinEnd = Math.sin(endAngle);

	const xOuterStart = cx + outerRadius * cosStart;
	const yOuterStart = cy + outerRadius * sinStart;
	const xOuterEnd = cx + outerRadius * cosEnd;
	const yOuterEnd = cy + outerRadius * sinEnd;

	const xInnerEnd = cx + innerRadius * cosEnd;
	const yInnerEnd = cy + innerRadius * sinEnd;
	const xInnerStart = cx + innerRadius * cosStart;
	const yInnerStart = cy + innerRadius * sinStart;

	const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

	return [
		`M ${xOuterStart.toFixed(3)} ${yOuterStart.toFixed(3)}`,
		`A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${xOuterEnd.toFixed(3)} ${yOuterEnd.toFixed(3)}`,
		`L ${xInnerEnd.toFixed(3)} ${yInnerEnd.toFixed(3)}`,
		`A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${xInnerStart.toFixed(3)} ${yInnerStart.toFixed(3)}`,
		'Z'
	].join(' ');
}

/**
 * 纯函数：根据数据集计算环形图各扇区的几何参数与 SVG 路径
 */
export function calculateDonutSlices<T extends { total: number }>(
	items: T[],
	options: DonutOptions = {}
): DonutSlice<T>[] {
	if (!items || items.length === 0) {
		return [];
	}

	const {
		cx = 100,
		cy = 100,
		outerRadius = 80,
		innerRadius = 55,
		padAngle = 0.03,
		popDistance = 6
	} = options;

	const totalSum = items.reduce((sum, item) => sum + (item.total > 0 ? item.total : 0), 0);
	if (totalSum === 0) {
		return [];
	}

	// 初始从 12 点钟方向 (-π/2) 开始顺时针旋转
	let currentAngle = -Math.PI / 2;
	const isSingle = items.filter((it) => it.total > 0).length === 1;

	return items.map((item) => {
		const val = item.total > 0 ? item.total : 0;
		const fraction = val / totalSum;
		const percentage = Number((fraction * 100).toFixed(1));
		const angleSpan = fraction * Math.PI * 2;

		const rawStart = currentAngle;
		const rawEnd = currentAngle + angleSpan;
		currentAngle = rawEnd;

		const midAngle = (rawStart + rawEnd) / 2;
		const dx = Number((Math.cos(midAngle) * popDistance).toFixed(3));
		const dy = Number((Math.sin(midAngle) * popDistance).toFixed(3));

		if (val === 0) {
			return {
				data: item,
				startAngle: rawStart,
				endAngle: rawEnd,
				midAngle,
				dx,
				dy,
				pathData: '',
				percentage: 0
			};
		}

		// 单项占满整圆时不需要间隙，多项时在起止两端各留 padAngle/2
		const effectivePad = isSingle ? 0 : Math.min(padAngle, angleSpan * 0.4);
		const startAngle = rawStart + effectivePad / 2;
		const endAngle = rawEnd - effectivePad / 2;

		const pathData = createArcPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle);

		return {
			data: item,
			startAngle,
			endAngle,
			midAngle,
			dx,
			dy,
			pathData,
			percentage
		};
	});
}
