import { describe, it, expect } from 'vitest';
import TodoCheckbox from '../todo/TodoCheckbox.svelte';
import { render } from 'svelte/server';
import { TODO_STATUSES } from '$lib/constants/status';

describe('TodoCheckbox status popover restoration', () => {
	it('does not render status popup by default when menu is closed', () => {
		const rendered = render(TodoCheckbox, {
			props: {
				status: 'pending',
				isMine: true
			}
		});

		// Popover container should not be present
		expect(rendered.body).not.toContain('rounded-xl bg-white dark:bg-zinc-900');
	});

	it('renders restored 4-state popover card with labels and arrow when open', () => {
		const rendered = render(TodoCheckbox, {
			props: {
				status: 'in_progress',
				isMine: true,
				defaultOpen: true
			}
		});

		// 1. Popover container card styles & Native Popover attributes
		expect(rendered.body).toContain('rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800');
		expect(rendered.body).toContain('popover="auto"');
		expect(rendered.body).toContain('data-placement="top-end"');

		// 2. Contains all shortActionLabels
		for (const st of TODO_STATUSES) {
			expect(rendered.body).toContain(st.shortActionLabel);
		}

		// 3. Active status item has highlighted styling
		expect(rendered.body).toContain('bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs');

		// 4. Pointer arrow at the bottom
		expect(rendered.body).toContain('absolute -bottom-1 right-2.5 w-2 h-2 rotate-45 bg-white dark:bg-zinc-900');
	});
});
