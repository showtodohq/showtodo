import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const promoDir = path.join(rootDir, 'promo');
const rawDir = path.join(promoDir, 'raw');

// Favicon SVG Base64
const faviconSvg = fs.readFileSync(path.join(rootDir, 'static/favicon.svg'), 'utf8');
const faviconBase64 = `data:image/svg+xml;base64,${Buffer.from(faviconSvg).toString('base64')}`;

// Home Full Background Base64
let homeFullBase64 = '';
const homeFullPath = path.join(rawDir, 'home_full.png');
if (fs.existsSync(homeFullPath)) {
  homeFullBase64 = `data:image/png;base64,${fs.readFileSync(homeFullPath).toString('base64')}`;
}

// Read popup.css to ensure 100% authentic styling
const popupCss = fs.readFileSync(path.join(rootDir, 'extension/popup.css'), 'utf8');

// Build an authentic Popup HTML string with mock clean data (sensitive info removed)
function getCleanPopupHtml({ content, note, category = 'dev', startVal = '2026-09-29T09:00', dueVal = '2026-09-29T23:59' }) {
  return `
  <div class="popup-wrapper">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <span class="pulse-dot"></span>
        <span>ShowTodo</span>
      </div>
      <div class="user-snippet">
        <div class="avatar" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white;">A</div>
        <span class="user-name">@alex</span>
        <button type="button" class="btn-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>

    <!-- Content Body -->
    <main class="content-body">
      <textarea class="main-input" rows="2" style="font-weight: 500;">${content}</textarea>

      <div class="note-section">
        <textarea class="note-input" rows="2">${note}</textarea>
        <label class="checkbox-row">
          <input type="checkbox" checked />
          <span>Public note</span>
        </label>
      </div>

      <div class="schedule-card">
        <div class="schedule-header">
          <span>Schedule</span>
          <button type="button" class="btn-clear">Clear</button>
        </div>
        <div class="schedule-grid">
          <div class="schedule-col">
            <div class="schedule-col-header">
              <span>Start Date</span>
              <div class="quick-pills">
                <button type="button" class="quick-pill active">Now</button>
                <button type="button" class="quick-pill">Tmr</button>
                <button type="button" class="quick-pill">Mon</button>
              </div>
            </div>
            <input type="datetime-local" class="datetime-input" value="${startVal}" />
          </div>
          <div class="schedule-col">
            <div class="schedule-col-header">
              <span>Due Date</span>
              <div class="quick-pills">
                <button type="button" class="quick-pill active">EOD</button>
                <button type="button" class="quick-pill">Tmr</button>
                <button type="button" class="quick-pill">+1w</button>
              </div>
            </div>
            <input type="datetime-local" class="datetime-input" value="${dueVal}" />
          </div>
        </div>
      </div>

      <div class="category-row">
        <button type="button" class="category-pill ${category === 'study' ? 'active' : ''}"><span class="color-dot" style="background-color: #3B82F6;"></span><span>Study</span></button>
        <button type="button" class="category-pill ${category === 'fitness' ? 'active' : ''}"><span class="color-dot" style="background-color: #22C55E;"></span><span>Fitness</span></button>
        <button type="button" class="category-pill ${category === 'finance' ? 'active' : ''}"><span class="color-dot" style="background-color: #F59E0B;"></span><span>Finance</span></button>
        <button type="button" class="category-pill ${category === 'dev' ? 'active' : ''}"><span class="color-dot" style="background-color: #8B5CF6;"></span><span>Dev</span></button>
        <button type="button" class="category-pill ${category === 'life' ? 'active' : ''}"><span class="color-dot" style="background-color: #EC4899;"></span><span>Life</span></button>
        <button type="button" class="category-pill ${category === 'other' ? 'active' : ''}"><span class="color-dot" style="background-color: #6B7280;"></span><span>Other</span></button>
      </div>

      <div class="footer-bar">
        <span class="shortcut-hint">⌘↵ to post</span>
        <button type="button" class="btn-post">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Post</span>
        </button>
      </div>
    </main>
  </div>
  `;
}

// 1. Generate Screenshot 1: 1280x800 Main Overview
async function generateScreenshot1(page) {
  const popupHtml = getCleanPopupHtml({
    content: 'Ship ShowTodo Chrome Extension to Web Store 🚀',
    note: 'Prepare screenshot assets, privacy policy URL, and publish checklist',
    category: 'dev'
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
    ${popupCss}
    
    body {
      width: 1280px;
      height: 800px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Browser Window Frame */
    .browser-window {
      width: 1280px;
      height: 800px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }

    /* macOS Chrome Tab Bar */
    .browser-top {
      height: 42px;
      background: #f1f3f4;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border-bottom: 1px solid #e0e0e0;
      gap: 12px;
      flex-shrink: 0;
    }

    .traffic-lights {
      display: flex;
      gap: 8px;
    }
    .traffic-light {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .tl-red { background: #ff5f56; }
    .tl-yellow { background: #ffbd2e; }
    .tl-green { background: #27c93f; }

    .browser-tab {
      background: #ffffff;
      height: 32px;
      border-radius: 8px 8px 0 0;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
      color: #202124;
      box-shadow: 0 -1px 2px rgba(0,0,0,0.04);
    }
    .tab-icon {
      width: 16px;
      height: 16px;
    }

    /* Address Bar */
    .browser-nav {
      height: 44px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      flex-shrink: 0;
    }

    .nav-buttons {
      display: flex;
      gap: 12px;
      color: #5f6368;
    }

    .omnibox {
      flex: 1;
      height: 30px;
      background: #f1f3f4;
      border-radius: 15px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      font-size: 12.5px;
      color: #202124;
      gap: 8px;
    }
    .lock-icon {
      color: #10b981;
      font-size: 12px;
    }

    .toolbar-extensions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ext-icon-badge {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #18181b;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .user-avatar-small {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      color: white;
      font-size: 11px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Webpage Viewport */
    .viewport {
      flex: 1;
      position: relative;
      background: #fafafa;
      overflow: hidden;
    }

    .webpage-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      filter: brightness(0.97);
    }

    /* Chrome Extension Popup Placement */
    .popup-wrapper {
      position: absolute;
      top: 6px;
      right: 18px;
      width: 380px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 14px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06);
      z-index: 100;
      animation: popIn 0.3s ease-out;
    }

    /* Banner callout on the left */
    .callout-overlay {
      position: absolute;
      bottom: 40px;
      left: 40px;
      max-width: 440px;
      background: rgba(9, 10, 15, 0.88);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 24px 28px;
      color: white;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
    }
    .callout-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .callout-title {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .callout-desc {
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="browser-window">
    <div class="browser-top">
      <div class="traffic-lights">
        <div class="traffic-light tl-red"></div>
        <div class="traffic-light tl-yellow"></div>
        <div class="traffic-light tl-green"></div>
      </div>
      <div class="browser-tab">
        <img src="${faviconBase64}" class="tab-icon" />
        <span>ShowTodo · Public Accountability</span>
      </div>
    </div>

    <div class="browser-nav">
      <div class="nav-buttons">
        <span>←</span>
        <span>→</span>
        <span>↻</span>
      </div>
      <div class="omnibox">
        <span class="lock-icon">🔒</span>
        <span>https://www.showtodo.com</span>
      </div>
      <div class="toolbar-extensions">
        <div class="ext-icon-badge">
          <img src="${faviconBase64}" style="width: 18px; height: 18px;" />
        </div>
        <div class="user-avatar-small">A</div>
      </div>
    </div>

    <div class="viewport">
      <img src="${homeFullBase64}" class="webpage-bg" />

      <!-- Authentic Extension Popup Mock -->
      ${popupHtml}

      <!-- Marketing Callout Card -->
      <div class="callout-overlay">
        <div class="callout-badge">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;"></span>
          Instant Capture
        </div>
        <div class="callout-title">Post Todos with 0-Latency, Right from Any Browser Tab</div>
        <div class="callout-desc">Full schedule planning, categories, and markdown notes. Seamlessly syncs with your ShowTodo public feed.</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const outputPath = path.join(promoDir, 'extension_screenshot_1_1280x800.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`✓ Generated: ${outputPath}`);
}

// 2. Generate Screenshot 2: 1280x800 Selection Auto-Fill
async function generateScreenshot2(page) {
  const selectedText = 'Design token system and dark mode zinc palette';
  const popupHtml = getCleanPopupHtml({
    content: selectedText,
    note: 'Extracted from technical documentation. Add to weekly sprint goals.',
    category: 'study'
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
    ${popupCss}
    
    body {
      width: 1280px;
      height: 800px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
    }

    .browser-window {
      width: 1280px;
      height: 800px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }

    .browser-top {
      height: 42px;
      background: #f1f3f4;
      display: flex;
      align-items: center;
      padding: 0 14px;
      border-bottom: 1px solid #e0e0e0;
      gap: 12px;
      flex-shrink: 0;
    }

    .traffic-lights { display: flex; gap: 8px; }
    .traffic-light { width: 12px; height: 12px; border-radius: 50%; }
    .tl-red { background: #ff5f56; }
    .tl-yellow { background: #ffbd2e; }
    .tl-green { background: #27c93f; }

    .browser-tab {
      background: #ffffff;
      height: 32px;
      border-radius: 8px 8px 0 0;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
      color: #202124;
    }

    .browser-nav {
      height: 44px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 16px;
      flex-shrink: 0;
    }

    .omnibox {
      flex: 1;
      height: 30px;
      background: #f1f3f4;
      border-radius: 15px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      font-size: 12.5px;
      color: #202124;
      gap: 8px;
    }

    .viewport {
      flex: 1;
      display: flex;
      position: relative;
      background: #fafafa;
    }

    /* Mock Documentation Article with Highlighted Text */
    .article-container {
      width: 760px;
      padding: 48px 60px;
      background: #ffffff;
      height: 100%;
      border-right: 1px solid #e5e7eb;
      box-sizing: border-box;
    }
    .article-tag {
      font-size: 12px;
      font-weight: 600;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .article-h1 {
      font-size: 26px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 18px;
      line-height: 1.3;
    }
    .article-p {
      font-size: 14.5px;
      line-height: 1.7;
      color: #4b5563;
      margin-bottom: 16px;
    }
    .highlight-selection {
      background: #bfdbfe;
      color: #1e3a8a;
      border-radius: 3px;
      padding: 2px 4px;
      font-weight: 600;
    }

    /* Popup on the right */
    .popup-wrapper {
      position: absolute;
      top: 6px;
      right: 18px;
      width: 380px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 14px;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06);
      z-index: 100;
    }

    /* Connecting arrow line / pointer effect */
    .feature-badge-float {
      position: absolute;
      bottom: 36px;
      left: 60px;
      background: rgba(17, 24, 39, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 14px;
      padding: 16px 20px;
      color: white;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 20px 30px rgba(0,0,0,0.25);
    }
    .badge-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
  </style>
</head>
<body>
  <div class="browser-window">
    <div class="browser-top">
      <div class="traffic-lights">
        <div class="traffic-light tl-red"></div>
        <div class="traffic-light tl-yellow"></div>
        <div class="traffic-light tl-green"></div>
      </div>
      <div class="browser-tab">
        <span>📄 Architecture Docs · Technical Spec</span>
      </div>
    </div>

    <div class="browser-nav">
      <div class="omnibox">
        <span>🔒 https://developer.internal.spec/docs/design-system</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 28px; height: 28px; border-radius: 6px; background: #18181b; display: flex; align-items: center; justify-content: center;">
          <img src="${faviconBase64}" style="width: 18px; height: 18px;" />
        </div>
      </div>
    </div>

    <div class="viewport">
      <div class="article-container">
        <div class="article-tag">Frontend Architecture</div>
        <h1 class="article-h1">Building Scalable Design Tokens & Themes</h1>
        <p class="article-p">
          When constructing multi-platform web extensions, visual consistency requires a unified palette. We established a strict <span class="highlight-selection">Design token system and dark mode zinc palette</span> across all public surfaces to maximize signal-to-noise ratio.
        </p>
        <p class="article-p">
          By utilizing native CSS custom properties and lightweight modules, popup performance remains under 16ms with zero cold start delays.
        </p>
      </div>

      <!-- Popup displaying selected text auto-filled -->
      ${popupHtml}

      <!-- Feature Highlight Badge -->
      <div class="feature-badge-float">
        <div class="badge-icon">✨</div>
        <div>
          <div style="font-size: 15px; font-weight: 700;">Selection Auto-Fill</div>
          <div style="font-size: 12.5px; color: #9ca3af; margin-top: 2px;">Highlight text on any site → Click extension → Directly auto-filled. No floating buttons or right-click clutter.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const outputPath = path.join(promoDir, 'extension_screenshot_2_1280x800.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`✓ Generated: ${outputPath}`);
}

// 3. Generate Small Promo Tile: 440x280
async function generateSmallPromoTile(page) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 440px;
      height: 280px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      text-align: center;
      padding: 24px;
    }

    /* Ambient Gradients */
    .ambient-1 {
      position: absolute;
      top: -40px;
      left: 20%;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 70%);
      filter: blur(40px);
      pointer-events: none;
    }

    .ambient-2 {
      position: absolute;
      bottom: -40px;
      right: 20%;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.24) 0%, transparent 70%);
      filter: blur(40px);
      pointer-events: none;
    }

    .logo-container {
      position: relative;
      z-index: 10;
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.25);
      margin-bottom: 16px;
    }

    .logo-img {
      width: 44px;
      height: 44px;
    }

    .brand-title {
      position: relative;
      z-index: 10;
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .brand-tagline {
      position: relative;
      z-index: 10;
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
      max-width: 320px;
      line-height: 1.45;
      margin-bottom: 16px;
    }

    .pill-badge {
      position: relative;
      z-index: 10;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="ambient-1"></div>
  <div class="ambient-2"></div>

  <div class="logo-container">
    <img src="${faviconBase64}" class="logo-img" />
  </div>

  <div class="brand-title">ShowTodo Quick Post</div>
  <div class="brand-tagline">Capture ideas & highlighted text to your public accountability feed with 1-click.</div>

  <div class="pill-badge">
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38bdf8;"></span>
    Official Chrome & Edge Extension
  </div>
</body>
</html>`;

  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const outputPath = path.join(promoDir, 'extension_promo_tile_440x280.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`✓ Generated: ${outputPath}`);
}

// 4. Generate Marquee Promo Tile: 1400x560
async function generateMarqueePromoTile(page) {
  const popupHtml = getCleanPopupHtml({
    content: 'Ship ShowTodo Chrome Extension to Web Store 🚀',
    note: 'Prepare screenshot assets, privacy policy URL, and publish checklist',
    category: 'dev'
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
    ${popupCss}

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 1400px;
      height: 560px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: #090a0f;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      position: relative;
    }

    /* Ambient Gradients */
    .mesh-gradient {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.22) 0%, transparent 50%),
        radial-gradient(circle at 80% 60%, rgba(56, 189, 248, 0.20) 0%, transparent 55%),
        radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.15) 0%, transparent 60%),
        #090a0f;
      pointer-events: none;
      z-index: 1;
    }

    .grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 50%, transparent 85%);
      pointer-events: none;
      z-index: 2;
    }

    /* Left Copy Area */
    .left-content {
      position: relative;
      z-index: 10;
      max-width: 580px;
    }

    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .brand-logo-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(0,0,0,0.4);
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .hero-h1 {
      font-size: 46px;
      font-weight: 800;
      line-height: 1.15;
      color: #ffffff;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
    }

    .hero-h1 span {
      background: linear-gradient(135deg, #34d399, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-p {
      font-size: 16px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 28px;
    }

    .feature-list {
      display: flex;
      gap: 20px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 600;
      color: #cbd5e1;
    }

    .check-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
    }

    /* Right Preview Area */
    .right-preview {
      position: relative;
      z-index: 10;
      width: 480px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .popup-wrapper {
      width: 380px;
      background: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      box-shadow: 
        0 30px 60px -12px rgba(0, 0, 0, 0.6),
        0 18px 36px -18px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(0, 0, 0, 0.08);
      transform: perspective(1000px) rotateY(-4deg) rotateX(2deg);
      transition: transform 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="mesh-gradient"></div>
  <div class="grid-lines"></div>

  <div class="left-content">
    <div class="brand-row">
      <div class="brand-logo-box">
        <img src="${faviconBase64}" style="width: 26px; height: 26px;" />
      </div>
      <div class="brand-badge">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;"></span>
        Chrome & Edge Extension
      </div>
    </div>

    <h1 class="hero-h1">Turn Any Web Idea Into <span>Public Todos</span></h1>
    <p class="hero-p">
      Instantly clip highlighted text, organize with smart schedules, and broadcast your goals to stay accountable — without ever leaving your workflow.
    </p>

    <div class="feature-list">
      <div class="feature-item">
        <span class="check-dot">✓</span>
        <span>0ms Instant Open</span>
      </div>
      <div class="feature-item">
        <span class="check-dot">✓</span>
        <span>Text Highlight Auto-fill</span>
      </div>
      <div class="feature-item">
        <span class="check-dot">✓</span>
        <span>⌘+Enter Publish</span>
      </div>
    </div>
  </div>

  <div class="right-preview">
    ${popupHtml}
  </div>
</body>
</html>`;

  await page.setViewportSize({ width: 1400, height: 560 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  const outputPath = path.join(promoDir, 'extension_marquee_promo_1400x560.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`✓ Generated: ${outputPath}`);
}

async function main() {
  console.log('Starting Chrome & Edge Extension Store Asset Generation...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    deviceScaleFactor: 1 // Strictly preserve required store dimensions
  });
  const page = await context.newPage();

  try {
    await generateScreenshot1(page);
    await generateScreenshot2(page);
    await generateSmallPromoTile(page);
    await generateMarqueePromoTile(page);
    console.log('All 4 store assets generated successfully with sensitive data removed!');
  } catch (err) {
    console.error('Asset generation failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
