import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import * as userService from '$lib/server/services/user.service';
import * as todoService from '$lib/server/services/todo.service';
import { isUUID } from '$lib/server/validation';
import { handleError, AppError } from '$lib/server/errors';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const startDateFrom = url.searchParams.get('startDateFrom');
		const startDateTo = url.searchParams.get('startDateTo');
		const limitParam = url.searchParams.get('limit');
		const offsetParam = url.searchParams.get('offset');
		const currentUserId = url.searchParams.get('currentUserId');
		const category = url.searchParams.get('category') || undefined;

		if (!startDateFrom || !startDateTo) {
			throw new AppError('VALIDATION_ERROR', 'startDateFrom and startDateTo are required');
		}

		const limit = Math.min(Math.max(parseInt(limitParam || '20', 10), 1), 50);
		const offset = Math.max(parseInt(offsetParam || '0', 10), 0);

		// 1. 获取在当前周有待办的活跃用户列表
		const userResult = await userService.listUsersWithTodosInWeek(db, {
			startDateFrom,
			startDateTo,
			category,
			limit,
			offset
		});
		let activeUsers = [...userResult.users];

		// 2. 如果存在当前登录用户且在第一页，确保当前用户置顶
		if (currentUserId && isUUID(currentUserId) && offset === 0) {
			const existingIndex = activeUsers.findIndex((u) => u.id === currentUserId);
			if (existingIndex > -1) {
				const [myUser] = activeUsers.splice(existingIndex, 1);
				activeUsers.unshift(myUser);
			} else {
				const myUser = await userService.findById(db, currentUserId);
				if (myUser) {
					activeUsers.unshift(myUser);
				}
			}
		}

		// 3. 收集用户 ID 批量拉取本周 todos
		const authorIds = activeUsers.map((u) => u.id);
		const calendarTodos = await todoService.listForCalendar(db, {
			authorIds,
			startDateFrom,
			startDateTo,
			category
		});

		return json({
			users: activeUsers.map((u) => ({
				id: u.id,
				email: u.email,
				nickname: u.nickname,
				handle: u.handle,
				avatar: u.avatar,
				createdAt: u.createdAt.toISOString(),
				updatedAt: u.updatedAt.toISOString(),
				lastTodoUpdatedAt: u.lastTodoUpdatedAt ? u.lastTodoUpdatedAt.toISOString() : null
			})),
			todos: calendarTodos,
			hasMoreUsers: userResult.hasMore
		});
	} catch (e) {
		return handleError(e);
	}
};
