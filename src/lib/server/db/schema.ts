import { pgTable, text, boolean, timestamp, date, pgEnum, uuid, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'done', 'abandoned']);
export const activityTypeEnum = pgEnum('todo_activity_type', ['created', 'status_change', 'progress_note']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	handle: text('handle').notNull().unique(),
	nickname: text('nickname').notNull(),
	avatar: text('avatar'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
	lastTodoUpdatedAt: timestamp('last_todo_updated_at', { withTimezone: true })
});

export const todos = pgTable(
	'todos',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		shortId: text('short_id').notNull().unique(),
		topicHash: text('topic_hash').notNull(),
		content: text('content').notNull(),
		note: text('note'),
		isNotePublic: boolean('is_note_public').notNull().default(true),
		category: text('category'),
		authorId: uuid('author_id')
			.notNull()
			.references(() => users.id),
		status: todoStatusEnum('status').notNull().default('pending'),
		startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
		dueDate: timestamp('due_date', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
	},
	(table) => [index('idx_todos_topic_hash').on(table.topicHash)]
);

export const reactions = pgTable(
	'reactions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		todoId: uuid('todo_id')
			.notNull()
			.references(() => todos.id, { onDelete: 'cascade' }),
		emoji: text('emoji').notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique('reaction_todo_user_emoji_unique').on(table.todoId, table.userId, table.emoji)]
);

export const todoActivities = pgTable(
	'todo_activities',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		todoId: uuid('todo_id')
			.notNull()
			.references(() => todos.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => users.id),
		type: activityTypeEnum('type').notNull().default('status_change'),
		fromStatus: todoStatusEnum('from_status'),
		toStatus: todoStatusEnum('to_status'),
		content: text('content'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('idx_todo_activities_todo_created').on(table.todoId, table.createdAt)]
);

// Relations for Drizzle query builder
export const usersRelations = relations(users, ({ many }) => ({
	todos: many(todos),
	reactions: many(reactions),
	activities: many(todoActivities)
}));

export const todosRelations = relations(todos, ({ one, many }) => ({
	author: one(users, {
		fields: [todos.authorId],
		references: [users.id]
	}),
	reactions: many(reactions),
	activities: many(todoActivities)
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
	todo: one(todos, {
		fields: [reactions.todoId],
		references: [todos.id]
	}),
	user: one(users, {
		fields: [reactions.userId],
		references: [users.id]
	})
}));

export const todoActivitiesRelations = relations(todoActivities, ({ one }) => ({
	todo: one(todos, {
		fields: [todoActivities.todoId],
		references: [todos.id]
	}),
	author: one(users, {
		fields: [todoActivities.authorId],
		references: [users.id]
	})
}));
