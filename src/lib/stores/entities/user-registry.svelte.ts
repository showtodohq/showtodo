import type { UserProfile } from '$lib/types/user';

/**
 * 全局用户资料与用户待办归一化缓存中心 (UserProfileRegistry)
 * 解决跨页面/多次进出用户主页时的 0ms 瞬间直出与数据持久在内存的能力
 */
class UserProfileRegistry {
	// 用户实体字典 (以 userId 为 key)
	profiles = $state<Record<string, UserProfile>>({});

	// handle -> userId 别名映射
	handleMap = $state<Record<string, string>>({});

	// 用户名下的待办 ID 列表字典 (以 userId 为 key)
	userTodoIdsMap = $state<Record<string, string[]>>({});

	/**
	 * 归一化登记或合并用户档案
	 */
	upsertProfile(user: Partial<UserProfile> & { id: string }): UserProfile {
		if (!user || !user.id) return user as UserProfile;

		const existing = this.profiles[user.id];
		let target: UserProfile;

		if (existing) {
			Object.assign(existing, user);
			target = existing;
		} else {
			target = {
				id: user.id,
				nickname: user.nickname || 'User',
				handle: user.handle || 'user',
				avatar: user.avatar || null,
				...(user.email ? { email: user.email } : {}),
				createdAt: user.createdAt || '',
				updatedAt: user.updatedAt || ''
			};
			this.profiles[user.id] = target;
		}

		if (target.handle) {
			this.handleMap[target.handle.toLowerCase()] = target.id;
		}

		return target;
	}

	/**
	 * 登记用户的所有待办 ID 序列
	 */
	setUserTodoIds(identifier: string, todoIds: string[]) {
		const realId = this.getRealUserId(identifier);
		if (realId) {
			this.userTodoIdsMap[realId] = [...todoIds];
		}
	}

	/**
	 * 获取指定标识符对应的真实 userId
	 */
	getRealUserId(identifier?: string | null): string | undefined {
		if (!identifier) return undefined;
		const clean = identifier.startsWith('@') ? identifier.slice(1).toLowerCase() : identifier.toLowerCase();
		return this.handleMap[clean] || (this.profiles[identifier] ? identifier : undefined);
	}

	/**
	 * 获取已缓存的用户档案，支持 ID 或 Handle
	 */
	getProfile(identifier?: string | null): UserProfile | undefined {
		if (!identifier) return undefined;
		const realId = this.getRealUserId(identifier) || identifier;
		return this.profiles[realId];
	}

	getUserTodoIds(identifier?: string | null): string[] | undefined {
		if (!identifier) return undefined;
		const realId = this.getRealUserId(identifier) || identifier;
		return this.userTodoIdsMap[realId];
	}

	/**
	 * 清空所有注册表数据 (供单元测试或重置会话使用)
	 */
	clear() {
		this.profiles = {};
		this.handleMap = {};
		this.userTodoIdsMap = {};
	}
}

export const userProfileRegistry = new UserProfileRegistry();
