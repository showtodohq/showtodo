import { pgTable, text, boolean, timestamp, date, pgEnum, uuid, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'done', 'abandoned']);
export const activityTypeEnum = pgEnum('todo_activity_type', ['created', 'status_change', 'progress_note']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
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

// Better Auth core tables
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	token: text('token').notNull().unique(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export const accounts = pgTable('accounts', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'),
	idToken: text('id_token'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export const verifications = pgTable('verifications', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

// Relations for Drizzle query builder
export const usersRelations = relations(users, ({ many }) => ({
	todos: many(todos),
	reactions: many(reactions),
	activities: many(todoActivities),
	sessions: many(sessions),
	accounts: many(accounts)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	})
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

