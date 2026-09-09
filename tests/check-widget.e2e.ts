import { test, expect } from '@playwright/test';

test('inspect home page aside widgets and console errors', async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			consoleErrors.push(msg.text());
		}
	});
	page.on('pageerror', (err) => {
		consoleErrors.push(err.message);
	});

	// 模拟宽屏桌面端访问首页
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');

	// 等待网络空闲
	await page.waitForTimeout(3000);

	// 打印 aside 区域文本
	const asideText = await page.locator('aside').innerText();
	console.log('--- ASIDE INNER TEXT ---');
	console.log(asideText);
	console.log('--- CONSOLE ERRORS ---');
	console.log(consoleErrors);

	// 验证 SiteStatsWidget 标题存在
	const statsWidgetTitle = page.locator('text=全站数据脉搏');
	await expect(statsWidgetTitle).toBeVisible();
});
