import type { Database } from '../db';
import * as todoService from '../services/todo.service';
import * as reactionService from '../services/reaction.service';
import * as activityService from '../services/activity.service';
import * as recurrenceService from '../services/recurrence.service';
import {
	validateContent,
	validateNote,
	validateCategory,
	validateBoolean,
	validateOptionalDateTime,
	validateStatus,
	validateLimit,
	validateEmoji,
	VALID_CATEGORIES,
	VALID_STATUSES,
	VALID_EMOJIS
} from '../validation';
import { ALL_RECURRENCE_FREQUENCIES, ALL_RECURRENCE_STATUSES } from '$lib/constants/recurrence';
import { AppError } from '../errors';

export interface McpToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
}

export interface McpToolResult {
	isError: boolean;
	content: Array<{
		type: 'text';
		text: string;
	}>;
}

export function getToolDefinitions(): McpToolDefinition[] {
	return [
		{
			name: 'create_todo',
			description:
				'Create a new public Todo on ShowTodo. Automatically standardizes content and indexes topicHash for peer discovery.',
			inputSchema: {
				type: 'object',
				properties: {
					content: {
						type: 'string',
						description: 'The core content or goal description (1-500 characters).'
					},
					category: {
						type: 'string',
						enum: [...VALID_CATEGORIES],
						description: 'Category for the task (study, fitness, finance, dev, life, other).'
					},
					note: {
						type: 'string',
						description: 'Optional breakdown details, sub-steps, or reflection note.'
					},
					isNotePublic: {
						type: 'boolean',
						default: true,
						description: 'Whether the note is public (true) or private to author only (false).'
					},
					dueDate: {
						type: 'string',
						description: 'Optional due date/time (ISO 8601 or YYYY-MM-DD).'
					}
				},
				required: ['content']
			}
		},
		{
			name: 'list_my_todos',
			description: 'Retrieve the authenticated user’s personal todos, with optional filtering by status and category.',
			inputSchema: {
				type: 'object',
				properties: {
					status: {
						type: 'string',
						enum: [...VALID_STATUSES],
						description: 'Filter by status: pending, in_progress, done, abandoned.'
					},
					category: {
						type: 'string',
						enum: [...VALID_CATEGORIES],
						description: 'Filter by category.'
					},
					limit: {
						type: 'integer',
						minimum: 1,
						maximum: 100,
						default: 20
					},
					cursor: {
						type: 'string',
						description: 'Pagination cursor (Todo UUID).'
					}
				}
			}
		},
		{
			name: 'update_todo_status',
			description:
				'Update the lifecycle status of a todo (pending, in_progress, done, abandoned) with an optional progress note.',
			inputSchema: {
				type: 'object',
				properties: {
					todoId: {
						type: 'string',
						description: 'Todo UUID or shortId.'
					},
					status: {
						type: 'string',
						enum: [...VALID_STATUSES],
						description: 'New status for the todo.'
					},
					activityNote: {
						type: 'string',
						description: 'Optional note describing reason or summary for this status change.'
					}
				},
				required: ['todoId', 'status']
			}
		},
		{
			name: 'add_progress_note',
			description: 'Append a progress update or reflection note to an existing in-progress todo timeline.',
			inputSchema: {
				type: 'object',
				properties: {
					todoId: {
						type: 'string',
						description: 'Todo UUID or shortId.'
					},
					content: {
						type: 'string',
						description: 'Progress milestone or reflection update.'
					}
				},
				required: ['todoId', 'content']
			}
		},
		{
			name: 'discover_topics',
			description: 'Search trending peer goals and topics across the public ShowTodo square.',
			inputSchema: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description: 'Optional search keyword.'
					},
					category: {
						type: 'string',
						enum: [...VALID_CATEGORIES],
						description: 'Filter by category.'
					},
					limit: {
						type: 'integer',
						default: 10
					}
				}
			}
		},
		{
			name: 'react_to_todo',
			description:
				'Cheer or react to a todo with one of the 8 canonical Unicode emojis (❤️, 👍, 🔥, 💪, 👏, 🚀, 🎉, 👀).',
			inputSchema: {
				type: 'object',
				properties: {
					todoId: {
						type: 'string',
						description: 'Target todo UUID.'
					},
					emoji: {
						type: 'string',
						enum: [...VALID_EMOJIS],
						description: 'One of the 8 canonical Unicode emojis: ❤️, 👍, 🔥, 💪, 👏, 🚀, 🎉, 👀'
					}
				},
				required: ['todoId', 'emoji']
			}
		},
		{
			name: 'create_recurring_rule',
			description:
				'Create a recurring habit or autonomous routine inspection rule template. Automatically materializes current cycle todo.',
			inputSchema: {
				type: 'object',
				properties: {
					content: {
						type: 'string',
						description: 'The recurring task title or goal (e.g. Daily E2E smoke tests, Weekly dependency audit).'
					},
					frequency: {
						type: 'string',
						enum: [...ALL_RECURRENCE_FREQUENCIES],
						description: 'Frequency: daily, weekdays, weekly, monthly, custom_cron.'
					},
					interval: {
						type: 'integer',
						default: 1,
						description: 'Interval step (e.g. 1 for every day, 2 for every 2 weeks).'
					},
					category: {
						type: 'string',
						enum: [...VALID_CATEGORIES],
						description: 'Task category.'
					},
					note: {
						type: 'string',
						description: 'Optional task details or checklist.'
					},
					daysOfWeek: {
						type: 'array',
						items: { type: 'integer' },
						description: 'For weekly: array of days of week (0=Sun, 1=Mon, ..., 6=Sat).'
					}
				},
				required: ['content', 'frequency']
			}
		},
		{
			name: 'list_my_recurring_rules',
			description: 'Retrieve the authenticated user or agent’s recurring task rules and streak metrics.',
			inputSchema: {
				type: 'object',
				properties: {
					status: {
						type: 'string',
						enum: [...ALL_RECURRENCE_STATUSES],
						description: 'Optional filter by rule status (active, paused, dormant, completed, archived).'
					}
				}
			}
		},
		{
			name: 'update_recurring_rule_status',
			description: 'Update the operational status of a recurring rule (e.g. active, paused, archived).',
			inputSchema: {
				type: 'object',
				properties: {
					ruleId: {
						type: 'string',
						description: 'Target recurring rule UUID.'
					},
					status: {
						type: 'string',
						enum: ['active', 'paused', 'archived'],
						description: 'Target status: active, paused, archived.'
					}
				},
				required: ['ruleId', 'status']
			}
		},
		{
			name: 'delete_recurring_rule',
			description:
				'Permanently delete a recurring rule. Stops future todo materialization and virtual calendar projection. Optionally cascades to delete historical completed todos.',
			inputSchema: {
				type: 'object',
				properties: {
					ruleId: {
						type: 'string',
						description: 'Target recurring rule UUID.'
					},
					deleteHistory: {
						type: 'boolean',
						default: false,
						description: 'Whether to also delete all past materialized todos belonging to this rule.'
					}
				},
				required: ['ruleId']
			}
		}
	];
}

export async function handleToolCall(
	db: Database,
	toolName: string,
	args: Record<string, any>,
	currentUser: any | null
): Promise<McpToolResult> {
	try {
		switch (toolName) {
			case 'create_todo': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [
							{
								type: 'text',
								text: 'Authentication required. Please configure your ShowTodo API Key in MCP settings.'
							}
						]
					};
				}

				const content = validateContent(args?.content);
				const category = validateCategory(args?.category);
				const note = validateNote(args?.note);
				const isNotePublic = validateBoolean(args?.isNotePublic, true);
				const dueDate = validateOptionalDateTime(args?.dueDate);

				const rawTodo = await todoService.create(db, {
					content,
					category,
					note,
					isNotePublic,
					dueDate,
					authorId: currentUser.id
				});

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `✅ Todo created successfully!\n- ID: ${rawTodo.id}\n- Short ID: ${rawTodo.shortId}\n- Content: ${rawTodo.content}\n- Category: ${rawTodo.category ?? 'none'}\n- Status: ${rawTodo.status}\n- Topic Hash: ${rawTodo.topicHash}`
						}
					]
				};
			}

			case 'list_my_todos': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required.' }]
					};
				}

				const status = args?.status ? validateStatus(args.status) : undefined;
				const category = validateCategory(args?.category);
				const limit = validateLimit(args?.limit, 20);
				const cursor = args?.cursor ? String(args.cursor) : undefined;

				const list = await todoService.list(db, {
					authorId: currentUser.id,
					status,
					category: category ?? undefined,
					limit,
					cursor
				});

				if (!list.todos || list.todos.length === 0) {
					return {
						isError: false,
						content: [{ type: 'text', text: 'No todos found matching criteria.' }]
					};
				}

				const markdownLines = list.todos.map((t) => {
					const categoryTag = t.category ? `[${t.category}] ` : '';
					const noteText = t.note ? `\n    Note: ${t.note}` : '';
					return `- [${t.status}] ${categoryTag}${t.content} (id: ${t.shortId || t.id})${noteText}`;
				});

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `📋 Found ${list.todos.length} todos:\n\n${markdownLines.join('\n')}`
						}
					]
				};
			}

			case 'update_todo_status': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required.' }]
					};
				}

				const todo = await todoService.findByIdOrShortId(db, args?.todoId);
				if (!todo) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Todo not found.' }]
					};
				}

				if (todo.authorId !== currentUser.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Forbidden: You can only update your own todos.' }]
					};
				}

				const status = validateStatus(args?.status);
				if (!status) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Valid status is required.' }]
					};
				}

				const activityNote = validateNote(args?.activityNote);

				const updated = await todoService.update(
					db,
					todo.id,
					{ userId: currentUser.id },
					{
						status,
						activityNote
					}
				);

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `🔄 Todo status updated to "${updated.status}" (id: ${updated.shortId || updated.id}).`
						}
					]
				};
			}

			case 'add_progress_note': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required.' }]
					};
				}

				const todo = await todoService.findByIdOrShortId(db, args?.todoId);
				if (!todo) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Todo not found.' }]
					};
				}

				if (todo.authorId !== currentUser.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Forbidden: You can only update your own todos.' }]
					};
				}

				const content = validateContent(args?.content);
				await activityService.recordActivity(db, {
					todoId: todo.id,
					authorId: currentUser.id,
					type: 'progress_note',
					content
				});

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `📝 Progress note added to todo "${todo.content}":\n"${content}"`
						}
					]
				};
			}

			case 'discover_topics': {
				const search = args?.query ? String(args.query).trim() : (args?.search ? String(args.search).trim() : undefined);
				const category = validateCategory(args?.category);
				const limit = validateLimit(args?.limit, 10);

				const result = await todoService.listTopics(db, {
					search,
					category: category ?? undefined,
					limit
				});

				if (!result.topics || result.topics.length === 0) {
					return {
						isError: false,
						content: [{ type: 'text', text: 'No trending topics found.' }]
					};
				}

				const lines = result.topics.map(
					(t) => `- **${t.content}** (${t.totalParticipants} companions, hash: \`${t.topicHash}\`)`
				);

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `🌟 Trending peer goals on ShowTodo:\n\n${lines.join('\n')}`
						}
					]
				};
			}

			case 'react_to_todo': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required.' }]
					};
				}

				const emoji = validateEmoji(args?.emoji);
				const todo = await todoService.findByIdOrShortId(db, args?.todoId);
				if (!todo) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Todo not found.' }]
					};
				}

				try {
					await reactionService.add(db, todo.id, currentUser.id, emoji);
				} catch (e: any) {
					if (e instanceof AppError && e.code === 'DUPLICATE_REACTION') {
						return {
							isError: false,
							content: [
								{
									type: 'text',
									text: `✨ Already reacted with ${emoji} to todo "${todo.content}".`
								}
							]
						};
					}
					throw e;
				}

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `✨ Reacted with ${emoji} to todo "${todo.content}"!`
						}
					]
				};
			}

			case 'create_recurring_rule': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required. Please configure your API key.' }]
					};
				}

				const rule = await recurrenceService.createRule(db, {
					authorId: currentUser.id,
					content: args?.content,
					frequency: args?.frequency,
					interval: args?.interval,
					category: args?.category,
					note: args?.note,
					daysOfWeek: args?.daysOfWeek
				});

				const summary = [
					`🔁 **Recurring Rule Created Successfully!**`,
					`- **ID**: \`${rule.id}\``,
					`- **Content**: ${rule.content}`,
					`- **Frequency**: \`${rule.frequency}\` (every ${rule.interval})`,
					`- **Topic Hash**: \`${rule.topicHash}\``,
					`- **Status**: \`${rule.status}\``,
					`- **Next Run**: ${rule.nextRunAt.toISOString()}`,
					`\n💡 Current cycle todo was automatically materialized on your public timeline.`
				].join('\n');

				return {
					isError: false,
					content: [{ type: 'text', text: summary }]
				};
			}

			case 'list_my_recurring_rules': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required. Please configure your API key.' }]
					};
				}

				const rules = await recurrenceService.listByAuthor(db, currentUser.id, args?.status);
				if (rules.length === 0) {
					return {
						isError: false,
						content: [{ type: 'text', text: 'No recurring rules found for this account.' }]
					};
				}

				const lines = [
					`# 🔁 My Recurring Rules (${rules.length})`,
					'',
					'| ID | Content | Frequency | Status | Current Streak | Completed |',
					'|---|---|---|---|---|---|',
					...rules.map(
						(r) =>
							`| \`${r.id.slice(0, 8)}\` | ${r.content} | \`${r.frequency}\` | \`${r.status}\` | 🔥 ${r.currentStreak} | ${r.completedCycles}/${r.totalCycles} |`
					)
				];

				return {
					isError: false,
					content: [{ type: 'text', text: lines.join('\n') }]
				};
			}

			case 'update_recurring_rule_status': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required. Please configure your API key.' }]
					};
				}

				const updated = await recurrenceService.updateStatus(
					db,
					args.ruleId,
					currentUser.id,
					args.status
				);

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `✅ Recurring rule \`${updated.id.slice(0, 8)}\` status updated to \`${updated.status}\`.`
						}
					]
				};
			}

			case 'delete_recurring_rule': {
				if (!currentUser?.id) {
					return {
						isError: true,
						content: [{ type: 'text', text: 'Authentication required. Please configure your API key.' }]
					};
				}

				const result = await recurrenceService.deleteRule(
					db,
					args.ruleId,
					currentUser.id,
					{ deleteHistory: Boolean(args.deleteHistory) }
				);

				return {
					isError: false,
					content: [
						{
							type: 'text',
							text: `🗑️ Recurring rule \`${result.ruleId.slice(0, 8)}\` deleted permanently. Future todos will no longer materialize.`
						}
					]
				};
			}

			default:
				return {
					isError: true,
					content: [{ type: 'text', text: `Unknown tool: ${toolName}` }]
				};
		}
	} catch (err: any) {
		const message = err instanceof AppError ? err.message : err?.message || 'Internal tool execution error';
		return {
			isError: true,
			content: [{ type: 'text', text: `Error executing ${toolName}: ${message}` }]
		};
	}
}
