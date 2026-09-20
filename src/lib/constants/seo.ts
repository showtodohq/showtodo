/**
 * Centralized SEO Configuration & Metadata Domain (SSOT)
 * Contains canonical domain constants, target keyword pools,
 * dynamic meta generators for routes, and Schema.org JSON-LD builders.
 */

import { getCategoryConfig } from './categories';

export const SITE_BASE_URL = 'https://showtodo.com';
export const SITE_NAME = 'ShowTodo';
export const SITE_DEFAULT_IMAGE = `${SITE_BASE_URL}/og-image.png`;

/**
 * Standard crawler and agent discoverability document paths
 */
export const CRAWLER_DOCS = {
	ROBOTS: '/robots.txt',
	LLMS: '/llms.txt',
	LLMS_FULL: '/llms-full.txt',
	SITEMAP: '/sitemap.xml',
	WELL_KNOWN_LLMS: '/.well-known/llms.txt'
} as const;

/**
 * Core Target SEO Keywords categorized by intent
 */
export const SEO_KEYWORDS = {
	BRAND: ['ShowTodo', 'show todo', 'show me todo', 'Show your todo', 'share todo'],
	CORE_CONCEPT: [
		'Public todo list',
		'daily checklist',
		'person daily tasks',
		'what are people doing',
		'What are you going to do',
		'Public Intent / Public Action',
		'see someone\'s plans'
	],
	COMMUNITY_AND_GROWTH: [
		'build in public',
		'accountability partner',
		'public goals',
		'public plans',
		'social accountability'
	],
	AUDIENCE_SPECIFIC: [
		'founder todo list',
		'developer todo list',
		'indie hacker daily tasks',
		'open habit tracker'
	]
} as const;

export const ALL_TARGET_KEYWORDS = [
	...SEO_KEYWORDS.BRAND,
	...SEO_KEYWORDS.CORE_CONCEPT,
	...SEO_KEYWORDS.COMMUNITY_AND_GROWTH,
	...SEO_KEYWORDS.AUDIENCE_SPECIFIC
];

export interface SeoMetadata {
	title: string;
	description: string;
	keywords?: string[];
	canonical: string;
	ogType?: 'website' | 'article' | 'profile';
	ogImage?: string;
	publishedTime?: string;
	modifiedTime?: string;
	jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Category-specific meta map to target specialized searches (e.g. Developer Todo List)
 */
const CATEGORY_SEO_MAP: Record<string, { titleSuffix: string; description: string; extraKeywords: string[] }> = {
	dev: {
		titleSuffix: 'Developer Todo List & Coding Goals',
		description: 'Explore developer todo lists, coding checklists, and tech projects built in public. See what software engineers and builders are shipping today.',
		extraKeywords: ['developer todo list', 'coding goals', 'tech build in public', 'developer checklist']
	},
	study: {
		titleSuffix: 'Study Goals & Learning Checklist',
		description: 'Discover public study checklists, student learning goals, and daily academic tasks. Stay accountable with fellow learners worldwide.',
		extraKeywords: ['study checklist', 'learning goals', 'student daily tasks', 'study accountability']
	},
	fitness: {
		titleSuffix: 'Fitness Goals & Workout Checklist',
		description: 'Track and share daily workout checklists, fitness routines, and healthy habits in the open.',
		extraKeywords: ['fitness goals', 'workout checklist', 'daily health habits', 'habit partner']
	},
	finance: {
		titleSuffix: 'Finance Plans & Money Goals',
		description: 'Public finance plans, budgeting tasks, and financial freedom milestones tracked with social accountability.',
		extraKeywords: ['finance plans', 'money goals', 'financial checklist', 'personal finance tasks']
	},
	life: {
		titleSuffix: 'Personal Daily Tasks & Life Goals',
		description: 'Organize your daily checklist, personal daily tasks, and lifestyle goals. Build quiet consistency with an accountability community.',
		extraKeywords: ['person daily tasks', 'daily checklist', 'life goals', 'daily routine']
	}
};

/**
 * Generates SEO metadata for the Home / Feed page.
 * Seamlessly adapts when filtering by a specific category.
 */
export function getHomeSeo(category?: string | null): SeoMetadata {
	const catInfo = category ? CATEGORY_SEO_MAP[category] : undefined;
	const categoryObj = category ? getCategoryConfig(category) : undefined;

	if (catInfo && categoryObj) {
		return {
			title: `${categoryObj.name} Todos · ${catInfo.titleSuffix} · ${SITE_NAME}`,
			description: catInfo.description,
			keywords: [
				...catInfo.extraKeywords,
				'public todo list',
				'share todo',
				'build in public',
				SITE_NAME
			],
			canonical: `${SITE_BASE_URL}/?category=${category}`,
			ogType: 'website',
			ogImage: SITE_DEFAULT_IMAGE,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'CollectionPage',
				name: `${categoryObj.name} Public Todo List`,
				description: catInfo.description,
				url: `${SITE_BASE_URL}/?category=${category}`
			}
		};
	}

	return {
		title: `${SITE_NAME} · Public Todo List & Daily Checklist for Builders`,
		description:
			'Share your public todo list, see what people are doing, and build in public. A frictionless daily checklist and accountability partner platform for founders, developers, and learners.',
		keywords: [
			'Public todo list',
			'daily checklist',
			'what are people doing',
			'build in public',
			'founder todo list',
			'developer todo list',
			'accountability partner',
			'share todo',
			'show me todo',
			SITE_NAME
		],
		canonical: SITE_BASE_URL,
		ogType: 'website',
		ogImage: SITE_DEFAULT_IMAGE,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: SITE_NAME,
			url: SITE_BASE_URL,
			applicationCategory: 'ProductivityApplication',
			operatingSystem: 'Any (Web-based)',
			description:
				'A public-first todo list and accountability platform to share todos, see founders\' plans, and build in public.',
			offers: {
				'@type': 'Offer',
				price: '0',
				priceCurrency: 'USD'
			}
		}
	};
}

/**
 * Generates SEO metadata for a user profile showcase page (/@handle).
 * Focuses on personal identity, daily productivity footprint, and public track record.
 */
export function getUserProfileSeo(user?: {
	nickname?: string | null;
	handle?: string | null;
	avatar?: string | null;
}): SeoMetadata {
	if (!user || !user.handle) {
		return {
			title: `User Profile · Public Showcase · ${SITE_NAME}`,
			description: 'See public profile, activity footprint, and completed milestones on ShowTodo.',
			keywords: ['public profile', 'person daily tasks', 'see someone\'s plans', SITE_NAME],
			canonical: `${SITE_BASE_URL}/`,
			ogType: 'profile',
			ogImage: SITE_DEFAULT_IMAGE
		};
	}

	const displayName = user.nickname || `@${user.handle}`;
	const pageTitle = `${displayName} (@${user.handle}) · Public Profile & Activity Footprint · ${SITE_NAME}`;
	const pageDescription = `Explore ${displayName}'s public profile on ShowTodo. View their yearly activity heatmap, completed milestones, and see what they are building in the open.`;
	const canonicalUrl = `${SITE_BASE_URL}/@${user.handle}`;

	return {
		title: pageTitle,
		description: pageDescription,
		keywords: [
			`${displayName} profile`,
			'see someone\'s plans',
			'person daily tasks',
			'founder profile',
			'developer public profile',
			'activity footprint',
			'build in public',
			SITE_NAME
		],
		canonical: canonicalUrl,
		ogType: 'profile',
		ogImage: user.avatar || SITE_DEFAULT_IMAGE,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'ProfilePage',
			mainEntity: {
				'@type': 'Person',
				name: displayName,
				alternateName: user.handle,
				url: canonicalUrl,
				image: user.avatar || undefined,
				description: `${displayName}'s public profile and activity footprint on ShowTodo`
			}
		}
	};
}

/**
 * Generates SEO metadata for a user's todo workbench page (/@handle/todolist).
 * Focuses on the actionable checklist, kanban board, calendar schedules, and task execution.
 */
export function getUserWorkbenchSeo(user?: {
	nickname?: string | null;
	handle?: string | null;
	avatar?: string | null;
}): SeoMetadata {
	if (!user || !user.handle) {
		return {
			title: `Todo List & Task Workbench · ${SITE_NAME}`,
			description: 'Manage and explore public todo lists, kanban boards, and daily checklists on ShowTodo.',
			keywords: ['public todo list', 'daily checklist', 'developer todo list', 'founder todo list', SITE_NAME],
			canonical: `${SITE_BASE_URL}/`,
			ogType: 'website',
			ogImage: SITE_DEFAULT_IMAGE
		};
	}

	const displayName = user.nickname || `@${user.handle}`;
	const pageTitle = `${displayName}'s Public Todo List & Daily Checklist (Stream, Kanban, Calendar) · ${SITE_NAME}`;
	const pageDescription = `Explore ${displayName}'s full public todo list, multi-view kanban board, and calendar schedule on ShowTodo. Track active tasks, daily checklists, and build-in-public progress.`;
	const canonicalUrl = `${SITE_BASE_URL}/@${user.handle}/todolist`;

	return {
		title: pageTitle,
		description: pageDescription,
		keywords: [
			`${displayName} todo list`,
			`${displayName} daily checklist`,
			'public todo list',
			'daily checklist',
			'developer todo list',
			'founder todo list',
			'personal task board',
			'show todo',
			'show me todo',
			'Show your todo',
			SITE_NAME
		],
		canonical: canonicalUrl,
		ogType: 'website',
		ogImage: user.avatar || SITE_DEFAULT_IMAGE,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: `${displayName}'s Public Todo List Workbench`,
			description: pageDescription,
			url: canonicalUrl
		}
	};
}

/**
 * Generates SEO metadata for the Trending / Public Goals page (/trending).
 */
export function getTrendingSeo(query?: string | null): SeoMetadata {
	const querySuffix = query?.trim() ? ` for "${query.trim()}"` : '';

	return {
		title: `Trending Public Goals & What People Are Doing${querySuffix} · ${SITE_NAME}`,
		description:
			'Explore trending public goals, collaborative habits, and see what people are doing right now. Connect with accountability partners building in public worldwide.',
		keywords: [
			'what are people doing',
			'public goals',
			'public plans',
			'accountability partner',
			'build in public',
			'Public Intent / Public Action',
			SITE_NAME
		],
		canonical: `${SITE_BASE_URL}/trending`,
		ogType: 'website',
		ogImage: SITE_DEFAULT_IMAGE,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: 'Trending Public Goals & Todos',
			description: 'Discover trending public tasks and multi-person goals on ShowTodo.',
			url: `${SITE_BASE_URL}/trending`
		}
	};
}

export interface TodoDetailSeoInput {
	id?: string;
	shortId?: string;
	content?: string;
	author?: {
		nickname?: string | null;
		handle?: string | null;
		avatar?: string | null;
	} | null;
	createdAt?: string | Date | null;
	updatedAt?: string | Date | null;
}

/**
 * Format a Date object or date string into an ISO 8601 string.
 */
function toIsoDateString(dateVal?: string | Date | null): string | undefined {
	if (!dateVal) return undefined;
	if (dateVal instanceof Date) {
		return !isNaN(dateVal.getTime()) ? dateVal.toISOString() : undefined;
	}
	const d = new Date(dateVal);
	return !isNaN(d.getTime()) ? d.toISOString() : undefined;
}

/**
 * Generates SEO metadata for an individual Todo detail page (/t/[id]).
 */
export function getTodoDetailSeo(todo?: TodoDetailSeoInput | null): SeoMetadata {
	if (!todo || !todo.content) {
		return {
			title: `Todo Details · Public Task · ${SITE_NAME}`,
			description: 'View public task details, completion timeline, and cheer for the creator on ShowTodo.',
			keywords: ['public todo list', 'daily checklist', 'show todo', SITE_NAME],
			canonical: `${SITE_BASE_URL}/`,
			ogType: 'article',
			ogImage: SITE_DEFAULT_IMAGE
		};
	}

	const snippet = todo.content.length > 50 ? `${todo.content.slice(0, 47)}...` : todo.content;
	const authorName = todo.author?.nickname || (todo.author?.handle ? `@${todo.author.handle}` : 'A creator');
	const taskUrl = `${SITE_BASE_URL}/t/${todo.shortId || todo.id}`;
	const authorUrl = todo.author?.handle
		? `${SITE_BASE_URL}/@${todo.author.handle}`
		: `${SITE_BASE_URL}/`;

	const datePublished = toIsoDateString(todo.createdAt) || toIsoDateString(todo.updatedAt) || new Date().toISOString();
	const dateModified = toIsoDateString(todo.updatedAt) || datePublished;

	return {
		title: `"${snippet}" by ${authorName} · Public Todo · ${SITE_NAME}`,
		description: `"${todo.content}" - Tracked publicly by ${authorName} on ShowTodo. Witness daily progress, cheer them on, and build in public together.`,
		keywords: [
			'public todo list',
			'show todo',
			'person daily tasks',
			'accountability partner',
			'see someone\'s plans',
			SITE_NAME
		],
		canonical: taskUrl,
		ogType: 'article',
		ogImage: SITE_DEFAULT_IMAGE,
		publishedTime: datePublished,
		modifiedTime: dateModified,
		jsonLd: {
			'@context': 'https://schema.org',
			'@type': 'SocialMediaPosting',
			headline: snippet,
			articleBody: todo.content,
			url: taskUrl,
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': taskUrl
			},
			datePublished,
			dateModified,
			author: {
				'@type': 'Person',
				name: authorName,
				url: authorUrl,
				...(todo.author?.avatar ? { image: todo.author.avatar } : {})
			},
			publisher: {
				'@type': 'Organization',
				name: SITE_NAME,
				url: SITE_BASE_URL,
				logo: {
					'@type': 'ImageObject',
					url: `${SITE_BASE_URL}/favicon.svg`
				}
			}
		}
	};
}
