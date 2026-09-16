<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<Card class="max-w-md w-full p-8 text-center">
		<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-mono text-lg font-bold">
			{page.status || '500'}
		</div>

		<h1 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
			{page.error?.message || 'Error occurred or page not found'}
		</h1>

		<p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
			Sorry, the current request could not be completed. Please try refreshing or return to home.
		</p>

		<div class="mt-6 flex justify-center gap-3">
			<Button variant="outline" size="sm" onclick={() => history.back()}>
				Go Back
			</Button>
			<a href="/">
				<Button variant="primary" size="sm">
					Back to Home
				</Button>
			</a>
		</div>
	</Card>
</div>
