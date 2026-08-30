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
	size: number;
	color: string;
	shape: 'rect' | 'circle' | 'star';
	rotation: number;
	vRotation: number;
	scale: number;
	opacity: number;
	life: number;
	maxLife: number;
}

const PASTEL_COLORS = [
	'#FF6B6B', // 珊瑚红
	'#4ECDC4', // 薄荷绿
	'#45B7D1', // 天空蓝
	'#FFA07A', // 浅橙
	'#98D8C8', // 浅绿
	'#F7DC6F', // 柠檬黄
	'#BB8FCE', // 浅紫
	'#F1948A', // 蜜桃粉
	'#85C1E9', // 冰蓝
	'#F8C471'  // 暖黄
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
	 * 单次轻盈全屏纸屑喷发
	 * @param originX 发射源 X 坐标（默认屏幕中心）
	 * @param originY 发射源 Y 坐标（默认屏幕中心）
	 * @param count 粒子数量
	 */
	burst(originX?: number, originY?: number, count = 45) {
		if (!browser) return;
		this.initCanvas();

		const x = originX ?? this.width / 2;
		const y = originY ?? this.height / 2;

		const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];

		for (let i = 0; i < count; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 4 + Math.random() * 9;
			const maxLife = 70 + Math.random() * 40;

			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
				vy: Math.sin(angle) * speed - 3 - Math.random() * 4, // 初始向上喷射冲量
				size: 5 + Math.random() * 5,
				color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
				shape: shapes[Math.floor(Math.random() * shapes.length)],
				rotation: Math.random() * 360,
				vRotation: (Math.random() - 0.5) * 12,
				scale: 1,
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

		// 第 1 波：左侧礼炮向右上喷发
		this.burstCannon(this.width * 0.15, this.height * 0.85, Math.PI / 4, 70);

		// 第 2 波（300ms 后）：右侧礼炮向左上喷发
		setTimeout(() => {
			this.burstCannon(this.width * 0.85, this.height * 0.85, (Math.PI * 3) / 4, 70);
		}, 300);

		// 第 3 波（600ms 后）：全屏中央 360 度超级大喷发
		setTimeout(() => {
			this.burst(this.width / 2, this.height * 0.45, 100);
		}, 600);
	}

	private burstCannon(x: number, y: number, centerAngle: number, count = 60) {
		const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];

		for (let i = 0; i < count; i++) {
			const angle = centerAngle + (Math.random() - 0.5) * (Math.PI / 3);
			const speed = 10 + Math.random() * 12;
			const maxLife = 85 + Math.random() * 45;

			this.particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: -Math.abs(Math.sin(angle) * speed),
				size: 6 + Math.random() * 6,
				color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
				shape: shapes[Math.floor(Math.random() * shapes.length)],
				rotation: Math.random() * 360,
				vRotation: (Math.random() - 0.5) * 16,
				scale: 1,
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

		const gravity = 0.22;
		const drag = 0.985;

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life += 1;

			// 物理更新
			p.vx *= drag;
			p.vy = p.vy * drag + gravity;
			p.x += p.vx;
			p.y += p.vy;
			p.rotation += p.vRotation;

			// 淡出计算
			const progress = p.life / p.maxLife;
			p.opacity = Math.max(0, 1 - progress);

			// 绘制粒子
			this.drawParticle(p);

			// 移除衰减完成的粒子
			if (p.life >= p.maxLife || p.y > this.height + 50) {
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
		this.ctx.globalAlpha = p.opacity;
		this.ctx.fillStyle = p.color;

		if (p.shape === 'circle') {
			this.ctx.beginPath();
			this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
			this.ctx.fill();
		} else if (p.shape === 'star') {
			this.drawStar(this.ctx, 0, 0, 5, p.size / 2, p.size / 4);
		} else {
			// 3D 翻转效果
			const scaleY = Math.cos((p.rotation * Math.PI) / 90);
			this.ctx.scale(1, scaleY);
			this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
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
