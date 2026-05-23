HEAD
'use strict';
/* ═══════════════════════════════════════════
   리셀그라운드 — 버튼 연결 + 부트
═══════════════════════════════════════════ */

function openLoginModal() { openModal('login'); }

/* 드로어 상태 업데이트 — 로그인/비로그인에 따라 하단 버튼 변경 */
function updateDrawerState() {
  const actions = document.querySelector('.drawer__actions');
  if (!actions) return;

 if (S.loggedIn) {
  // 로그인 상태: 마이페이지 + 로그아웃
  const userName = document.querySelector('.mp-name')?.textContent || '내 계정';

  actions.innerHTML = `
    <button class="btn btn--g btn--full" id="loginBtnM" style="text-align:left;justify-content:flex-start;gap:8px">
      <span style="font-size:20px">👤</span>
      <span>
        <span style="display:block;font-size:13px;font-weight:800;color:var(--text)">${userName}</span>
        <span style="display:block;font-size:11px;color:var(--text-mute)">마이페이지 →</span>
      </span>
    </button>

    <button class="btn btn--outline-brand btn--full" id="logoutBtnM">
      로그아웃
    </button>
  `;

  document.getElementById('loginBtnM')?.addEventListener('click', () => {
    closeMobileDrawer();
    navigateTo('mypage');
  });

  document.getElementById('logoutBtnM')?.addEventListener('click', () => {
    closeMobileDrawer();
    logout();
    if (typeof updateDrawerState === 'function') updateDrawerState();
  });
} else {
    // 비로그인 상태: 로그인 + 파트너 신청
    actions.innerHTML = `
      <button class="btn btn--g" id="loginBtnM">로그인</button>
      <button class="btn btn--p" id="preregBtnM">파트너 신청</button>
    `;
    document.getElementById('loginBtnM').addEventListener('click', () => {
      closeMobileDrawer();
      openModal('login');
    });
    document.getElementById('preregBtnM').addEventListener('click', () => {
      closeMobileDrawer();
      openModal('prereg');
    });
  }
}

/* NAV 버튼 */
/* NAV 버튼 */
const loginBtn = document.getElementById('loginBtn');

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    if (S.loggedIn) {
      navigateTo('mypage');
    } else {
      openModal('login');
    }
  });
}

const loginBtnM = document.getElementById('loginBtnM');

if (loginBtnM) {
  loginBtnM.addEventListener('click', () => {
    closeMobileDrawer();
    openModal('login');
  });
}

const preregBtn = document.getElementById('preregBtn');

if (preregBtn) {
  preregBtn.addEventListener('click', () => openModal('prereg'));
}

const preregBtnM = document.getElementById('preregBtnM');

if (preregBtnM) {
  preregBtnM.addEventListener('click', () => {
    closeMobileDrawer();
    openModal('prereg');
  });
}
/* 홈 CTA */
const ctaBtn = document.getElementById('ctaBtn');
if (ctaBtn) ctaBtn.addEventListener('click', () => openModal('prereg'));

/* 로그인 필요 버튼들 */
const profileBtn = document.getElementById('profileBtn');

if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    if (S.loggedIn) {
      navigateTo('mypage');
    } else {
      openModal('login');
    }
  });
}
const writePostBtn = document.getElementById('writePostBtn');

if (writePostBtn) {
  writePostBtn.addEventListener('click', () => {
    if (requireLogin()) openModal('writePost');
  });
}

const addDropBtn = document.getElementById('addDropBtn');

if (addDropBtn) {
  addDropBtn.addEventListener('click', () => {
    if (requireLogin()) openModal('addDrop');
  });
}

/* 마이페이지 저장 */
const mpSaveBtn = document.getElementById('mpSaveBtn');
if (mpSaveBtn) mpSaveBtn.addEventListener('click', function() {
  this.classList.add('btn--load'); this.textContent = '저장 중...';
  setTimeout(()=>{ this.classList.remove('btn--load'); this.textContent='저장하기'; showToast('프로필이 저장됐어요.','success'); }, 800);
});

/* 고객센터 문의 */
const supportBtn = document.getElementById('supportBtn');
if (supportBtn) supportBtn.addEventListener('click', function() {
  this.classList.add('btn--load'); this.textContent='전송 중...';
  setTimeout(()=>{ this.classList.remove('btn--load'); this.textContent='문의 보내기'; showToast('문의가 접수됐어요. 빠르게 답변드릴게요.','success'); }, 1000);
});

/* 📣 실시간 거래 로그 자동 갱신 */
function startTradeLogRotation() {
  let idx = 0;
  setInterval(() => {
    const tl = document.getElementById('tradeLogList');
    if (!tl) return;
    const log = DATA.tradeLogs[idx % DATA.tradeLogs.length];
    idx++;
    const item = renderTradeLog(log);
    tl.insertBefore(item, tl.firstChild);
    if (tl.children.length > 8) tl.removeChild(tl.lastChild);
  }, 5000);
}

/* 🔔 알림 카운트 업데이트 */
function updateNotifBadge() {
  const unread = DATA.notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}


/* ⑤ KPI 카운트업 애니메이션 */
function animateCountUp(el, target, duration=1200, suffix='') {
  const start = 0;
  const startTime = performance.now();
  const isFloat = String(target).includes('.');
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutQuart
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (target - start) * eased);
    if (isFloat) {
      el.textContent = (start + (target - start) * eased).toFixed(1) + suffix;
    } else {
      el.textContent = current.toLocaleString('ko-KR') + suffix;
    }
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = isFloat ? target.toFixed(1) + suffix : target.toLocaleString('ko-KR') + suffix;
  };
  requestAnimationFrame(update);
}

function initKpiAnimation() {
  const kpiMap = [
    { selector: '.kpi-card:nth-child(2) .kpi-card__value', target: 1248, suffix: '' },
    { selector: '.kpi-card:nth-child(3) .kpi-card__value', target: 247,  suffix: '명' },
  ];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        kpiMap.forEach(({ selector, target, suffix }) => {
          const el = document.querySelector(selector);
          if (el && !el.dataset.animated) {
            el.dataset.animated = '1';
            el.classList.add('counting');
            animateCountUp(el, target, 1400, suffix);
            setTimeout(() => el.classList.remove('counting'), 1500);
          }
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const kpiSection = document.querySelector('.hero__kpi');
  if (kpiSection) observer.observe(kpiSection);
}

/* 실시간 거래 현황 숫자 카운트업 (trade-bar) */
function initTradeBarAnimation() {
  const bars = document.querySelectorAll('.trade-bar__num');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      bars.forEach(el => {
        if (el.dataset.animated) return;
        el.dataset.animated = '1';

       // 수수료 2.5%는 숫자 카운트업 대상에서 제외
if (el.classList.contains('brand')) {
  el.dataset.animated = '1';
  el.textContent = '2.5%';
  return;
}

const raw = el.textContent.replace(/[^0-9]/g, '');
const num = parseInt(raw, 10);

if (!isNaN(num) && num > 1) {
  animateCountUp(el, num, 1000);
}
      });

      observer.disconnect();
    });
  }, { threshold: 0.5 });

  const bar = document.querySelector('.trade-bar');
  if (bar) observer.observe(bar);
}
async function loadPostsFromDB() {
  try {
    const res = await fetch('https://backend.di702934.workers.dev/api/posts');

    if (!res.ok) {
      throw new Error('게시글을 불러오지 못했습니다.');
    }

    const posts = await res.json();

    if (!Array.isArray(posts)) return;
    if (!Array.isArray(DATA.posts)) DATA.posts = [];

    const dbIds = new Set(posts.map(post => String(post.id)));
    const localOnly = DATA.posts.filter(post => !dbIds.has(String(post.id)));

    DATA.posts = [...posts, ...localOnly];

    const postList = document.getElementById('postList');
    if (postList && typeof renderPostCard === 'function') {
      postList.innerHTML = '';
      DATA.posts.forEach(post => {
        postList.appendChild(renderPostCard(post));
      });
    }

    console.log('DB 게시글 불러오기 완료');
  } catch (err) {
    console.warn('DB 게시글 불러오기 실패:', err);
  }
}
/* BOOT */
initGrids();

if (typeof loadPostsFromDB === 'function') {
  loadPostsFromDB();
}

startFeed();
startTradeLogRotation();
updateNotifBadge();
updateDrawerState();
initKpiAnimation();
initTradeBarAnimation();

if (typeof initMarketSearch === 'function') initMarketSearch();
if (typeof initScrollTopBtn === 'function') initScrollTopBtn();
if (typeof initEnterSubmit === 'function') initEnterSubmit();
if (typeof initGuide === 'function') initGuide();
if (typeof initWebSocket === 'function') initWebSocket();
if (typeof initChatToolbar === 'function') initChatToolbar();
if (typeof initTypingEvent === 'function') initTypingEvent();
if (typeof renderWeeklyTop === 'function') renderWeeklyTop();
if (typeof _hookPostDetail === 'function') _hookPostDetail();

/* 주간 TOP 셀러 그리드 */
function renderWeeklyTop() {
  const grid = document.getElementById('weeklyTopGrid');
  if (!grid) return;
  const topSellers = DATA.sellers.filter(s=>s.weeklyTop).slice(0,3);
  grid.innerHTML = topSellers.map((s,i) => `
    <div class="weekly-seller-card">
      <div class="weekly-seller-av ${s.av}">${s.em}</div>
      <div>
        <p class="weekly-seller-name">${s.name}</p>
        <p class="weekly-seller-spec">${s.cat} · ${s.loc}</p>
      </div>
      <span class="weekly-seller-count">${s.sales}건</span>
    </div>
  `).join('');
}


'38cb74f (update product ui work)'
