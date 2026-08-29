import { toast } from '$lib/stores/toast.svelte';

export class HttpError extends Error {
	code: string;
	status: number;
	details?: unknown;

	constructor(code: string, message: string, status: number, details?: unknown) {
		super(message);
		this.name = 'HttpError';
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

export interface RequestConfig extends Omit<RequestInit, 'body'> {
	body?: unknown;
	params?: Record<string, string | number | boolean | undefined | null>;
	customFetch?: typeof fetch;
	silent?: boolean; // 若为 true，不自动触发全局 Toast 错误提醒
}

const ERROR_MESSAGE_MAP: Record<string, string> = {
	VALIDATION_ERROR: '输入内容格式有误，请检查后重试',
	INVALID_STATUS_TRANSITION: '当前状态不可进行该流转变更',
	FORBIDDEN: '无权操作：只有创建者可以修改此内容',
	NOT_FOUND: '请求的资源或用户不存在',
	DUPLICATE_REACTION: '您已经对该条目表态过了',
	INTERNAL_ERROR: '服务器繁忙，请稍后再试'
};

/**
 * 统一 HTTP 请求核心函数
 */
export async function request<T = unknown>(
	url: string,
	config: RequestConfig = {}
): Promise<T> {
	const {
		body,
		params,
		customFetch,
		silent = false,
		headers: customHeaders,
		...restOptions
	} = config;

	let finalUrl = url;
	if (params) {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null && value !== '') {
				searchParams.set(key, String(value));
			}
		}
		const qs = searchParams.toString();
		if (qs) {
			finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
		}
	}

	const fetcher = customFetch || fetch;
	const isJsonBody = body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob);

	const headers: Record<string, string> = {
		Accept: 'application/json',
		...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
		...(customHeaders as Record<string, string> | undefined)
	};

	let response: Response;
	try {
		response = await fetcher(finalUrl, {
			...restOptions,
			headers,
			body: isJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined)
		});
	} catch (networkError) {
		const errorMsg = '网络连接异常，请检查您的网络';
		if (!silent) {
			toast.error(errorMsg);
		}
		throw new HttpError('NETWORK_ERROR', errorMsg, 0, networkError);
	}

	if (!response.ok) {
		let code = 'INTERNAL_ERROR';
		let message = '请求失败，请稍后重试';
		let details: unknown;

		try {
			const errorData = await response.json();
			if (errorData?.error) {
				code = errorData.error.code || code;
				message = errorData.error.message || ERROR_MESSAGE_MAP[code] || message;
				details = errorData.error.details;
			}
		} catch {
			// 无法解析 JSON 则采用默认映射
			message = ERROR_MESSAGE_MAP[code] || response.statusText || message;
		}

		if (!silent) {
			toast.error(message);
		}

		throw new HttpError(code, message, response.status, details);
	}

	// 204 No Content
	if (response.status === 204) {
		return undefined as T;
	}

	try {
		return (await response.json()) as T;
	} catch {
		return undefined as T;
	}
}

export const http = {
	get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
		return request<T>(url, { ...config, method: 'GET' });
	},
	post<T = unknown>(url: string, body?: unknown, config?: RequestConfig): Promise<T> {
		return request<T>(url, { ...config, method: 'POST', body });
	},
	patch<T = unknown>(url: string, body?: unknown, config?: RequestConfig): Promise<T> {
		return request<T>(url, { ...config, method: 'PATCH', body });
	},
	put<T = unknown>(url: string, body?: unknown, config?: RequestConfig): Promise<T> {
		return request<T>(url, { ...config, method: 'PUT', body });
	},
	delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
		return request<T>(url, { ...config, method: 'DELETE' });
	}
};
