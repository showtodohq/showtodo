/**
 * 头像服务 (Avatar Service)
 * 采用 DiceBear 开放头像服务，默认风格为 lorelei
 */

export const DEFAULT_AVATAR_STYLE = 'lorelei';
export const DEFAULT_AVATAR_VERSION = '10.x';
export const DEFAULT_AVATAR_BG_COLORS = 'f4f4f5,e4e4e7,d4d4d8';

export const AVATAR_STYLES = [
	'lorelei',
	'lorelei-neutral',
	'notionists',
	'notionists-neutral',
	'adventurer',
	'adventurer-neutral',
	'avataaars',
	'avataaars-neutral',
	'big-ears',
	'big-ears-neutral',
	'big-smile',
	'bottts',
	'bottts-neutral',
	'croodles',
	'croodles-neutral',
	'dylan',
	'fun-emoji',
	'glass',
	'icons',
	'identicon',
	'micah',
	'miniavs',
	'open-peeps',
	'personas',
	'pixel-art',
	'pixel-art-neutral',
	'rings',
	'shapes',
	'thumbs'
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

export const AVATAR_VERSIONS = ['7.x', '8.x', '9.x', '10.x'] as const;
export type AvatarVersion = (typeof AVATAR_VERSIONS)[number];

export interface ParsedDiceBearAvatar {
	version: string;
	style: string;
	seed: string;
}

/**
 * 解析 DiceBear URL，获取版本号、风格和 seed
 */
export function parseDiceBearUrl(url: string | null | undefined): ParsedDiceBearAvatar | null {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes('dicebear.com')) {
			return null;
		}
		const parts = parsed.pathname.split('/').filter(Boolean);
		if (parts.length < 2) {
			return null;
		}
		const version = parts[0];
		const style = parts[1];
		const seed = parsed.searchParams.get('seed') || '';
		return { version, style, seed };
	} catch {
		return null;
	}
}

/**
 * 根据昵称或头像地址获取最终头像 URL
 * 若无自定义头像，则返回默认风格 (lorelei) 的 DiceBear 头像
 */
export function getAvatarUrl(
	avatar: string | null | undefined,
	seed: string | null | undefined,
	size = 80
): string {
	if (avatar && avatar.trim().length > 0) {
		return avatar;
	}
	const cleanSeed = seed?.trim() || 'user';
	const safeSeed = encodeURIComponent(cleanSeed.toLowerCase());
	return `https://api.dicebear.com/${DEFAULT_AVATAR_VERSION}/${DEFAULT_AVATAR_STYLE}/svg?seed=${safeSeed}&size=${size}&backgroundColor=${DEFAULT_AVATAR_BG_COLORS}`;
}

/**
 * 随机头像生成：保持 seed 不变，仅在不同风格和版本号之间进行切换
 */
export function generateRandomAvatarUrl(params: {
	seed: string;
	currentUrl?: string;
	size?: number;
}): string {
	const currentParsed = parseDiceBearUrl(params.currentUrl);
	const targetSeed = currentParsed?.seed || params.seed?.trim() || 'user';
	const safeSeed = encodeURIComponent(targetSeed.toLowerCase());

	// 排除当前已使用的风格，保证切换
	const candidateStyles = AVATAR_STYLES.filter((s) => s !== currentParsed?.style);
	const nextStyle =
		candidateStyles.length > 0
			? candidateStyles[Math.floor(Math.random() * candidateStyles.length)]
			: AVATAR_STYLES[0];

	// 随机挑选版本号
	const nextVersion = AVATAR_VERSIONS[Math.floor(Math.random() * AVATAR_VERSIONS.length)];

	let result = `https://api.dicebear.com/${nextVersion}/${nextStyle}/svg?seed=${safeSeed}&backgroundColor=${DEFAULT_AVATAR_BG_COLORS}`;
	if (params.size) {
		result += `&size=${params.size}`;
	}
	return result;
}
