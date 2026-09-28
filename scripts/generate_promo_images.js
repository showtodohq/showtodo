import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const promoDir = path.resolve(__dirname, '../promo');
const rawDir = path.join(promoDir, 'raw');
const outputDir = promoDir;

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert image to base64 for reliable local HTML embedding
function getBase64Image(filename) {
  const filePath = path.join(rawDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const faviconSvg = fs.readFileSync(path.resolve(__dirname, '../static/favicon.svg'), 'utf8');
const faviconBase64 = `data:image/svg+xml;base64,${Buffer.from(faviconSvg).toString('base64')}`;

// Common HTML Template Wrapper
function wrapHTML({ width, height, title, subtitle, badge, contentHtml, footerBadges = [] }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
      background: #090a0f;
      color: #f8fafc;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 44px 56px 40px 56px;
      -webkit-font-smoothing: antialiased;
    }

    /* Ambient Background Effects */
    .bg-mesh {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      background: 
        radial-gradient(circle at 18% 18%, rgba(16, 185, 129, 0.16) 0%, transparent 45%),
        radial-gradient(circle at 82% 25%, rgba(56, 189, 248, 0.14) 0%, transparent 50%),
        radial-gradient(circle at 50% 90%, rgba(99, 102, 241, 0.12) 0%, transparent 55%),
        #090a0f;
    }

    .bg-grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
      pointer-events: none;
      z-index: 1;
    }

    /* Layout Elements */
    .header {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-left {
      max-width: 820px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    .brand-name {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.28);
      color: #34d399;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .title {
      font-size: 40px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin-bottom: 8px;
      background: linear-gradient(180deg, #ffffff 40%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 17px;
      line-height: 1.45;
      color: #94a3b8;
      font-weight: 450;
      max-width: 760px;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }

    .url-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }

    .url-icon {
      color: #38bdf8;
    }

    /* Stage Area */
    .stage {
      position: relative;
      z-index: 5;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 18px;
      margin-bottom: 14px;
    }

    /* macOS Window Frame Container */
    .mac-window {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 
        0 0 0 1px rgba(255, 255, 255, 0.12),
        0 28px 70px -15px rgba(0, 0, 0, 0.75),
        0 10px 24px -5px rgba(0, 0, 0, 0.4);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .window-header {
      height: 38px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 8px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }

    .window-search {
      margin-left: 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 3px 14px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
    }

    .window-body {
      overflow: hidden;
      display: flex;
      background: #ffffff;
    }

    .window-body img {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    /* Floating Accent Card */
    .floating-card {
      position: absolute;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(16px);
      border-radius: 14px;
      padding: 14px 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 20;
    }

    /* Footer Badges */
    .footer {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .footer-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 550;
      color: #cbd5e1;
    }

    .footer-badge-icon {
      color: #10b981;
      font-size: 14px;
    }

    .footer-right {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="bg-grid"></div>

  <div class="header">
    <div class="header-left">
      <div class="brand-row">
        <img class="brand-logo" src="${faviconBase64}" alt="Logo" />
        <span class="brand-name">ShowTodo</span>
        ${badge ? `<div class="badge-pill"><span class="badge-dot"></span>${badge}</div>` : ''}
      </div>
      <h1 class="title">${title}</h1>
      <p class="subtitle">${subtitle}</p>
    </div>
    <div class="header-right">
      <div class="url-tag">
        <span class="url-icon">✦</span> www.showtodo.com
      </div>
    </div>
  </div>

  <div class="stage">
    ${contentHtml}
  </div>

  <div class="footer">
    <div class="footer-left">
      ${footerBadges.map(b => `
        <div class="footer-badge">
          <span class="footer-badge-icon">✓</span> ${b}
        </div>
      `).join('')}
    </div>
    <div class="footer-right">
      ShowTodo · Built in Public
    </div>
  </div>
</body>
</html>`;
}

// Generate the 7 Promo Visuals
async function generateAll() {
  console.log('Generating high-fidelity promotion graphics with Playwright...');
  
  const executablePath = '/Users/exc/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const b64Home = getBase64Image('home_full.png');
  const b64Profile = getBase64Image('profile_full.png');
  const b64Stream = getBase64Image('todolist_stream.png');
  const b64Kanban = getBase64Image('todolist_kanban.png');
  const b64Calendar = getBase64Image('todolist_calendar.png');
  const b64Stats = getBase64Image('stats_full.png');
  const b64Trending = getBase64Image('trending_full.png');

  // Helper to render HTML to image
  async function renderSlide({ filename, width, height, html }) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2, // 2x Retina output
    });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const outputPath = path.join(outputDir, filename);
    await page.screenshot({ path: outputPath });
    await page.close();
    console.log(`✓ Rendered: ${filename} (${width}x${height} @2x)`);
  }

  // ==========================================
  // 1. PH 01: Hero Showcase (1270 x 760)
  // ==========================================
  const html01 = wrapHTML({
    width: 1270,
    height: 760,
    badge: 'Official Launch',
    title: 'The Public-First Todo Network',
    subtitle: 'Stop procrastinating in private. Turn daily progress into public momentum across the open web.',
    footerBadges: [
      'Social Accountability',
      '3 Flexible Workspaces',
      '365-Day Consistency Heatmaps',
      'Quiet Encouragement'
    ],
    contentHtml: `
      <div style="position: relative; width: 1060px; height: 420px; display: flex; justify-content: center; align-items: flex-start;">
        <!-- Main Application Window -->
        <div class="mac-window" style="width: 860px; height: 400px; transform: translateY(10px);">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">
              <span>🔒</span> https://www.showtodo.com
            </div>
          </div>
          <div class="window-body" style="height: 362px; overflow: hidden;">
            <img src="${b64Home}" style="margin-top: -65px; width: 860px;" alt="Feed" />
          </div>
        </div>

        <!-- Floating Accent Card 1: 365-Day Heatmap Proof -->
        <div class="floating-card" style="bottom: 25px; left: 10px; border-color: rgba(16, 185, 129, 0.4); background: rgba(10, 15, 25, 0.9);">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #10b981;">
            🔥
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">Proof of Consistency</div>
            <div style="font-size: 16px; font-weight: 700; color: #ffffff;">365-Day Activity Heatmap</div>
          </div>
        </div>

        <!-- Floating Accent Card 2: 92% Completion Badge -->
        <div class="floating-card" style="top: 40px; right: 20px; border-color: rgba(56, 189, 248, 0.4); background: rgba(10, 15, 25, 0.9);">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #38bdf8;">
            ⚡
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em;">Completion Rate</div>
            <div style="font-size: 16px; font-weight: 700; color: #ffffff;">92% Completed Tasks</div>
          </div>
        </div>
      </div>
    `
  });
  await renderSlide({ filename: '01_PH_Hero_Showcase.png', width: 1270, height: 760, html: html01 });

  // ==========================================
  // 2. PH 02: Public Feed & Accountability (1270 x 760)
  // ==========================================
  const html02 = wrapHTML({
    width: 1270,
    height: 760,
    badge: 'Social Accountability',
    title: 'Build in Public. Stay Accountable.',
    subtitle: 'Publishing your daily todos replaces hidden procrastination with visible, transparent commitment.',
    footerBadges: [
      'Live Task Stream',
      'Distraction-free Reactions',
      'Category Tags (#Life, #Dev, #Study)',
      'Timestamped Proof'
    ],
    contentHtml: `
      <div style="position: relative; width: 1100px; height: 420px; display: flex; gap: 28px; align-items: center; justify-content: center;">
        <!-- Left: Mac Window with Real Feed Detail -->
        <div class="mac-window" style="width: 680px; height: 390px;">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">
              <span>Feed</span> · All Public Creators
            </div>
          </div>
          <div class="window-body" style="height: 352px; overflow: hidden; background: #fafafa;">
            <img src="${b64Home}" style="margin-top: -65px; width: 680px;" alt="Feed detail" />
          </div>
        </div>

        <!-- Right: Feature Highlights Panel -->
        <div style="width: 360px; display: flex; flex-direction: column; gap: 16px;">
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 20px;">👀</span>
              <h3 style="font-size: 16px; font-weight: 700; color: #fff;">Workflow Discovery</h3>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Observe how experienced builders break down ambitious projects into daily granular todos.</p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 20px;">❤️</span>
              <h3 style="font-size: 16px; font-weight: 700; color: #fff;">Quiet Encouragement</h3>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Celebrate finished milestones with low-friction heart signals without conversational clutter.</p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 20px;">⚡</span>
              <h3 style="font-size: 16px; font-weight: 700; color: #fff;">Instant Commitment</h3>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Publishing creates a psychological pledge that keeps you shipping every single day.</p>
          </div>
        </div>
      </div>
    `
  });
  await renderSlide({ filename: '02_PH_Public_Feed.png', width: 1270, height: 760, html: html02 });

  // ==========================================
  // 3. PH 03: 3 Views (Stream, Kanban, Calendar) (1270 x 760)
  // ==========================================
  const html03 = wrapHTML({
    width: 1270,
    height: 760,
    badge: 'Flexible Workspaces',
    title: 'Stream, Kanban, or Calendar',
    subtitle: 'One unified workbench. Switch perspectives instantly to match how you plan, focus, and review.',
    footerBadges: [
      'Chronological Stream View',
      'Multi-Lane Kanban Board',
      'Monthly Calendar Perspective',
      'Fluid State Transitions'
    ],
    contentHtml: `
      <div style="position: relative; width: 1120px; height: 420px; display: flex; align-items: center; justify-content: center;">
        <!-- Background Stack 1: Calendar View (Left/Behind) -->
        <div class="mac-window" style="position: absolute; left: 10px; width: 440px; height: 350px; transform: scale(0.92) rotate(-3deg); opacity: 0.75; filter: brightness(0.85); z-index: 1;">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">Calendar View</div>
          </div>
          <div class="window-body" style="height: 312px; overflow: hidden;">
            <img src="${b64Calendar}" style="margin-top: -120px; width: 500px;" alt="Calendar" />
          </div>
        </div>

        <!-- Center Focus: Kanban Board (Main) -->
        <div class="mac-window" style="position: relative; width: 680px; height: 390px; z-index: 10; box-shadow: 0 30px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.15);">
          <div class="window-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="dot dot-red"></div>
              <div class="dot dot-yellow"></div>
              <div class="dot dot-green"></div>
              <div class="window-search">@Archer / Kanban Workspace</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #e2e8f0; color: #475569; font-weight: 600;">Kanban Active</span>
            </div>
          </div>
          <div class="window-body" style="height: 352px; overflow: hidden;">
            <img src="${b64Kanban}" style="margin-top: -105px; width: 680px;" alt="Kanban" />
          </div>
        </div>

        <!-- Background Stack 2: Stream View (Right/Behind) -->
        <div class="mac-window" style="position: absolute; right: 10px; width: 440px; height: 350px; transform: scale(0.92) rotate(3deg); opacity: 0.75; filter: brightness(0.85); z-index: 1;">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">Stream View</div>
          </div>
          <div class="window-body" style="height: 312px; overflow: hidden;">
            <img src="${b64Stream}" style="margin-top: -120px; width: 500px;" alt="Stream" />
          </div>
        </div>
      </div>
    `
  });
  await renderSlide({ filename: '03_PH_Workflows.png', width: 1270, height: 760, html: html03 });

  // ==========================================
  // 4. PH 04: Heatmap & Proof of Consistency (1270 x 760)
  // ==========================================
  const html04 = wrapHTML({
    width: 1270,
    height: 760,
    badge: 'Build In Public',
    title: 'Your 365-Day Proof of Consistency',
    subtitle: 'Automated activity heatmaps, completion rates, and public creator profiles validate your grit.',
    footerBadges: [
      '365-Day Activity Footprint',
      'Transparent Completion Metrics',
      'Personal Creator Showcase',
      'Exportable Proof of Work'
    ],
    contentHtml: `
      <div style="position: relative; width: 1080px; height: 420px; display: flex; gap: 24px; align-items: center; justify-content: center;">
        <!-- Main Focus: Profile & Heatmap Window -->
        <div class="mac-window" style="width: 820px; height: 390px; box-shadow: 0 30px 80px rgba(0,0,0,0.8);">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">
              <span>https://www.showtodo.com/@Archer</span>
            </div>
          </div>
          <div class="window-body" style="height: 352px; overflow: hidden; background: #ffffff;">
            <img src="${b64Profile}" style="margin-top: -65px; width: 820px;" alt="Profile and Heatmap" />
          </div>
        </div>

        <!-- Right Side: Stats Highlight Pills -->
        <div style="width: 230px; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 18px;">
            <div style="font-size: 32px; font-weight: 800; color: #34d399; font-family: 'JetBrains Mono', monospace;">92%</div>
            <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-top: 4px;">Completion Rate</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Real execution record</div>
          </div>

          <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 14px; padding: 18px;">
            <div style="font-size: 32px; font-weight: 800; color: #38bdf8; font-family: 'JetBrains Mono', monospace;">365</div>
            <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-top: 4px;">Day Heatmap Grid</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Verifiable daily commits</div>
          </div>

          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 18px;">
            <div style="font-size: 32px; font-weight: 800; color: #fbbf24; font-family: 'JetBrains Mono', monospace;">100%</div>
            <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-top: 4px;">Public & Open</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Own your personal url</div>
          </div>
        </div>
      </div>
    `
  });
  await renderSlide({ filename: '04_PH_Proof_Of_Consistency.png', width: 1270, height: 760, html: html04 });

  // ==========================================
  // 5. PH 05: Trending Goals & Companionship (1270 x 760)
  // ==========================================
  const html05 = wrapHTML({
    width: 1270,
    height: 760,
    badge: 'Shared Goals',
    title: 'Never Walk Alone on Hard Goals',
    subtitle: 'Content-addressable topic clustering connects makers chasing identical targets for quiet companionship.',
    footerBadges: [
      'Trending Maker Challenges',
      'One-click "Add to My List"',
      'Real-time Peer Headcount',
      'Synchronous Pacing'
    ],
    contentHtml: `
      <div style="position: relative; width: 1080px; height: 420px; display: flex; gap: 24px; align-items: center; justify-content: center;">
        <!-- Left: Stats & Trending Overview -->
        <div class="mac-window" style="width: 740px; height: 390px; box-shadow: 0 30px 80px rgba(0,0,0,0.8);">
          <div class="window-header">
            <div class="dot dot-red"></div>
            <div class="dot dot-yellow"></div>
            <div class="dot dot-green"></div>
            <div class="window-search">
              <span>Trending Goals</span> · What makers are building today
            </div>
          </div>
          <div class="window-body" style="height: 352px; overflow: hidden; background: #ffffff;">
            <img src="${b64Trending}" style="margin-top: -65px; width: 740px;" alt="Trending" />
          </div>
        </div>

        <!-- Right Side: Key Benefits -->
        <div style="width: 310px; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 18px; color: #fbbf24;">⚡</span>
              <div style="font-size: 15px; font-weight: 700; color: #fff;">One-Click Adopt</div>
            </div>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.45;">See a great routine? Hit "Add to my list" to start the identical challenge with zero setup.</p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 18px; color: #34d399;">🤝</span>
              <div style="font-size: 15px; font-weight: 700; color: #fff;">Shared Pacing</div>
            </div>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.45;">Watch peer avatars complete their tasks side-by-side. Camaraderie without endless chat noise.</p>
          </div>

          <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 18px; color: #38bdf8;">📊</span>
              <div style="font-size: 15px; font-weight: 700; color: #fff;">Collective Metrics</div>
            </div>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.45;">Track overall completion rates and community momentum across common aspirations.</p>
          </div>
        </div>
      </div>
    `
  });
  await renderSlide({ filename: '05_PH_Trending_Goals.png', width: 1270, height: 760, html: html05 });

  // ==========================================
  // 6. X (Twitter) Launch Post Promo (1200 x 675, 16:9)
  // ==========================================
  const html06 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@600;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 675px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 50px 36px 50px;
      position: relative;
    }
    .bg-mesh {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: 
        radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
        radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 50% 90%, rgba(139, 92, 246, 0.14) 0%, transparent 55%),
        #090a0f;
      z-index: 0;
    }
    .bg-grid {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-size: 36px 36px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      z-index: 1;
    }
    .content-box {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-tag {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
      margin-bottom: 12px;
    }
    .title {
      font-size: 46px;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .title-gradient {
      background: linear-gradient(135deg, #34d399 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      font-size: 18px;
      color: #94a3b8;
      max-width: 680px;
      line-height: 1.4;
    }
    .cta-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 22px;
      background: #ffffff;
      color: #090a0f;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 10px 25px rgba(255, 255, 255, 0.2);
    }
    .stage {
      position: relative;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 350px;
      margin-top: 10px;
    }
    .window-card {
      width: 780px;
      height: 340px;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.15);
      position: relative;
    }
    .window-card-header {
      height: 36px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 14px;
      gap: 8px;
    }
    .dot { width: 9px; height: 9px; border-radius: 50%; }
    .dot-r { background: #ff5f56; }
    .dot-y { background: #ffbd2e; }
    .dot-g { background: #27c93f; }
    .float-badge {
      position: absolute;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(14px);
      border-radius: 14px;
      padding: 12px 18px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 20;
    }
    .footer {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }
    .footer-items {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #cbd5e1;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="bg-grid"></div>

  <div class="content-box">
    <div>
      <div class="brand-tag">
        <img src="${faviconBase64}" width="16" height="16" alt="Icon" />
        <span>OFFICIALLY LIVE ON SHOWTODO.COM</span>
      </div>
      <h1 class="title">Public Todo Network <span class="title-gradient">for Builders</span></h1>
      <p class="subtitle">Turn private procrastination into public momentum with 365-day heatmaps & 3 flexible views.</p>
    </div>
    <div>
      <div class="cta-pill">
        <span>🚀 Join Now</span>
        <span style="color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 13px;">showtodo.com</span>
      </div>
    </div>
  </div>

  <div class="stage">
    <div class="window-card">
      <div class="window-card-header">
        <div class="dot dot-r"></div>
        <div class="dot dot-y"></div>
        <div class="dot dot-g"></div>
        <span style="margin-left: 12px; font-size: 11px; color: #64748b; font-family: 'JetBrains Mono', monospace;">https://www.showtodo.com/@Archer</span>
      </div>
      <div style="height: 304px; overflow: hidden;">
        <img src="${b64Profile}" style="margin-top: -65px; width: 780px;" alt="Profile" />
      </div>
    </div>

    <!-- Floating Bubble 1 -->
    <div class="float-badge" style="bottom: 15px; left: 60px;">
      <span style="font-size: 20px;">🔥</span>
      <div>
        <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Activity Footprint</div>
        <div style="font-size: 14px; font-weight: 700; color: #fff;">365-Day Heatmap</div>
      </div>
    </div>

    <!-- Floating Bubble 2 -->
    <div class="float-badge" style="top: 20px; right: 50px;">
      <span style="font-size: 20px;">⚡</span>
      <div>
        <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Success Rate</div>
        <div style="font-size: 14px; font-weight: 700; color: #34d399;">92% Completed</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-items">
      <span>✦ Social Accountability</span>
      <span>✦ Stream · Kanban · Calendar</span>
      <span>✦ Distraction-free Reactions</span>
    </div>
    <div style="font-size: 13px; font-weight: 600; color: #94a3b8; font-family: 'JetBrains Mono', monospace;">
      #BuildInPublic #ProductLaunch
    </div>
  </div>
</body>
</html>`;
  await renderSlide({ filename: '06_X_Launch_Announcement.png', width: 1200, height: 675, html: html06 });

  // ==========================================
  // 7. X (Twitter) Header Banner (1500 x 500, 3:1)
  // ==========================================
  const html07 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@600;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1500px;
      height: 500px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px 0 100px;
      position: relative;
    }
    .bg-mesh {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: 
        radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.22) 0%, transparent 50%),
        radial-gradient(circle at 80% 40%, rgba(56, 189, 248, 0.20) 0%, transparent 55%),
        #090a0f;
      z-index: 0;
    }
    .bg-grid {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-size: 36px 36px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      z-index: 1;
    }
    .left-col {
      position: relative;
      z-index: 10;
      max-width: 600px;
      /* Margin-left to ensure profile picture avatar on Twitter doesn't obstruct content */
      margin-left: 20px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
    }
    .brand-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .tagline {
      font-size: 36px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 14px;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .desc {
      font-size: 16px;
      color: #94a3b8;
      line-height: 1.45;
      margin-bottom: 22px;
      max-width: 520px;
    }
    .pills-row {
      display: flex;
      gap: 12px;
    }
    .pill {
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .right-col {
      position: relative;
      z-index: 10;
      width: 640px;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stage-window {
      width: 580px;
      height: 340px;
      background: #ffffff;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.15);
      transform: perspective(1000px) rotateY(-8deg) rotateX(4deg);
    }
    .stage-window-header {
      height: 32px;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 6px;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-r { background: #ff5f56; }
    .dot-y { background: #ffbd2e; }
    .dot-g { background: #27c93f; }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="bg-grid"></div>

  <div class="left-col">
    <div class="brand-row">
      <img class="brand-logo" src="${faviconBase64}" alt="Logo" />
      <span class="brand-title">ShowTodo</span>
      <span style="padding: 4px 10px; border-radius: 6px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; font-weight: 700; font-family: 'JetBrains Mono', monospace;">LIVE</span>
    </div>
    <div class="tagline">The Public-First Todo Network for Builders & Creators</div>
    <div class="desc">Publish daily tasks openly, cultivate positive accountability, and turn consistency into an indisputable 365-day public footprint.</div>
    <div class="pills-row">
      <div class="pill"><span style="color:#10b981;">●</span> Social Accountability</div>
      <div class="pill"><span style="color:#38bdf8;">●</span> Stream / Kanban / Calendar</div>
      <div class="pill"><span style="color:#fbbf24;">●</span> www.showtodo.com</div>
    </div>
  </div>

  <div class="right-col">
    <div class="stage-window">
      <div class="stage-window-header">
        <div class="dot dot-r"></div>
        <div class="dot dot-y"></div>
        <div class="dot dot-g"></div>
        <span style="margin-left: 10px; font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace;">https://www.showtodo.com</span>
      </div>
      <div style="height: 308px; overflow: hidden;">
        <img src="${b64Home}" style="margin-top: -65px; width: 580px;" alt="Preview" />
      </div>
    </div>
  </div>
</body>
</html>`;
  await renderSlide({ filename: '07_X_Header_Banner.png', width: 1500, height: 500, html: html07 });

  await browser.close();
  console.log('🎉 All 7 promotion images have been generated successfully!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
