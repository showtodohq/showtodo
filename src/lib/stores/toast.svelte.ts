export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
}

class ToastStore {
	toasts = $state<ToastItem[]>([]);

	show(message: string, type: ToastType = 'info', duration = 3500) {
		const id = Math.random().toString(36).substring(2, 9);
		const item: ToastItem = { id, type, message, duration };
		this.toasts = [...this.toasts, item];

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}
		return id;
	}

	success(message: string, duration = 3500) {
		return this.show(message, 'success', duration);
	}

	error(message: string, duration = 4500) {
		return this.show(message, 'error', duration);
	}

	info(message: string, duration = 3500) {
		return this.show(message, 'info', duration);
	}

	warning(message: string, duration = 4000) {
		return this.show(message, 'warning', duration);
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();
