/**
 * 纯原生高性能全屏五彩纸屑物理引擎 (Lightweight Canvas Confetti Engine)
 * 零第三方依赖、物理重力阻尼与自旋、支持点击源坐标发射与连续礼炮庆祝
 */

import { browser } from '$app/environment';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	width: number;
	height: number;
	color: string;
	shape: 'rect' | 'circle' | 'star' | 'ribbon';
	rotation: number;
	vRotation: number;
	rotationY: number;
	vRotationY: number;
	opacity: number;
	life: number;
	maxLife: number;
}

// 高饱和度、高对比度、鲜艳夺目的派对庆祝配色 (Vibrant Party Palette)
const VIBRANT_COLORS = [
	'#FF135A', // 鲜亮红
	'#FF5E00', // 荧光橙
	'#FFD700', // 灿金黄
	'#00E676', // 电光绿
	'#00D2FF', // 霓虹青蓝
	'#7C4DFF', // 幻彩电紫
	'#FF007F', // 耀眼洋红
	'#FF3366', // 烈焰粉
	'#00F5D4', // 绿松石青
	'#FEE440'  // 柠檬金
];

class ConfettiEngine {
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private particles: Particle[] = [];
	private animationFrameId: number | null = null;
	private width = 0;
	private height = 0;

	constructor() {
		if (browser) {
			this.initCanvas();
		}
	}

	private initCanvas() {
		if (this.canvas) return;

		this.canvas = document.createElement('canvas');
		this.canvas.id = 'confetti-canvas';
		this.canvas.style.position = 'fixed';
		this.canvas.style.inset = '0';
		this.canvas.style.width = '100vw';
		this.canvas.style.height = '100vh';
		this.canvas.style.pointerEvents = 'none';
		this.canvas.style.zIndex = '9999';

		document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext('2d');

		this.handleResize = this.handleResize.bind(this);
		this.handleResize();
		window.addEventListener('resize', this.handleResize);
	}

	private handleResize() {
		if (!this.canvas) return;
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.canvas.width = this.width * window.devicePixelRatio;
		this.canvas.height = this.height * window.devicePixelRatio;
		if (this.ctx) {
			this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		}
	}

	/**
	 * 单次高饱和度、璀璨全屏纸屑喷发
	 * @param originX 发射源 X 坐标（默认屏幕中心）
	 * @param originY 发射源 Y 坐标（默认屏幕中心）
	 * @param count 粒子数量
	 */
	burst(originX?: number, originY?: number, count = 65) {
		if (!browser) return;
		this.initCanvas();

		const x = originX ?? this.width / 2;
		const y = originY ?? this.height / 2;

		const shapes: ('rect' | 'circle' | 'star' | 'ribbon')[] = ['rect', 'rect', 'circle', 'star', 'ribbon'];

		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 6 + Math.random() * 11;
			const maxLife = 75 + Math.random() * 45;
			const shape = shapes[Math.floor(Math.random() * shapes.length)];
			const baseSize = 6 + Math.random() * 6;

			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
				vy: Math.sin(angle) * speed - 4 - Math.random() * 5, // 强劲向上喷发冲量
				width: shape === 'ribbon' ? baseSize * 0.5 : baseSize,
				height: shape === 'ribbon' ? baseSize * 2.2 : baseSize * 0.9,
				color: VIBRANT_COLORS[Math.floor(Math.random() * VIBRANT_COLORS.length)],
				shape,
				rotation: Math.random() * 360,
				vRotation: (Math.random() - 0.5) * 14,
				rotationY: Math.random() * 360,
				vRotationY: (Math.random() - 0.5) * 16,
				opacity: 1,
				life: 0,
				maxLife
			});
		}

		if (!this.animationFrameId) {
			this.loop();
		}
	}

	/**
	 * 连续三次全屏超级大撒花庆祝（当天的待办全部搞定时触发）
	 */
	tripleCelebration() {
		if (!browser) return;
		this.initCanvas();

		// 第 1 波：左侧强劲礼炮向右上喷发
		this.burstCannon(this.width * 0.12, this.height * 0.88, Math.PI / 4, 85);

		// 第 2 波（280ms 后）：右侧强劲礼炮向左上喷发
		setTimeout(() => {
			this.burstCannon(this.width * 0.88, this.height * 0.88, (Math.PI * 3) / 4, 85);
		}, 280);

		// 第 3 波（560ms 后）：全屏中央 360 度超级绚烂大爆发
		setTimeout(() => {
			this.burst(this.width / 2, this.height * 0.4, 130);
		}, 560);
	}

	private burstCannon(x: number, y: number, centerAngle: number, count = 75) {
		const shapes: ('rect' | 'circle' | 'star' | 'ribbon')[] = ['rect', 'rect', 'circle', 'star', 'ribbon'];

		for (let i = 0; i < count; i++) {
			const angle = centerAngle + (Math.random() - 0.5) * (Math.PI / 3);
			const speed = 12 + Math.random() * 15;
			const maxLife = 90 + Math.random() * 45;
			const shape = shapes[Math.floor(Math.random() * shapes.length)];
			const baseSize = 7 + Math.random() * 7;

			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: -Math.abs(Math.sin(angle) * speed),
				width: shape === 'ribbon' ? baseSize * 0.5 : baseSize,
				height: shape === 'ribbon' ? baseSize * 2.2 : baseSize * 0.9,
				color: VIBRANT_COLORS[Math.floor(Math.random() * VIBRANT_COLORS.length)],
				shape,
				rotation: Math.random() * 360,
				vRotation: (Math.random() - 0.5) * 18,
				rotationY: Math.random() * 360,
				vRotationY: (Math.random() - 0.5) * 20,
				opacity: 1,
				life: 0,
				maxLife
			});
		}

		if (!this.animationFrameId) {
			this.loop();
		}
	}

	private loop = () => {
		if (!this.ctx) return;

		this.ctx.clearRect(0, 0, this.width, this.height);

		const gravity = 0.24;
		const drag = 0.988;

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life += 1;

			// 物理速度衰减与重力下落
			p.vx *= drag;
			p.vy = p.vy * drag + gravity;
			p.x += p.vx;
			p.y += p.vy;
			p.rotation += p.vRotation;
			p.rotationY += p.vRotationY;

			// 衰减与自然淡出
			const progress = p.life / p.maxLife;
			p.opacity = Math.max(0, 1 - Math.pow(progress, 1.5));

			// 绘制炫彩粒子
			this.drawParticle(p);

			// 移除离开视口或寿命结束的粒子
			if (p.life >= p.maxLife || p.y > this.height + 60) {
				this.particles.splice(i, 1);
			}
		}

		if (this.particles.length > 0) {
			this.animationFrameId = requestAnimationFrame(this.loop);
		} else {
			this.animationFrameId = null;
			this.ctx.clearRect(0, 0, this.width, this.height);
		}
	};

	private drawParticle(p: Particle) {
		if (!this.ctx || p.opacity <= 0) return;

		this.ctx.save();
		this.ctx.translate(p.x, p.y);
		this.ctx.rotate((p.rotation * Math.PI) / 180);

		// 逼真的 3D 空间翻转缩放 (Flip 3D)
		const scaleY = Math.cos((p.rotationY * Math.PI) / 180);
		this.ctx.scale(1, scaleY);

		this.ctx.globalAlpha = p.opacity;
		this.ctx.fillStyle = p.color;

		if (p.shape === 'circle') {
			this.ctx.beginPath();
			this.ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
			this.ctx.fill();
		} else if (p.shape === 'star') {
			this.drawStar(this.ctx, 0, 0, 5, p.width * 0.8, p.width * 0.4);
		} else if (p.shape === 'ribbon') {
			// 长条飘带，略带微圆角
			this.ctx.beginPath();
			this.ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 2);
			this.ctx.fill();
		} else {
			// 经典节日方形纸屑
			this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
		}

		this.ctx.restore();
	}

	private drawStar(
		ctx: CanvasRenderingContext2D,
		cx: number,
		cy: number,
		spikes: number,
		outerRadius: number,
		innerRadius: number
	) {
		let rot = (Math.PI / 2) * 3;
		let x = cx;
		let y = cy;
		const step = Math.PI / spikes;

		ctx.beginPath();
		ctx.moveTo(cx, cy - outerRadius);
		for (let i = 0; i < spikes; i++) {
			x = cx + Math.cos(rot) * outerRadius;
			y = cy + Math.sin(rot) * outerRadius;
			ctx.lineTo(x, y);
			rot += step;

			x = cx + Math.cos(rot) * innerRadius;
			y = cy + Math.sin(rot) * innerRadius;
			ctx.lineTo(x, y);
			rot += step;
		}
		ctx.lineTo(cx, cy - outerRadius);
		ctx.closePath();
		ctx.fill();
	}
}

export const confetti = new ConfettiEngine();
