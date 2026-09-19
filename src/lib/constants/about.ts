/**
 * Single source of truth for "What's ShowTodo" (/about) page.
 * Contains entity definitions, SEO metadata, JSON-LD generator,
 * core value pillars, experience highlights, and structured FAQs.
 */

export interface AboutMeta {
	title: string;
	description: string;
	canonical: string;
	keywords: string[];
}

export interface ValuePillar {
	id: string;
	title: string;
	tagline: string;
	description: string;
	icon: string;
	points: string[];
}

export interface ExperienceHighlight {
	id: string;
	title: string;
	subtitle: string;
	badge?: string;
	description: string;
	icon: string;
}

export interface FAQItem {
	id: string;
	question: string;
	shortAnswer: string;
	details: string[];
}

export interface AboutContent {
	meta: AboutMeta;
	hero: {
		badge: string;
		headline: string;
		subheadline: string;
		primaryCta: { label: string; href: string };
		secondaryCta: { label: string; href: string };
	};
	entityDefinition: {
		summary: string;
		statement: string;
	};
	pillars: ValuePillar[];
	highlights: ExperienceHighlight[];
	faqs: FAQItem[];
	bottomCta: {
		headline: string;
		subheadline: string;
		actionLabel: string;
		actionHref: string;
	};
}

export const ABOUT_CONTENT: AboutContent = {
	meta: {
		title: "What's ShowTodo · The Public Todo Network",
		description:
			'ShowTodo is an open public task network for creators, learners, and builders. Share your daily journey, gain social accountability, learn from others workflows, and build in public.',
		canonical: 'https://showtodo.com/about',
		keywords: [
			'ShowTodo',
			'public todo list',
			'build in public',
			'social accountability',
			'habit tracking',
			'developer daily goals',
			'open task tracker',
			'learn from workflows'
		]
	},
	hero: {
		badge: 'The Public Todo Network',
		headline: 'Show what you do. Journey together in public.',
		subheadline:
			'A clean, quiet space where goals are shared in the open. Overcome procrastination through social accountability, exchange quiet encouragement, and learn how productive people worldwide structure their days.',
		primaryCta: {
			label: 'Explore Public Feed',
			href: '/'
		},
		secondaryCta: {
			label: 'View Live Stats',
			href: '/stats'
		}
	},
	entityDefinition: {
		summary: 'Canonical Product Definition',
		statement:
			'ShowTodo is a public-first task and accountability network for individuals, creators, and learners. It transforms isolated personal todo lists into an open stream of daily progress, fostering quiet companionship, anti-procrastination accountability, and genuine workflow discovery.'
	},
	pillars: [
		{
			id: 'companionship',
			title: 'Companionship & Shared Presence',
			tagline: 'You are never building in isolation.',
			description:
				'Working toward difficult goals can feel solitary. On ShowTodo, you see real people around the globe making progress at the exact same moment. Sensing that quiet collective effort transforms solitary struggles into a shared journey.',
			icon: 'lucide:users',
			points: [
				'Real-time pulse of creators, engineers, and students taking action',
				'A calm co-working presence without noisy feeds or algorithmic distraction',
				'Sense of community belonging grounded purely in action, not talk'
			]
		},
		{
			id: 'accountability',
			title: 'Social Accountability',
			tagline: 'Public commitment beats private procrastination.',
			description:
				'Private todo items are effortlessly postponed or deleted without a trace. When you post an intention to the public feed, you create an intrinsic psychological contract. Stating what you will accomplish today makes follow-through second nature.',
			icon: 'lucide:shield-check',
			points: [
				'Positive social friction that discourages premature quitting',
				'Transparent daily records that hold you kindly accountable to your ambitions',
				'Simple satisfaction of marking tasks completed in full view of the world'
			]
		},
		{
			id: 'encouragement',
			title: 'Quiet Encouragement',
			tagline: 'Meaningful resonance without social toxicity.',
			description:
				'No toxic comment sections, no rage-bait algorithms, and no vanity metrics. ShowTodo provides lightweight emoji reactions that let peers signal respect, cheer, and solidarity when you cross off a meaningful task.',
			icon: 'lucide:sparkles',
			points: [
				'Distraction-free reactions (🔥, 💪, 👏, ❤️, 🚀, 👀) celebrating real effort',
				'Delightful completion micro-interactions that spark joy with every checkbox',
				'A positive, healthy feedback loop built around tangible execution'
			]
		},
		{
			id: 'learn-workflows',
			title: "Learn from Others' Workflows",
			tagline: 'Discover how high performers organize their day.',
			description:
				'Ever wonder how prolific developers, researchers, or writers break down monolithic goals? ShowTodo gives you a front-row seat to authentic daily task breakdowns, time management habits, and prioritization strategies from builders everywhere.',
			icon: 'lucide:compass',
			points: [
				'Inspect how real projects are decomposed into achievable daily chunks',
				'Adopt effective rituals, study routines, and focus techniques from peers',
				'Gain practical inspiration when you are feeling stuck or disorganized'
			]
		},
		{
			id: 'build-in-public',
			title: 'Build in Public',
			tagline: 'A living, timestamped proof of your craftsmanship.',
			description:
				'Whether shipping an indie SaaS, writing a book, or completing a 100-day coding marathon, ShowTodo preserves your cumulative momentum. Your public feed and activity heatmap reflect genuine dedication that speaks louder than any resume.',
			icon: 'lucide:flame',
			points: [
				'Automatic chronological ledger of shipped features and milestones',
				'Visual activity heatmap showing consistent streaks and dedication',
				'Build lasting credibility with potential collaborators, clients, and audiences'
			]
		}
	],
	highlights: [
		{
			id: 'instant-capture',
			title: 'Zero-Friction Capture',
			subtitle: 'Press C anytime to post',
			badge: 'Shortcut First',
			description:
				'Capture thoughts and intentions at the speed of thought. Hit the C key from anywhere on the platform to instantly pop the composer.',
			icon: 'lucide:zap'
		},
		{
			id: 'open-access',
			title: 'Completely Open by Design',
			subtitle: 'No paywalls or gatekeeping',
			badge: 'Open Web',
			description:
				'Anyone can read the public feeds and learn from shared todos without an account. When ready to post, all it takes is an email—no tedious passwords required.',
			icon: 'lucide:globe'
		},
		{
			id: 'shared-goals',
			title: 'Shared Goals & Companionship',
			subtitle: 'Journey together on the same path',
			badge: 'Trending Goals',
			description:
				'When different people pursue similar intentions, ShowTodo automatically clusters them into shared goals. Discover peers with matching ambitions and join the journey with one click.',
			icon: 'lucide:sparkles'
		},
		{
			id: 'visual-heatmaps',
			title: 'Streak & Heatmap Analytics',
			subtitle: 'Quantify your consistency',
			badge: 'Data Insights',
			description:
				'Track your daily cadence on a GitHub-style activity grid. Watch your cumulative momentum compound week over week.',
			icon: 'lucide:bar-chart-2'
		}
	],
	faqs: [
		{
			id: 'is-todo-public',
			question: 'Are all todos on ShowTodo public by default?',
			shortAnswer:
				'Yes. The fundamental philosophy of ShowTodo is public visibility for accountability and inspiration.',
			details: [
				'Every todo posted to ShowTodo is accessible to anyone on the web.',
				'However, you have the option to make the optional "Note" (the detailed description or personal thoughts) private if you wish to keep specific context confidential.',
				'If you need a strictly private, confidential task manager for sensitive trade secrets, traditional private todo tools are recommended.'
			]
		},
		{
			id: 'why-not-private-notes',
			question: 'Why should I share my daily tasks publicly instead of using a private app?',
			shortAnswer:
				'Public sharing harnesses the proven psychological power of social accountability and shared human presence.',
			details: [
				'Private lists often become forgotten graveyards of postponed intentions.',
				'Sharing your intentions openly creates a gentle internal drive to follow through.',
				'Additionally, your public progress inspires others and allows you to receive silent encouragement from peers walking a similar path.'
			]
		},
		{
			id: 'do-i-need-account',
			question: 'Do I need to create an account or set a password to use ShowTodo?',
			shortAnswer:
				'No passwords required. ShowTodo utilizes a frictionless email-identity model.',
			details: [
				'You can browse, filter, and learn from all public todos without doing anything.',
				'When posting your first todo, simply enter your email address. An identity is automatically established, and your future todos will link to your personal handle and public profile.'
			]
		},
		{
			id: 'how-to-learn-from-others',
			question: 'How do people use ShowTodo to learn from other creators?',
			shortAnswer:
				'By observing real task breakdown patterns, time allocations, and consistency habits across diverse domains.',
			details: [
				'You can filter feeds by categories (Dev, Study, Fitness, Finance, Life, or Other) or search trending goals.',
				'You will see firsthand how seasoned developers schedule their daily goals, how students organize study intervals, and how creators maintain streaks over months.'
			]
		},
		{
			id: 'can-i-edit-or-delete-todos',
			question: 'Can I edit or delete my todos after posting?',
			shortAnswer:
				'Yes, absolutely. As the author, you retain complete ownership and control over your tasks.',
			details: [
				'You can edit your todo content and optional note directly from the todo detail view at any time.',
				'You can transition statuses, post progress check-in notes along your activity timeline, or adjust start and due dates.',
				'You can permanently delete your todo at any moment with a single confirmation.'
			]
		}
	],
	bottomCta: {
		headline: 'Ready to share your momentum?',
		subheadline:
			'Join creators, learners, and builders turning intentions into action every single day.',
		actionLabel: 'Explore the Public Feed',
		actionHref: '/'
	}
};

/**
 * Generates Schema.org JSON-LD structured data for SEO and GEO ingestion.
 */
export function generateAboutJsonLd(content: AboutContent = ABOUT_CONTENT): string {
	const softwareApplication = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'ShowTodo',
		url: 'https://showtodo.com',
		applicationCategory: 'ProductivityApplication',
		operatingSystem: 'Any (Web-based)',
		description: content.entityDefinition.statement,
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		featureList: [
			'Public todo sharing and feed',
			'Social accountability',
			'Quiet emoji reactions',
			'Workflow discovery and study',
			'Activity streak heatmap',
			'Frictionless keyboard shortcuts'
		]
	};

	const organization = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'ShowTodo',
		url: 'https://showtodo.com',
		logo: 'https://showtodo.com/favicon.svg',
		description: content.meta.description
	};

	const faqPage = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: content.faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: `${faq.shortAnswer} ${faq.details.join(' ')}`
			}
		}))
	};

	return JSON.stringify([softwareApplication, organization, faqPage]);
}
