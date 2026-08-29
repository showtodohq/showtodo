/**
 * 通用本地数据变异与乐观更新工具集 (Local Mutation & Optimistic Update Utilities)
 * 适配 Svelte 5 $state 细粒度响应式代理，实现 0ms 本地即时更新与失败安全回滚
 */

type PredicateOrKey<T> = ((item: T) => boolean) | unknown;

function matches<T>(item: T, predicateOrKey: PredicateOrKey<T>, keyName: string = 'id'): boolean {
	if (typeof predicateOrKey === 'function') {
		return (predicateOrKey as (item: T) => boolean)(item);
	}
	if (item && typeof item === 'object') {
		return (item as Record<string, unknown>)[keyName] === predicateOrKey;
	}
	return item === predicateOrKey;
}

/**
 * 本地就地插入新项（支持顶部插入或末尾插入）
 */
export function insertItem<T>(list: T[], item: T, position: 'start' | 'end' = 'start'): T[] {
	if (position === 'start') {
		list.unshift(item);
	} else {
		list.push(item);
	}
	return list;
}

/**
 * 本地就地修改指定项（根据 ID 或自定义判断谓词查找）
 * 返回是否成功找到并更新
 */
export function updateItem<T>(
	list: T[],
	predicateOrKey: PredicateOrKey<T>,
	patch: Partial<T> | ((current: T) => Partial<T> | T),
	keyName: string = 'id'
): boolean {
	const index = list.findIndex((item) => matches(item, predicateOrKey, keyName));
	if (index === -1) return false;

	const target = list[index];
	if (typeof patch === 'function') {
		const next = patch(target);
		if (typeof next === 'object' && next !== null && typeof target === 'object' && target !== null) {
			Object.assign(target as object, next);
		} else {
			list[index] = next as T;
		}
	} else if (typeof patch === 'object' && patch !== null && typeof target === 'object' && target !== null) {
		Object.assign(target as object, patch);
	} else {
		list[index] = patch as unknown as T;
	}

	return true;
}

/**
 * 本地就地移除指定项
 * 返回被移除的元素，未找到则返回 null
 */
export function removeItem<T>(
	list: T[],
	predicateOrKey: PredicateOrKey<T>,
	keyName: string = 'id'
): T | null {
	const index = list.findIndex((item) => matches(item, predicateOrKey, keyName));
	if (index === -1) return null;
	const [removed] = list.splice(index, 1);
	return removed;
}

/**
 * 本地 Upsert（存在则合并更新，不存在则插入到顶部）
 */
export function upsertItem<T>(
	list: T[],
	item: T,
	keyName: string = 'id',
	position: 'start' | 'end' = 'start'
): T[] {
	const idVal = (item as Record<string, unknown>)[keyName];
	const updated = updateItem(list, idVal, item as Partial<T>, keyName);
	if (!updated) {
		insertItem(list, item, position);
	}
	return list;
}

/**
 * 乐观更新操作执行器
 * 1. 0ms 同步执行 apply 修改本地数据；
 * 2. 异步发起 action 网络请求；
 * 3. 遇异常自动执行 rollback 回滚状态并触发 onError。
 */
export async function optimisticAction<TResult>(options: {
	apply: () => void;
	rollback: () => void;
	action: () => Promise<TResult>;
	onError?: (error: unknown) => void;
}): Promise<TResult> {
	// 1. 立即执行本地乐观变更
	options.apply();

	try {
		// 2. 异步发起服务端请求
		const result = await options.action();
		return result;
	} catch (error) {
		// 3. 失败时自动安全回滚
		options.rollback();
		if (options.onError) {
			options.onError(error);
		}
		throw error;
	}
}
