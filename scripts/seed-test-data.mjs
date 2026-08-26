/**
 * 测试数据种子脚本
 *
 * 通过公开 API 批量创建测试账号与 Todo：
 * - 20 个仿真账号（拼音/英文名/QQ 号风格邮箱，自动建号后补设昵称）
 * - 每个账号 6 条 Todo，共 120 条（>= 100）
 * - 每个人设有偏好分类，覆盖全部状态（pending / in_progress / done / abandoned）与隐私组合
 *
 * 用法：
 *   node scripts/seed-test-data.mjs
 *   API_BASE=http://localhost:3003/api node scripts/seed-test-data.mjs
 *
 * 注意：脚本可重复执行；重复运行会在相同账号下追加更多 Todo。
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:3003/api';
const CONCURRENCY = 5;
const TODOS_PER_ACCOUNT = 6;

// ---------------------------------------------------------------------------
// 人设池：邮箱前缀即默认 handle，nickname 通过 PATCH /api/users/:id 补设
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

// ---------------------------------------------------------------------------
// 测试内容池
// ---------------------------------------------------------------------------

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

const ALL_CATEGORIES = /** @type {string[]} */ (Object.keys(CONTENT_POOL));

/** 全局已使用内容集合，尽量避免不同账号出现完全相同的 Todo 文案 */
const usedContents = new Set();

// ---------------------------------------------------------------------------
// 数据生成
// ---------------------------------------------------------------------------

/**
 * 生成 YYYY-MM-DD 格式的偏移日期
 * @param {number} offsetDays 相对今天的偏移天数
 */
function formatDate(offsetDays) {
	const date = new Date();
	date.setDate(date.getDate() + offsetDays);
	return date.toISOString().slice(0, 10);
}

/**
 * 第 todoIndex 条 Todo 的目标状态
 * 分布大致为：pending 40%、in_progress 25%、done 25%、abandoned 10%
 * @param {number} personaIndex
 * @param {number} todoIndex
 * @returns {'pending' | 'in_progress' | 'done' | 'abandoned'}
 */
function pickTargetStatus(personaIndex, todoIndex) {
	const patterns = [
		['pending', 'pending', 'in_progress', 'done', 'pending', 'done'],
		['pending', 'in_progress', 'done', 'pending', 'abandoned', 'in_progress']
	];
	return patterns[personaIndex % patterns.length][todoIndex];
}

/**
 * 从内容池中挑选一条未被使用过的文案；池子耗尽时允许复用
 * @param {string[]} pool
 */
function pickContent(pool) {
	const candidates = pool.filter((item) => !usedContents.has(item));
	const chosen = candidates.length > 0 ? candidates[0] : pool[usedContents.size % pool.length];
	usedContents.add(chosen);
	return chosen;
}

/**
 * 构造一条待创建的 Todo 输入
 * @param {{ email: string, nickname: string, cats: [string, string] }} persona
 * @param {number} personaIndex
 * @param {number} todoIndex
 */
function buildTodoInput(persona, personaIndex, todoIndex) {
	// 每 3 条里有 1 条跳出偏好分类，制造自然的多样性
	const category =
		todoIndex % 3 === 2
			? ALL_CATEGORIES[(personaIndex * 5 + todoIndex) % ALL_CATEGORIES.length]
			: persona.cats[todoIndex % 2];

	const hasNote = (personaIndex + todoIndex) % 3 !== 0; // 约 2/3 带 note
	const note = hasNote ? NOTE_POOL[(personaIndex * 2 + todoIndex) % NOTE_POOL.length] : null;
	const isNotePublic = (personaIndex + todoIndex) % 5 !== 0; // 约 1/5 私密

	const startOffset = ((personaIndex * 3 + todoIndex * 5) % 11) - 7; // -7 ~ +3 天
	const startDate = formatDate(startOffset);
	const hasDueDate = (personaIndex + todoIndex) % 4 !== 0; // 约 3/4 有截止日
	const dueDate = hasDueDate
		? formatDate(startOffset + 3 + ((personaIndex + todoIndex) % 18))
		: null;

	return { category, content: pickContent(CONTENT_POOL[category]), note, isNotePublic, startDate, dueDate };
}

// ---------------------------------------------------------------------------
// HTTP 请求
// ---------------------------------------------------------------------------

/**
 * 统一的 API 调用封装，失败时抛出带上下文的错误
 * @param {string} method
 * @param {string} path
 * @param {unknown} [body]
 */
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
 * 灌入单个账号的数据：创建 Todo、流转状态、补设昵称
 * @param {{ email: string, nickname: string, cats: [string, string] }} persona
 * @param {number} personaIndex
 */
async function seedAccount(persona, personaIndex) {
	/** @type {{ label: string, ok: boolean, detail?: string }[]} */
	const results = [];

	for (let todoIndex = 0; todoIndex < TODOS_PER_ACCOUNT; todoIndex++) {
		const input = buildTodoInput(persona, personaIndex, todoIndex);
		const targetStatus = pickTargetStatus(personaIndex, todoIndex);

		try {
			const created = await callApi('POST', '/todos', { email: persona.email, ...input });
			const todoId = created.todo.id;

			if (targetStatus !== 'pending') {
				await callApi('PATCH', `/todos/${todoId}`, { email: persona.email, status: targetStatus });
			}
			results.push({ label: `[${persona.nickname}] ${input.content}`, ok: true });

			// 注册时默认昵称是邮箱前缀，用首次响应里的作者 id 补设为拟真昵称
			if (todoIndex === 0 && created.author?.id) {
				try {
					await callApi('PATCH', `/users/${created.author.id}`, {
						email: persona.email,
						nickname: persona.nickname
					});
				} catch (error) {
					results.push({
						label: `[${persona.email}] 设置昵称「${persona.nickname}」`,
						ok: false,
						detail: error instanceof Error ? error.message : String(error)
					});
				}
			}
		} catch (error) {
			results.push({
				label: `[${persona.nickname}] ${input.content}`,
				ok: false,
				detail: error instanceof Error ? error.message : String(error)
			});
		}
	}
	return { email: persona.email, results };
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
	console.log(`开始灌入测试数据 → ${API_BASE}`);
	console.log(`计划：${PERSONAS.length} 个账号 × ${TODOS_PER_ACCOUNT} 条 Todo = ${PERSONAS.length * TODOS_PER_ACCOUNT} 条\n`);

	// 先确认服务可用，避免盲目发请求
	try {
		await callApi('GET', '/health');
	} catch (error) {
		console.error('服务不可用，请先启动 dev server（npm run dev）。');
		throw error;
	}

	/** @type {{ email: string, results: { label: string, ok: boolean, detail?: string }[] }[]} */
	const allResults = [];

	await runPool(
		PERSONAS,
		async (persona) => {
			allResults.push(await seedAccount(persona, PERSONAS.indexOf(persona)));
		},
		CONCURRENCY
	);

	const allRecords = allResults.flatMap((r) => r.results);
	const failed = allRecords.filter((r) => !r.ok);

	console.log(`完成：成功 ${allRecords.length - failed.length} 项 / 失败 ${failed.length} 项`);
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
