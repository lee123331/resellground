'use strict';
/* ═══════════════════════════════════════════
   리셀그라운드 — 버튼 연결 + 부트
═══════════════════════════════════════════ */

function openLoginModal() { openModal('login'); }

/* NAV 버튼 */
document.getElementById('loginBtn').addEventListener('click', () => {
  if (S.loggedIn) {
    navigateTo('mypage');
  } else {
    openModal('login');
  }
});
document.getElementById('loginBtnM').addEventListener('click', () => {
  closeMobileDrawer();

  if (S.loggedIn) {
    navigateTo('mypage');
  } else {
    openModal('login');
  }
}); 
document.getElementById('preregBtn').addEventListener('click', () => openModal('prereg'));
document.getElementById('preregBtnM').addEventListener('click', () => { closeMobileDrawer(); openModal('prereg'); });

/* 홈 CTA */
const ctaBtn = document.getElementById('ctaBtn');
if (ctaBtn) ctaBtn.addEventListener('click', () => openModal('prereg'));

/* 로그인 필요 버튼들 */
document.getElementById('profileBtn').addEventListener('click', () => S.loggedIn ? navigateTo('mypage') : openModal('login'));
document.getElementById('writePostBtn').addEventListener('click', () => requireLogin() && openModal('writePost'));
document.getElementById('addDropBtn').addEventListener('click', () => requireLogin() && openModal('addDrop'));

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

/* BOOT */
initGrids();
startFeed();
startTradeLogRotation();
updateNotifBadge();

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
renderWeeklyTop();
