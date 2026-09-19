<script lang="ts">
	import { PRIVACY_POLICY } from '$lib/constants/privacy';
	import Icon from '@iconify/svelte';

	let activeSectionId = $state<string>(PRIVACY_POLICY.sections[0].id);

	function scrollToSection(id: string) {
		activeSectionId = id;
		const el = document.getElementById(id);
		if (el) {
			const offset = 80; // Account for sticky header
			const bodyRect = document.body.getBoundingClientRect().top;
			const elementRect = el.getBoundingClientRect().top;
			const elementPosition = elementRect - bodyRect;
			const offsetPosition = elementPosition - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}
</script>

<svelte:head>
	<title>{PRIVACY_POLICY.meta.title}</title>
	<meta name="description" content={PRIVACY_POLICY.meta.description} />
	<link rel="canonical" href="https://showtodo.com/privacy" />
	<meta property="og:title" content={PRIVACY_POLICY.meta.title} />
	<meta property="og:description" content={PRIVACY_POLICY.meta.description} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="w-full space-y-12 sm:space-y-16 py-4 sm:py-8">
	<!-- 1. Header (Borderless, Refined Typography) -->
	<header class="space-y-4 max-w-3xl">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium tracking-wide">
			<Icon icon="lucide:shield" class="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
			<span>Legal & Data Protection</span>
		</div>

		<h1 class="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
			Privacy Policy
		</h1>

		<p class="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
			ShowTodo is rooted in public transparency and social accountability, but your personal security, account integrity, and data ownership are fiercely protected.
		</p>

		<div class="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 dark:text-zinc-500 pt-1">
			<span>Effective: {PRIVACY_POLICY.meta.effectiveDate}</span>
			<span>·</span>
			<span>Updated: {PRIVACY_POLICY.meta.lastUpdated}</span>
			<span>·</span>
			<span>Version {PRIVACY_POLICY.meta.version}</span>
		</div>
	</header>

	<!-- 2. High-Signal Summary Highlights (Borderless 3-Tile Row) -->
	<section aria-labelledby="highlights-heading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<h2 id="highlights-heading" class="sr-only">Key Privacy Highlights</h2>
		{#each PRIVACY_POLICY.quickHighlights as highlight}
			<div class="rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 p-5 sm:p-6 space-y-2.5">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs">
					<Icon icon={highlight.icon} class="h-4 w-4" />
				</div>
				<h3 class="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
					{highlight.title}
				</h3>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
					{highlight.description}
				</p>
			</div>
		{/each}
	</section>

	<!-- 3. Dual-Column Legal Content (Desktop Sticky TOC + Clean Borderless Prose) -->
	<div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 sm:gap-12 items-start">
		<!-- Desktop Sticky Table of Contents -->
		<aside class="hidden lg:block sticky top-20 space-y-3">
			<span class="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
				Table of Contents
			</span>
			<nav class="space-y-1">
				{#each PRIVACY_POLICY.sections as section}
					<button
						type="button"
						onclick={() => scrollToSection(section.id)}
						class="w-full text-left text-xs py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer {activeSectionId === section.id
							? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 font-semibold'
							: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}"
					>
						{section.title}
					</button>
				{/each}
			</nav>

			<div class="pt-4 border-t border-zinc-100/60 dark:border-zinc-800/40">
				<p class="text-[11px] text-zinc-400 dark:text-zinc-500 leading-normal">
					Questions? Reach us at
					<a href="mailto:{PRIVACY_POLICY.meta.contactEmail}" class="text-zinc-700 dark:text-zinc-300 underline underline-offset-2">
						{PRIVACY_POLICY.meta.contactEmail}
					</a>
				</p>
			</div>
		</aside>

		<!-- Main Legal Sections -->
		<main class="space-y-12 sm:space-y-16">
			{#each PRIVACY_POLICY.sections as section}
				<article id={section.id} class="space-y-4 scroll-mt-24">
					<!-- Section Title -->
					<h2 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
						{section.title}
					</h2>

					<!-- High Signal-to-Noise Plain English Takeaway -->
					<div class="rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 px-4 py-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
						<Icon icon="lucide:info" class="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400 mt-0.5" />
						<div>
							<span class="font-semibold text-zinc-900 dark:text-zinc-100">Plain English Takeaway:</span>{' '}
							{section.plainTakeaway}
						</div>
					</div>

					<!-- Section Prose Paragraphs -->
					<div class="space-y-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
						{#each section.content as para}
							<p>{para}</p>
						{/each}
					</div>

					<!-- Structured List Items -->
					{#if section.listItems && section.listItems.length > 0}
						<ul class="space-y-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400 pl-2">
							{#each section.listItems as item}
								<li class="flex items-start gap-2.5">
									<span class="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 shrink-0"></span>
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					{/if}

					<!-- Special Callouts -->
					{#if section.callout}
						<div class="rounded-xl bg-zinc-50 dark:bg-zinc-900/40 p-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
							<Icon icon="lucide:check-circle" class="h-4 w-4 text-zinc-700 dark:text-zinc-300 mt-0.5 shrink-0" />
							<div>
								<span class="font-semibold text-zinc-800 dark:text-zinc-200">Important Note:</span>{' '}
								{section.callout.text}
							</div>
						</div>
					{/if}
				</article>
			{/each}

			<!-- Contact Footer Box -->
			<div class="rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 p-6 sm:p-8 space-y-3">
				<h3 class="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
					Contact Our Privacy Officer
				</h3>
				<p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
					If you wish to request a data export, delete your personal records, or ask legal questions, please email
					<a href="mailto:{PRIVACY_POLICY.meta.contactEmail}" class="font-medium text-zinc-900 dark:text-zinc-100 underline underline-offset-2">
						{PRIVACY_POLICY.meta.contactEmail}
					</a>. We are committed to responding to all formal requests within 48 business hours.
				</p>
			</div>
		</main>
	</div>
</div>
