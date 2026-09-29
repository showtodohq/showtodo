# Chrome Web Store Listing — ShowTodo Quick Post

> Last Updated: 2026-09-29

## Store Listing

**Extension Name** [REQUIRED]  
ShowTodo - Quick Post

**Short Description** [REQUIRED]  
Instantly capture ideas or highlighted web text and publish public todos to ShowTodo with a single click.

**Detailed Description** [REQUIRED]  
ShowTodo Quick Post is the official companion extension for ShowTodo (https://www.showtodo.com). It helps you stay accountable by letting you post public todos and action goals directly from any browser tab without breaking your focus.

KEY FEATURES
- Instant Capture: Click the extension icon to immediately compose and publish public tasks.
- Selection Auto-fill: Highlight any text on any webpage and open the extension to auto-fill your todo title. Zero page pollution, no intrusive floating buttons, and no context menu bloat.
- Complete Planning: Set optional start and due dates with smart quick presets (Now, Tomorrow, Monday, End of Day, Next Week).
- Organized Categories: Categorize your todos into Study, Fitness, Finance, Dev, Life, and Other with vibrant visual indicators.
- Seamless Authentication: Automatically connects to your active ShowTodo account via secure cookies or lets you sign in with Google or Email.
- Keyboard First: Hit Cmd+Enter (Mac) or Ctrl+Enter (Windows) to publish in a fraction of a second.

HOW TO USE
1. Click the ShowTodo icon in your browser toolbar (or highlight any text on a webpage first).
2. Review your todo content, select a category, and optionally add details or dates.
3. Press Cmd+Enter or click Post. Your task is published to ShowTodo instantly!

PRIVACY & PERMISSIONS
We believe in minimal, ethical software. ShowTodo Quick Post does not run tracking scripts, does not inject ads, and never reads your browsing activity. It only reads highlighted text on the active tab at the exact moment you open the popup.

SUPPORT & COMMUNITY
Website: https://www.showtodo.com  
Privacy Policy: https://www.showtodo.com/privacy  
Contact: privacy@showtodo.com

**Category** [REQUIRED]  
Productivity

**Single Purpose** [REQUIRED]  
Instantly publish public tasks and highlighted web text to ShowTodo with customizable schedules and categories.

**Primary Language** [REQUIRED]  
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `extension/icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Ready | `promo/extension_screenshot_1_1280x800.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ✅ Ready | `promo/extension_screenshot_2_1280x800.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ✅ Ready | `promo/extension_promo_tile_440x280.png` |
| Marquee Promo Tile | 1400×560 | ✅ Ready | `promo/extension_marquee_promo_1400x560.png` |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `cookies` | permissions | Required to seamlessly read the user's authenticated session cookie (`better-auth.session_token`) on ShowTodo (`https://www.showtodo.com`), enabling instant login state synchronization without asking the user to log in twice. |
| `storage` | permissions | Used exclusively to save local preferences such as the preferred backend API base and cached user profile for zero-latency synchronous popup rendering. |
| `activeTab` | permissions | Granted temporarily when the user clicks the extension action icon to extract the user's selected text on the active webpage, enabling seamless text clipping into the task form. |
| `scripting` | permissions | Used to execute a single-line function (`window.getSelection().toString()`) on the active tab upon popup launch to read the user's highlighted text. |
| `https://www.showtodo.com/*` | host_permissions | Required to communicate with the ShowTodo backend API to verify session credentials and submit new todos to the user's public feed. |
| `http://127.0.0.1:3003/*` | host_permissions | Used during local development and testing to interact with local development server. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | Yes (Name, Email, Handle) | Yes (To ShowTodo API) | Display user identity in popup and assign author to created todos | No |
| Authentication info | Yes (Session Token) | Yes (To ShowTodo API) | Authenticate requests to create todos | No |
| Website content | Yes (Highlighted text only) | Yes (To ShowTodo API when user clicks Post) | Allow user to turn selected text into a todo | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL** [REQUIRED]  
https://www.showtodo.com/privacy

---

## Distribution

**Visibility**: Public  
**Regions**: All regions  

---

## Developer Info

**Publisher Name** [REQUIRED]  
ShowTodo

**Contact Email** [REQUIRED]  
privacy@showtodo.com

**Homepage URL** [RECOMMENDED]  
https://www.showtodo.com
