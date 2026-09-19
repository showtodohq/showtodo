<script lang="ts">
	import { ABOUT_CONTENT, generateAboutJsonLd } from '$lib/constants/about';
	import { createTodoModalStore } from '$lib/stores/create-todo-modal.svelte';
	import Icon from '@iconify/svelte';

	let openFaqIds = $state<Set<string>>(new Set([ABOUT_CONTENT.faqs[0].id]));

	function toggleFaq(id: string) {
		const next = new Set(openFaqIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		openFaqIds = next;
	}

	const jsonLd = $derived(generateAboutJsonLd(ABOUT_CONTENT));
</script>

<svelte:head>
	<title>{ABOUT_CONTENT.meta.title}</title>
	<meta name="description" content={ABOUT_CONTENT.meta.description} />
	<meta name="keywords" content={ABOUT_CONTENT.meta.keywords.join(', ')} />
	<link rel="canonical" href={ABOUT_CONTENT.meta.canonical} />

	<!-- OpenGraph -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={ABOUT_CONTENT.meta.canonical} />
	<meta property="og:title" content={ABOUT_CONTENT.meta.title} />
	<meta property="og:description" content={ABOUT_CONTENT.meta.description} />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ABOUT_CONTENT.meta.title} />
	<meta name="twitter:description" content={ABOUT_CONTENT.meta.description} />

	<!-- Schema.org Structured Data for SEO & GEO -->
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div class="w-full space-y-16 sm:space-y-24 py-4 sm:py-8">
	<!-- 1. Hero Section (Borderless, High-Impact, Linear Typography) -->
	<section class="space-y-6 sm:space-y-8">
		<!-- Micro Badge -->
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium tracking-wide">
			<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
			{ABOUT_CONTENT.hero.badge}
		</div>

		<!-- Main Headline -->
		<h1 class="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.12]">
			{ABOUT_CONTENT.hero.headline}
		</h1>

		<!-- Subheadline -->
		<p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
			{ABOUT_CONTENT.hero.subheadline}
		</p>

		<!-- Action Row -->
		<div class="flex flex-wrap items-center gap-3 pt-2">
			<a
				href={ABOUT_CONTENT.hero.primaryCta.href}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
			>
				<span>{ABOUT_CONTENT.hero.primaryCta.label}</span>
				<Icon icon="lucide:arrow-right" class="h-4 w-4" />
			</a>

			<button
				type="button"
				onclick={() => createTodoModalStore.show()}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-200/70 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
			>
				<Icon icon="lucide:plus" class="h-4 w-4" />
				<span>Post a Todo</span>
				<kbd class="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 leading-none">C</kbd>
			</button>

			<a
				href={ABOUT_CONTENT.hero.secondaryCta.href}
				class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 text-sm font-medium transition-colors"
			>
				<span>{ABOUT_CONTENT.hero.secondaryCta.label}</span>
			</a>
		</div>
	</section>

	<!-- 2. GEO Canonical Entity Definition Block (Borderless, High Information Density) -->
	<section aria-labelledby="definition-heading" class="rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 p-6 sm:p-8 space-y-3">
		<div class="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
			<Icon icon="lucide:sparkles" class="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
			<span id="definition-heading">{ABOUT_CONTENT.entityDefinition.summary}</span>
		</div>
		<p class="text-base sm:text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
			{ABOUT_CONTENT.entityDefinition.statement}
		</p>
	</section>

	<!-- 3. The 5 Core Pillars (Borderless Tile Layout with Generous Whitespace) -->
	<section aria-labelledby="pillars-heading" class="space-y-8">
		<div class="space-y-2">
			<h2 id="pillars-heading" class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				The Core Philosophy
			</h2>
			<p class="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
				Why sharing your daily progress openly transforms motivation, focus, and personal consistency.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
			{#each ABOUT_CONTENT.pillars as pillar, index}
				<article
					class="group rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/70 transition-all p-6 sm:p-8 space-y-4 {index === 0 ? 'md:col-span-2' : ''}"
				>
					<div class="flex items-center justify-between">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs">
							<Icon icon={pillar.icon} class="h-5 w-5" />
						</div>
						<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500">0{index + 1}</span>
					</div>

					<div class="space-y-1.5">
						<h3 class="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
							{pillar.title}
						</h3>
						<p class="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
							{pillar.tagline}
						</p>
					</div>

					<p class="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
						{pillar.description}
					</p>

					<ul class="pt-2 space-y-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
						{#each pillar.points as point}
							<li class="flex items-start gap-2.5">
								<Icon icon="lucide:check" class="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
								<span>{point}</span>
							</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<!-- 4. Product Experience Highlights (Borderless Feature Matrix) -->
	<section aria-labelledby="experience-heading" class="space-y-8">
		<div class="space-y-2">
			<h2 id="experience-heading" class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				Designed for Calm Focus
			</h2>
			<p class="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
				A quiet, lightweight web experience without bloat, advertisements, or friction.
			</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
			{#each ABOUT_CONTENT.highlights as highlight}
				<div class="rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30 p-6 space-y-3">
					<div class="flex items-center justify-between">
						<Icon icon={highlight.icon} class="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
						{#if highlight.badge}
							<span class="px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
								{highlight.badge}
							</span>
						{/if}
					</div>
					<div>
						<h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
							{highlight.title}
						</h4>
						<p class="text-xs text-zinc-500 dark:text-zinc-400">
							{highlight.subtitle}
						</p>
					</div>
					<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
						{highlight.description}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- 5. Progressive-Disclosure FAQ (Borderless Accordion, Schema-Matched) -->
	<section aria-labelledby="faq-heading" class="space-y-8">
		<div class="space-y-2">
			<h2 id="faq-heading" class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
				Frequently Asked Questions
			</h2>
			<p class="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl">
				Everything you need to know about transparency, privacy, and how ShowTodo works.
			</p>
		</div>

		<div class="space-y-3">
			{#each ABOUT_CONTENT.faqs as faq}
				{@const isOpen = openFaqIds.has(faq.id)}
				<div class="rounded-2xl bg-zinc-50/60 dark:bg-zinc-900/40 transition-colors overflow-hidden">
					<button
						type="button"
						onclick={() => toggleFaq(faq.id)}
						aria-expanded={isOpen}
						class="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60"
					>
						<span class="text-[15px] sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
							{faq.question}
						</span>
						<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}">
							<Icon icon="lucide:chevron-down" class="h-4 w-4" />
						</div>
					</button>

					{#if isOpen}
						<div class="px-5 sm:px-6 pb-6 pt-1 space-y-3 text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100/60 dark:border-zinc-800/40">
							<p class="font-medium text-zinc-800 dark:text-zinc-200">
								{faq.shortAnswer}
							</p>
							{#if faq.details.length > 0}
								<ul class="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
									{#each faq.details as detail}
										<li>{detail}</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- 6. Bottom Call to Action (Borderless, Centered Focus) -->
	<section class="rounded-3xl bg-zinc-100/70 dark:bg-zinc-900/60 p-8 sm:p-12 text-center space-y-6">
		<div class="max-w-xl mx-auto space-y-3">
			<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
				{ABOUT_CONTENT.bottomCta.headline}
			</h2>
			<p class="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
				{ABOUT_CONTENT.bottomCta.subheadline}
			</p>
		</div>

		<div class="flex flex-wrap items-center justify-center gap-3">
			<a
				href={ABOUT_CONTENT.bottomCta.actionHref}
				class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-xs"
			>
				<span>{ABOUT_CONTENT.bottomCta.actionLabel}</span>
				<Icon icon="lucide:arrow-right" class="h-4 w-4" />
			</a>
			<button
				type="button"
				onclick={() => createTodoModalStore.show()}
				class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
			>
				<Icon icon="lucide:plus" class="h-4 w-4" />
				<span>Post Your First Todo</span>
			</button>
		</div>
	</section>
</div>
