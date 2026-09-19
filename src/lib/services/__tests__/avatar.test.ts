import { describe, it, expect } from 'vitest';
import {
	DEFAULT_AVATAR_STYLE,
	DEFAULT_AVATAR_VERSION,
	AVATAR_STYLES,
	AVATAR_VERSIONS,
	getAvatarUrl,
	parseDiceBearUrl,
	generateRandomAvatarUrl
} from '../avatar';

describe('avatar service', () => {
	describe('constants', () => {
		it('should have lorelei as the default style', () => {
			expect(DEFAULT_AVATAR_STYLE).toBe('lorelei');
		});

		it('should have a valid default version and style in the supported lists', () => {
			expect(DEFAULT_AVATAR_STYLE).toBe('lorelei');
			expect(DEFAULT_AVATAR_VERSION).toBe('10.x');
			expect(AVATAR_STYLES).toContain(DEFAULT_AVATAR_STYLE);
			expect(AVATAR_VERSIONS).toContain(DEFAULT_AVATAR_VERSION);
		});
	});

	describe('getAvatarUrl', () => {
		it('should return existing avatar if provided', () => {
			const customAvatar = 'https://example.com/my-avatar.png';
			expect(getAvatarUrl(customAvatar, 'Alice')).toBe(customAvatar);
		});

		it('should generate default lorelei avatar URL when avatar is null or empty', () => {
			const url = getAvatarUrl(null, 'Alice', 100);
			expect(url).toContain('api.dicebear.com');
			expect(url).toContain('/10.x/lorelei/svg');
			expect(url).toContain('seed=alice');
			expect(url).toContain('size=100');
		});

		it('should fallback to user when seed is empty or null', () => {
			const url = getAvatarUrl(undefined, '');
			expect(url).toContain('seed=user');
		});
	});

	describe('parseDiceBearUrl', () => {
		it('should parse version, style, and seed correctly from DiceBear URL', () => {
			const url = 'https://api.dicebear.com/7.x/lorelei/svg?seed=bob&backgroundColor=f4f4f5';
			const parsed = parseDiceBearUrl(url);
			expect(parsed).toEqual({
				version: '7.x',
				style: 'lorelei',
				seed: 'bob'
			});
		});

		it('should return null for non-dicebear URL', () => {
			expect(parseDiceBearUrl('https://example.com/pic.svg')).toBeNull();
			expect(parseDiceBearUrl('')).toBeNull();
		});
	});

	describe('generateRandomAvatarUrl', () => {
		it('should keep the seed unchanged when switching styles/versions', () => {
			const initialSeed = 'my-unique-seed';
			const newUrl = generateRandomAvatarUrl({ seed: initialSeed });

			const parsed = parseDiceBearUrl(newUrl);
			expect(parsed).not.toBeNull();
			expect(parsed?.seed).toBe(initialSeed.toLowerCase());
		});

		it('should preserve existing seed from currentUrl if present', () => {
			const currentUrl = 'https://api.dicebear.com/7.x/notionists/svg?seed=existing-seed';
			const newUrl = generateRandomAvatarUrl({ seed: 'fallback-seed', currentUrl });

			const parsed = parseDiceBearUrl(newUrl);
			expect(parsed?.seed).toBe('existing-seed');
		});

		it('should switch style or version and produce a valid DiceBear URL', () => {
			const currentUrl = 'https://api.dicebear.com/7.x/lorelei/svg?seed=test-user';
			const newUrl = generateRandomAvatarUrl({ seed: 'test-user', currentUrl });

			const parsed = parseDiceBearUrl(newUrl);
			expect(parsed).not.toBeNull();
			expect(AVATAR_STYLES).toContain(parsed!.style);
			expect(AVATAR_VERSIONS).toContain(parsed!.version);
			// Either style or version should have changed from (7.x, lorelei)
			const isSame = parsed!.version === '7.x' && parsed!.style === 'lorelei';
			expect(isSame).toBe(false);
		});

		it('should keep seed identical across multiple consecutive random generations', () => {
			const seed = 'persistent-seed';
			let currentUrl: string | undefined = undefined;

			for (let i = 0; i < 10; i++) {
				const nextUrl = generateRandomAvatarUrl({ seed, currentUrl });
				const parsed = parseDiceBearUrl(nextUrl);
				expect(parsed?.seed).toBe(seed.toLowerCase());
				currentUrl = nextUrl;
			}
		});
	});
});
