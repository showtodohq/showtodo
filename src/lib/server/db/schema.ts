import { pgTable, text, boolean, timestamp, date, pgEnum, uuid, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'done', 'abandoned']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	nickname: text('nickname').notNull(),
	avatar: text('avatar'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export const todos = pgTable('todos', {
	id: uuid('id').primaryKey().defaultRandom(),
	content: text('content').notNull(),
	note: text('note'),
	isNotePublic: boolean('is_note_public').notNull().default(true),
	category: text('category'),
	authorId: uuid('author_id')
		.notNull()
		.references(() => users.id),
	status: todoStatusEnum('status').notNull().default('pending'),
	startDate: date('start_date').notNull().defaultNow(),
	dueDate: date('due_date'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

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

// Relations for Drizzle query builder
export const usersRelations = relations(users, ({ many }) => ({
	todos: many(todos),
	reactions: many(reactions)
}));

export const todosRelations = relations(todos, ({ one, many }) => ({
	author: one(users, {
		fields: [todos.authorId],
		references: [users.id]
	}),
	reactions: many(reactions)
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
