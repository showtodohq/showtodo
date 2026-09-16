<script lang="ts">
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';

	interface Props {
		backHref?: string;
		backLabel?: string;
	}

	let {
		backHref = '/',
		backLabel = 'Back to Feed'
	}: Props = $props();
</script>

<BreadcrumbNav {backHref} {backLabel} />
