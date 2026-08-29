/**
 * 测试数据种子脚本
 *
 * 通过公开 API 批量创建测试账号与 Todo：
 * 1. 动态模式：通过命令行参数 `--data '<JSON>'` 直接接收外部生成的账号与 Todo 数据（无需生成数据文件）。
 * 2. 默认模式：未提供 `--data` 时，使用内置的 20 个仿真账号与 120 条预设数据。
 *
 * 用法：
 *   # 1. 接收外部 JSON 数据（AI 动态生成）
 *   node .agents/skills/seed-test-data/scripts/seed-test-data.mjs --data '[{"email":"alice@example.com","nickname":"Alice","todos":[{"content":"完成季度总结","category":"dev","status":"in_progress"}]}]'
 *
 *   # 2. 指定 API 地址与并发度
 *   node .agents/skills/seed-test-data/scripts/seed-test-data.mjs --api-base http://localhost:3003/api --concurrency 5 --data '...'
 *
 *   # 3. 使用内置默认数据
 *   node .agents/skills/seed-test-data/scripts/seed-test-data.mjs
 */

import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI 参数解析
// ---------------------------------------------------------------------------

const cliOptions = {
	data: { type: 'string', short: 'd' },
	'api-base': { type: 'string' },
	concurrency: { type: 'string', short: 'c' },
	'dry-run': { type: 'boolean', default: false },
	help: { type: 'boolean', short: 'h', default: false }
};

let parsedCli;
try {
	parsedCli = parseArgs({
		options: cliOptions,
		allowPositionals: true
	});
} catch (error) {
	console.error(`参数解析失败: ${error instanceof Error ? error.message : String(error)}`);
	printHelp();
	process.exit(1);
}

if (parsedCli.values.help) {
	printHelp();
	process.exit(0);
}

function printHelp() {
	console.log(`
测试数据种子脚本 (seed-test-data)

选项：
  -d, --data <json>        直接传入外部 JSON 格式的账号与 Todo 数据字符串
      --api-base <url>     后端 API 基础路径 (默认: http://localhost:3003/api 或环境变量 API_BASE)
  -c, --concurrency <num>  并发请求数 (默认: 5)
      --dry-run            仅解析和打印数据计划，不发送真实网络请求
  -h, --help               查看帮助文档

数据格式示例：
  [
    {
      "email": "user@example.com",
      "nickname": "张三",
      "todos": [
        {
          "content": "学习 Svelte 5",
          "category": "study",
          "status": "in_progress",
          "note": "看官方 Runes 文档",
          "isNotePublic": true,
          "startDate": "2026-08-30",
          "dueDate": "2026-09-05"
        }
      ]
    }
  ]
`);
}

const API_BASE = parsedCli.values['api-base'] ?? process.env.API_BASE ?? 'http://localhost:3003/api';
const CONCURRENCY = parseInt(parsedCli.values.concurrency ?? '5', 10) || 5;
const IS_DRY_RUN = parsedCli.values['dry-run'] ?? false;

// ---------------------------------------------------------------------------
// 内置默认人设与文案池（用于默认模式）
// ---------------------------------------------------------------------------

/** @type {{ email: string, nickname: string, cats: [string, string] }[]} */
const PERSONAS = [
	{ email: 'yuchenhe92@163.com', nickname: '何雨辰', cats: ['study', 'dev'] },
	{ email: 'mochalatte@qq.com', nickname: '拿铁不加糖', cats: ['life', 'other'] },
	{ email: 'lin.xiaoyu@outlook.com', nickname: '小渔', cats: ['study', 'life'] },
	{ email: 'kevinzhou88@gmail.com', nickname: 'Kevin Zhou', cats: ['dev', 'study'] },
	{ email: 'tangerine_cat@foxmail.com', nickname: '橘猫本喵', cats: ['life', 'other'] },
	{ email: 'suhan0301@163.com', nickname: '苏寒', cats: ['finance', 'study'] },
	{ email: 'jiangnanyu@qq.com', nickname: '江南雨', cats: ['life', 'study'] },
	{ email: 'emma.wang94@gmail.com', nickname: 'Emma', cats: ['dev', 'finance'] },
	{ email: '59823317@qq.com', nickname: '大山', cats: ['fitness', 'life'] },
	{ email: 'zoe.chen@icloud.com', nickname: 'Zoe', cats: ['study', 'dev'] },
	{ email: 'fengqiwu@foxmail.com', nickname: '凤栖梧', cats: ['life', 'other'] },
	{ email: 'haoyun2024@qq.com', nickname: '好运来', cats: ['finance', 'life'] },
	{ email: 'lucas.sun@gmail.com', nickname: 'Lucas', cats: ['dev', 'other'] },
	{ email: 'qingfengxu@163.com', nickname: '清风徐来', cats: ['study', 'finance'] },
	{ email: 'momo.riko@outlook.com', nickname: '桃子', cats: ['life', 'fitness'] },
	{ email: 'taishanjian@qq.com', nickname: '泰山健身党', cats: ['fitness', 'dev'] },
	{ email: 'yeying0721@126.com', nickname: '夜莺', cats: ['other', 'study'] },
	{ email: 'frankliu.dev@gmail.com', nickname: 'Frank', cats: ['dev', 'fitness'] },
	{ email: 'xinghe.manbu@foxmail.com', nickname: '星河漫步', cats: ['life', 'study'] },
	{ email: 'baobao.shu@qq.com', nickname: '抱抱树', cats: ['finance', 'other'] }
];

/** @type {Record<string, string[]>} */
const CONTENT_POOL = {
	study: [
		'完成 Rust 所有权机制章节学习并整理笔记',
		'刷完 LeetCode 二叉树专题 20 题',
		'读完《设计数据密集型应用》第 5 章',
		'准备雅思口语 Part 2 话题卡，每天录音复盘',
		'学习 Kubernetes 网络模型并在本地集群实践',
		'复习线性代数矩阵分解相关知识点',
		'看完 CS61B 的哈希表课程并完成对应实验',
		'整理前端面试题库：事件循环与微任务篇',
		'学习 FFmpeg 基础用法，剪一支 vlog 片头',
		'备考 PMP，刷完敏捷管理章节习题',
		'跟练日语五十音，目标两周内默写全对',
		'精读论文《Attention Is All You Need》并写摘要',
		'报名驾校科目一，刷完题库模拟三套',
		'系统学习摄影构图，每周交一组练习片'
	],
	fitness: [
		'完成本周三次 5 公里跑步计划',
		'健身房力量训练：练背日 4 组动作',
		'学会自由泳换气，连续游完 25 米',
		'挑战 30 天平板支撑打卡',
		'晨间拉伸课程坚持一周不断档',
		'体脂率降到 18%，每周固定记录体重变化',
		'骑行通勤上下班，单程 12 公里',
		'完成人生第一个 10 公里越野跑',
		'研究增肌饮食搭配，制定一份周食谱',
		'引体向上突破 10 个',
		'睡前戒掉手机，23:30 前入睡打卡一个月',
		'报个羽毛球班，每周打两场',
		'徒步武功山反穿路线，提前拉练两次',
		'跟着帕梅拉跳操，连续打卡 21 天'
	],
	finance: [
		'梳理本月收支账单，把外卖和打车单独归类',
		'研究指数基金定投策略，设置好自动扣款',
		'整理公积金和社保的缴纳记录',
		'了解可转债打新流程，先小仓位试一手',
		'优化信用卡积分使用方案，年底前换购机票',
		'建立六个月应急备用金账户',
		'复盘上季度投资组合的收益与回撤',
		'比较三家银行的大额存单利率再决定存哪',
		'给自己配置一份定期寿险',
		'清理闲置数码产品，在二手平台变现',
		'记账 App 连续记满 60 天',
		'研究个人所得税专项附加扣除，别漏报赡养老人',
		'把散落的余额宝零钱归集到一张卡统一管理',
		'学习看懂基金季报里的持仓变化'
	],
	dev: [
		'完成 SvelteKit 项目的服务端渲染改造',
		'给开源项目修复一个 good first issue',
		'搭家庭服务器 Docker 监控面板，Uptime 加告警',
		'重构用户模块，抽出统一的参数校验层',
		'调研 Postgres 连接池在 Serverless 下的最佳实践',
		'写一篇技术博客：短 ID 生成方案对比',
		'升级项目依赖到最新 LTS 版本并做回归测试',
		'实现 CI 流水线的自动化部署预览环境',
		'学习 Drizzle ORM 的迁移工作流',
		'优化首屏加载性能，LCP 控制在 2 秒内',
		'给个人网站加上 RSS 订阅支持',
		'折腾 Home Assistant，把客厅灯接入自动化',
		'写一个命令行小工具：批量压缩截图',
		'把博客评论系统从第三方迁到自托管'
	],
	life: [
		'预约周末的牙科洗牙',
		'给家里添几盆绿植并做好浇水排期',
		'规划十一假期的川西自驾路线',
		'整理衣柜，捐掉一年没穿的衣服',
		'学会一道新菜：红烧牛腩',
		'陪爸妈完成一次周边短途游',
		'修一修书房那盏接触不良的台灯',
		'办张图书馆借书证，借三本书回来',
		'把过期药品和旧电池送去回收点',
		'拍一卷胶片并冲洗装册',
		'换季大扫除，空调滤网拆下来洗一遍',
		'给手机换个新电池，官方售后预约走起',
		'养成喝水的习惯，办公桌放个刻度杯',
		'把阳台改造一下，加一把躺椅和小灯串'
	],
	other: [
		'组织部门季度团建的活动策划',
		'把积压的邮件清零，收件箱保持整洁',
		'更新个人简历和作品集网站',
		'帮朋友的毕业设计调代码，周末约图书馆',
		'参加本地技术沙龙，会后整理笔记分享出来',
		'整理浏览器书签，归档失效链接',
		'给社区开源文档翻译一章',
		'规划下季度的个人 OKR',
		'清理手机相册，腾出 20GB 空间',
		'盲打速度练到 80 WPM',
		'给公众号写一篇年度复盘长文',
		'学一首吉他曲子，《晴天》前奏先拿下',
		'把微信收藏夹里的干货文章分门别类归档',
		'研究一下 AI 绘图工具，给头像换个风格'
	]
};

/** @type {string[]} */
const NOTE_POOL = [
	'拆成小步骤推进，每天固定投入一小时。',
	'参考了社区里几篇实践帖，先跑通最小闭环再迭代。',
	'时间有点紧，优先核心部分，边角情况后面再补。',
	'之前踩过一次坑，这次记得提前备份。',
	'找了个搭子互相监督，周日晚一起复盘。',
	'预算控制在合理范围，超支就砍掉非必要项。',
	'先做三天试试水，能坚持再加量。',
	'查了下资料比想象中复杂，留出缓冲时间。'
];

const ALL_CATEGORIES = Object.keys(CONTENT_POOL);
const usedContents = new Set();

// ---------------------------------------------------------------------------
// 数据结构与准备
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SeedTodoItem
 * @property {string} content 待办内容
 * @property {string} [category] 分类 (study/dev/life/fitness/finance/other)
 * @property {'pending' | 'in_progress' | 'done' | 'abandoned'} [status] 目标状态
 * @property {string | null} [note] 备注
 * @property {boolean} [isNotePublic] 备注是否公开
 * @property {string | null} [startDate] 开始日期 (YYYY-MM-DD)
 * @property {string | null} [dueDate] 截止日期 (YYYY-MM-DD)
 */

/**
 * @typedef {Object} SeedAccountItem
 * @property {string} email 邮箱
 * @property {string} [nickname] 昵称
 * @property {SeedTodoItem[]} todos 待办列表
 */

function formatDate(offsetDays) {
	const date = new Date();
	date.setDate(date.getDate() + offsetDays);
	return date.toISOString().slice(0, 10);
}

function pickDefaultStatus(personaIndex, todoIndex) {
	const patterns = [
		['pending', 'pending', 'in_progress', 'done', 'pending', 'done'],
		['pending', 'in_progress', 'done', 'pending', 'abandoned', 'in_progress']
	];
	return patterns[personaIndex % patterns.length][todoIndex];
}

function pickContent(pool) {
	const candidates = pool.filter((item) => !usedContents.has(item));
	const chosen = candidates.length > 0 ? candidates[0] : pool[usedContents.size % pool.length];
	usedContents.add(chosen);
	return chosen;
}

/**
 * 生成内置默认全量测试账号数据
 * @returns {SeedAccountItem[]}
 */
function generateDefaultAccounts() {
	const TODOS_PER_ACCOUNT = 6;
	return PERSONAS.map((persona, personaIndex) => {
		const todos = [];
		for (let todoIndex = 0; todoIndex < TODOS_PER_ACCOUNT; todoIndex++) {
			const category =
				todoIndex % 3 === 2
					? ALL_CATEGORIES[(personaIndex * 5 + todoIndex) % ALL_CATEGORIES.length]
					: persona.cats[todoIndex % 2];

			const hasNote = (personaIndex + todoIndex) % 3 !== 0;
			const note = hasNote ? NOTE_POOL[(personaIndex * 2 + todoIndex) % NOTE_POOL.length] : null;
			const isNotePublic = (personaIndex + todoIndex) % 5 !== 0;

			const startOffset = ((personaIndex * 3 + todoIndex * 5) % 11) - 7;
			const startDate = formatDate(startOffset);
			const hasDueDate = (personaIndex + todoIndex) % 4 !== 0;
			const dueDate = hasDueDate
				? formatDate(startOffset + 3 + ((personaIndex + todoIndex) % 18))
				: null;

			todos.push({
				content: pickContent(CONTENT_POOL[category] || CONTENT_POOL.other),
				category,
				status: /** @type {'pending' | 'in_progress' | 'done' | 'abandoned'} */ (
					pickDefaultStatus(personaIndex, todoIndex)
				),
				note,
				isNotePublic,
				startDate,
				dueDate
			});
		}
		return {
			email: persona.email,
			nickname: persona.nickname,
			todos
		};
	});
}

/**
 * 标准化和校验外部传入的 JSON 数据
 * @param {unknown} rawData
 * @returns {SeedAccountItem[]}
 */
function normalizeInputData(rawData) {
	let list = rawData;
	if (typeof rawData === 'string') {
		try {
			list = JSON.parse(rawData);
		} catch (error) {
			throw new Error(`外部数据 JSON 解析失败: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	if (list && typeof list === 'object' && !Array.isArray(list) && Array.isArray(/** @type {any} */ (list).accounts)) {
		list = /** @type {any} */ (list).accounts;
	}

	if (!Array.isArray(list)) {
		throw new Error('传入的数据必须是数组格式，例如 `[ { "email": "...", "todos": [...] } ]`');
	}

	const normalized = list.map((account, accIdx) => {
		if (!account || typeof account !== 'object' || !account.email || typeof account.email !== 'string') {
			throw new Error(`第 ${accIdx + 1} 个账号数据缺失有效的 email 字段`);
		}

		const email = account.email.trim();
		const nickname =
			typeof account.nickname === 'string' && account.nickname.trim()
				? account.nickname.trim()
				: email.split('@')[0];
		const rawTodos = Array.isArray(account.todos) ? account.todos : [];

		if (rawTodos.length === 0) {
			throw new Error(`账号 [${email}] 未包含任何 todos 待办条目`);
		}

		const todos = rawTodos.map((t, todoIdx) => {
			if (!t || typeof t !== 'object' || !t.content || typeof t.content !== 'string') {
				throw new Error(`账号 [${email}] 的第 ${todoIdx + 1} 条 Todo 缺失 content 字段`);
			}
			const category = typeof t.category === 'string' && t.category ? t.category : 'other';
			const validStatuses = ['pending', 'in_progress', 'done', 'abandoned'];
			const status = validStatuses.includes(t.status) ? t.status : 'pending';
			const note = t.note ? String(t.note) : null;
			const isNotePublic = typeof t.isNotePublic === 'boolean' ? t.isNotePublic : true;
			const startDate = t.startDate ? String(t.startDate) : formatDate(0);
			const dueDate = t.dueDate ? String(t.dueDate) : null;

			return {
				content: t.content.trim(),
				category,
				status,
				note,
				isNotePublic,
				startDate,
				dueDate
			};
		});

		return { email, nickname, todos };
	});

	return normalized;
}

// ---------------------------------------------------------------------------
// HTTP 请求封装
// ---------------------------------------------------------------------------

async function callApi(method, path, body) {
	let response;
	try {
		response = await fetch(`${API_BASE}${path}`, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	} catch (error) {
		throw new Error(
			`网络请求失败 ${method} ${path}: ${error instanceof Error ? error.message : String(error)}`
		);
	}

	const payload = await response.json().catch(() => null);
	if (!response.ok) {
		const detail =
			payload && typeof payload === 'object' && 'error' in payload && payload.error
				? `${payload.error.code}: ${payload.error.message}`
				: `HTTP ${response.status}`;
		throw new Error(`${method} ${path} 失败 (${detail})`);
	}
	return payload;
}

/**
 * 灌入单个账号的数据
 * @param {SeedAccountItem} account
 */
async function seedAccount(account) {
	/** @type {{ label: string, ok: boolean, detail?: string }[]} */
	const results = [];

	for (let todoIndex = 0; todoIndex < account.todos.length; todoIndex++) {
		const item = account.todos[todoIndex];
		const body = {
			email: account.email,
			category: item.category,
			content: item.content,
			note: item.note,
			isNotePublic: item.isNotePublic,
			startDate: item.startDate,
			dueDate: item.dueDate
		};

		if (IS_DRY_RUN) {
			results.push({ label: `[DRY-RUN] [${account.nickname}] ${item.content} (${item.status})`, ok: true });
			continue;
		}

		try {
			const created = await callApi('POST', '/todos', body);
			const todoId = created.todo.id;

			if (item.status && item.status !== 'pending') {
				await callApi('PATCH', `/todos/${todoId}`, { email: account.email, status: item.status });
			}
			results.push({ label: `[${account.nickname}] ${item.content}`, ok: true });

			// 注册时默认昵称是邮箱前缀，用首次响应里的作者 id 补设为指定昵称
			if (todoIndex === 0 && created.author?.id && account.nickname) {
				try {
					await callApi('PATCH', `/users/${created.author.id}`, {
						email: account.email,
						nickname: account.nickname
					});
				} catch (error) {
					results.push({
						label: `[${account.email}] 设置昵称「${account.nickname}」`,
						ok: false,
						detail: error instanceof Error ? error.message : String(error)
					});
				}
			}
		} catch (error) {
			results.push({
				label: `[${account.nickname}] ${item.content}`,
				ok: false,
				detail: error instanceof Error ? error.message : String(error)
			});
		}
	}
	return { email: account.email, results };
}

/**
 * 简单并发池
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} worker
 * @param {number} limit
 */
async function runPool(items, worker, limit) {
	let cursor = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const item = items[cursor++];
			await worker(item);
		}
	});
	await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
	/** @type {SeedAccountItem[]} */
	let accounts;

	if (parsedCli.values.data) {
		accounts = normalizeInputData(parsedCli.values.data);
		console.log(`[动态模式] 成功解析外部参数数据：${accounts.length} 个账号`);
	} else {
		accounts = generateDefaultAccounts();
		console.log(`[默认模式] 使用内置预设数据：${accounts.length} 个账号`);
	}

	const totalTodos = accounts.reduce((acc, cur) => acc + cur.todos.length, 0);
	console.log(`目标 API: ${API_BASE}`);
	console.log(`计划灌入: ${accounts.length} 个账号，共 ${totalTodos} 条 Todo (并发度: ${CONCURRENCY})\n`);

	if (!IS_DRY_RUN) {
		// 先确认服务可用
		try {
			await callApi('GET', '/health');
		} catch (error) {
			console.error(`\n服务不可用 (${API_BASE})，请先启动 dev server（例如 npm run dev）或检查 --api-base 参数。`);
			throw error;
		}
	}

	/** @type {{ email: string, results: { label: string, ok: boolean, detail?: string }[] }[]} */
	const allResults = [];

	await runPool(
		accounts,
		async (account) => {
			allResults.push(await seedAccount(account));
		},
		CONCURRENCY
	);

	const allRecords = allResults.flatMap((r) => r.results);
	const failed = allRecords.filter((r) => !r.ok);

	console.log(`\n执行结果：成功 ${allRecords.length - failed.length} 项 / 失败 ${failed.length} 项`);
	console.log(`涉及账号：${new Set(allResults.map((r) => r.email)).size} 个\n`);

	if (failed.length > 0) {
		console.error('失败明细：');
		for (const item of failed) {
			console.error(`  ✗ ${item.label}\n    ${item.detail}`);
		}
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(`种子脚本执行失败: ${error instanceof Error ? error.message : String(error)}`);
	process.exit(1);
});
