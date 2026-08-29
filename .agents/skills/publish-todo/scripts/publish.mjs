#!/usr/bin/env node

/**
 * Fast Todo Publisher CLI for web-public-todo (ptdl-alpha)
 * 
 * Usage:
 *   node publish.mjs --email user@example.com --content "Write unit tests" --category dev
 *   node publish.mjs -e user@example.com -c "Morning run 5km" -g fitness -s 2026-08-30
 *   node publish.mjs --batch todos.json
 */

import { readFileSync } from 'node:fs';

const VALID_CATEGORIES = ['study', 'fitness', 'finance', 'dev', 'life', 'other'];

function getTodayString() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function parseArgs(args) {
	const options = {
		email: process.env.PTDL_EMAIL || process.env.GIT_AUTHOR_EMAIL || '',
		content: '',
		category: null,
		startDate: getTodayString(),
		dueDate: null,
		note: null,
		isNotePublic: true,
		baseUrl: process.env.PTDL_API_URL || 'http://localhost:3003',
		batchFile: null,
		raw: false,
		help: false
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--help' || arg === '-h') {
			options.help = true;
		} else if (arg === '--raw') {
			options.raw = true;
		} else if (arg === '--private-note') {
			options.isNotePublic = false;
		} else if (arg === '--email' || arg === '-e') {
			options.email = args[++i];
		} else if (arg === '--content' || arg === '-c') {
			options.content = args[++i];
		} else if (arg === '--category' || arg === '-g') {
			options.category = args[++i];
		} else if (arg === '--start-date' || arg === '-s' || arg === '--startDate') {
			options.startDate = args[++i];
		} else if (arg === '--due-date' || arg === '-d' || arg === '--dueDate') {
			options.dueDate = args[++i];
		} else if (arg === '--note' || arg === '-n') {
			options.note = args[++i];
		} else if (arg === '--base-url' || arg === '-u' || arg === '--url') {
			options.baseUrl = args[++i];
		} else if (arg === '--batch' || arg === '-b') {
			options.batchFile = args[++i];
		}
	}

	return options;
}

function printHelp() {
	console.log(`
🚀 Fast Todo Publisher CLI (ptdl-alpha)

Usage:
  node publish.mjs [options]

Options:
  -e, --email <string>       Author email (Required, or set PTDL_EMAIL env var)
  -c, --content <string>     Todo content (Required, 1-1000 chars)
  -g, --category <string>    Category ID (${VALID_CATEGORIES.join(', ')})
  -s, --start-date <date>    Start date in YYYY-MM-DD (Default: today)
  -d, --due-date <date>      Due date in YYYY-MM-DD (Optional)
  -n, --note <string>        Note/description (Optional, max 5000 chars)
      --private-note         Set note as private (Default: public)
  -u, --base-url <url>       API Base URL (Default: http://localhost:3003 or $PTDL_API_URL)
  -b, --batch <file>         Path to a JSON file containing an array of todos
      --raw                  Output raw JSON response
  -h, --help                 Show this help message

Examples:
  node publish.mjs -e me@example.com -c "Design system refactor" -g dev
  node publish.mjs -e me@example.com -c "Gym workout" -g fitness -s 2026-08-30 -d 2026-08-30
  node publish.mjs -b ./my-todos.json
`);
}

function resolveApiUrl(baseUrl, endpoint = 'todos') {
	const cleanBase = baseUrl.replace(/\/+$/, '');
	const cleanEndpoint = endpoint.replace(/^\/+/, '');
	if (cleanBase.endsWith('/api')) {
		return `${cleanBase}/${cleanEndpoint.replace(/^api\//, '')}`;
	}
	return `${cleanBase}/api/${cleanEndpoint.replace(/^api\//, '')}`;
}

async function postTodo(baseUrl, payload) {
	const url = resolveApiUrl(baseUrl, 'todos');
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const data = await res.json().catch(() => ({
		error: { code: 'HTTP_ERROR', message: `Server responded with status ${res.status}` }
	}));

	return { status: res.status, ok: res.ok, data };
}

async function run() {
	const options = parseArgs(process.argv.slice(2));

	if (options.help) {
		printHelp();
		process.exit(0);
	}

	// 1. Batch mode
	if (options.batchFile) {
		try {
			const fileContent = readFileSync(options.batchFile, 'utf-8');
			const todos = JSON.parse(fileContent);
			if (!Array.isArray(todos)) {
				console.error('❌ Batch file must contain a JSON array of todo items.');
				process.exit(1);
			}

			console.log(`📦 Publishing ${todos.length} todos in batch...`);
			let successCount = 0;

			for (let i = 0; i < todos.length; i++) {
				const item = todos[i];
				const payload = {
					email: item.email || options.email,
					content: item.content,
					category: item.category || options.category,
					startDate: item.startDate || options.startDate,
					dueDate: item.dueDate || options.dueDate,
					note: item.note || options.note,
					isNotePublic: item.isNotePublic !== undefined ? item.isNotePublic : options.isNotePublic
				};

				if (!payload.email || !payload.content) {
					console.warn(`⚠️ [${i + 1}/${todos.length}] Skipped: email and content are required.`);
					continue;
				}

				const { ok, status, data } = await postTodo(options.baseUrl, payload);
				if (ok) {
					successCount++;
					console.log(`✅ [${i + 1}/${todos.length}] Created: "${payload.content}" (ID: ${data.todo?.shortId || data.todo?.id})`);
				} else {
					console.error(`❌ [${i + 1}/${todos.length}] Failed: ${data.error?.message || `HTTP ${status}`}`);
				}
			}

			console.log(`\n🎉 Finished: ${successCount}/${todos.length} todos successfully published.`);
			return;
		} catch (err) {
			console.error(`❌ Failed to process batch file: ${err.message}`);
			process.exit(1);
		}
	}

	// 2. Single item mode
	if (!options.email) {
		console.error('❌ Error: Email is required. Use -e / --email or set $PTDL_EMAIL.');
		process.exit(1);
	}

	if (!options.content || !options.content.trim()) {
		console.error('❌ Error: Content is required. Use -c / --content.');
		process.exit(1);
	}

	if (options.category && !VALID_CATEGORIES.includes(options.category)) {
		console.warn(`⚠️ Warning: Category "${options.category}" is not standard. Valid choices: ${VALID_CATEGORIES.join(', ')}`);
	}

	const payload = {
		email: options.email.trim(),
		content: options.content.trim(),
		category: options.category || null,
		startDate: options.startDate,
		dueDate: options.dueDate || null,
		note: options.note || null,
		isNotePublic: options.isNotePublic
	};

	try {
		const { ok, status, data } = await postTodo(options.baseUrl, payload);

		if (options.raw) {
			console.log(JSON.stringify(data, null, 2));
			process.exit(ok ? 0 : 1);
		}

		if (ok) {
			console.log('\n✨ Todo Published Successfully!');
			console.log('----------------------------------------');
			console.log(`📌 ID:          ${data.todo.id}`);
			console.log(`🔗 Short ID:    ${data.todo.shortId}`);
			console.log(`📝 Content:     ${data.todo.content}`);
			console.log(`🏷️  Category:    ${data.todo.category || '(None)'}`);
			console.log(`📅 Start Date:  ${data.todo.startDate}`);
			if (data.todo.dueDate) console.log(`⏰ Due Date:    ${data.todo.dueDate}`);
			if (data.todo.note) console.log(`🗒️  Note:        ${data.todo.note} (${data.todo.isNotePublic ? 'Public' : 'Private'})`);
			console.log(`👤 Author:      ${data.author.nickname || data.author.handle} (${data.author.email})`);
			console.log('----------------------------------------\n');
		} else {
			console.error('\n❌ Failed to publish Todo:');
			console.error(`Status: ${status}`);
			console.error(`Error Code: ${data.error?.code || 'UNKNOWN_ERROR'}`);
			console.error(`Message:    ${data.error?.message || 'Unknown error occurred'}\n`);
			process.exit(1);
		}
	} catch (err) {
		console.error(`\n❌ Network / Execution Error: ${err.message}`);
		console.error(`   Make sure the server is running at ${options.baseUrl}\n`);
		process.exit(1);
	}
}

run();
