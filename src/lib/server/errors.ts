export type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'FORBIDDEN'
	| 'INVALID_STATUS_TRANSITION'
	| 'DUPLICATE_REACTION'
	| 'INTERNAL_ERROR';

const STATUS_MAP: Record<ErrorCode, number> = {
	VALIDATION_ERROR: 400,
	NOT_FOUND: 404,
	FORBIDDEN: 403,
	INVALID_STATUS_TRANSITION: 400,
	DUPLICATE_REACTION: 409,
	INTERNAL_ERROR: 500
};

export class AppError extends Error {
	readonly code: ErrorCode;
	readonly statusCode: number;

	constructor(code: ErrorCode, message: string) {
		super(message);
		this.code = code;
		this.statusCode = STATUS_MAP[code];
	}

	toResponse(): Response {
		return new Response(JSON.stringify({ error: { code: this.code, message: this.message } }), {
			status: this.statusCode,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

export function handleError(e: unknown): Response {
	if (e instanceof AppError) return e.toResponse();
	console.error('Unhandled error:', e);
	return new AppError('INTERNAL_ERROR', 'Internal server error').toResponse();
}
