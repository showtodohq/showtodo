import type { Todo } from '$lib/types/todo';

/**
 * 全局标准化待办实体仓库 (Normalized Entity Cache)
 * 
 * 核心设计：
 * 1. 采用 Svelte 5 原生深层响应式字典 $state<Record<string, Todo>>({})，
 *    确保写入的每一个实体及其字段（status, reactions, note 等）天然具备 Deep Reactive Proxy 能力；
 * 2. 单点修改（如 item.status = targetStatus），所有引用该实体的视图（Feed, Today, Trending, Detail, UserProfile）
 *    0ms 瞬间自动触发精准重绘；
 * 3. 双向别名哈希表，毫秒级支持 UUID 与 shortId 双重索引检索。
 */
class TodoRegistry {
	// 实体主表 (以 UUID 为 key，Svelte 5 细粒度深层响应式字典)
	entities = $state<Record<string, Todo>>({});

	// 别名/短链接映射表 (shortId -> UUID)
	aliasMap = $state<Record<string, string>>({});

	/**
	 * 归一化写入或增量合并 Todo 实体
	 * 若已存在该实体，原地浅合并字段，保持现有 Proxy 引用不变并触发字段级响应
	 */
	upsert(todo: Todo): Todo {
		if (!todo || !todo.id) return todo;

		const existing = this.entities[todo.id];
		let target: Todo;

		if (existing) {
			// 原地合并有效字段，避免被缺少 activities / topicParticipantCount 的列表接口覆盖丢失
			for (const [key, val] of Object.entries(todo)) {
				if (val !== undefined) {
					(existing as unknown as Record<string, unknown>)[key] = val;
				}
			}
			target = existing;
		} else {
			// 直接赋值给 $state 字典，Svelte 5 自动赋予全字段深层响应式能力
			this.entities[todo.id] = { ...todo };
			target = this.entities[todo.id];
		}

		// 注册 shortId 别名索引（支持原样与小写索引）
		if (target.shortId) {
			this.aliasMap[target.shortId] = target.id;
			this.aliasMap[target.shortId.toLowerCase()] = target.id;
		}

		return target;
	}

	/**
	 * 批量归一化写入
	 */
	upsertMany(todos: Todo[]): Todo[] {
		return todos.map((t) => this.upsert(t));
	}

	/**
	 * 获取指定待办实体，支持 UUID 或 shortId
	 */
	get(identifier?: string | null): Todo | undefined {
		if (!identifier) return undefined;
		const realId =
			this.aliasMap[identifier] ||
			this.aliasMap[identifier.toLowerCase()] ||
			identifier;
		return this.entities[realId];
	}

	/**
	 * 就地变异响应式实体，保留详情页和列表持有的同一个 Proxy 引用
	 */
	mutate(identifier: string, updater: (todo: Todo) => void): boolean {
		const item = this.get(identifier);
		if (item) {
			updater(item);
			// $state 已提供深层响应式；替换引用会让详情资源继续读写脱离仓库的旧对象。
			if (item.shortId) {
				this.aliasMap[item.shortId] = item.id;
			}
			return true;
		}
		return false;
	}

	/**
	 * 原子替换临时待办（先接入正式实体，再移除临时 key，杜绝列表渲染空窗闪烁）
	 */
	replace(tempId: string, realTodo: Todo): Todo {
		const tempTodo = this.entities[tempId];
		if (tempTodo) {
			if (!realTodo.author && tempTodo.author) {
				realTodo.author = tempTodo.author;
			}
			if (!realTodo.reactions && tempTodo.reactions) {
				realTodo.reactions = tempTodo.reactions;
			}
			if (!realTodo.myReactions && tempTodo.myReactions) {
				realTodo.myReactions = tempTodo.myReactions;
			}
		}
		const authoritative = this.upsert(realTodo);
		if (tempId !== realTodo.id) {
			delete this.entities[tempId];
			delete this.aliasMap[tempId];
		}
		return authoritative;
	}

	/**
	 * 移除实体
	 */
	remove(identifier: string) {
		const realId = this.aliasMap[identifier] || identifier;
		delete this.entities[realId];

		// 清理别名映射
		for (const [alias, mappedId] of Object.entries(this.aliasMap)) {
			if (mappedId === realId) {
				delete this.aliasMap[alias];
			}
		}
	}

	/**
	 * 清空实体仓库
	 */
	clear() {
		this.entities = {};
		this.aliasMap = {};
	}
}

export const todoRegistry = new TodoRegistry();
