import { CATEGORIES, DEFAULT_API_BASE, PRODUCTION_API_BASE, STORAGE_KEY_API_BASE, STORAGE_KEY_USER } from './constants.js';

// --- State ---
let currentApiBase = DEFAULT_API_BASE;
let currentUser = null;
let selectedCategory = null;
let activeQuickStart = null;
let activeQuickDue = null;
let isSubmitting = false;

// --- Synchronous Cache Restoration (0ms Instant Render) ---
try {
  const savedBase = localStorage.getItem(STORAGE_KEY_API_BASE);
  if (savedBase) {
    currentApiBase = savedBase.includes('localhost:3003') ? DEFAULT_API_BASE : savedBase;
  }
  const savedUser = localStorage.getItem(STORAGE_KEY_USER);
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.warn('Sync cache restore failed:', e);
}

// --- DOM Elements ---
const toastEl = document.getElementById('toast');
const userAreaEl = document.getElementById('user-area');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name');
const btnLogoutEl = document.getElementById('btn-logout');

const viewLoginEl = document.getElementById('view-login');
const viewPublishEl = document.getElementById('view-publish');

// Login Form Elements
const btnGoogleLoginEl = document.getElementById('btn-google-login');
const formPasswordLoginEl = document.getElementById('form-password-login');
const loginEmailEl = document.getElementById('login-email');
const loginPasswordEl = document.getElementById('login-password');
const loginErrorEl = document.getElementById('login-error');
const btnSubmitLoginEl = document.getElementById('btn-submit-login');

// Publish Form Elements
const contentInputEl = document.getElementById('todo-content');
const noteInputEl = document.getElementById('todo-note');
const notePublicEl = document.getElementById('note-public');
const startDateInputEl = document.getElementById('start-date');
const dueDateInputEl = document.getElementById('due-date');
const timeErrorEl = document.getElementById('time-error');
const btnClearScheduleEl = document.getElementById('btn-clear-schedule');
const categoryContainerEl = document.getElementById('category-container');
const btnPostEl = document.getElementById('btn-post');
const btnPostTextEl = document.getElementById('btn-post-text');

// Environment Elements
const currentApiLabelEl = document.getElementById('current-api-label');
const btnToggleEnvEl = document.getElementById('btn-toggle-env');

// --- Helper Functions ---
function showToast(message, duration = 2200) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}

function formatLocalDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// --- Environment Management ---
function updateEnvUI() {
  const isLocal = currentApiBase.includes('localhost') || currentApiBase.includes('127.0.0.1');
  currentApiLabelEl.textContent = isLocal ? '127.0.0.1:3003' : 'www.showtodo.com';
  btnToggleEnvEl.textContent = isLocal ? 'Switch to Prod' : 'Switch to Local';
}

async function toggleApiBase() {
  const isLocal = currentApiBase.includes('localhost') || currentApiBase.includes('127.0.0.1');
  currentApiBase = isLocal ? PRODUCTION_API_BASE : DEFAULT_API_BASE;
  try {
    localStorage.setItem(STORAGE_KEY_API_BASE, currentApiBase);
  } catch {}
  await chrome.storage.local.set({ [STORAGE_KEY_API_BASE]: currentApiBase });
  updateEnvUI();
  showToast(`Switched API to ${isLocal ? 'Production' : '127.0.0.1:3003'}`);
  await checkSession();
}

// --- Session Verification (Background SWR) ---
async function checkSession() {
  try {
    const res = await fetch(`${currentApiBase}/api/auth/get-session`, {
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        currentUser = data.user;
        try {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
        } catch {}
        renderLoggedInView();
        return;
      }
    }
  } catch (err) {
    console.warn('Session check failed:', err);
    // If network error, retain cached user session to avoid flashing logout
    if (currentUser) {
      return;
    }
  }
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {}
  renderLoggedOutView();
}

function renderLoggedInView() {
  viewLoginEl.classList.add('hidden');
  viewPublishEl.classList.remove('hidden');
  userAreaEl.classList.remove('hidden');

  const displayName = currentUser.name || currentUser.nickname || currentUser.email.split('@')[0];
  const handle = currentUser.handle ? `@${currentUser.handle}` : displayName;

  userNameEl.textContent = handle;
  userNameEl.title = `${displayName} (${currentUser.email})`;

  if (currentUser.image || currentUser.avatar) {
    userAvatarEl.innerHTML = `<img src="${currentUser.image || currentUser.avatar}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
  } else {
    userAvatarEl.textContent = displayName.charAt(0).toUpperCase();
  }

  contentInputEl.focus();
  validateForm();
}

function renderLoggedOutView() {
  viewPublishEl.classList.add('hidden');
  userAreaEl.classList.add('hidden');
  viewLoginEl.classList.remove('hidden');
  loginErrorEl.classList.add('hidden');
  loginEmailEl.focus();
}

// --- Category Pills ---
function initCategories() {
  categoryContainerEl.innerHTML = '';
  CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-pill';
    btn.dataset.id = cat.id;
    btn.innerHTML = `<span class="color-dot" style="background-color: ${cat.color}"></span><span>${cat.name}</span>`;

    btn.addEventListener('click', () => {
      if (selectedCategory === cat.id) {
        selectedCategory = null;
        btn.classList.remove('active');
      } else {
        selectedCategory = cat.id;
        document.querySelectorAll('.category-pill').forEach((el) => el.classList.remove('active'));
        btn.classList.add('active');
      }
    });

    categoryContainerEl.appendChild(btn);
  });
}

// --- Schedule Quick Actions ---
function setQuickStartDate(type) {
  if (activeQuickStart === type) {
    startDateInputEl.value = '';
    activeQuickStart = null;
    updateQuickPills();
    validateForm();
    return;
  }
  activeQuickStart = type;
  const target = new Date();
  if (type === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0);
  } else if (type === 'nextMonday') {
    const day = target.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    target.setDate(target.getDate() + diff);
    target.setHours(9, 0, 0, 0);
  }
  startDateInputEl.value = formatLocalDateTime(target);
  updateQuickPills();
  validateForm();
}

function setQuickDueDate(type) {
  if (activeQuickDue === type) {
    dueDateInputEl.value = '';
    activeQuickDue = null;
    updateQuickPills();
    validateForm();
    return;
  }
  activeQuickDue = type;
  const target = new Date();
  if (type === 'eod') {
    target.setHours(23, 59, 0, 0);
  } else if (type === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    target.setHours(23, 59, 0, 0);
  } else if (type === 'nextWeek') {
    target.setDate(target.getDate() + 7);
    target.setHours(23, 59, 0, 0);
  }
  dueDateInputEl.value = formatLocalDateTime(target);
  updateQuickPills();
  validateForm();
}

function updateQuickPills() {
  document.querySelectorAll('[data-start]').forEach((el) => {
    el.classList.toggle('active', el.dataset.start === activeQuickStart);
  });
  document.querySelectorAll('[data-due]').forEach((el) => {
    el.classList.toggle('active', el.dataset.due === activeQuickDue);
  });
}

function clearSchedule() {
  startDateInputEl.value = '';
  dueDateInputEl.value = '';
  activeQuickStart = null;
  activeQuickDue = null;
  updateQuickPills();
  validateForm();
}

// --- Validation ---
function validateForm() {
  const content = contentInputEl.value.trim();
  const start = startDateInputEl.value;
  const due = dueDateInputEl.value;

  let isTimeInvalid = false;
  if (start && due) {
    isTimeInvalid = new Date(start).getTime() > new Date(due).getTime();
  }

  timeErrorEl.classList.toggle('hidden', !isTimeInvalid);

  const canSubmit = Boolean(content) && !isTimeInvalid && !isSubmitting;
  btnPostEl.disabled = !canSubmit;
  return canSubmit;
}

// --- Publish Action ---
async function handlePublish() {
  if (!validateForm() || isSubmitting) return;

  const content = contentInputEl.value.trim();
  const note = noteInputEl.value.trim();
  const isNotePublic = notePublicEl.checked;
  const startDate = startDateInputEl.value ? new Date(startDateInputEl.value).toISOString() : null;
  const dueDate = dueDateInputEl.value ? new Date(dueDateInputEl.value).toISOString() : null;

  isSubmitting = true;
  btnPostEl.disabled = true;
  btnPostTextEl.textContent = 'Posting...';

  try {
    const payload = {
      content,
      note: note || null,
      isNotePublic,
      category: selectedCategory,
      startDate,
      dueDate
    };

    const res = await fetch(`${currentApiBase}/api/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || errData.message || 'Failed to create todo');
    }

    showToast('Todo posted successfully! ✓');
    contentInputEl.value = '';
    noteInputEl.value = '';
    clearSchedule();
    selectedCategory = null;
    document.querySelectorAll('.category-pill').forEach((el) => el.classList.remove('active'));

    // Gracefully close after feedback
    setTimeout(() => {
      window.close();
    }, 900);
  } catch (err) {
    console.error('Publish error:', err);
    showToast(err.message || 'Failed to post todo');
  } finally {
    isSubmitting = false;
    btnPostTextEl.textContent = 'Post';
    validateForm();
  }
}

// --- Auth Actions ---
async function handlePasswordLogin(e) {
  e.preventDefault();
  const email = loginEmailEl.value.trim().toLowerCase();
  const password = loginPasswordEl.value;

  if (!email || !password) return;

  btnSubmitLoginEl.disabled = true;
  btnSubmitLoginEl.textContent = 'Signing in...';
  loginErrorEl.classList.add('hidden');

  try {
    const res = await fetch(`${currentApiBase}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Invalid email or password');
    }

    showToast('Signed in successfully!');
    loginPasswordEl.value = '';
    if (data.user) {
      currentUser = data.user;
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } catch {}
      renderLoggedInView();
    }
    await checkSession();
  } catch (err) {
    loginErrorEl.textContent = err.message || 'Login failed';
    loginErrorEl.classList.remove('hidden');
  } finally {
    btnSubmitLoginEl.disabled = false;
    btnSubmitLoginEl.textContent = 'Sign In';
  }
}

async function handleGoogleLogin() {
  btnGoogleLoginEl.disabled = true;
  btnGoogleLoginEl.style.opacity = '0.7';
  showToast('Connecting to Google...');

  try {
    const res = await fetch(`${currentApiBase}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        provider: 'google',
        callbackURL: `${currentApiBase}/`,
        disableRedirect: true
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      throw new Error(data.message || 'Failed to initialize Google login');
    }

    // Direct navigation to Google's OAuth consent page
    chrome.tabs.create({ url: data.url });
    showToast('Redirected to Google sign-in');
  } catch (err) {
    console.error('Google login error:', err);
    showToast(err.message || 'Google sign-in failed');
  } finally {
    btnGoogleLoginEl.disabled = false;
    btnGoogleLoginEl.style.opacity = '';
  }
}

async function handleLogout() {
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {}
  currentUser = null;
  renderLoggedOutView();
  try {
    await fetch(`${currentApiBase}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Logout failed:', err);
  }
  showToast('Signed out');
  await checkSession();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Post button click
  btnPostEl.addEventListener('click', handlePublish);

  // Form input validation & keyboard submit
  contentInputEl.addEventListener('input', validateForm);
  noteInputEl.addEventListener('input', validateForm);

  contentInputEl.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePublish();
    }
  });

  noteInputEl.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePublish();
    }
  });

  // Schedule Quick Pills
  document.querySelectorAll('[data-start]').forEach((btn) => {
    btn.addEventListener('click', () => setQuickStartDate(btn.dataset.start));
  });

  document.querySelectorAll('[data-due]').forEach((btn) => {
    btn.addEventListener('click', () => setQuickDueDate(btn.dataset.due));
  });

  startDateInputEl.addEventListener('input', () => {
    activeQuickStart = null;
    updateQuickPills();
    validateForm();
  });

  dueDateInputEl.addEventListener('input', () => {
    activeQuickDue = null;
    updateQuickPills();
    validateForm();
  });

  btnClearScheduleEl.addEventListener('click', clearSchedule);

  // Auth Events
  formPasswordLoginEl.addEventListener('submit', handlePasswordLogin);
  btnGoogleLoginEl.addEventListener('click', handleGoogleLogin);
  btnLogoutEl.addEventListener('click', handleLogout);

  // Environment Switcher
  btnToggleEnvEl.addEventListener('click', toggleApiBase);

  // Listen for cookie changes (e.g. completing Google login in a tab)
  if (chrome.cookies?.onChanged) {
    chrome.cookies.onChanged.addListener((changeInfo) => {
      if (changeInfo.cookie?.name?.includes('better-auth.session_token')) {
        checkSession();
      }
    });
  }
}

// --- Initialization (Instant Synchronous Render + Background SWR) ---
function init() {
  initCategories();
  updateEnvUI();

  // Instant 0ms render from synchronous cache
  if (currentUser) {
    renderLoggedInView();
  } else {
    renderLoggedOutView();
  }

  setupEventListeners();

  // Background non-blocking session revalidation
  checkSession();
}

init();
