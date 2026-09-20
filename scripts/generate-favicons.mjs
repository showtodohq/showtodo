import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const staticDir = path.resolve(rootDir, 'static');

// 深色模式配色的纯粹矢量模板（无媒体查询依赖，固定为深色高对比工程美学配色）
function getSvgContent(size) {
	return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <!-- Background Squircle Container -->
  <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.25" fill="#09090b" stroke="#3f3f46" stroke-width="1.5" />
  
  <!-- Broadcast & Progress Ring (Open 270-degree Arc) -->
  <path d="M 16 7.5 A 8.5 8.5 0 1 0 22.5 20.5" fill="none" stroke="rgba(255, 255, 255, 0.38)" stroke-width="2.2" stroke-linecap="round" />
  
  <!-- Focus Beacon Dot -->
  <circle cx="16" cy="7.5" r="1.3" fill="#38bdf8" />
  
  <!-- Decisive Completed Checkmark -->
  <path d="M 11 16.5 L 14.5 20 L 22.5 11.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`.trim();
}

// 为 iOS Apple Touch Icon 优化的全尺寸深色版本 (180x180)
function getAppleTouchSvg(size = 180) {
	return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="${size}" height="${size}">
  <rect width="180" height="180" rx="40" fill="#09090b" />
  <rect x="1" y="1" width="178" height="178" rx="39" fill="none" stroke="#27272a" stroke-width="2" />
  <g transform="translate(18, 18) scale(4.5)">
    <!-- Broadcast & Progress Ring -->
    <path d="M 16 7.5 A 8.5 8.5 0 1 0 22.5 20.5" fill="none" stroke="rgba(255, 255, 255, 0.38)" stroke-width="2.2" stroke-linecap="round" />
    <!-- Focus Beacon Dot -->
    <circle cx="16" cy="7.5" r="1.3" fill="#38bdf8" />
    <!-- Decisive Completed Checkmark -->
    <path d="M 11 16.5 L 14.5 20 L 22.5 11.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`.trim();
}

/**
 * 将一组 PNG Buffer 组装为标准的 Windows ICO 格式二进制 Buffer
 * 支持多分辨率封装 (16x16, 32x32, 48x48)
 */
function createIcoFromPngs(pngItems) {
	const count = pngItems.length;
	const headerSize = 6;
	const entrySize = 16;
	let offset = headerSize + entrySize * count;

	const header = Buffer.alloc(headerSize);
	header.writeUInt16LE(0, 0); // Reserved
	header.writeUInt16LE(1, 2); // 1 for ICO
	header.writeUInt16LE(count, 4); // Number of images

	const entries = [];
	for (const item of pngItems) {
		const entry = Buffer.alloc(entrySize);
		entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0); // Width
		entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1); // Height
		entry.writeUInt8(0, 2); // Color palette
		entry.writeUInt8(0, 3); // Reserved
		entry.writeUInt16LE(1, 4); // Color planes
		entry.writeUInt16LE(32, 6); // Bits per pixel
		entry.writeUInt32LE(item.buffer.length, 8); // Size of image data
		entry.writeUInt32LE(offset, 12); // Image data offset
		entries.push(entry);
		offset += item.buffer.length;
	}

	return Buffer.concat([header, ...entries, ...pngItems.map((p) => p.buffer)]);
}

async function renderSvgToPng(page, svgString, width, height) {
	await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; overflow: hidden; }
        </style>
      </head>
      <body>
        ${svgString}
      </body>
    </html>
  `);

	const svgElement = page.locator('svg');
	return await svgElement.screenshot({
		omitBackground: true
	});
}

async function main() {
	console.log('Launching browser to render high-fidelity icons...');
	const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
	const launchOptions = {
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
	};

	if (fs.existsSync(chromePath)) {
		launchOptions.executablePath = chromePath;
	}

	const browser = await chromium.launch(launchOptions);
	const context = await browser.newContext({
		deviceScaleFactor: 1 // 1:1 像素映射确保生成的 PNG 物理分辨率与文件名及规范严格一致 (48x48, 192x192, 180x180)
	});
	const page = await context.newPage();

	// 1. 生成 48x48 PNG (Google 最佳推荐尺寸之一)
	console.log('Rendering favicon-48x48.png...');
	const png48 = await renderSvgToPng(page, getSvgContent(48), 48, 48);
	fs.writeFileSync(path.join(staticDir, 'favicon-48x48.png'), png48);

	// 2. 生成 192x192 PNG (PWA & Android & 搜索引擎高清位图)
	console.log('Rendering favicon-192x192.png...');
	const png192 = await renderSvgToPng(page, getSvgContent(192), 192, 192);
	fs.writeFileSync(path.join(staticDir, 'favicon-192x192.png'), png192);

	// 3. 生成 180x180 Apple Touch Icon (iOS 专属)
	console.log('Rendering apple-touch-icon.png...');
	const png180 = await renderSvgToPng(page, getAppleTouchSvg(180), 180, 180);
	fs.writeFileSync(path.join(staticDir, 'apple-touch-icon.png'), png180);

	// 4. 生成多尺寸并打包为 favicon.ico (包含 16x16, 32x32, 48x48)
	console.log('Rendering multi-res for favicon.ico...');
	const png16 = await renderSvgToPng(page, getSvgContent(16), 16, 16);
	const png32 = await renderSvgToPng(page, getSvgContent(32), 32, 32);

	const icoBuffer = createIcoFromPngs([
		{ width: 16, height: 16, buffer: png16 },
		{ width: 32, height: 32, buffer: png32 },
		{ width: 48, height: 48, buffer: png48 }
	]);
	fs.writeFileSync(path.join(staticDir, 'favicon.ico'), icoBuffer);

	await browser.close();
	console.log('✅ All favicon formats (ICO, PNG-48, PNG-192, Apple-Touch-Icon-180) generated successfully!');
}

main().catch((err) => {
	console.error('Failed to generate favicons:', err);
	process.exit(1);
});
