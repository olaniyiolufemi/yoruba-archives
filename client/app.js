const API = '/api';

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
  debounceTimer: null,
  notifications: []
};

const catIcons = {
  'Art & Sculpture': '🏺',
  'Linguistics & Orthography': '🔤',
  'Cosmology & Philosophy': '☽',
  'Historical Monarchies & Wars': '⚔️',
  'Musical Traditions & Oral Poetry': '🥁',
  'Indigenous Medicine & Botany': '🌿'
};

function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  if (opts.formData) {
    delete headers['Content-Type'];
  }
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
  if (t && u) {
    state.token = t;
    state.user = JSON.parse(u);
    return true;
  }
  return false;
}

function updateNav() {
  const u = state.user;
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const submitBtn = document.getElementById('submit-btn');
  const notifBtn = document.getElementById('notif-btn');
  const avatar = document.getElementById('user-avatar');
  const adminLink = document.getElementById('nav-admin');

  if (u) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    submitBtn.style.display = u.role === 'researcher' || u.role === 'admin' ? 'flex' : 'none';
    notifBtn.style.display = 'flex';
    avatar.style.display = 'flex';
    avatar.textContent = u.name.charAt(0).toUpperCase();
    document.getElementById('menu-name').textContent = u.name;
    document.getElementById('menu-role').textContent = u.role;
    adminLink.style.display = (u.role === 'admin' || u.role === 'reviewer') ? 'inline-flex' : 'none';
    fetchNotifications();
  } else {
    loginBtn.style.display = 'flex';
    registerBtn.style.display = 'flex';
    submitBtn.style.display = 'none';
    notifBtn.style.display = 'none';
    avatar.style.display = 'none';
    adminLink.style.display = 'none';
  }
}

function navigate(page, data) {
  state.prevPage = state.currentPage;
  state.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  closeAllDropdowns();

  if (page === 'home') loadHome();
  else if (page === 'archive') loadArchive();
  else if (page === 'requests') loadRequests();
  else if (page === 'admin') loadAdmin();
  else if (page === 'my-submissions') loadMySubmissions();
  else if (page === 'detail' && data) loadDetail(data);

  window.scrollTo(0, 0);
}

function goBack() {
  navigate(state.prevPage || 'archive');
}

function openModal(id) {
  if ((id === 'submit-modal' || id === 'request-modal') && !state.user) {
    toast('Please sign in first.', 'info');
    openModal('login-modal');
    return;
  }
  document.getElementById(id).classList.add('open');
  if (id === 'submit-modal') loadCategoriesToForm();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function closeModalOnBg(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

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

document.addEventListener('click', (e) => {
  const np = document.getElementById('notif-panel');
  const um = document.getElementById('user-menu');
  const nb = document.getElementById('notif-btn');
  const av = document.getElementById('user-avatar');
  if (!np.contains(e.target) && e.target !== nb) np.classList.remove('open');
  if (!um.contains(e.target) && e.target !== av) um.classList.remove('open');
});

function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  div.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function statusBadge(s) {
  const labels = { verified: 'Verified', pending: 'Pending', rejected: 'Rejected', revision_requested: 'Revision' };
  return `<span class="status-badge status-${s}">${labels[s] || s}</span>`;
}

function relTime(ts) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

async function loadHome() {
  try {
    const [subsData, reqData] = await Promise.all([
      api('/submissions?limit=6&status=verified'),
      api('/requests?limit=3')
    ]);

    document.getElementById('stat-subs').textContent = subsData.total || '—';
    document.getElementById('stat-reqs').textContent = reqData.total || '—';

    const strip = document.getElementById('featured-strip');
    if (subsData.submissions.length) {
      strip.innerHTML = subsData.submissions.map(s => `
        <div class="featured-card" onclick="navigate('detail', '${s.submission_id}')">
          <div class="featured-card-cat">${catIcons[s.category_name] || '📄'} ${s.category_name}</div>
          <div class="featured-card-title">${escHtml(s.title)}</div>
          <div class="featured-card-author">by ${escHtml(s.author_name)}</div>
        </div>
      `).join('');
    } else {
      strip.innerHTML = '<p style="color:var(--text-2)">No verified research yet.</p>';
    }

    const cats = await api('/submissions/categories');
    const catGrid = document.getElementById('home-categories');
    catGrid.innerHTML = cats.map(c => `
      <div class="category-tile" onclick="navigate('archive');state.archiveCat='${c.category_id}';loadArchive()">
        <div class="category-tile-icon">${catIcons[c.category_name] || '📖'}</div>
        <div class="category-tile-name">${escHtml(c.category_name)}</div>
      </div>
    `).join('');

    const reqs = document.getElementById('home-requests');
    reqs.innerHTML = reqData.requests.map(r => buildRequestCard(r)).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadCategoriesToForm() {
  try {
    const cats = await api('/submissions/categories');
    const sel = document.getElementById('sub-category');
    sel.innerHTML = cats.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
  } catch (_) {}
}

async function loadArchive() {
  const grid = document.getElementById('archive-grid');
  grid.innerHTML = '<div class="loading-cards"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div>';

  try {
    const cats = await api('/submissions/categories');
    const filterRow = document.getElementById('category-filters');
    const existing = filterRow.querySelectorAll('[data-cat]');
    if (existing.length === 1) {
      cats.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.dataset.cat = c.category_id;
        btn.textContent = `${catIcons[c.category_name] || ''} ${c.category_name}`;
        btn.onclick = () => setFilter(btn, c.category_id);
        filterRow.appendChild(btn);
      });
    }

    let url = `/submissions?page=${state.archivePage}&limit=12`;
    if (state.archiveSearch) url += `&q=${encodeURIComponent(state.archiveSearch)}`;
    if (state.archiveCat) url += `&category=${state.archiveCat}`;
    if (state.archiveSrc) url += `&source_type=${state.archiveSrc}`;

    const data = await api(url);
    grid.innerHTML = data.submissions.length
      ? data.submissions.map(s => buildSubmissionCard(s)).join('')
      : '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No results found</div><p>Try adjusting your filters or search term.</p></div>';

    buildPagination('archive-pagination', data.page, data.pages, (p) => { state.archivePage = p; loadArchive(); });
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load archive</div></div>';
  }
}

function buildSubmissionCard(s) {
  const srcTag = s.source_type === 'aggregated'
    ? `<span class="source-tag">🔗 Aggregated</span>`
    : '';
  return `
    <div class="card" onclick="navigate('detail','${s.submission_id}')">
      <div class="card-meta">
        <span class="card-category">${catIcons[s.category_name] || ''} ${escHtml(s.category_name)}</span>
        ${statusBadge(s.status)}
      </div>
      <div class="card-title">${escHtml(s.title)}</div>
      <div class="card-abstract">${escHtml(s.abstract)}</div>
      <div class="card-footer">
        <div class="card-author">
          <strong>${escHtml(s.author_name)}</strong><br>
          <span>${escHtml(s.institution || '')}</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem">
          ${srcTag}
          <span style="font-size:0.72rem;color:var(--text-2)">${relTime(s.created_at)}</span>
        </div>
      </div>
    </div>
  `;
}

async function loadDetail(id) {
  try {
    const s = await api(`/submissions/${id}`);
    document.getElementById('detail-category').innerHTML = `<span class="card-category">${catIcons[s.category_name] || ''} ${escHtml(s.category_name)}</span> ${statusBadge(s.status)}`;
    document.getElementById('detail-title').textContent = s.title;
    document.getElementById('detail-meta').innerHTML = `
      <span class="meta-item">👤 ${escHtml(s.author_name)}</span>
      <span class="meta-item">🏛 ${escHtml(s.institution || 'Independent')}</span>
      <span class="meta-item">📅 ${new Date(s.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      ${s.source_type === 'aggregated' ? `<span class="source-tag">🔗 Aggregated Source</span>` : ''}
    `;

    let fileSection = '';
    if (s.file_url) {
      const isImg = s.file_type && s.file_type.startsWith('image/');
      const icon = s.file_type === 'application/pdf' ? '📄' : isImg ? '🖼' : s.file_type?.startsWith('audio') ? '🎵' : s.file_type?.startsWith('video') ? '🎬' : '📎';
      fileSection = `
        <div class="file-preview">
          <div class="file-icon">${icon}</div>
          <div class="file-info">
            <div class="file-name">${escHtml(s.file_name || 'Attached File')}</div>
            <div class="file-type">${s.file_type || ''}</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="${s.file_url}" target="_blank" rel="noopener">Download</a>
        </div>
      `;
    }

    const shareUrl = `${location.origin}/share/${s.shareable_link}`;

    let reviewSection = '';
    if (state.user && (state.user.role === 'reviewer' || state.user.role === 'admin') && s.status === 'pending') {
      reviewSection = `
        <div class="review-panel">
          <div class="review-panel-title">🔬 Reviewer Action</div>
          <button class="btn btn-primary" onclick="openReviewModal('${s.submission_id}')">Submit Decision</button>
        </div>
      `;
    }

    document.getElementById('detail-body-content').innerHTML = `
      <div class="abstract-block">
        <strong style="display:block;margin-bottom:0.5rem;font-size:0.8rem;letter-spacing:0.04em;color:var(--text-2);text-transform:uppercase">Abstract</strong>
        ${escHtml(s.abstract)}
      </div>
      ${fileSection}
      <div class="section-title" style="font-size:1rem;margin-bottom:0.75rem">🔗 Shareable Link</div>
      <div class="share-box">
        <div class="share-url" id="share-url-text">${shareUrl}</div>
        <button class="btn btn-ghost btn-sm" onclick="copyShare('${shareUrl}')">Copy</button>
      </div>
      ${reviewSection}
    `;
  } catch (err) {
    document.getElementById('detail-body-content').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Could not load submission</div></div>';
  }
}

function openReviewModal(id) {
  document.getElementById('review-sub-id').value = id;
  openModal('review-modal');
}

function copyShare(url) {
  navigator.clipboard.writeText(url).then(() => toast('Link copied!', 'success'));
}

function buildRequestCard(r) {
  const statusCls = `req-status-${r.status}`;
  const voted = false;
  return `
    <div class="request-card">
      <div class="vote-block">
        <div class="vote-count">${r.vote_count}</div>
        <button class="vote-btn ${voted ? 'voted' : ''}" onclick="event.stopPropagation();voteRequest(${r.request_id}, this)" title="Vote">▲</button>
        <div class="vote-label">votes</div>
      </div>
      <div class="req-body">
        <div class="req-title">${escHtml(r.topic)}</div>
        <div class="req-desc">${escHtml(r.description)}</div>
        <div class="req-footer">
          <span>👤 ${escHtml(r.requester_name || 'Anonymous')}</span>
          <span class="${statusCls}">● ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
          <span>${relTime(r.created_at)}</span>
        </div>
      </div>
    </div>
  `;
}

async function loadRequests() {
  const el = document.getElementById('requests-list');
  el.innerHTML = '<p style="color:var(--text-2)">Loading...</p>';
  try {
    let url = `/requests?page=${state.reqPage}&limit=10`;
    if (state.reqStatus) url += `&status=${state.reqStatus}`;
    const data = await api(url);
    el.innerHTML = data.requests.length
      ? data.requests.map(r => buildRequestCard(r)).join('')
      : '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No requests found</div></div>';
    buildPagination('requests-pagination', data.page, data.pages, (p) => { state.reqPage = p; loadRequests(); });
  } catch (_) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load</div></div>';
  }
}

async function voteRequest(id, btn) {
  if (!state.user) { toast('Sign in to vote', 'info'); return; }
  try {
    const res = await api(`/requests/${id}/vote`, { method: 'POST' });
    const countEl = btn.previousElementSibling;
    const curr = parseInt(countEl.textContent);
    countEl.textContent = res.voted ? curr + 1 : curr - 1;
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
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  ['overview', 'review', 'users', 'sources'].forEach(t => {
    document.getElementById(`admin-${t}`).style.display = t === tab ? 'block' : 'none';
  });

  if (tab === 'overview') {
    try {
      const stats = await api('/admin/stats');
      document.getElementById('dash-stats').innerHTML = `
        <div class="stat-card"><div class="stat-label">Total Submissions</div><div class="stat-value stat-gold">${stats.total_submissions}</div></div>
        <div class="stat-card"><div class="stat-label">Verified</div><div class="stat-value stat-green">${stats.verified}</div></div>
        <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value stat-amber">${stats.pending}</div></div>
        <div class="stat-card"><div class="stat-label">Rejected</div><div class="stat-value stat-red">${stats.rejected}</div></div>
        <div class="stat-card"><div class="stat-label">Users</div><div class="stat-value stat-purple">${stats.total_users}</div></div>
        <div class="stat-card"><div class="stat-label">Research Requests</div><div class="stat-value stat-gold">${stats.total_requests}</div></div>
      `;
      document.getElementById('cat-breakdown').innerHTML = stats.by_category.map(c => `
        <div style="margin-bottom:0.75rem">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:0.25rem">
            <span>${catIcons[c.category_name] || ''} ${c.category_name}</span>
            <span style="color:var(--text-2)">${c.count}</span>
          </div>
          <div class="progress-bar-outer">
            <div class="progress-bar-inner" style="width:${Math.min(100, (c.count / stats.total_submissions) * 100)}%"></div>
          </div>
        </div>
      `).join('');
    } catch (_) {}
  } else if (tab === 'review') {
    try {
      const subs = await api('/admin/pending');
      const el = document.getElementById('review-queue');
      el.innerHTML = subs.length
        ? subs.map(s => `
          <div class="card" style="margin-bottom:1rem">
            <div class="card-meta">
              <span class="card-category">${catIcons[s.category_name] || ''} ${s.category_name}</span>
              ${statusBadge(s.status)}
            </div>
            <div class="card-title">${escHtml(s.title)}</div>
            <div class="card-abstract" style="-webkit-line-clamp:2">${escHtml(s.abstract)}</div>
            <div class="card-footer">
              <span style="font-size:0.78rem;color:var(--text-2)">by ${escHtml(s.author_name)} · ${relTime(s.created_at)}</span>
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-sm btn-ghost" onclick="navigate('detail','${s.submission_id}')">View</button>
                <button class="btn btn-sm btn-primary" onclick="openReviewModal('${s.submission_id}')">Review</button>
              </div>
            </div>
          </div>
        `).join('')
        : '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">Queue is clear</div></div>';
    } catch (_) {}
  } else if (tab === 'users') {
    try {
      const users = await api('/admin/users');
      const tbl = document.getElementById('users-table');
      tbl.innerHTML = `
        <thead><tr>
          <th>Name</th><th>Email</th><th>Role</th><th>Institution</th><th>Joined</th><th>Action</th>
        </tr></thead>
        <tbody>${users.map(u => `
          <tr>
            <td>${escHtml(u.name)}</td>
            <td style="color:var(--text-2)">${escHtml(u.email)}</td>
            <td><span class="status-badge status-${u.role === 'admin' ? 'verified' : u.role === 'reviewer' ? 'pending' : 'revision_requested'}">${u.role}</span></td>
            <td style="color:var(--text-2)">${escHtml(u.institution || '—')}</td>
            <td style="color:var(--text-2)">${relTime(u.created_at)}</td>
            <td>
              <select class="filter-select" onchange="changeRole(${u.user_id}, this.value)" style="font-size:0.75rem">
                ${['public','researcher','reviewer','admin'].map(r => `<option ${r===u.role?'selected':''} value="${r}">${r}</option>`).join('')}
              </select>
            </td>
          </tr>
        `).join('')}</tbody>
      `;
    } catch (_) {}
  } else if (tab === 'sources') {
    try {
      const sources = await api('/admin/external-sources');
      document.getElementById('sources-grid').innerHTML = sources.map(src => `
        <div class="card">
          <div class="card-title" style="font-size:0.95rem">${escHtml(src.name)}</div>
          <div style="font-size:0.78rem;color:var(--text-2);margin-top:0.5rem;word-break:break-all">${escHtml(src.base_url)}</div>
          <div class="card-footer">
            <span style="font-size:0.72rem;color:var(--text-2)">Last indexed: ${src.last_indexed_at ? relTime(src.last_indexed_at) : 'Never'}</span>
            <a class="btn btn-ghost btn-sm" href="${escHtml(src.base_url)}" target="_blank" rel="noopener">Visit ↗</a>
          </div>
        </div>
      `).join('');
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
  const grid = document.getElementById('my-subs-grid');
  if (!state.user) { navigate('home'); return; }
  grid.innerHTML = '<p style="color:var(--text-2)">Loading...</p>';
  try {
    const data = await api('/submissions?limit=50');
    const mine = data.submissions.filter(s => s.user_id === state.user.user_id || true);
    grid.innerHTML = data.submissions.length
      ? data.submissions.map(s => buildSubmissionCard(s)).join('')
      : '<div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">No submissions yet</div></div>';
  } catch (_) {}
}

async function fetchNotifications() {
  if (!state.user) return;
  try {
    const notifs = await api('/notifications');
    state.notifications = notifs;
    const unread = notifs.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-badge');
    badge.style.display = unread > 0 ? 'flex' : 'none';
    badge.textContent = unread;

    const panel = document.getElementById('notif-panel');
    panel.innerHTML = `
      <div class="notif-header">
        <span>Notifications</span>
        <span style="color:var(--gold);cursor:pointer;font-weight:400" onclick="markAllRead()">Mark all read</span>
      </div>
      ${notifs.length ? notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" onclick="markRead(${n.notification_id})">
          <div class="notif-item-title">${escHtml(n.title)}</div>
          <div class="notif-item-msg">${escHtml(n.message)}</div>
        </div>
      `).join('') : '<div style="padding:1.5rem;text-align:center;color:var(--text-2);font-size:0.82rem">No notifications</div>'}
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
    if (total > 7 && (i > 2 && i < cur - 1)) { if (i === 3) html += '<span style="color:var(--text-2);padding:0 4px">…</span>'; continue; }
    if (total > 7 && (i > cur + 1 && i < total - 1)) { if (i === cur + 2) html += '<span style="color:var(--text-2);padding:0 4px">…</span>'; continue; }
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
  document.getElementById('upload-label').textContent = f ? `📎 ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)` : '📎 Click to attach a file';
}

async function handleLogin(e) {
  e.preventDefault();
  document.getElementById('login-error').textContent = '';
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } });
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
    const user = { ...body, user_id: null, role: res.role };
    saveSession(res.token, user);
    updateNav();
    closeModal('register-modal');
    toast('Account created! Welcome 🎉', 'success');
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
    const res = await api('/submissions', { method: 'POST', formData: fd });
    closeModal('submit-modal');
    toast('Submitted for peer review ✅', 'success');
    e.target.reset();
    document.getElementById('upload-label').textContent = '📎 Click to attach a file';
    fetchNotifications();
  } catch (err) {
    document.getElementById('submit-error').textContent = err.message;
  }
}

async function handleRequest(e) {
  e.preventDefault();
  document.getElementById('req-error').textContent = '';
  const body = {
    topic: document.getElementById('req-topic').value,
    description: document.getElementById('req-desc').value
  };
  try {
    await api('/requests', { method: 'POST', body });
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
  toast('Signed out.', 'info');
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
