'use strict';
/* ═══════════════════════════════════════════
   리셀그라운드 — UI / 라우팅 / 모달 / 채팅
═══════════════════════════════════════════ */

/* ── ROUTER ── */
function navigateTo(pageId) {
  const target = document.getElementById(`page-${pageId}`);
  if (!target) return;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  target.classList.add('active');
  S.page = pageId;
  window.scrollTo({top:0,behavior:'smooth'});
  closeMobileDrawer();
  /* 하단 네비 활성 표시 */
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    item.classList.toggle('act', item.dataset.goto === pageId);
  });
}

/* ── 비로그인 체크 (항목 10) ── */
function requireLogin() {
  if (S.loggedIn) return true;
  openModal('login');
  showToast('로그인 후 이용할 수 있어요.', 'info');
  return false;
}

/* ── TOAST ── */
function showToast(msg, type='info') {
  const icons = {info:'ℹ️',success:'✅',error:'❌',warn:'⚠️'};
  const container = document.getElementById('toastCon');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

/* ── MODAL ── */
function openModal(id) {
  const ov = document.getElementById(`modal-${id}`);
  if (!ov) return;
  ov.classList.add('open');
  S.openModals.add(id);
  document.body.style.overflow = 'hidden';
  const first = ov.querySelector('input,button,select,textarea');
  if (first) setTimeout(()=>first.focus(),100);
}
function closeModal(id) {
  const ov = document.getElementById(`modal-${id}`);
  if (!ov) return;
  ov.classList.remove('open');
  S.openModals.delete(id);
  if (S.openModals.size === 0) document.body.style.overflow = '';
}

/* ESC 닫기 */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('searchOv').classList.contains('open')) { closeSearch(); return; }
    const last = [...S.openModals].pop();
    if (last) closeModal(last);
    if (S.drawerOpen) closeMobileDrawer();
  }
});
document.querySelectorAll('.modal-ov').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) closeModal(ov.id.replace('modal-',''));
  });
});
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

/* ── MODAL TABS ── */
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const modal = this.closest('.modal');
    modal.querySelectorAll('.modal-tab').forEach(t=>{t.classList.remove('act');t.setAttribute('aria-selected','false')});
    this.classList.add('act'); this.setAttribute('aria-selected','true');
    const tabId = this.dataset.tab;
    modal.querySelectorAll('#login-pane,#signup-pane').forEach(p=>p.style.display='none');
    const target = document.getElementById(tabId);
    if (target) target.style.display='block';
  });
});

/* ── SEARCH ── */
function openSearch() {
  document.getElementById('searchOv').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(()=>document.getElementById('searchInp').focus(),100);
}
function closeSearch() {
  document.getElementById('searchOv').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('searchBtn').addEventListener('click', openSearch);
document.getElementById('searchClose').addEventListener('click', closeSearch);
document.getElementById('searchOv').addEventListener('click', e => { if(e.target===document.getElementById('searchOv')) closeSearch(); });
document.getElementById('searchInp').addEventListener('keydown', e => {
  if (e.key==='Enter') {
    const q = e.target.value.trim();
    if (q) { closeSearch(); showToast(`"${q}" 검색 중...`, 'info'); }
  }
});
document.querySelectorAll('.search-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('searchInp').value = chip.textContent.replace(/^[^\w가-힣]+/,'');
    closeSearch();
    showToast('검색 결과를 불러옵니다.', 'info');
  });
});

/* ── NAV SEARCH INPUT ── */
const navSearchTop = document.getElementById('searchInpTop');
if (navSearchTop) {
  navSearchTop.addEventListener('focus', openSearch);
}

/* ── HAMBURGER / DRAWER ── */
function openMobileDrawer() {
  S.drawerOpen = true;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer').setAttribute('aria-hidden','false');
  const hbg = document.getElementById('hbgBtn');
  hbg.classList.add('open');
  hbg.setAttribute('aria-expanded','true');
}
function closeMobileDrawer() {
  S.drawerOpen = false;
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer').setAttribute('aria-hidden','true');
  const hbg = document.getElementById('hbgBtn');
  if (hbg) { hbg.classList.remove('open'); hbg.setAttribute('aria-expanded','false'); }
}
const hbgBtn = document.getElementById('hbgBtn');
if (hbgBtn) hbgBtn.addEventListener('click', () => S.drawerOpen ? closeMobileDrawer() : openMobileDrawer());

/* ── CHAT (거래용 강화) ── */
function toggleChat() {
  if (!S.loggedIn) { openModal('login'); return; }
  S.chatOpen = !S.chatOpen;
  document.getElementById('chatPanel').classList.toggle('open', S.chatOpen);
  // FAB 버튼 — 채팅 열리면 숨기고, 닫히면 다시 보임
  const fab = document.getElementById('fabBtn');
  if (fab) fab.style.display = S.chatOpen ? 'none' : 'flex';
  if (!S.chatOpen) closeChatConv();
}
function openChatWith(userName) {
  if (!S.loggedIn) { openModal('login'); return; }
  S.chatUser = userName;
  document.getElementById('chatConvList').style.display = 'none';
  document.getElementById('chatMsgs').style.display = 'flex';
  document.getElementById('chatInputRow').style.display = 'flex';
  document.getElementById('chatBackBtn').style.display = 'flex';
  document.getElementById('chatTitle').textContent = userName;
  document.getElementById('chatSub').textContent = '거래 채팅 · 온라인';

  const msgs = DATA.chatMessages[userName] || [];
  const area = document.getElementById('chatMsgs');
  area.innerHTML = msgs.map(m=>`
    <div class="chat-msg ${m.me?'me':'them'}">
      ${m.t}
      <span class="chat-msg-read">${m.me ? (m.read?'읽음':'전송됨') : ''}</span>
    </div>
  `).join('');
  area.scrollTop = area.scrollHeight;
  setTimeout(()=>document.getElementById('chatInp').focus(),100);
}
function closeChatConv() {
  S.chatUser = null;
  document.getElementById('chatConvList').style.display = '';
  document.getElementById('chatMsgs').style.display = 'none';
  document.getElementById('chatInputRow').style.display = 'none';
  document.getElementById('chatBackBtn').style.display = 'none';
  document.getElementById('chatTitle').textContent = '거래 채팅';
  document.getElementById('chatSub').textContent = '3개의 대화';
}
function sendChatMsg() {
  const inp = document.getElementById('chatInp');
  const text = inp.value.trim();
  if (!text || !S.chatUser) return;
  const area = document.getElementById('chatMsgs');
  const msg = document.createElement('div');
  msg.className = 'chat-msg me';
  msg.innerHTML = `${text}<span class="chat-msg-read">전송됨</span>`;
  area.appendChild(msg);
  inp.value = '';
  area.scrollTop = area.scrollHeight;
  if (!DATA.chatMessages[S.chatUser]) DATA.chatMessages[S.chatUser] = [];
  DATA.chatMessages[S.chatUser].push({me:true,t:text,read:false});
}

document.getElementById('chatBtn').addEventListener('click', toggleChat);
document.getElementById('chatCloseBtn').addEventListener('click', toggleChat);
document.getElementById('chatBackBtn').addEventListener('click', closeChatConv);
document.getElementById('chatSendBtn').addEventListener('click', sendChatMsg);
document.getElementById('chatInp').addEventListener('keydown', e => { if(e.key==='Enter') sendChatMsg(); });
document.querySelectorAll('.chat-conv').forEach(conv => {
  conv.addEventListener('click', () => openChatWith(conv.dataset.user));
});

/* 거래 카드 전송 버튼 */
const chatSendDrop = document.getElementById('chatSendDrop');
if (chatSendDrop) {
  chatSendDrop.addEventListener('click', () => {
    if (!S.chatUser) return;
    const area = document.getElementById('chatMsgs');
    const card = document.createElement('div');
    card.className = 'chat-trade-card';
    card.innerHTML = `
      <div class="chat-trade-card__inner">
        <span class="chat-trade-card__em">👟</span>
        <div>
          <p class="chat-trade-card__name">Air Jordan 1 Chicago</p>
          <p class="chat-trade-card__price">₩ 680,000</p>
        </div>
        <span class="chat-trade-card__status">거래중</span>
      </div>
    `;
    area.appendChild(card);
    area.scrollTop = area.scrollHeight;
    showToast('상품 카드를 전송했어요.', 'success');
  });
}

/* ── FILTERS ── */
document.querySelectorAll('[data-cat]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-cat]').forEach(b=>b.classList.remove('act'));
    this.classList.add('act');
    const val = this.dataset.cat;
    const grid = document.getElementById('fullSellerGrid');
    grid.innerHTML = '';
    const filtered = val==='전체' ? DATA.sellers : DATA.sellers.filter(s=>s.cat===val);
    if (filtered.length===0) {
      grid.innerHTML = '<div class="empty-state"><p class="empty-state__icon">🔍</p><p class="empty-state__title">검색 결과 없음</p><p class="empty-state__desc">해당 카테고리의 셀러가 없습니다.</p></div>';
    } else {
      filtered.forEach((s,i)=>grid.appendChild(renderSellerCard(s,i)));
    }
  });
});
document.querySelectorAll('[data-tier]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-tier]').forEach(b=>b.classList.remove('act'));
    this.classList.add('act');
    const val = this.dataset.tier;
    const grid = document.getElementById('fullSellerGrid');
    grid.innerHTML = '';
    let filtered;
    if (val === '전체') filtered = DATA.sellers;
    else if (val === '주간TOP') filtered = DATA.sellers.filter(s=>s.weeklyTop);
    else filtered = DATA.sellers.filter(s=>s.tierCls===val||s.tier.includes(val));
    filtered.forEach((s,i)=>grid.appendChild(renderSellerCard(s,i)));
    showToast(`${val} 셀러 ${filtered.length}명`, 'info');
  });
});
document.querySelectorAll('[data-df]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-df]').forEach(b=>b.classList.remove('act'));
    this.classList.add('act');
    const val = this.dataset.df;
    const grid = document.getElementById('dropsPageGrid');
    grid.innerHTML = '';
    const filterMap = {스니커즈:'스니커즈',명품:'명품',시계:'시계',의류:'의류'};
    const filtered = val==='전체' ? DATA.drops : DATA.drops.filter(d=>d.cat.includes(filterMap[val]||val));
    filtered.forEach(d=>grid.appendChild(renderDropCard(d)));
  });
});

/* ── 커뮤니티 게시판 ── */
document.querySelectorAll('[data-board]').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('[data-board]').forEach(l=>l.classList.remove('act'));
    this.classList.add('act');
  });
});

/* ── 마이페이지 네비 ── */
document.querySelectorAll('.mp-nav-link').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('.mp-nav-link').forEach(l=>l.classList.remove('act'));
    this.classList.add('act');
  });
});

/* ── TAG OPTIONS ── */
document.querySelectorAll('.tag-opt').forEach(tag => {
  tag.addEventListener('click', () => tag.classList.toggle('sel'));
});

/* ── 알림 버튼 ── */
const notifBtn = document.getElementById('notifBtn');
if (notifBtn) {
  notifBtn.addEventListener('click', () => {
    if (!S.loggedIn) { openModal('login'); return; }
    openModal('notifications');
    renderNotifications();
  });
}
function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  list.innerHTML = DATA.notifications.map(n => `
    <div class="notif-item ${n.read?'':'notif-item--unread'}">
      <span class="notif-icon">${n.type==='trade'?'💰':n.type==='price'?'📈':n.type==='chat'?'💬':'👤'}</span>
      <div class="notif-body"><p class="notif-msg">${n.msg}</p><p class="notif-time">${n.time}</p></div>
      ${!n.read?'<span class="notif-dot"></span>':''}
    </div>
  `).join('');
}

/* ── 전역 이벤트 위임 ── */
document.addEventListener('click', e => {
  const gotoEl = e.target.closest('[data-goto]');
  if (gotoEl) navigateTo(gotoEl.dataset.goto);
});

/* ── NAV 스크롤 효과 ── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY>40);
}, {passive:true});

/* ── REVEAL 애니메이션 ── */
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('on');revObs.unobserve(e.target);} });
}, {threshold:.06});
document.querySelectorAll('.reveal').forEach(el=>revObs.observe(el));

/* ── LIVE FEED ── */
function startFeed() {
  if (S.feedTimer) clearInterval(S.feedTimer);
  S.feedTimer = setInterval(() => {
    const fl = document.getElementById('feedList');
    if (!fl) return;
    const d = DATA.feedQueue[S.feedIdx % DATA.feedQueue.length];
    S.feedIdx++;
    const item = renderFeedItem(d);
    fl.insertBefore(item, fl.firstChild);
    if (fl.children.length > 8) fl.removeChild(fl.lastChild);
  }, 3500);
}

/* ── 플로팅 버튼 (모바일) ── */
const fabBtn = document.getElementById('fabBtn');
if (fabBtn) {
  fabBtn.addEventListener('click', () => {
    if (!requireLogin()) return;
    openModal('writePost');
  });
}

/* ═══ [6] 시세조회 검색 기능 ═══ */
function initMarketSearch() {
  const inp = document.getElementById('marketSearchInp');
  const btn = document.getElementById('marketSearchBtn');
  const noResult = document.getElementById('marketNoResult');
  if (!inp || !btn) return;

  function doSearch() {
    const q = inp.value.trim().toLowerCase();
    const grid = document.getElementById('marketGrid');
    const cards = grid ? grid.querySelectorAll('.mkc') : [];
    let found = 0;
    cards.forEach(card => {
      const name = card.querySelector('.mkc__name')?.textContent.toLowerCase() || '';
      const cat  = card.querySelector('.mkc__cat')?.textContent.toLowerCase() || '';
      const match = !q || name.includes(q) || cat.includes(q);
      card.style.display = match ? '' : 'none';
      if (match) found++;
    });
    if (noResult) noResult.style.display = (q && found === 0) ? 'block' : 'none';
    if (q) showToast(`"${inp.value.trim()}" 검색 결과 ${found}건`, found > 0 ? 'info' : 'error');
  }

  btn.addEventListener('click', doSearch);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // 카테고리 필터 연동
  document.querySelectorAll('[data-market]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-market]').forEach(b => b.classList.remove('act'));
      this.classList.add('act');
      inp.value = '';
      if (noResult) noResult.style.display = 'none';
      const val = this.dataset.market;
      const grid = document.getElementById('marketGrid');
      if (!grid) return;
      grid.querySelectorAll('.mkc').forEach(card => {
        const cat = card.querySelector('.mkc__cat')?.textContent || '';
        card.style.display = (val === '전체' || cat.includes(val)) ? '' : 'none';
      });
    });
  });
}

/* ═══ [7] 스크롤 상단 버튼 ═══ */
function initScrollTopBtn() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 400;
    btn.style.display = show ? 'flex' : 'none';
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══ [8] 엔터키 폼 제출 ═══ */
function initEnterSubmit() {
  // 로그인 폼
  const loginPw = document.getElementById('loginPw');
  const doLoginBtn = document.getElementById('doLoginBtn');
  if (loginPw && doLoginBtn) {
    loginPw.addEventListener('keydown', e => { if (e.key === 'Enter') doLoginBtn.click(); });
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) loginEmail.addEventListener('keydown', e => { if (e.key === 'Enter') loginPw.focus(); });
  }

  // 회원가입 폼 — 마지막 입력 필드에서 엔터
  const doSignupBtn = document.getElementById('doSignupBtn');
  if (doSignupBtn) {
    ['signupPw2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doSignupBtn.click(); });
    });
  }

  // 사전신청 폼
  const doPreregBtn = document.getElementById('doPreregBtn');
  if (doPreregBtn) {
    ['prName','prEmail','prTel','prIntro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => {
        if (e.key === 'Enter' && el.tagName !== 'TEXTAREA') doPreregBtn.click();
      });
    });
  }

  // 채팅창은 ui.js에서 이미 처리됨
}
