import { createHash } from 'node:crypto';

/**
 * 文本归一化预处理：
 * 1. 去除首尾空白
 * 2. 全部转小写
 * 3. 连续空白/换行折叠为单个空格
 * 4. 去除末尾标点符号（中英文常见标点）
 */
export function normalizeContent(content: string): string {
	if (!content) return '';

	let normalized = content
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ');

	// 去除末尾中英文标点符号
	normalized = normalized.replace(/[.,!?;:。，！？；：…~～、]+$/g, '').trim();

	return normalized;
}

/**
 * 计算待办内容的 topic_hash (SHA-256 前 16 位十六进制)
 * topic_hash = SHA256( (category || '') + ":" + normalize(content) ).substring(0, 16)
 */
export function computeTopicHash(category: string | null | undefined, content: string): string {
	const catKey = (category ?? '').trim().toLowerCase();
	const normalizedContent = normalizeContent(content);
	const raw = `${catKey}:${normalizedContent}`;

	return createHash('sha256').update(raw, 'utf8').digest('hex').substring(0, 16);
}
