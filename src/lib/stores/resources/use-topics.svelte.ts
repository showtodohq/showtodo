import { api } from '$lib/services/api';
import { userStore } from '$lib/stores/user.svelte';
import { toast } from '$lib/stores/toast.svelte';
import { todoMutations } from '$lib/stores/mutations.svelte';
import { getLocalDayAsUtcRange } from '$lib/utils/format';
import type { TopicItem } from '$lib/types/todo';

export function createTopicsResource() {
	let topics = $state<TopicItem[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let loadingMore = $state(false);
	let loaded = $state(false);
	let error = $state<string | null>(null);
	let hasMore = $state(false);

	let category = $state<string>('all');
	let scope = $state<'all' | 'mine'>('all');
	let sortBy = $state<'participants' | 'recent' | 'completion'>('participants');
	let timeRange = $state<'all' | 'today'>('all');
	let search = $state<string>('');
	let minParticipants = $state<number>(1);
	let offset = $state(0);
	const PAGE_SIZE = 15;

	let requestVersion = 0;

	async function load(reset = true) {
		if (!reset && (loading || loadingMore || !hasMore)) return;
		const version = ++requestVersion;
		const viewerId = userStore.id;
		const isCurrent = () => version === requestVersion && viewerId === userStore.id;
		if (reset) {
			loadingMore = false;
			loading = true;
			offset = 0;
			error = null;
		} else {
			loadingMore = true;
		}

		try {
			let startDateFrom: string | undefined = undefined;
			let startDateTo: string | undefined = undefined;
			if (timeRange === 'today') {
				const range = getLocalDayAsUtcRange();
				startDateFrom = range.startDateFrom;
				startDateTo = range.startDateTo;
			}

			const res = await api.getTopics({
				category: category === 'all' ? undefined : category,
				scope,
				sortBy,
				timeRange,
				search: search.trim() || undefined,
				minParticipants,
				currentUserId: userStore.id,
				limit: PAGE_SIZE,
				offset: reset ? 0 : offset,
				startDateFrom,
				startDateTo
			});

			// 竞态守卫：如果当前请求已过时（用户已发起新搜索或切换身份），直接丢弃，防止脏覆写
			if (!isCurrent()) return;

			if (reset) {
				topics = res.topics;
			} else {
				// 按 topicHash 去重追加
				const existingHashes = new Set(topics.map((t) => t.topicHash));
				const newItems = res.topics.filter((t) => !existingHashes.has(t.topicHash));
				topics = [...topics, ...newItems];
			}
			total = res.total;
			hasMore = res.hasMore;
			offset = reset ? res.topics.length : offset + res.topics.length;
			loaded = true;
		} catch (err) {
			if (!isCurrent()) return;
			error = (err as Error).message || 'Failed to load goals';
			console.error('Failed to load topics:', err);
		} finally {
			if (isCurrent()) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	async function loadMore() {
		if (loading || loadingMore || !hasMore) return;
		await load(false);
	}

	function setCategory(cat: string) {
		if (category === cat) return;
		category = cat;
		load(true);
	}

	function setScope(s: 'all' | 'mine') {
		if (scope === s) return;
		scope = s;
		load(true);
	}

	function setSortBy(s: 'participants' | 'recent' | 'completion') {
		if (sortBy === s) return;
		sortBy = s;
		load(true);
	}

	function setTimeRange(t: 'all' | 'today') {
		if (timeRange === t) return;
		timeRange = t;
		load(true);
	}

	function setSearch(q: string) {
		const clean = q.trim();
		if (search === clean) return;
		search = clean;
		load(true);
	}

	function setMinParticipants(m: number) {
		if (minParticipants === m) return;
		minParticipants = m;
		load(true);
	}

	async function handleJoin(topic: TopicItem) {
		if (!userStore.email) {
			toast.info('Please set your email in the top right avatar before joining');
			return;
		}

		// 0ms 本地乐观更新
		const tempId = `temp-${Date.now()}`;
		const currentUser = {
			id: userStore.id || '',
			nickname: userStore.nickname || 'Me',
			handle: userStore.handle || 'me',
			avatar: userStore.avatar || null
		};

		const found = topics.find((t) => t.topicHash === topic.topicHash);
		if (found) {
			const alreadyIn = found.participants.some(
				(p) => p.isMe || (currentUser.id && p.user.id === currentUser.id)
			);
			if (!alreadyIn) {
				found.participants = [
					{
						todoId: tempId,
						shortId: tempId,
						status: 'pending',
						createdAt: new Date().toISOString(),
						isMe: true,
						user: currentUser
					},
					...found.participants
				];
				found.totalParticipants += 1;
				found.isMultiplayer = found.totalParticipants > 1;
				found.completionRate =
					found.totalParticipants > 0
						? Math.round((found.doneCount / found.totalParticipants) * 100)
						: 0;
				topics = [...topics];
			}
		}

		await todoMutations.joinTopic({
			content: topic.content,
			category: topic.category
		});
	}

	return {
		get topics() {
			return topics;
		},
		get total() {
			return total;
		},
		get loading() {
			return loading;
		},
		get loadingMore() {
			return loadingMore;
		},
		get loaded() {
			return loaded;
		},
		get error() {
			return error;
		},
		get hasMore() {
			return hasMore;
		},
		get category() {
			return category;
		},
		get scope() {
			return scope;
		},
		get sortBy() {
			return sortBy;
		},
		get timeRange() {
			return timeRange;
		},
		get search() {
			return search;
		},
		get minParticipants() {
			return minParticipants;
		},
		load,
		loadMore,
		setCategory,
		setScope,
		setSortBy,
		setTimeRange,
		setSearch,
		setMinParticipants,
		handleJoin
	};
}
