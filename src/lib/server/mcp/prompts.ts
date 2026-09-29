export interface McpPromptDefinition {
	name: string;
	description: string;
	arguments?: Array<{
		name: string;
		description: string;
		required?: boolean;
	}>;
}

export interface McpPromptResult {
	description?: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: {
			type: 'text';
			text: string;
		};
	}>;
}

export function getPromptDefinitions(): McpPromptDefinition[] {
	return [
		{
			name: 'daily_standup',
			description: 'Guide the user through a daily standup review and prioritization of their ShowTodo items.',
			arguments: [
				{
					name: 'focusArea',
					description: 'Primary area of focus today (dev, fitness, study, etc.)',
					required: false
				}
			]
		},
		{
			name: 'breakdown_goal',
			description: 'Break down a high-level aspiration into actionable, atomic ShowTodo items with suggested categories.',
			arguments: [
				{
					name: 'goal',
					description: 'The big objective or ambition to decompose',
					required: true
				},
				{
					name: 'category',
					description: 'Optional category (study, fitness, finance, dev, life, other)',
					required: false
				}
			]
		},
		{
			name: 'companion_cheer',
			description: 'Generate empathetic peer cheer messages and recommend emojis for fellow travellers on ShowTodo.',
			arguments: [
				{
					name: 'topic',
					description: 'The shared topic or goal content',
					required: false
				}
			]
		}
	];
}

export function handlePromptGet(
	promptName: string,
	args: Record<string, string> = {}
): McpPromptResult | null {
	switch (promptName) {
		case 'daily_standup': {
			const focusArea = args.focusArea ? ` Focus area: ${args.focusArea}.` : '';
			return {
				description: 'Daily standup planning assistant',
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please help me run my daily standup review for ShowTodo.${focusArea}\n\n1. Use \`list_my_todos\` (with status "in_progress" and "pending") to check what I am currently working on.\n2. Help me choose the Top 3 highest-priority tasks for today.\n3. Identify any overdue or stuck items and suggest whether to continue, adjust due date, or mark abandoned.`
						}
					}
				]
			};
		}

		case 'breakdown_goal': {
			const goal = args.goal || 'My Goal';
			const category = args.category ? ` in category "${args.category}"` : '';
			return {
				description: 'Decompose a goal into ShowTodo tasks',
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `I want to achieve this goal${category}: "${goal}".\n\nPlease help me break it down into 3-5 specific, atomic, and measurable ShowTodo tasks.\nFor each task, provide:\n- Clear action-oriented content\n- Recommended category (study, fitness, finance, dev, life, other)\n- Brief note explaining the milestone\nAfter confirming with me, you can invoke \`create_todo\` to add them to my ShowTodo list!`
						}
					}
				]
			};
		}

		case 'companion_cheer': {
			const topic = args.topic ? ` regarding "${args.topic}"` : '';
			return {
				description: 'Peer companion cheer generator',
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `I want to cheer on fellow companions on ShowTodo${topic}.\n\nPlease search for trending goals using \`discover_topics\`, find participants, and craft warm, motivating encouragement. Suggest which of the 8 canonical emojis (❤️, 👍, 🔥, 💪, 👏, 🚀, 🎉, 👀) best fits the cheer.`
						}
					}
				]
			};
		}

		default:
			return null;
	}
}
