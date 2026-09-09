import { api } from '$lib/services/api';
import type { GlobalStatsData } from '$lib/types/stats';

class StatsStore {
	stats = $state<GlobalStatsData | null>(null);
	loading = $state(false);
	loaded = $state(false);
	isRevalidating = $state(false);

	async load(force = false, heatmapDays?: number) {
		if (this.loading || this.isRevalidating) {
			return;
		}

		if (!this.loaded || force) {
			this.loading = true;
		} else {
			this.isRevalidating = true;
		}

		try {
			const res = await api.getGlobalStats(heatmapDays);
			this.stats = res;
			this.loaded = true;
		} catch (err) {
			console.error('Failed to load global site stats:', err);
		} finally {
			this.loading = false;
			this.isRevalidating = false;
		}
	}
}

export const statsStore = new StatsStore();
