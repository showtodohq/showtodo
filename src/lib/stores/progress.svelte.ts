/**
 * 全局顶部极细加载条状态管理器 (Progress Store)
 * 采用 Svelte 5 原生响应式状态，支持多任务并发引用计数与平滑缓动
 */

class ProgressStore {
	private _visible = $state(false);
	private _progress = $state(0);
	private _activeCount = 0;
	private _timer: ReturnType<typeof setInterval> | null = null;
	private _fadeTimer: ReturnType<typeof setTimeout> | null = null;

	get visible() {
		return this._visible;
	}

	get progress() {
		return this._progress;
	}

	/**
	 * 启动或增加在途加载任务
	 */
	start() {
		if (typeof window === 'undefined') return;

		this._activeCount++;
		if (this._activeCount === 1) {
			if (this._fadeTimer) {
				clearTimeout(this._fadeTimer);
				this._fadeTimer = null;
			}
			if (this._timer) {
				clearInterval(this._timer);
				this._timer = null;
			}

			this._progress = 10;
			this._visible = true;

			// 平滑模拟推进：从 10% 快速到 30%，随后缓进至 85% 左右待命
			this._timer = setInterval(() => {
				if (this._progress < 60) {
					this._progress += 5 + Math.random() * 5;
				} else if (this._progress < 85) {
					this._progress += 1 + Math.random() * 2;
				}
			}, 150);
		}
	}

	/**
	 * 结束一个在途加载任务
	 */
	done() {
		if (typeof window === 'undefined') return;

		this._activeCount = Math.max(0, this._activeCount - 1);

		// 所有在途任务均完成时，冲刺至 100% 并渐隐
		if (this._activeCount === 0) {
			if (this._timer) {
				clearInterval(this._timer);
				this._timer = null;
			}

			this._progress = 100;

			this._fadeTimer = setTimeout(() => {
				this._visible = false;
				setTimeout(() => {
					if (!this._visible) {
						this._progress = 0;
					}
				}, 300);
			}, 250);
		}
	}

	/**
	 * 强制重置
	 */
	reset() {
		if (this._timer) clearInterval(this._timer);
		if (this._fadeTimer) clearTimeout(this._fadeTimer);
		this._activeCount = 0;
		this._visible = false;
		this._progress = 0;
	}
}

export const progressStore = new ProgressStore();
