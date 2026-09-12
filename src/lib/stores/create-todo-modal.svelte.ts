import type { CategoryId } from '$lib/types/todo';

export interface OpenCreateTodoOptions {
	category?: CategoryId | null;
	content?: string;
	startDate?: string | null;
	dueDate?: string | null;
}

class CreateTodoModalStore {
	#open = $state(false);
	#initialCategory = $state<CategoryId | null>(null);
	#initialContent = $state('');
	#initialStartDate = $state<string | null>(null);
	#initialDueDate = $state<string | null>(null);

	get open(): boolean {
		return this.#open;
	}

	set open(val: boolean) {
		this.#open = val;
		if (!val) {
			this.reset();
		}
	}

	get initialCategory(): CategoryId | null {
		return this.#initialCategory;
	}

	get initialContent(): string {
		return this.#initialContent;
	}

	get initialStartDate(): string | null {
		return this.#initialStartDate;
	}

	get initialDueDate(): string | null {
		return this.#initialDueDate;
	}

	show(options?: OpenCreateTodoOptions) {
		this.#initialCategory = options?.category ?? null;
		this.#initialContent = options?.content ?? '';
		this.#initialStartDate = options?.startDate ?? null;
		this.#initialDueDate = options?.dueDate ?? null;
		this.#open = true;
	}

	close() {
		this.#open = false;
		this.reset();
	}

	private reset() {
		this.#initialCategory = null;
		this.#initialContent = '';
		this.#initialStartDate = null;
		this.#initialDueDate = null;
	}
}

export const createTodoModalStore = new CreateTodoModalStore();
