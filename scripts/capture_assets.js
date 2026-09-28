import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../promo/raw');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  console.log('Launching browser to capture high-res assets...');
  const executablePath = '/Users/exc/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x Retina for crystal clarity
  });

  const page = await context.newPage();

  // 1. Home / Feed Page
  console.log('1. Loading Home / Feed...');
  await page.goto('https://www.showtodo.com', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, 'home_full.png'), fullPage: false });

  // 2. Profile Page
  console.log('2. Loading @Archer Profile...');
  await page.goto('https://www.showtodo.com/@Archer', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, 'profile_full.png') });

  // 3. Todolist Stream
  console.log('3. Loading Todolist...');
  await page.goto('https://www.showtodo.com/@Archer/todolist', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, 'todolist_stream.png') });

  // 4. Kanban View
  console.log('4. Switching to Kanban...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Kanban'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, 'todolist_kanban.png') });

  // 5. Calendar View
  console.log('5. Switching to Calendar...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Calendar'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, 'todolist_calendar.png') });

  // 6. Stats Dashboard
  console.log('6. Loading Stats...');
  await page.goto('https://www.showtodo.com/stats', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, 'stats_full.png') });

  // 7. Trending Page
  console.log('7. Loading Trending...');
  await page.goto('https://www.showtodo.com/trending', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, 'trending_full.png') });

  await browser.close();
  console.log('All high-res raw assets captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
