<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showText?: boolean;
		class?: string;
		textClass?: string;
		title?: string;
	}

	let {
		size = 'md',
		showText = false,
		class: className = '',
		textClass = 'hidden sm:inline',
		title = 'ShowTodo'
	}: Props = $props();

	const containerSizeMap = {
		sm: 'w-5 h-5 rounded-md',
		md: 'w-7 h-7 rounded-lg',
		lg: 'w-9 h-9 rounded-xl'
	};

	const iconSizeMap = {
		sm: 'w-3.5 h-3.5',
		md: 'w-4.5 h-4.5',
		lg: 'w-6 h-6'
	};
</script>

<div class="inline-flex items-center gap-2.5 {className}">
	<div
		class="flex items-center justify-center bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs shrink-0 {containerSizeMap[size]}"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 32 32"
			class="showtodo-brand-logo {iconSizeMap[size]}"
			role="img"
			aria-label={title}
		>
			{#if title}
				<title>{title}</title>
			{/if}
			<!-- Broadcast & Progress Ring (Open 270-degree Arc) -->
			<path
				d="M 16 7.5 A 8.5 8.5 0 1 0 22.5 20.5"
				fill="none"
				stroke="currentColor"
				stroke-opacity="0.4"
				stroke-width="2.2"
				stroke-linecap="round"
			/>
			<!-- Focus Beacon Dot -->
			<circle cx="16" cy="7.5" r="1.3" class="fill-sky-400" />
			<!-- Decisive Completed Checkmark -->
			<path
				d="M 11 16.5 L 14.5 20 L 22.5 11.5"
				fill="none"
				stroke="currentColor"
				stroke-width="2.6"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>

	{#if showText}
		<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 {textClass}">
			ShowTodo
		</span>
	{/if}
</div>
