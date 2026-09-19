import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import * as todoService from '$lib/server/services/todo.service';
import type { Todo, ReactionEmoji } from '$lib/types/todo';

export const load: PageServerLoad = async ({ params }) => {
	const rawTodo = await todoService.findByIdOrShortId(db, params.id);
	if (!rawTodo) {
		throw error(404, 'Todo not found');
	}

	const todo: Todo = {
		...rawTodo,
		startDate: rawTodo.startDate instanceof Date ? rawTodo.startDate.toISOString() : String(rawTodo.startDate),
		dueDate: rawTodo.dueDate instanceof Date ? rawTodo.dueDate.toISOString() : (rawTodo.dueDate ? String(rawTodo.dueDate) : null),
		createdAt: rawTodo.createdAt instanceof Date ? rawTodo.createdAt.toISOString() : String(rawTodo.createdAt),
		updatedAt: rawTodo.updatedAt instanceof Date ? rawTodo.updatedAt.toISOString() : String(rawTodo.updatedAt),
		myReactions: [] as ReactionEmoji[]
	};

	return {
		todo
	};
};
