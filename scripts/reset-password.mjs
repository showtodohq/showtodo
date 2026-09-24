#!/usr/bin/env node

/**
 * 账号密码重置 / 设置脚本
 *
 * 适用于：管理员直接在服务器端为老用户（或任意已知 handle / email 的用户）
 * 设置或重置本地密码凭据（Better Auth credential account）。
 *
 * 用法：
 *   node scripts/reset-password.mjs --handle <username> --password <newPassword>
 *   node scripts/reset-password.mjs -u <username> -p <newPassword>
 *   node scripts/reset-password.mjs --email <email> --password <newPassword>
 */

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, or, sql } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

// ---------------------------------------------------------------------------
// 1. 加载本地 .env 环境变量
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadEnvFile(envPath) {
	if (!fs.existsSync(envPath)) return;
	const content = fs.readFileSync(envPath, 'utf8');
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const match = trimmed.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			let val = match[2].trim();
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			if (!process.env[key]) {
				process.env[key] = val;
			}
		}
	}
}

loadEnvFile(path.join(rootDir, '.env'));
loadEnvFile(path.join(rootDir, '.env.local'));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('\x1b[31m[错误] 未找到 DATABASE_URL 环境变量，请检查 .env 文件。\x1b[0m');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. 解析 CLI 参数
// ---------------------------------------------------------------------------
const cliOptions = {
	handle: { type: 'string', short: 'u' },
	email: { type: 'string', short: 'e' },
	password: { type: 'string', short: 'p' },
	help: { type: 'boolean', short: 'h', default: false }
};

let parsed;
try {
	parsed = parseArgs({
		options: cliOptions,
		allowPositionals: true
	});
} catch (error) {
	console.error(`\x1b[31m[参数错误] ${error instanceof Error ? error.message : String(error)}\x1b[0m`);
	printHelp();
	process.exit(1);
}

if (parsed.values.help) {
	printHelp();
	process.exit(0);
}

function printHelp() {
	console.log(`
ShowTodo 用户密码重置脚本

用法:
  node scripts/reset-password.mjs --handle <handle> --password <newPassword>
  node scripts/reset-password.mjs -u <handle> -p <newPassword>
  node scripts/reset-password.mjs --email <email> --password <newPassword>

选项:
  -u, --handle <handle>      用户 handle（支持携带或不携带 @ 前缀）
  -e, --email <email>        用户邮箱（与 handle 二选一）
  -p, --password <password>  新密码（至少 8 位）
  -h, --help                 显示帮助信息
`);
}

const rawHandle = parsed.values.handle?.trim();
const rawEmail = parsed.values.email?.trim().toLowerCase();
const newPassword = parsed.values.password?.trim();

if (!rawHandle && !rawEmail) {
	console.error('\x1b[31m[错误] 必须提供 --handle (-u) 或 --email (-e)\x1b[0m');
	printHelp();
	process.exit(1);
}

if (!newPassword || newPassword.length < 8) {
	console.error('\x1b[31m[错误] 密码不能为空且长度必须至少 8 个字符\x1b[0m');
	process.exit(1);
}

const cleanHandle = rawHandle ? (rawHandle.startsWith('@') ? rawHandle.slice(1) : rawHandle).toLowerCase() : null;

// ---------------------------------------------------------------------------
// 3. 执行数据库查询与更新
// ---------------------------------------------------------------------------
async function main() {
	console.log('\x1b[36m[信息] 正在连接数据库...\x1b[0m');
	const client = neon(databaseUrl);
	const db = drizzle(client);

	// 查找用户
	let queryCondition;
	if (cleanHandle && rawEmail) {
		queryCondition = sql`LOWER(handle) = ${cleanHandle} OR LOWER(email) = ${rawEmail}`;
	} else if (cleanHandle) {
		queryCondition = sql`LOWER(handle) = ${cleanHandle}`;
	} else {
		queryCondition = sql`LOWER(email) = ${rawEmail}`;
	}

	const userRows = await db.execute(
		sql`SELECT id, email, handle, nickname FROM users WHERE ${queryCondition} LIMIT 1`
	);

	const user = userRows[0];
	if (!user) {
		console.error(`\x1b[31m[错误] 未找到对应的用户 (handle: ${cleanHandle || '无'}, email: ${rawEmail || '无'})\x1b[0m`);
		process.exit(1);
	}

	console.log(`\x1b[32m[找到用户]\x1b[0m ID: ${user.id} | Handle: @${user.handle} | Email: ${user.email} | Nickname: ${user.nickname}`);

	// 采用 Better Auth 官方 scrypt 算法生成 Hash
	console.log('\x1b[36m[信息] 正在使用 Better Auth 标准算法哈希新密码...\x1b[0m');
	const hashedPassword = await hashPassword(newPassword);

	// 检查该用户是否已有 credential 记录
	const accountRows = await db.execute(
		sql`SELECT id FROM accounts WHERE user_id = ${user.id}::uuid AND provider_id = 'credential' LIMIT 1`
	);

	const existingAccount = accountRows[0];

	if (existingAccount) {
		// 已存在 credential 账号，更新密码并刷新更新时间
		await db.execute(
			sql`UPDATE accounts 
				SET password = ${hashedPassword}, 
				    updated_at = NOW() 
				WHERE id = ${existingAccount.id}`
		);
		console.log(`\x1b[32m[成功] 已成功为用户 @${user.handle} (${user.email}) 更新密码！\x1b[0m`);
	} else {
		// 不存在 credential 账号（例如历史老用户仅存 users 表），新建 credential 凭据
		// 生成 nanoid 风格主键
		const newAccountId = `cred_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
		await db.execute(
			sql`INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) 
				VALUES (${newAccountId}, ${user.id}::uuid, ${user.id}, 'credential', ${hashedPassword}, NOW(), NOW())`
		);
		console.log(`\x1b[32m[成功] 已成功为用户 @${user.handle} (${user.email}) 初始化创建本地密码凭据！\x1b[0m`);
	}

	// 清理该用户旧会话（确保密码变更后安全下线其它设备）
	const deletedSessions = await db.execute(
		sql`DELETE FROM sessions WHERE user_id = ${user.id}::uuid RETURNING id`
	);
	if (deletedSessions.length > 0) {
		console.log(`\x1b[33m[安全提示] 已作废该用户的 ${deletedSessions.length} 个历史登录会话，需使用新密码重新登录。\x1b[0m`);
	}

	console.log(`\n\x1b[32m✔ 密码重置完成！用户可直接在网页端使用邮箱【${user.email}】和新密码进行登录。\x1b[0m\n`);
}

main().catch((err) => {
	console.error('\x1b[31m[执行失败]\x1b[0m', err);
	process.exit(1);
});
