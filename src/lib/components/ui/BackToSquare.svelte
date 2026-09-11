<script lang="ts">
	import BreadcrumbNav from '$lib/components/ui/BreadcrumbNav.svelte';

	interface Props {
		backHref?: string;
		backLabel?: string;
	}

	let {
		backHref = '/',
		backLabel = '返回动态流'
	}: Props = $props();
</script>

<BreadcrumbNav {backHref} {backLabel} />
