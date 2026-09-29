/**
 * ShowTodo Chrome Extension Constants
 * Single source of truth aligned with src/lib/constants/categories.ts
 */

export const CATEGORIES = [
	{ id: 'study', name: 'Study', color: '#3B82F6' },
	{ id: 'fitness', name: 'Fitness', color: '#22C55E' },
	{ id: 'finance', name: 'Finance', color: '#F59E0B' },
	{ id: 'dev', name: 'Dev', color: '#8B5CF6' },
	{ id: 'life', name: 'Life', color: '#EC4899' },
	{ id: 'other', name: 'Other', color: '#6B7280' }
];

export const DEFAULT_API_BASE = 'http://127.0.0.1:3003';
export const PRODUCTION_API_BASE = 'https://www.showtodo.com';
export const STORAGE_KEY_API_BASE = 'showtodo_api_base';
export const STORAGE_KEY_USER = 'showtodo_cached_user';
