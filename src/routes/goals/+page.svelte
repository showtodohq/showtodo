<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	$effect(() => {
		const search = page.url.search;
		goto(`/trending${search}`, { replaceState: true });
	});
</script>
