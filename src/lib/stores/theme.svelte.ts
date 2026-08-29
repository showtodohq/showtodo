import { browser } from '$app/environment';
import type { ThemeMode } from '$lib/types/common';

const THEME_STORAGE_KEY = 'app_theme_mode';

class ThemeStore {
	mode = $state<ThemeMode>('system');
	isDark = $state(false);

	constructor() {
		if (browser) {
			this.init();
		}
	}

	private init() {
		const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
		if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
			this.mode = saved;
		}

		this.applyTheme();

		// 监听操作系统色彩模式变化
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (this.mode === 'system') {
				this.applyTheme();
			}
		});
	}

	setMode(mode: ThemeMode) {
		this.mode = mode;
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, mode);
			this.applyTheme();
		}
	}

	toggle() {
		if (this.isDark) {
			this.setMode('light');
		} else {
			this.setMode('dark');
		}
	}

	private applyTheme() {
		if (!browser) return;

		let dark = false;
		if (this.mode === 'system') {
			dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		} else {
			dark = this.mode === 'dark';
		}

		this.isDark = dark;
		if (dark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
}

export const theme = new ThemeStore();
