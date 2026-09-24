import { betterAuth, generateId } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { getRequestEvent } from '$app/server';
import { db } from './db';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { generateUniqueHandleForAuth } from './auth/handle-utils';
import { eq } from 'drizzle-orm';

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,

	database: drizzleAdapter(db, {
		provider: 'pg',
		usePlural: true,
		schema: {
			...schema,
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications
		}
	}),

	// 字段映射与扩展声明
	user: {
		modelName: 'user',
		fields: {
			name: 'nickname',
			image: 'avatar'
		},
		additionalFields: {
			handle: {
				type: 'string',
				required: false,
				input: false,
				returned: true
			},
			lastTodoUpdatedAt: {
				type: 'string',
				required: false,
				input: false,
				returned: false
			}
		}
	},

	// 邮箱密码能力配置：支持登录，封死公开注册
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		requireEmailVerification: false
	},

	// Google OAuth 配置
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!,
			prompt: 'select_account'
		}
	},

	// 账号自动合并（以 Google 权威 Verified 邮箱为准）
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['google']
		}
	},

	// 精确 ID 生成策略：Postgres 负责 users UUID，Better Auth 负责 nanoid
	advanced: {
		database: {
			generateId: ({ model, size }) => {
				if (model === 'user' || model === 'users') {
					return false;
				}
				// 为其他表生成 nanoid 字符串
				return generateId(size);
			}
		}
	},

	// 核心生命周期 Hooks 拦截
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// 保证入库时 handle 绝不为空
					if (!user.handle) {
						const seed = user.email ? user.email.split('@')[0] : (user.name || 'user');
						const handle = await generateUniqueHandleForAuth(db, seed);
						return { data: { ...user, handle } };
					}
					return { data: user };
				}
			}
		},
		account: {
			create: {
				after: async (account) => {
					// 仅对 Google 社交账号关联时生效：若用户无头像则将 Google 头像回填
					if (account.providerId === 'google') {
						const [existingUser] = await db
							.select({ avatar: schema.users.avatar })
							.from(schema.users)
							.where(eq(schema.users.id, account.userId as any))
							.limit(1);

						if (existingUser && !existingUser.avatar && (account as any).image) {
							await db
								.update(schema.users)
								.set({ avatar: (account as any).image })
								.where(eq(schema.users.id, account.userId as any));
						}
					}
				}
			}
		}
	},

	// 安全防线：双保险拦截任何 /sign-up/email 请求
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith('/sign-up/email')) {
				throw new APIError('FORBIDDEN', {
					message: 'Public password registration is disabled. Please sign in with Google.'
				});
			}
		})
	},

	plugins: [sveltekitCookies(getRequestEvent)]
});
