/**
 * 根据昵称生成 DiceBear 头像 URL
 * 采用 notionists / bottts / identicon 风格，清爽优雅
 */
export function getAvatarUrl(
	avatar: string | null | undefined,
	seed: string | null | undefined,
	size = 80
): string {
	if (avatar && avatar.trim().length > 0) {
		return avatar;
	}
	const safeSeed = encodeURIComponent((seed && seed.trim().length > 0 ? seed : 'explorer').toLowerCase());
	return `https://api.dicebear.com/7.x/notionists/svg?seed=${safeSeed}&size=${size}&backgroundColor=f4f4f5,e4e4e7,d4d4d8`;
}
