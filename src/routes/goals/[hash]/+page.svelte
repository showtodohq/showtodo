<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	$effect(() => {
		const hash = page.params.hash;
		const search = page.url.search;
		goto(`/trending/${hash}${search}`, { replaceState: true });
	});
</script>
