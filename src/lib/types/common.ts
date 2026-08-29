export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg';

export type ComponentVariant =
	| 'primary'
	| 'secondary'
	| 'outline'
	| 'ghost'
	| 'danger'
	| 'success'
	| 'warning';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ApiResponse<T = unknown> {
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

export interface PaginationQuery {
	limit?: number;
	offset?: number;
	cursor?: string;
}

export interface PaginationResult<T> {
	items: T[];
	total?: number;
	hasMore: boolean;
	nextCursor?: string | null;
}
