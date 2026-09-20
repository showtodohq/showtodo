<script lang="ts">
	import type { SeoMetadata } from '$lib/constants/seo';
	import { SITE_NAME } from '$lib/constants/seo';

	interface Props {
		seo: SeoMetadata;
	}

	let { seo }: Props = $props();

	const jsonLdString = $derived(
		seo.jsonLd ? JSON.stringify(seo.jsonLd) : null
	);
</script>

<svelte:head>
	<!-- Standard Meta Tags -->
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	{#if seo.keywords && seo.keywords.length > 0}
		<meta name="keywords" content={seo.keywords.join(', ')} />
	{/if}
	<link rel="canonical" href={seo.canonical} />

	<!-- OpenGraph Social Sharing -->
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content={seo.ogType || 'website'} />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={seo.canonical} />
	{#if seo.ogImage}
		<meta property="og:image" content={seo.ogImage} />
	{/if}
	{#if seo.ogType === 'article'}
		{#if seo.publishedTime}
			<meta property="article:published_time" content={seo.publishedTime} />
		{/if}
		{#if seo.modifiedTime}
			<meta property="article:modified_time" content={seo.modifiedTime} />
		{/if}
	{/if}

	<!-- Twitter Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	{#if seo.ogImage}
		<meta name="twitter:image" content={seo.ogImage} />
	{/if}

	<!-- Schema.org JSON-LD Structured Data -->
	{#if jsonLdString}
		{@html `<script type="application/ld+json">${jsonLdString}</script>`}
	{/if}
</svelte:head>
