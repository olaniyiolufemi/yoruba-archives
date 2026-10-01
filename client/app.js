const API = '/api';

const catIcons = {};

const catColors = {
  1: { bg: '#f0f0f0', accent: '#888888' },
  2: { bg: '#ebebeb', accent: '#777777' },
  3: { bg: '#e8e8e8', accent: '#666666' },
  4: { bg: '#f2f2f2', accent: '#555555' },
  5: { bg: '#eeeeee', accent: '#999999' },
  6: { bg: '#f4f4f4', accent: '#aaaaaa' }
};

let state = {
  user: null,
  token: null,
  currentPage: 'home',
  prevPage: null,
  archivePage: 1,
  archiveSearch: '',
  archiveCat: '',
  archiveSrc: '',
  reqStatus: '',
  reqPage: 1,
  homeTab: 'verified',
  debounceTimer: null
};

function api(path, opts = {}) {
  const headers = {};
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  if (!opts.formData) headers['Content-Type'] = 'application/json';
  return fetch(`${API}${path}`, {
    ...opts,
    headers: opts.formData ? { 'Authorization': `Bearer ${state.token}` } : headers,
    body: opts.formData || (opts.body ? JSON.stringify(opts.body) : undefined)
  }).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  });
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('ya_token', token);
  localStorage.setItem('ya_user', JSON.stringify(user));
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('ya_token');
  localStorage.removeItem('ya_user');
}

function loadSession() {
  const t = localStorage.getItem('ya_token');
  const u = localStorage.getItem('ya_user');
  if (t && u) { state.token = t; state.user = JSON.parse(u); return true; }
  return false;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  return m < 12 ? `${m}mo ago` : `${Math.floor(m / 12)}y ago`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusPill(s) {
  const map = {
    verified: ['status-verified', 'Active'],
    pending: ['status-pending', 'Pending'],
    rejected: ['status-rejected', 'Rejected'],
    revision_requested: ['status-revision_requested', 'Revision']
  };
  const [cls, label] = map[s] || ['status-pending', s];
  return `<span class="status-pill ${cls}">${label}</span>`;
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function updateNav() {
  const u = state.user;
  const loginBtnTop = document.getElementById('login-btn-top');
  const registerBtnTop = document.getElementById('register-btn-top');
  const notifBtn = document.getElementById('notif-btn');
  const topAvatar = document.getElementById('top-avatar');
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarName = document.getElementById('sidebar-name');
  const sidebarRole = document.getElementById('sidebar-role');
  const adminLink = document.getElementById('nav-admin');
  const mySubLink = document.getElementById('nav-my-submissions');
  const loginLink = document.getElementById('sidebar-login');
  const logoutLink = document.getElementById('sidebar-logout');

  if (u) {
    loginBtnTop.style.display = 'none';
    registerBtnTop.style.display = 'none';
    notifBtn.style.display = 'flex';
    topAvatar.style.display = 'flex';
    topAvatar.textContent = initials(u.name);
    sidebarAvatar.textContent = initials(u.name);
    sidebarName.textContent = u.name;
    sidebarRole.textContent = u.role.charAt(0).toUpperCase() + u.role.slice(1) + ' Account';
    document.getElementById('menu-name').textContent = u.name;
    document.getElementById('menu-role').textContent = u.role;
    adminLink.style.display = (u.role === 'admin' || u.role === 'reviewer') ? 'flex' : 'none';
    mySubLink.style.display = 'flex';
    loginLink.style.display = 'none';
    logoutLink.style.display = 'flex';
    fetchNotifications();
  } else {
    loginBtnTop.style.display = 'flex';
    registerBtnTop.style.display = 'flex';
    notifBtn.style.display = 'none';
    topAvatar.style.display = 'none';
    sidebarAvatar.textContent = '?';
    sidebarName.textContent = 'Sign In';
    sidebarRole.textContent = 'Guest';
    adminLink.style.display = 'none';
    mySubLink.style.display = 'none';
    loginLink.style.display = 'flex';
    logoutLink.style.display = 'none';
  }
}

function navigate(page, data) {
  state.prevPage = state.currentPage;
  state.currentPage = page;

  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[id^="nav-"]').forEach(l => l.classList.remove('active'));

  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  closeAllDropdowns();

  if (page === 'home') loadHome();
  else if (page === 'archive') { state.archiveCat = data || state.archiveCat; loadArchive(); }
  else if (page === 'requests') loadRequests();
  else if (page === 'admin') loadAdmin();
  else if (page === 'my-submissions') loadMySubmissions();
  else if (page === 'detail' && data) loadDetail(data);

  window.scrollTo(0, 0);
}

function goBack() { navigate(state.prevPage || 'archive'); }

function openModal(id) {
  if ((id === 'submit-modal' || id === 'request-modal') && !state.user) {
    toast('Please sign in first', 'info');
    openModal('login-modal');
    return;
  }
  if (id === 'submit-modal') loadCatsToForm();
  document.getElementById(id).classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function closeModalOnBg(e, id) { if (e.target === e.currentTarget) closeModal(id); }

function closeAllDropdowns() {
  document.getElementById('notif-panel').classList.remove('open');
  document.getElementById('user-menu').classList.remove('open');
}

function toggleNotifPanel() {
  document.getElementById('user-menu').classList.remove('open');
  document.getElementById('notif-panel').classList.toggle('open');
}

function toggleUserMenu() {
  document.getElementById('notif-panel').classList.remove('open');
  document.getElementById('user-menu').classList.toggle('open');
}

document.addEventListener('click', e => {
  const np = document.getElementById('notif-panel');
  const um = document.getElementById('user-menu');
  const nb = document.getElementById('notif-btn');
  const ta = document.getElementById('top-avatar');
  const sa = document.getElementById('account-switcher');
  if (!np.contains(e.target) && e.target !== nb) np.classList.remove('open');
  if (!um.contains(e.target) && e.target !== ta && e.target !== sa) um.classList.remove('open');
});

function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  const icons = { success: '+', error: 'x', info: 'i' };
  div.innerHTML = `<span style="width:16px;height:16px;border-radius:50%;background:#111111;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function buildCard(s) {
  const col = catColors[s.category_id] || { bg: '#f4f4f6', accent: '#7A7A82' };
  const icon = catIcons[s.category_name] || '—';
  const srcTag = s.source_type === 'aggregated' ? `<span class="proj-tag">External source</span>` : '';
  return `
    <div class="proj-card" onclick="navigate('detail','${s.submission_id}')">
      <div class="proj-card-inner">
        <div class="proj-card-header">
          <div class="proj-client">
            <div class="proj-client-logo" style="background:#eeeeee"></div>
            <div>
              <div class="proj-client-name">${esc(s.author_name)}</div>
              <div class="proj-client-date">${fmtDate(s.created_at)}</div>
            </div>
          </div>
          <div class="proj-header-right">
            ${statusPill(s.status)}
            <button class="more-btn" onclick="event.stopPropagation()">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
          </div>
        </div>
        <div class="proj-img-wrap">
          <div class="proj-img-placeholder" style="background:linear-gradient(135deg,#f0f0f0,#e0e0e0)"></div>
        </div>
      </div>
      <div class="proj-card-body">
        <div class="proj-title">${esc(s.title)}</div>
        <div class="proj-tags">
          <span class="proj-tag">${esc(s.category_name)}</span>
          ${srcTag}
          ${s.institution ? `<span class="proj-tag">${esc(s.institution.split(' ').slice(-2).join(' '))}</span>` : ''}
        </div>
        <div class="proj-meta">
          <div class="proj-meta-row">
            <span class="proj-meta-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            ${s.source_type === 'aggregated' ? 'Aggregated source' : 'Contributed research'}
          </div>
          ${s.file_name ? `<div class="proj-meta-row">
            <span class="proj-meta-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            ${esc(s.file_name)}
          </div>` : ''}
          <div class="proj-meta-row">
            <span class="proj-meta-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            Added ${relTime(s.created_at)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function adjustHex(hex, amount) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1,3),16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3,5),16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5,7),16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

const catAccentColors = {
  1: { band: 'linear-gradient(90deg,#cccccc,#e8e8e8)', pill: '#f0f0f0', pillText: '#333333' },
  2: { band: 'linear-gradient(90deg,#b0b0b0,#d8d8d8)', pill: '#ebebeb', pillText: '#222222' },
  3: { band: 'linear-gradient(90deg,#c0c0c0,#e0e0e0)', pill: '#f0f0f0', pillText: '#2a2a2a' },
  4: { band: 'linear-gradient(90deg,#aaaaaa,#d0d0d0)', pill: '#ebebeb', pillText: '#1a1a1a' },
  5: { band: 'linear-gradient(90deg,#bbbbbb,#dedede)', pill: '#f2f2f2', pillText: '#333333' },
  6: { band: 'linear-gradient(90deg,#c8c8c8,#e4e4e4)', pill: '#f4f4f4', pillText: '#2a2a2a' }
};

const avatarGradients = [
  'linear-gradient(135deg,#555555,#222222)',
  'linear-gradient(135deg,#666666,#333333)',
  'linear-gradient(135deg,#888888,#444444)',
  'linear-gradient(135deg,#444444,#111111)',
  'linear-gradient(135deg,#777777,#3a3a3a)',
  'linear-gradient(135deg,#999999,#555555)'
];

function avatarGrad(name) {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return avatarGradients[h % avatarGradients.length];
}

function buildArchiveCard(s) {
  const col = catAccentColors[s.category_id] || { band: 'linear-gradient(90deg,#cccccc,#e0e0e0)', pill: '#f0f0f0', pillText: '#444444' };
  const icon = '';
  const grad = avatarGrad(s.author_name);
  const srcTag = s.source_type === 'aggregated'
    ? `<span class="archive-source-tag">Aggregated</span>`
    : '';
  return `
    <div class="archive-card" onclick="navigate('detail','${s.submission_id}')">
      <div class="archive-card-band" style="background:${col.band}"></div>
      <div class="archive-card-body">
        <div class="archive-card-top">
          <span class="archive-cat-pill" style="background:${col.pill};color:${col.pillText}">${esc(s.category_name)}</span>
          ${srcTag}
        </div>
        <div class="archive-card-title">${esc(s.title)}</div>
        <div class="archive-card-abstract">${esc(s.abstract)}</div>
      </div>
      <div class="archive-card-footer">
        <div class="archive-card-author">
          <div class="archive-author-avatar" style="background:${grad}">${initials(s.author_name)}</div>
          <div class="archive-author-info">
            <div class="archive-author-name">${esc(s.author_name)}</div>
            <div class="archive-author-date">${fmtDate(s.created_at)}</div>
          </div>
        </div>
        ${statusPill(s.status)}
      </div>
    </div>
  `;
}


async function loadHome() {
  const row = document.getElementById('home-cards');
  row.innerHTML = `
    <div class="skeleton skeleton-card-wrap"></div>
    <div class="skeleton skeleton-card-wrap"></div>
    <div class="skeleton skeleton-card-wrap"></div>
  `;
  try {
    const [subsData, reqData] = await Promise.all([
      api(`/submissions?limit=8${state.homeTab === 'aggregated' ? '&source_type=aggregated' : state.homeTab === 'pending' ? '&status=pending' : '&status=verified'}`),
      api('/requests?limit=3')
    ]);

    document.getElementById('stat-verified').textContent = subsData.total;
    document.getElementById('stat-reqs').textContent = reqData.total;

    if (subsData.submissions.length) {
      row.innerHTML = subsData.submissions.map(s => buildCard(s)).join('');
    } else {
      row.innerHTML = `<div class="empty-state" style="width:100%"><div class="empty-icon">—</div><div class="empty-title">No research found</div><div class="empty-body">Be the first to submit in this category.</div></div>`;
    }
  } catch (err) {
    row.innerHTML = `<div class="empty-state" style="width:100%"><div class="empty-icon">!</div><div class="empty-title">Failed to load</div></div>`;
  }
}

function homeTab(tab, el) {
  document.querySelectorAll('#home-tabs .tab-item').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  state.homeTab = tab;
  loadHome();
}

async function loadCatsToForm() {
  try {
    const cats = await api('/submissions/categories');
    const sel = document.getElementById('sub-category');
    sel.innerHTML = cats.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
  } catch (_) {}
}

async function loadArchive() {
  const grid = document.getElementById('archive-grid');
  grid.innerHTML = `
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
    <div class="skeleton" style="height:220px;border-radius:20px"></div>
  `;

  try {
    const cats = await api('/submissions/categories');
    const filterRow = document.getElementById('category-filters');
    if (filterRow.querySelectorAll('[data-cat]').length === 1) {
      cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.dataset.cat = c.category_id;
        btn.textContent = `${catIcons[c.category_name] || ''} ${c.category_name}`;
        btn.onclick = () => setFilter(btn, c.category_id);
        filterRow.appendChild(btn);
      });
    }

    let url = `/submissions?page=${state.archivePage}&limit=9`;
    if (state.archiveSearch) url += `&q=${encodeURIComponent(state.archiveSearch)}`;
    if (state.archiveCat) url += `&category=${state.archiveCat}`;
    if (state.archiveSrc) url += `&source_type=${state.archiveSrc}`;

    const data = await api(url);
    grid.innerHTML = data.submissions.length
      ? data.submissions.map(s => buildArchiveCard(s)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">—</div><div class="empty-title">No results</div><div class="empty-body">Try adjusting your filters or search term.</div></div>`;

    buildPagination('archive-pagination', data.page, data.pages, p => { state.archivePage = p; loadArchive(); });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">!</div><div class="empty-title">Failed to load archive</div></div>`;
  }
}

async function loadDetail(id) {
  const row = document.getElementById('detail-status-row');
  const titleEl = document.getElementById('detail-title');
  const metaEl = document.getElementById('detail-meta');
  const bodyEl = document.getElementById('detail-body');

  row.innerHTML = '';
  titleEl.textContent = 'Loading...';
  metaEl.innerHTML = '';
  bodyEl.innerHTML = '';

  try {
    const s = await api(`/submissions/${id}`);
    const col = catColors[s.category_id] || { bg: '#f4f4f6', accent: '#7A7A82' };
    const icon = catIcons[s.category_name] || '—';

    row.innerHTML = `
      <span class="cat-pill">${icon} ${esc(s.category_name)}</span>
      ${statusPill(s.status)}
      ${s.source_type === 'aggregated' ? '<span class="proj-tag" style="border:1px solid var(--border);padding:4px 12px;border-radius:999px;font-size:11px;color:var(--text-1)">Aggregated</span>' : ''}
    `;
    titleEl.textContent = s.title;
    metaEl.innerHTML = `
      <div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${esc(s.author_name)}
      </div>
      ${s.institution ? `<div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        ${esc(s.institution)}
      </div>` : ''}
      <div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${fmtDate(s.created_at)}
      </div>
    `;

    let fileHtml = '';
    if (s.file_url) {
      const icons = { 'application/pdf': 'PDF', 'image/jpeg': 'IMG', 'image/png': 'IMG', 'audio/mpeg': 'MP3', 'video/mp4': 'MP4' };
      const ico = icons[s.file_type] || 'FILE';
      fileHtml = `
        <div class="file-card">
          <div class="file-card-icon">${ico}</div>
          <div style="flex:1">
            <div class="file-card-name">${esc(s.file_name || 'Attached file')}</div>
            <div class="file-card-type">${esc(s.file_type || '')}</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="${esc(s.file_url)}" target="_blank" rel="noopener">Download</a>
        </div>
      `;
    }

    const shareUrl = `${location.origin}/?share=${encodeURIComponent(s.shareable_link)}`;

    let reviewHtml = '';
    if (state.user && (state.user.role === 'reviewer' || state.user.role === 'admin') && s.status === 'pending') {
      reviewHtml = `
        <div class="review-action-card">
          <div>
            <div class="review-action-label">Peer Review Required</div>
            <div class="review-action-sub">This submission is awaiting your decision.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openReviewModal('${s.submission_id}')">Submit Decision</button>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      <div class="abstract-card">
        <div class="abstract-label">Abstract</div>
        ${esc(s.abstract)}
      </div>
      ${fileHtml}
      <div class="share-card">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:500;color:var(--text-1);margin-bottom:6px">Shareable Link</div>
          <div class="share-url-box" id="share-url-box">${shareUrl}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="copyShare('${shareUrl}')">Copy</button>
      </div>
      ${reviewHtml}
    `;
  } catch (_) {
    bodyEl.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><div class="empty-title">Could not load submission</div></div>`;
  }
}

function openReviewModal(id) {
  document.getElementById('review-sub-id').value = id;
  openModal('review-modal');
}

function copyShare(url) {
  navigator.clipboard.writeText(url).then(() => toast('Link copied!', 'success'));
}

function buildReqCard(r) {
  const statusMap = { open: ['rsb-open', 'Open'], prioritized: ['rsb-prioritized', 'Prioritized'], addressed: ['rsb-addressed', 'Addressed'] };
  const [cls, label] = statusMap[r.status] || ['rsb-open', r.status];
  return `
    <div class="req-card">
      <div class="vote-col">
        <div class="vote-num">${r.vote_count}</div>
        <button class="vote-btn" onclick="voteRequest(${r.request_id}, this)" title="Upvote">▲</button>
        <div class="vote-label">votes</div>
      </div>
      <div class="req-body">
        <div class="req-title">${esc(r.topic)}</div>
        <div class="req-desc">${esc(r.description)}</div>
        <div class="req-footer">
          <span>${esc(r.requester_name || 'Anonymous')}</span>
          <span class="req-status-badge ${cls}">${label}</span>
          <span>${relTime(r.created_at)}</span>
        </div>
      </div>
    </div>
  `;
}

async function loadRequests() {
  const el = document.getElementById('requests-list');
  el.innerHTML = '<div style="color:var(--text-2);font-size:13px;padding:20px 0">Loading...</div>';
  try {
    let url = `/requests?page=${state.reqPage}&limit=10`;
    if (state.reqStatus) url += `&status=${state.reqStatus}`;
    const data = await api(url);
    el.innerHTML = data.requests.length
      ? data.requests.map(r => buildReqCard(r)).join('')
      : `<div class="empty-state"><div class="empty-icon">—</div><div class="empty-title">No requests found</div></div>`;
    buildPagination('requests-pagination', data.page, data.pages, p => { state.reqPage = p; loadRequests(); });
  } catch (_) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">!</div><div class="empty-title">Failed to load</div></div>`;
  }
}

async function voteRequest(id, btn) {
  if (!state.user) { toast('Sign in to vote', 'info'); return; }
  try {
    const res = await api(`/requests/${id}/vote`, { method: 'POST' });
    const numEl = btn.previousElementSibling;
    numEl.textContent = parseInt(numEl.textContent) + (res.voted ? 1 : -1);
    btn.classList.toggle('voted', res.voted);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadAdmin() {
  if (!state.user || (state.user.role !== 'admin' && state.user.role !== 'reviewer')) {
    toast('Access denied', 'error');
    navigate('home');
    return;
  }
  adminTab('overview');
}

async function adminTab(tab) {
  document.querySelectorAll('#page-admin .tab-item').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById(`atab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  ['overview','review','users','sources'].forEach(t => {
    document.getElementById(`admin-${t}`).style.display = t === tab ? 'block' : 'none';
  });

  if (tab === 'overview') {
    try {
      const stats = await api('/admin/stats');
      document.getElementById('admin-overview').innerHTML = `
        <div class="admin-stat-row">
          <div class="admin-stat"><div class="admin-stat-label">Total Submissions</div><div class="admin-stat-value sv-accent">${stats.total_submissions}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Verified</div><div class="admin-stat-value sv-green">${stats.verified}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Pending</div><div class="admin-stat-value sv-amber">${stats.pending}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Rejected</div><div class="admin-stat-value sv-red">${stats.rejected}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Users</div><div class="admin-stat-value sv-accent">${stats.total_users}</div></div>
          <div class="admin-stat"><div class="admin-stat-label">Research Requests</div><div class="admin-stat-value">${stats.total_requests}</div></div>
        </div>
        <div style="font-size:14px;font-weight:500;color:var(--text-0);margin-bottom:14px">Submissions by Category</div>
        ${stats.by_category.map(c => `
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <span>${catIcons[c.category_name] || ''} ${c.category_name}</span>
              <span style="color:var(--text-2)">${c.count}</span>
            </div>
            <div class="prog-outer">
              <div class="prog-inner" style="width:${Math.round((c.count/Math.max(stats.total_submissions,1))*100)}%"></div>
            </div>
          </div>
        `).join('')}
      `;
    } catch (_) {}
  } else if (tab === 'review') {
    try {
      const subs = await api('/admin/pending');
      const el = document.getElementById('admin-review');
      el.innerHTML = subs.length
        ? `<div class="content-grid">${subs.map(s => `
            <div class="proj-card">
              <div class="proj-card-body" style="padding-top:20px">
                <div class="proj-card-header" style="margin-bottom:12px">
                  <span class="cat-pill">${catIcons[s.category_name] || ''} ${esc(s.category_name)}</span>
                  ${statusPill(s.status)}
                </div>
                <div class="proj-title" style="font-size:16px;margin-bottom:8px">${esc(s.title)}</div>
                <div style="font-size:12px;color:var(--text-2);margin-bottom:14px;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">${esc(s.abstract)}</div>
                <div style="font-size:12px;color:var(--text-2);margin-bottom:14px">by ${esc(s.author_name)} · ${relTime(s.created_at)}</div>
                <div style="display:flex;gap:8px">
                  <button class="btn btn-ghost btn-sm" onclick="navigate('detail','${s.submission_id}')">View</button>
                  <button class="btn btn-primary btn-sm" onclick="openReviewModal('${s.submission_id}')">Review</button>
                </div>
              </div>
            </div>
          `).join('')}</div>`
        : `<div class="empty-state"><div class="empty-icon">+</div><div class="empty-title">Queue is clear</div><div class="empty-body">All submissions reviewed.</div></div>`;
    } catch (_) {}
  } else if (tab === 'users') {
    try {
      const users = await api('/admin/users');
      document.getElementById('admin-users').innerHTML = `
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Institution</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>${users.map(u => `
              <tr>
                <td><strong>${esc(u.name)}</strong></td>
                <td style="color:var(--text-2)">${esc(u.email)}</td>
                <td>${statusPill(u.role === 'admin' ? 'verified' : u.role === 'reviewer' ? 'pending' : 'revision_requested').replace(/Active|Pending|Revision/g, u.role)}</td>
                <td style="color:var(--text-2)">${esc(u.institution || '—')}</td>
                <td style="color:var(--text-2)">${relTime(u.created_at)}</td>
                <td>
                  <select class="role-select" onchange="changeRole(${u.user_id}, this.value)">
                    ${['public','researcher','reviewer','admin'].map(r => `<option ${r===u.role?'selected':''} value="${r}">${r}</option>`).join('')}
                  </select>
                </td>
              </tr>
            `).join('')}</tbody>
          </table>
        </div>
      `;
    } catch (_) {}
  } else if (tab === 'sources') {
    try {
      const sources = await api('/admin/external-sources');
      document.getElementById('admin-sources').innerHTML = `
        <div class="content-grid">${sources.map(src => `
          <div class="proj-card">
            <div class="proj-card-body" style="padding-top:20px">
              <div class="proj-title" style="font-size:16px;margin-bottom:8px">${esc(src.name)}</div>
              <div style="font-size:12px;color:var(--text-2);word-break:break-all;margin-bottom:14px">${esc(src.base_url)}</div>
              <div style="font-size:12px;color:var(--text-2);margin-bottom:16px">Last indexed: ${src.last_indexed_at ? relTime(src.last_indexed_at) : 'Never'}</div>
              <a class="btn btn-ghost btn-sm" href="${esc(src.base_url)}" target="_blank" rel="noopener">Visit Source ↗</a>
            </div>
          </div>
        `).join('')}
        </div>
      `;
    } catch (_) {}
  }
}

async function changeRole(uid, role) {
  try {
    await api(`/admin/users/${uid}/role`, { method: 'PATCH', body: { role } });
    toast('Role updated', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadMySubmissions() {
  if (!state.user) { navigate('home'); return; }
  const grid = document.getElementById('my-subs-grid');
  grid.innerHTML = '<div style="color:var(--text-2);font-size:13px">Loading...</div>';
  try {
    const data = await api('/submissions?limit=50');
    grid.innerHTML = data.submissions.length
      ? data.submissions.map(s => buildArchiveCard(s)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">—</div><div class="empty-title">No submissions yet</div><div class="empty-body">Submit your first research contribution.</div></div>`;
  } catch (_) {}
}

async function fetchNotifications() {
  if (!state.user) return;
  try {
    const notifs = await api('/notifications');
    const unread = notifs.filter(n => !n.is_read).length;
    const dot = document.getElementById('notif-dot');
    dot.style.display = unread > 0 ? 'block' : 'none';

    const panel = document.getElementById('notif-panel');
    panel.innerHTML = `
      <div class="notif-panel-header">
        <span>Notifications</span>
        <span onclick="markAllRead()">Mark all read</span>
      </div>
      ${notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="markRead(${n.notification_id})">
          <div class="notif-item-title">${esc(n.title)}</div>
          <div class="notif-item-msg">${esc(n.message)}</div>
        </div>
      `).join('') : '<div style="padding:20px;text-align:center;font-size:13px;color:var(--text-2)">No notifications</div>'}
    `;
  } catch (_) {}
}

async function markRead(id) {
  await api(`/notifications/${id}/read`, { method: 'PATCH' });
  fetchNotifications();
}

async function markAllRead() {
  await api('/notifications/mark-all-read', { method: 'PATCH' });
  fetchNotifications();
}

function buildPagination(containerId, cur, total, cb) {
  const el = document.getElementById(containerId);
  if (total <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${cur===1?'disabled':''} onclick="(${cb.toString()})(${cur-1})">←</button>`;
  for (let i = 1; i <= total; i++) {
    if (total > 7 && i > 2 && i < cur - 1) { if (i === 3) html += '<span style="color:var(--text-2);padding:0 4px">…</span>'; continue; }
    if (total > 7 && i > cur + 1 && i < total - 1) { if (i === cur + 2) html += '<span style="color:var(--text-2);padding:0 4px">…</span>'; continue; }
    html += `<button class="page-btn ${i===cur?'active':''}" onclick="(${cb.toString()})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${cur===total?'disabled':''} onclick="(${cb.toString()})(${cur+1})">→</button>`;
  el.innerHTML = html;
}

function setFilter(btn, cat) {
  document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.archiveCat = cat;
  state.archivePage = 1;
  loadArchive();
}

function setSrcFilter(btn, src) {
  document.querySelectorAll('[data-src]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.archiveSrc = src;
  state.archivePage = 1;
  loadArchive();
}

function setReqFilter(btn, status) {
  document.querySelectorAll('[data-req-status]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.reqStatus = status;
  state.reqPage = 1;
  loadRequests();
}

function debounceSearch() {
  clearTimeout(state.debounceTimer);
  state.archiveSearch = document.getElementById('archive-search').value;
  state.archivePage = 1;
  state.debounceTimer = setTimeout(loadArchive, 350);
}

function onFileSelect(e) {
  const f = e.target.files[0];
  document.getElementById('upload-label').textContent = f
    ? `${f.name} — ${(f.size / 1024 / 1024).toFixed(1)} MB`
    : 'Click to browse or drag a file here';
}

async function handleLogin(e) {
  e.preventDefault();
  document.getElementById('login-error').textContent = '';
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email: document.getElementById('login-email').value, password: document.getElementById('login-password').value }
    });
    saveSession(res.token, res.user);
    updateNav();
    closeModal('login-modal');
    toast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
    loadHome();
  } catch (err) {
    document.getElementById('login-error').textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  document.getElementById('reg-error').textContent = '';
  const body = {
    name: document.getElementById('reg-name').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value,
    role: document.getElementById('reg-role').value,
    institution: document.getElementById('reg-institution').value
  };
  try {
    const res = await api('/auth/register', { method: 'POST', body });
    saveSession(res.token, { ...body, role: res.role });
    updateNav();
    closeModal('register-modal');
    toast('Account created. Welcome!', 'success');
  } catch (err) {
    document.getElementById('reg-error').textContent = err.message;
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  document.getElementById('submit-error').textContent = '';
  const fd = new FormData();
  fd.append('title', document.getElementById('sub-title').value);
  fd.append('abstract', document.getElementById('sub-abstract').value);
  fd.append('category_id', document.getElementById('sub-category').value);
  const file = document.getElementById('sub-file').files[0];
  if (file) fd.append('file', file);
  try {
    await api('/submissions', { method: 'POST', formData: fd });
    closeModal('submit-modal');
    toast('Submitted for peer review', 'success');
    e.target.reset();
    document.getElementById('upload-label').textContent = 'Click to browse or drag a file here';
    fetchNotifications();
  } catch (err) {
    document.getElementById('submit-error').textContent = err.message;
  }
}

async function handleRequest(e) {
  e.preventDefault();
  document.getElementById('req-error').textContent = '';
  try {
    await api('/requests', {
      method: 'POST',
      body: { topic: document.getElementById('req-topic').value, description: document.getElementById('req-desc').value }
    });
    closeModal('request-modal');
    toast('Research request submitted!', 'success');
    e.target.reset();
    if (state.currentPage === 'requests') loadRequests();
  } catch (err) {
    document.getElementById('req-error').textContent = err.message;
  }
}

async function handleReview(e) {
  e.preventDefault();
  const id = document.getElementById('review-sub-id').value;
  const body = {
    decision: document.getElementById('review-decision').value,
    comments: document.getElementById('review-comments').value
  };
  try {
    await api(`/submissions/${id}/review`, { method: 'PATCH', body });
    closeModal('review-modal');
    toast(`Decision recorded: ${body.decision}`, 'success');
    if (state.currentPage === 'detail') loadDetail(id);
    if (state.currentPage === 'admin') adminTab('review');
  } catch (err) {
    toast(err.message, 'error');
  }
}

function logout() {
  clearSession();
  updateNav();
  closeAllDropdowns();
  navigate('home');
  toast('Signed out', 'info');
}

(function init() {
  if (loadSession()) {
    updateNav();
    fetchNotifications();
  } else {
    updateNav();
  }
  navigate('home');

  const params = new URLSearchParams(location.search);
  const shareLink = params.get('share');
  if (shareLink) {
    api(`/submissions/share/${shareLink}`)
      .then(s => navigate('detail', s.submission_id))
      .catch(() => navigate('home'));
  }
})();
