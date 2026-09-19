import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';
import * as statsService from '$lib/server/services/stats.service';
import type { Todo, ReactionEmoji } from '$lib/types/todo';

export const load: PageServerLoad = async ({ params }) => {
	const cleanHandle = params.handle.startsWith('@') ? params.handle.slice(1) : params.handle;
	const user = await userService.findByIdOrHandle(db, cleanHandle);

	if (!user) {
		throw error(404, 'User not found');
	}

	const [todosResult, heatmap] = await Promise.all([
		todoService.list(db, {
			authorId: user.id,
			limit: 100
		}),
		statsService.getUserHeatmapStats(db, user.id, 365)
	]);

	const profile = userService.toUserProfile(user, { isSelf: false });

	const todos: Todo[] = todosResult.todos.map((todo) => ({
		...todo,
		startDate: todo.startDate instanceof Date ? todo.startDate.toISOString() : String(todo.startDate),
		dueDate: todo.dueDate instanceof Date ? todo.dueDate.toISOString() : (todo.dueDate ? String(todo.dueDate) : null),
		createdAt: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : String(todo.createdAt),
		updatedAt: todo.updatedAt instanceof Date ? todo.updatedAt.toISOString() : String(todo.updatedAt),
		myReactions: (todo.myReactions || []) as ReactionEmoji[]
	}));

	return {
		profile,
		todos,
		heatmap
	};
};
