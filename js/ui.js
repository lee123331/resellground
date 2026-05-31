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
  if (pageId === 'mypage' && typeof refreshMpBookmarks === 'function') {
    refreshMpBookmarks();
  }
  if (pageId === 'popular-products') {
    S.popularPage = 1;
    S.popularCategory = '전체';
    S.popularHasMore = true;
    document.querySelectorAll('[data-pop-cat]').forEach(b =>
      b.classList.toggle('act', b.dataset.popCat === '전체')
    );
    if (typeof loadPopularProducts === 'function') loadPopularProducts(false);
  }
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

  if (!container) return;

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
    const searchOv = document.getElementById('searchOv');

    if (searchOv && searchOv.classList.contains('open')) {
      closeSearch();
      return;
    }

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
  const searchOv = document.getElementById('searchOv');
  const searchInp = document.getElementById('searchInp');

  if (!searchOv) return;

  searchOv.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (searchInp) {
    setTimeout(() => searchInp.focus(), 100);
  }
}

function closeSearch() {
  const searchOv = document.getElementById('searchOv');

  if (!searchOv) return;

  searchOv.classList.remove('open');
  document.body.style.overflow = '';
}
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
  searchBtn.addEventListener('click', openSearch);
}

const searchClose = document.getElementById('searchClose');
if (searchClose) {
  searchClose.addEventListener('click', closeSearch);
}

const searchOv = document.getElementById('searchOv');
if (searchOv) {
  searchOv.addEventListener('click', e => {
    if (e.target === searchOv) closeSearch();
  });
}

const searchInp = document.getElementById('searchInp');
if (searchInp) {
  searchInp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) {
        closeSearch();
        showToast(`"${q}" 검색 중...`, 'info');
      }
    }
  });
}
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
  const drawer = document.getElementById('drawer');
  const hbg = document.getElementById('hbgBtn');

  if (!drawer) return;

  S.drawerOpen = true;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');

  if (hbg) {
    hbg.classList.add('open');
    hbg.setAttribute('aria-expanded', 'true');
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('drawer');
  const hbg = document.getElementById('hbgBtn');

  S.drawerOpen = false;

  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  if (hbg) {
    hbg.classList.remove('open');
    hbg.setAttribute('aria-expanded', 'false');
  }
}
const hbgBtn = document.getElementById('hbgBtn');
if (hbgBtn) hbgBtn.addEventListener('click', () => S.drawerOpen ? closeMobileDrawer() : openMobileDrawer());

/* ── CHAT (거래용 강화) ── */
function toggleChat() {
  const chatPanel = document.getElementById('chatPanel');

  if (!S.loggedIn) {
    openModal('login');
    return;
  }

  if (!chatPanel) return;

  S.chatOpen = !S.chatOpen;
  chatPanel.classList.toggle('open', S.chatOpen);

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
  const area = document.getElementById('chatMsgs');

  if (!inp || !area) return;

  const text = inp.value.trim();

  if (!text || !S.chatUser) return;

  const msg = document.createElement('div');
  msg.className = 'chat-msg me';
  msg.innerHTML = `${text}<span class="chat-msg-read">전송됨</span>`;
  area.appendChild(msg);

  inp.value = '';
  area.scrollTop = area.scrollHeight;

  if (!DATA.chatMessages[S.chatUser]) DATA.chatMessages[S.chatUser] = [];
  DATA.chatMessages[S.chatUser].push({me:true,t:text,read:false});
}
const chatBtn = document.getElementById('chatBtn');
if (chatBtn) {
  chatBtn.addEventListener('click', toggleChat);
}

const chatCloseBtn = document.getElementById('chatCloseBtn');
if (chatCloseBtn) {
  chatCloseBtn.addEventListener('click', toggleChat);
}

const chatBackBtn = document.getElementById('chatBackBtn');
if (chatBackBtn) {
  chatBackBtn.addEventListener('click', closeChatConv);
}

const chatSendBtn = document.getElementById('chatSendBtn');
if (chatSendBtn) {
  chatSendBtn.addEventListener('click', sendChatMsg);
}

const chatInp = document.getElementById('chatInp');
if (chatInp) {
  chatInp.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendChatMsg();
  });
}
document.querySelectorAll('.chat-conv').forEach(conv => {
  conv.addEventListener('click', () => {
    openChatWith(conv.dataset.user);
  });
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
document.querySelectorAll('.sellers-side [data-cat]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sellers-side [data-cat]').forEach(b => b.classList.remove('act'));
    this.classList.add('act');

    const val = this.dataset.cat;
    const grid = document.getElementById('fullSellerGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = val === '전체'
      ? DATA.sellers
      : DATA.sellers.filter(s => s.cat === val);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p class="empty-state__icon">🔍</p><p class="empty-state__title">검색 결과 없음</p><p class="empty-state__desc">해당 카테고리의 셀러가 없습니다.</p></div>';
    } else {
      filtered.forEach((s, i) => grid.appendChild(renderSellerCard(s, i)));
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
    document.querySelectorAll('[data-df]').forEach(b => b.classList.remove('act'));
    this.classList.add('act');

    const val = this.dataset.df || '전체';

    const filterMap = {
      스니커즈: '스니커즈',
      명품: '명품',
      시계: '시계',
      의류: '의류'
    };

    const category = val === '전체' ? '' : (filterMap[val] || val);

    if (typeof refreshProductsFromDB === 'function') {
      refreshProductsFromDB({
        page: 1,
        limit: PRODUCT_PAGE_STATE.limit || 12,
        category
      });
    }
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
document.querySelectorAll('[data-mp-tab]').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('.mp-nav-link').forEach(l => l.classList.remove('act'));
    this.classList.add('act');
    const tab = this.dataset.mpTab;
    document.querySelectorAll('.mp-panel').forEach(p => { p.style.display = 'none'; });
    const panel = document.getElementById(`mp-panel-${tab}`);
    if (panel) panel.style.display = '';
    if (tab === 'myproducts' && typeof loadMyProducts === 'function') loadMyProducts();
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
function escapePostHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderPostContent(raw = '') {
  let html = escapePostHtml(raw);

  // 이미지: ![파일명](data:image... 또는 https://...)
  html = html.replace(
    /!\[([^\]]*)\]\((data:image\/(?:png|jpe?g|webp|gif);base64,[^)]+|https?:\/\/[^)\s]+)\)/gi,
    (_, alt, src) => {
      return `<img class="post-content-img" src="${src}" alt="${escapePostHtml(alt)}" loading="lazy">`;
    }
  );

  // 링크: [텍스트](https://...)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, text, url) => {
      return `<a class="post-content-link" href="${url}" target="_blank" rel="noopener noreferrer">${escapePostHtml(text)}</a>`;
    }
  );

  // 굵게: **텍스트**
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong>$1</strong>'
  );

  // 줄바꿈
  html = html.replace(/\n/g, '<br>');

  return html;
}
function syncPostCommentCount(postId, count) {
  if (!postId) return;

  // 현재 열린 상세 데이터 갱신
  if (window._currentPost && String(window._currentPost.id) === String(postId)) {
    window._currentPost.comments = count;
  }

  // DATA.posts 내부 데이터 갱신
  if (Array.isArray(DATA.posts)) {
    const target = DATA.posts.find(p => String(p.id) === String(postId));

    if (target) {
      target.comments = count;
    }
  }

  // DATA.userPosts 내부 데이터도 있으면 갱신
  if (Array.isArray(DATA.userPosts)) {
    const target = DATA.userPosts.find(p => String(p.id) === String(postId));

    if (target) {
      target.comments = count;
    }
  }

  // 상세 모달 댓글 숫자 갱신
  const detailCount = document.getElementById('pdComments');
  if (detailCount) {
    detailCount.textContent = `댓글 ${count || 0}`;
  }

  // 게시글 카드 전체 다시 렌더링
  const postList = document.getElementById('postList');

  if (postList && typeof renderPostCard === 'function' && Array.isArray(DATA.posts)) {
    postList.innerHTML = '';

    DATA.posts.forEach(p => {
      postList.appendChild(renderPostCard(p));
    });
  }
}
async function getCommentCountFromDB(postId) {
  if (!postId) return 0;

  try {
    const res = await fetch(
      `https://resellground.di702934.workers.dev/api/comments/${encodeURIComponent(postId)}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return 0;

    const rows = await res.json();

    return Array.isArray(rows) ? rows.length : 0;
  } catch (err) {
    console.warn('댓글 수 조회 실패:', err);
    return 0;
  }
}
async function refreshCommunityPostsFromDB() {
  const postList = document.getElementById('postList');

  if (!postList || typeof renderPostCard !== 'function') return;

  try {
    const res = await fetch('https://resellground.di702934.workers.dev/api/posts', {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('게시글 목록 불러오기 실패');
    }

    const rows = await res.json();

    if (!Array.isArray(rows)) return;

DATA.posts = await Promise.all(
  rows.map(async post => {
    const dbCommentCount = await getCommentCountFromDB(post.id);

    return {
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : [],
      comments: dbCommentCount,
      likes: Number(post.likes || 0),
      views: Number(post.views || 0)
    };
  })
);

    postList.innerHTML = '';

    DATA.posts.forEach(post => {
      postList.appendChild(renderPostCard(post));
    });
  } catch (err) {
    console.warn('DB 게시글 목록 동기화 실패:', err);
  }
}
function normalizeProductToDrop(product) {
  return {
    id: product.id,
    em: '📦',
    badgeCls: '',
    badgeTxt: product.status || '판매중',
    status: product.status || '판매중',
    tag: '',
    cat: product.category || '기타',
    brand: product.brand || '',
    name: product.name || '상품명 없음',
    seller: product.seller_name || '익명',
    price: `${Number(String(product.price || '0').replace(/[^\d]/g, '') || 0).toLocaleString('ko-KR')}원`,
rawPrice: Number(String(product.price || '0').replace(/[^\d]/g, '') || 0),
    condition: product.condition || '',
    trade: product.trade_method || '',
    desc: product.description || '',
    images: Array.isArray(product.images) ? product.images : [],
    views: Number(product.views || 0),
interest: Number(product.views || 0),
postedAt: product.created_at || ''
  };
}
const PRODUCT_PAGE_STATE = {
  page: 1,
  limit: 12,
  category: '',
  status: ''
};
async function refreshProductsFromDB(options = {}) {
  try {
    PRODUCT_PAGE_STATE.page = Number(options.page || PRODUCT_PAGE_STATE.page || 1);
    PRODUCT_PAGE_STATE.limit = Number(options.limit || PRODUCT_PAGE_STATE.limit || 12);

    if (Object.prototype.hasOwnProperty.call(options, 'category')) {
      PRODUCT_PAGE_STATE.category = String(options.category || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(options, 'status')) {
      PRODUCT_PAGE_STATE.status = String(options.status || '').trim();
    }

    const params = new URLSearchParams();

    params.set('page', String(PRODUCT_PAGE_STATE.page));
    params.set('limit', String(PRODUCT_PAGE_STATE.limit));

    if (PRODUCT_PAGE_STATE.category && PRODUCT_PAGE_STATE.category !== '전체') {
      params.set('category', PRODUCT_PAGE_STATE.category);
    }

    if (PRODUCT_PAGE_STATE.status && PRODUCT_PAGE_STATE.status !== '전체') {
      params.set('status', PRODUCT_PAGE_STATE.status);
    }

    const res = await fetch(`https://resellground.di702934.workers.dev/api/products?${params.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error('상품 목록을 불러오지 못했습니다.');
    }

    const data = await res.json();

    const products = Array.isArray(data)
      ? data
      : Array.isArray(data.products)
        ? data.products
        : [];

    const drops = products.map(normalizeProductToDrop);

    if (typeof DATA !== 'undefined') {
      DATA.drops = drops;
      DATA.productsMeta = Array.isArray(data)
        ? {
            page: PRODUCT_PAGE_STATE.page,
            limit: PRODUCT_PAGE_STATE.limit,
            total: drops.length,
            totalPages: 1
          }
        : {
            page: Number(data.page || PRODUCT_PAGE_STATE.page),
            limit: Number(data.limit || PRODUCT_PAGE_STATE.limit),
            total: Number(data.total || drops.length),
            totalPages: Number(data.totalPages || 1)
          };
    }

    const dropsPageGrid = document.getElementById('dropsPageGrid');

    if (dropsPageGrid && typeof renderDropCard === 'function') {
      dropsPageGrid.innerHTML = '';

      if (drops.length === 0) {
        dropsPageGrid.innerHTML = `
          <div class="empty-state">
            <p class="empty-state__icon">📦</p>
            <p class="empty-state__title">등록된 상품이 없어요</p>
            <p class="empty-state__desc">선택한 조건에 맞는 상품이 없습니다.</p>
          </div>
        `;
      } else {
        drops.forEach(drop => {
          dropsPageGrid.appendChild(renderDropCard(drop));
        });
      }
    }

    const popularGrid = document.getElementById('popularGrid');

    if (popularGrid && typeof renderPopularCard === 'function') {
      popularGrid.innerHTML = '';

      drops.forEach((drop, i) => {
        popularGrid.appendChild(renderPopularCard(drop, i));
      });
    }

    const homePopularGrid = document.getElementById('homePopularGrid');

    if (homePopularGrid && typeof renderPopularCard === 'function') {
      homePopularGrid.innerHTML = '';

      drops.slice(0, 4).forEach((drop, i) => {
        homePopularGrid.appendChild(renderPopularCard(drop, i));
      });
    }

    renderProductPagination();

    console.log('상품 목록 DB 동기화 완료:', {
      count: drops.length,
      meta: DATA?.productsMeta
    });
  } catch (err) {
    console.warn('상품 목록 DB 동기화 실패:', err);
  }
}
function renderProductPagination() {
  const grid = document.getElementById('dropsPageGrid');
  if (!grid || typeof DATA === 'undefined') return;

  const meta = DATA.productsMeta || {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  };

  let pager = document.getElementById('productPagination');

  if (!pager) {
    pager = document.createElement('div');
    pager.id = 'productPagination';
    pager.className = 'product-pagination';
    grid.insertAdjacentElement('afterend', pager);
  }

  const page = Number(meta.page || 1);
  const totalPages = Number(meta.totalPages || 1);
  const total = Number(meta.total || 0);

  if (totalPages <= 1) {
    pager.innerHTML = '';
    pager.style.display = 'none';
    return;
  }

  pager.style.display = 'flex';

  pager.innerHTML = `
    <button class="product-pagination__btn" type="button" data-page="prev" ${page <= 1 ? 'disabled' : ''}>
      이전
    </button>

    <span class="product-pagination__info">
      ${page} / ${totalPages} 페이지 · 총 ${total.toLocaleString('ko-KR')}개
    </span>

    <button class="product-pagination__btn" type="button" data-page="next" ${page >= totalPages ? 'disabled' : ''}>
      다음
    </button>
  `;

  pager.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.page;

      if (type === 'prev' && page > 1) {
        refreshProductsFromDB({ page: page - 1 });
      }

      if (type === 'next' && page < totalPages) {
        refreshProductsFromDB({ page: page + 1 });
      }
    });
  });
}
/* ── 게시글 상세보기 ── */
function openPostDetail(post) {
  window._currentPost = post;

if (!Array.isArray(post.commentList)) {
  post.commentList = [];
}



  const title = document.getElementById('pdTitle');
  const boardBadge = document.getElementById('pdBoardBadge');
  const meta = document.getElementById('pdMeta');
  const authorAv = document.getElementById('pdAuthorAv');
  const authorName = document.getElementById('pdAuthorName');
  const authorSub = document.getElementById('pdAuthorSub');
  const tags = document.getElementById('pdTags');
  const content = document.getElementById('pdContent');
  const likes = document.getElementById('pdLikes');
  const comments = document.getElementById('pdComments');
  const views = document.getElementById('pdViews');
  const bookmarkBtn = document.getElementById('pdBookmarkBtn');

  if (!title || !content) return;

  title.textContent = post.title || '제목 없음';

  if (boardBadge) boardBadge.textContent = post.badge || '커뮤니티';
  if (meta) meta.textContent = post.time ? `작성 ${post.time}` : '작성 방금 전';

if (authorAv) {
  authorAv.className = `pc__av ${post.av || 'av-a'}`;
  authorAv.textContent = post.em || '💬';
}

if (authorName) authorName.textContent = post.author || '익명';
if (authorSub) authorSub.textContent = '리셀그라운드 커뮤니티';

if (tags) {
  tags.innerHTML = postTags(post.tags || []);
}

content.innerHTML = renderPostContent(
  post.content || post.preview || '게시글 내용이 없습니다.'
);

if (likes) likes.textContent = `👍 ${post.likes || 0}`;
if (comments) comments.textContent = `댓글 ${post.comments || 0}`;

if (comments) {
  comments.style.cursor = 'pointer';
  comments.onclick = () => {
    const modalBody = document.querySelector('#modal-postDetail .modal__body');
    const commentBox = document.getElementById('pdCommentInput');

    if (modalBody && commentBox) {
      modalBody.scrollTo({
        top: commentBox.offsetTop - 100,
        behavior: 'smooth'
      });

      commentBox.focus();
    }
  };
}
if (views) views.textContent = `조회 ${post.views || 0}`;

if (bookmarkBtn) {
  const postId = post.id || post.title || String(Date.now());
  const user = getAuthUser();

  if (!Array.isArray(DATA.bookmarks)) DATA.bookmarks = [];

  const alreadyBookmarked = DATA.bookmarks.some(item => {
    const saved = item.post || item;
    return saved.id === postId || saved.title === post.title;
  });

  bookmarkBtn.textContent = alreadyBookmarked ? '북마크 해제' : '북마크';
  bookmarkBtn.classList.toggle('act', alreadyBookmarked);

  bookmarkBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!requireLogin()) return;

    const idx = DATA.bookmarks.findIndex(item => {
      const saved = item.post || item;
      return saved.id === postId || saved.title === post.title;
    });

    try {
      if (idx >= 0) {
        DATA.bookmarks.splice(idx, 1);

        await fetch('https://resellground.di702934.workers.dev/api/bookmarks', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
          },
          body: JSON.stringify({
            user_email: user?.email || '',
            post_id: postId
          })
        });

        bookmarkBtn.textContent = '북마크';
        bookmarkBtn.classList.remove('act');
        showToast('북마크를 해제했어요.', 'info');
      } else {
        DATA.bookmarks.unshift({
          postId,
          post: { ...post, id: postId }
        });

        await fetch('https://resellground.di702934.workers.dev/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
          },
body: JSON.stringify({
  id: `bookmark_${Date.now()}`,
  user_email: user?.email || '',
  post_id: postId
})
        });

        bookmarkBtn.textContent = '북마크 해제';
        bookmarkBtn.classList.add('act');
        showToast('북마크에 저장됐어요.', 'success');
      }

      if (typeof refreshMpBookmarks === 'function') {
        refreshMpBookmarks();
      }
    } catch (err) {
      console.error(err);
      showToast('북마크 DB 저장 중 오류가 발생했습니다.', 'warn');
    }
  };
}
 // 댓글 렌더링 및 등록 코드
const commentList = document.getElementById('pdCommentList');
const commentInput = document.getElementById('pdCommentInput');
const commentSubmit = document.getElementById('pdCommentSubmit');

if (commentList) {
  commentList.innerHTML = '';

  const commentsData = Array.isArray(post.commentList) ? post.commentList : [];

  if (commentsData.length === 0) {
    commentList.innerHTML = '<div class="pd-comment-empty">아직 등록된 댓글이 없습니다.</div>';
  } else {
    commentsData.forEach(c => {
      const item = document.createElement('div');
      item.className = 'pd-comment-item';
      item.innerHTML = `
        <div class="pd-comment-author">${c.author || '익명'}</div>
        <div class="pd-comment-content">${c.content || ''}</div>
      `;
      commentList.appendChild(item);
    });
  }
}

if (commentSubmit) {
  commentSubmit.onclick = async () => {
    if (!requireLogin()) return;

    const text = commentInput?.value.trim();

    if (!text) {
      showToast('댓글 내용을 입력해주세요.', 'error');
      return;
    }

    const user = getAuthUser();

    const newComment = {
      id: `comment_${Date.now()}`,
      post_id: post.id,
      author: user?.nickname || user?.email || '나',
      author_email: user?.email || '',
      content: text,
      created_at: '방금 전'
    };

    if (!Array.isArray(post.commentList)) {
      post.commentList = [];
    }

    // 1) 먼저 화면 데이터에 즉시 반영
    post.commentList.unshift(newComment);
    post.comments = post.commentList.length;

    if (comments) {
      comments.textContent = `댓글 ${post.comments || 0}`;
    }

    // 2) 댓글 목록 즉시 다시 그림
    if (commentList) {
      commentList.innerHTML = '';

      post.commentList.forEach(c => {
        const item = document.createElement('div');
        item.className = 'pd-comment-item';
        item.innerHTML = `
          <div class="pd-comment-author">${c.author || '익명'}</div>
          <div class="pd-comment-content">${c.content || ''}</div>
        `;
        commentList.appendChild(item);
      });
    }

    // 3) 입력창 비우기
    commentInput.value = '';

    // 4) 게시글 카드 쪽 댓글 수치도 즉시 갱신
    const targetPost = DATA.posts?.find(p => String(p.id) === String(post.id));
    if (targetPost) {
      targetPost.comments = post.comments;
      targetPost.commentList = post.commentList;
    }

    const postList = document.getElementById('postList');
    if (postList && typeof renderPostCard === 'function' && Array.isArray(DATA.posts)) {
      postList.innerHTML = '';
      DATA.posts.forEach(p => {
        postList.appendChild(renderPostCard(p));
      });
    }

    // 5) DB 저장
    try {
      const res = await fetch('https://resellground.di702934.workers.dev/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
        },
        body: JSON.stringify({
          id: newComment.id,
          post_id: post.id,
          author: newComment.author,
          author_email: newComment.author_email,
          content: text
        })
      });

      if (!res.ok) {
        throw new Error('댓글 DB 저장 실패');
      }

      console.log('댓글 DB 저장 완료');

      // 6) DB 기준으로 한 번 더 동기화
      await loadAndRenderComments();
    } catch (err) {
      console.error(err);
      showToast('화면에는 등록됐지만 댓글 DB 저장에 실패했어요.', 'warn');
    }
  };
}
async function loadAndRenderComments() {
  const commentList = document.getElementById('pdCommentList');
  const comments = document.getElementById('pdComments');

  if (!commentList || !post.id) return;

  try {
    const res = await fetch(
      `https://resellground.di702934.workers.dev/api/comments/${encodeURIComponent(post.id)}`
    );

    const rows = res.ok ? await res.json() : [];

    post.commentList = rows.map(row => ({
      id: row.id,
      author: row.author || '익명',
      content: row.content || '',
      created_at: row.created_at || ''
    }));

  post.comments = post.commentList.length;

if (comments) comments.textContent = `댓글 ${post.comments || 0}`;

syncPostCommentCount(post.id, post.comments);

commentList.innerHTML = '';

    if (post.commentList.length === 0) {
      commentList.innerHTML = '<div class="pd-comment-empty">아직 등록된 댓글이 없습니다.</div>';
      return;
    }

    post.commentList.forEach(c => {
  const item = document.createElement('div');
  item.className = 'pd-comment-item';

  const author = document.createElement('div');
  author.className = 'pd-comment-author';
  author.textContent = c.author || '익명';

  const content = document.createElement('div');
  content.className = 'pd-comment-content';
  content.textContent = c.content || '';

  item.append(author, content);
  commentList.appendChild(item);
});
  } catch (err) {
    console.warn('댓글 불러오기 실패:', err);
  }
}

loadAndRenderComments();
openModal('postDetail');

}
/* ── 마이페이지 북마크 렌더링 ── */
async function refreshMpBookmarks() {
  const list = document.getElementById('mpBookmarkList');
  if (!list) return;

  if (!Array.isArray(DATA.bookmarks)) DATA.bookmarks = [];

  const user = getAuthUser ? getAuthUser() : null;

  if (user?.email) {
    try {
      const res = await fetch(
        `https://resellground.di702934.workers.dev/api/bookmarks/${encodeURIComponent(user.email)}`
      );

      if (res.ok) {
        const rows = await res.json();

        DATA.bookmarks = rows.map(row => ({
          postId: row.id || row.post_id,
          post: {
            id: row.id || row.post_id,
            av: 'av-a',
            em: '📝',
            author: row.author || '익명',
            authorTier: '',
            time: row.created_at || '',
            badge: row.badge || row.board || '커뮤니티',
            tags: row.tags ? JSON.parse(row.tags) : [],
            title: row.title || '제목 없음',
            content: row.content || '',
            preview: row.preview || String(row.content || '').slice(0, 90),
            likes: row.likes || 0,
            comments: row.comments || 0,
            views: row.views || 0
          }
        }));
      }
    } catch (err) {
      console.warn('DB 북마크 불러오기 실패:', err);
    }
  }

  if (DATA.bookmarks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__icon">🔖</p>
        <p class="empty-state__title">저장한 북마크가 없어요</p>
        <p class="empty-state__desc">관심 있는 게시글을 북마크하면 이곳에서 다시 볼 수 있어요.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';

  DATA.bookmarks.forEach(item => {
    if (typeof renderBookmarkCard === 'function') {
      list.appendChild(renderBookmarkCard(item));
    }
  });
}
function removeBookmark(postId) {
  if (!Array.isArray(DATA.bookmarks)) DATA.bookmarks = [];

  DATA.bookmarks = DATA.bookmarks.filter(item => {
    const post = item.post || item;
    return item.postId !== postId && post.id !== postId;
  });

  refreshMpBookmarks();
  showToast('북마크를 해제했어요.', 'info');
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
    navigateTo('product-register');
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
/* ═══ 거래 가이드 세부 내용 ═══ */
const GUIDE_DATA = {
  join: {
    title: '회원가입 방법',
    icon: '👤',
    steps: [
      { step: '01', title: '이메일 입력', desc: '리셀그라운드 로그인 또는 회원가입 화면에서 이메일과 비밀번호를 입력합니다.' },
      { step: '02', title: '기본 정보 입력', desc: '닉네임, 연락처, 관심 카테고리 등 서비스 이용에 필요한 기본 정보를 입력합니다.' },
      { step: '03', title: '프로필 완성', desc: '프로필 이미지와 소개글을 설정하면 거래 신뢰도를 높일 수 있습니다.' },
      { step: '04', title: '서비스 이용 시작', desc: '가입 후 상품 탐색, 커뮤니티 활동, 셀러 팔로우 기능을 이용할 수 있습니다.' },
    ],
    tip: '💡 프로필을 꼼꼼히 작성할수록 구매자와 판매자 모두에게 신뢰를 줄 수 있어요.'
  },

  profile: {
    title: '프로필 설정',
    icon: '🖼',
    steps: [
      { step: '01', title: '마이페이지 접속', desc: '우측 상단 프로필 아이콘 또는 모바일 하단 MY 버튼을 눌러 마이페이지로 이동합니다.' },
      { step: '02', title: '닉네임 설정', desc: '거래 상대방이 쉽게 알아볼 수 있는 닉네임을 설정합니다.' },
      { step: '03', title: '소개글 작성', desc: '주로 거래하는 카테고리, 활동 지역, 직거래 가능 여부를 적어두면 좋습니다.' },
      { step: '04', title: 'SNS 정보 입력', desc: '인스타그램, 틱톡 등 활동 계정을 연결하면 셀러 신뢰도를 높이는 데 도움이 됩니다.' },
    ],
    tip: '💡 리셀 거래에서는 프로필 완성도가 곧 신뢰의 시작이에요.'
  },

  verify: {
    title: '셀러 정보 등록',
    icon: '✓',
    steps: [
      { step: '01', title: '셀러 정보 입력', desc: '판매 활동을 원하는 경우 마이페이지에서 셀러 정보를 등록합니다.' },
      { step: '02', title: '활동 카테고리 선택', desc: '스니커즈, 명품, 시계, 의류 등 주로 판매할 카테고리를 선택합니다.' },
      { step: '03', title: 'SNS 또는 거래 이력 등록', desc: '기존 거래 후기나 SNS 활동 이력이 있다면 신뢰 자료로 활용할 수 있습니다.' },
      { step: '04', title: '추후 인증 확장', desc: '향후 인증 셀러, 인증 패키지 팩, RG 셀러지수와 연동될 수 있습니다.' },
    ],
    tip: '💡 셀러 정보를 등록하면 활동 카테고리와 거래 이력을 바탕으로 더 신뢰감 있는 프로필을 만들 수 있어요.'
  },

  category: {
    title: '관심 카테고리 설정',
    icon: '🏷',
    steps: [
      { step: '01', title: '관심 분야 선택', desc: '스니커즈, 명품, 시계, 의류 등 관심 있는 리셀 카테고리를 선택합니다.' },
      { step: '02', title: '피드 맞춤화', desc: '선택한 카테고리를 기준으로 상품, 드롭, 셀러 추천이 더 정확해집니다.' },
      { step: '03', title: '알림 확장', desc: '추후 관심 카테고리 기반 새 드롭 알림과 시세 알림으로 확장할 수 있습니다.' },
    ],
    tip: '💡 관심 카테고리를 설정하면 원하는 상품을 더 빠르게 찾을 수 있어요.'
  },

  register: {
    title: '상품 등록 방법',
    icon: '📸',
    steps: [
      { step: '01', title: '상품 등록 클릭', desc: '드롭스 페이지의 상품 등록 버튼 또는 모바일 플로팅 버튼을 눌러 등록 화면을 엽니다.' },
      { step: '02', title: '상품 정보 입력', desc: '상품명, 브랜드, 카테고리, 사이즈, 상태, 가격을 입력합니다.' },
      { step: '03', title: '이미지 업로드', desc: '상품 전체 사진, 디테일 사진, 구성품 사진을 함께 올리면 신뢰도가 높아집니다.' },
      { step: '04', title: '설명 작성', desc: '구매 경로, 사용감, 하자 여부, 구성품 여부를 솔직하게 작성합니다.' },
      { step: '05', title: '등록 완료', desc: '입력한 내용을 확인한 뒤 상품을 등록합니다.' },
    ],
    tip: '💡 하자나 사용감을 숨기지 않고 명확히 적는 것이 오히려 거래 신뢰도를 높입니다.'
  },

  photo: {
    title: '사진 잘 올리는 팁',
    icon: '📷',
    steps: [
      { step: '01', title: '밝은 배경 사용', desc: '흰색 또는 밝은 단색 배경에서 촬영하면 상품이 더 선명하게 보입니다.' },
      { step: '02', title: '여러 각도 촬영', desc: '정면, 측면, 후면, 로고, 구성품, 하자 부위를 각각 촬영합니다.' },
      { step: '03', title: '실물 색감 유지', desc: '과한 필터를 사용하면 실제 상품과 달라 보여 분쟁이 생길 수 있습니다.' },
      { step: '04', title: '구성품 포함', desc: '박스, 영수증, 더스트백, 보증서 등 구성품을 함께 보여주세요.' },
    ],
    tip: '💡 리셀 상품은 사진이 곧 첫 번째 신뢰 자료예요.'
  },

  title: {
    title: '빠르게 판매되는 제목 작성법',
    icon: '✍',
    steps: [
      { step: '01', title: '브랜드명 포함', desc: '나이키, 조던, 구찌, 롤렉스처럼 검색될 가능성이 높은 브랜드명을 넣습니다.' },
      { step: '02', title: '모델명 정확히 작성', desc: '정확한 모델명과 제품명을 입력하면 검색 노출이 좋아집니다.' },
      { step: '03', title: '사이즈와 상태 추가', desc: '예: “나이키 덩크 로우 팬더 270 새상품”처럼 핵심 정보를 넣습니다.' },
      { step: '04', title: '과한 문구 지양', desc: '급처, 특가, 무조건 정품 같은 과한 표현은 신뢰도를 낮출 수 있습니다.' },
    ],
    tip: '💡 좋은 제목은 검색에 잘 걸리고, 구매자가 빠르게 판단할 수 있게 해줍니다.'
  },

  price: {
    title: '가격 설정 팁',
    icon: '💵',
    steps: [
      { step: '01', title: '최근 시세 확인', desc: '시세조회 페이지나 최근 거래가를 참고해 적정 가격을 확인합니다.' },
      { step: '02', title: '상품 상태 반영', desc: '새상품, 미사용, 사용감 있음, 구성품 여부에 따라 가격을 조정합니다.' },
      { step: '03', title: '수수료 반영', desc: '리셀그라운드 수수료 2.5%를 고려해 실수령액을 계산합니다.' },
      { step: '04', title: '협상 가능성 고려', desc: '가격 제안 가능 여부를 설명에 적어두면 거래 문의가 늘어날 수 있습니다.' },
    ],
    tip: '💡 실수령액 = 판매가 × 0.975 기준으로 계산하면 돼요.'
  },

  tradeStatus: {
    title: '거래 상태 변경 방법',
    icon: '🔄',
    steps: [
      { step: '01', title: '내 상품 확인', desc: '마이페이지 또는 내 상품 목록에서 등록한 상품을 확인합니다.' },
      { step: '02', title: '상태 선택', desc: '판매중, 예약중, 거래완료 등 현재 거래 상태에 맞게 변경합니다.' },
      { step: '03', title: '구매자 혼선 방지', desc: '예약중이거나 판매 완료된 상품은 빠르게 상태를 바꿔 불필요한 문의를 줄입니다.' },
      { step: '04', title: '거래 이력 반영', desc: '거래 완료 처리는 추후 RG 셀러지수와 거래 이력에 반영될 수 있습니다.' },
    ],
    tip: '💡 상태 변경을 빠르게 해두면 셀러 신뢰도가 좋아집니다.'
  },

  howbuy: {
    title: '안전하게 구매하는 방법',
    icon: '🛒',
    steps: [
      { step: '01', title: '판매자 정보 확인', desc: '거래 전 판매자의 프로필, 후기, 거래 이력, 활동 카테고리를 확인합니다.' },
      { step: '02', title: 'RG 셀러지수 확인', desc: 'RG 셀러지수가 높을수록 거래 성공률, 후기 품질, 응답 속도가 안정적인 셀러예요.' },
      { step: '03', title: '상품 정보 확인', desc: '사진, 설명, 구성품, 하자 여부, 정품 자료를 꼼꼼히 확인합니다.' },
      { step: '04', title: '외부 결제 주의', desc: '플랫폼 외부 결제나 개인 송금을 유도하는 거래는 피하는 것이 좋습니다.' },
    ],
    tip: '💡 가격이 너무 저렴한 상품은 정품 여부와 판매자 신뢰도를 더 꼼꼼히 확인하세요.'
  },

  checkseller: {
    title: '판매자 확인 팁',
    icon: '🔍',
    steps: [
      { step: '01', title: '프로필 완성도 확인', desc: '프로필 사진, 소개글, 활동 카테고리가 잘 작성되어 있는지 확인합니다.' },
      { step: '02', title: '거래 이력 확인', desc: '거래 완료 횟수와 후기 내용을 함께 확인합니다.' },
      { step: '03', title: '응답 태도 확인', desc: '상품 질문에 빠르고 정확하게 답변하는 셀러는 신뢰도가 높습니다.' },
      { step: '04', title: '인증 정보 확인', desc: '인증 셀러, 인증 패키지 팩, 정품 자료 여부를 확인합니다.' },
    ],
    tip: '💡 별점보다 실제 후기 내용과 응답 태도를 함께 보는 것이 중요합니다.'
  },

  request: {
    title: '거래 요청 방법',
    icon: '🤝',
    steps: [
      { step: '01', title: '상품 선택', desc: '구매하고 싶은 상품을 선택한 뒤 판매자 정보를 확인합니다.' },
      { step: '02', title: '채팅 시작', desc: '거래 채팅을 통해 상품 상태, 가격, 배송 방식 등을 문의합니다.' },
      { step: '03', title: '조건 협의', desc: '가격, 직거래 장소, 배송 방식, 결제 방식을 협의합니다.' },
      { step: '04', title: '거래 진행', desc: '서로 조건이 맞으면 안전한 방식으로 거래를 진행합니다.' },
    ],
    tip: '💡 중요한 합의 내용은 채팅 기록으로 남겨두는 것이 좋아요.'
  },

  delivery: {
    title: '결제 및 배송 확인',
    icon: '📬',
    steps: [
      { step: '01', title: '결제 방식 확인', desc: '안전결제 또는 합의된 결제 방식을 확인합니다.' },
      { step: '02', title: '배송 정보 확인', desc: '운송장 번호, 택배사, 발송 예정일을 확인합니다.' },
      { step: '03', title: '수령 후 확인', desc: '상품을 받은 뒤 상태, 구성품, 설명과 일치하는지 확인합니다.' },
      { step: '04', title: '거래 완료', desc: '문제가 없다면 거래 완료 처리를 진행합니다.' },
    ],
    tip: '💡 수령 직후 사진이나 영상으로 개봉 기록을 남겨두면 분쟁 예방에 도움이 됩니다.'
  },

  refund: {
    title: '환불 / 분쟁 안내',
    icon: '↩',
    steps: [
      { step: '01', title: '문제 확인', desc: '상품 설명과 다른 점, 하자, 구성품 누락, 정품 의심 여부를 확인합니다.' },
      { step: '02', title: '증거 확보', desc: '사진, 영상, 채팅 기록 등 확인 가능한 자료를 보관합니다.' },
      { step: '03', title: '판매자와 협의', desc: '먼저 판매자와 문제 해결을 시도합니다.' },
      { step: '04', title: '고객센터 문의', desc: '해결되지 않는 경우 고객센터 또는 신고 기능을 이용합니다.' },
    ],
    tip: '💡 단순 변심과 상품 설명 불일치는 처리 기준이 다를 수 있어요.'
  },

  fraud: {
    title: '사기 예방 방법',
    icon: '⚠️',
    steps: [
      { step: '01', title: '외부 결제 주의', desc: '카카오톡, 문자, 개인 송금으로 유도하는 거래는 주의해야 합니다.' },
      { step: '02', title: '시세보다 낮은 가격 주의', desc: '시세보다 지나치게 저렴한 상품은 추가 확인이 필요합니다.' },
      { step: '03', title: '정품 자료 확인', desc: '고가 상품은 영수증, 보증서, 구성품, 시리얼 정보 등을 확인합니다.' },
      { step: '04', title: '의심 시 신고', desc: '의심스러운 거래는 즉시 신고하거나 고객센터에 문의합니다.' },
    ],
    tip: '💡 급하게 결제를 유도하는 판매자는 특히 조심하세요.'
  },

  auth: {
    title: '정품 확인 팁',
    icon: '🔎',
    steps: [
      { step: '01', title: '구성품 확인', desc: '박스, 영수증, 보증서, 더스트백 등 구성품 여부를 확인합니다.' },
      { step: '02', title: '디테일 사진 요청', desc: '로고, 마감, 시리얼, 라벨 등 정품 판단에 필요한 사진을 요청합니다.' },
      { step: '03', title: '구매 경로 확인', desc: '공식 매장, 온라인 스토어, 리셀 플랫폼 등 구매 경로를 확인합니다.' },
      { step: '04', title: '인증 패키지 팩 활용', desc: '향후 리셀그라운드 인증 패키지 팩과 연동해 신뢰도를 높일 수 있습니다.' },
    ],
    tip: '💡 정품 여부가 중요한 상품일수록 사진과 증빙 자료를 충분히 확인해야 합니다.'
  },

  report: {
    title: '의심 거래 신고',
    icon: '🚨',
    steps: [
      { step: '01', title: '의심 상황 확인', desc: '외부 결제 유도, 허위 상품 정보, 욕설, 가품 의심 등 신고 사유를 확인합니다.' },
      { step: '02', title: '증거 확보', desc: '채팅 내용, 상품 페이지, 결제 요청 화면 등을 캡처합니다.' },
      { step: '03', title: '신고 접수', desc: '고객센터 또는 신고 기능을 통해 내용을 제출합니다.' },
      { step: '04', title: '검토 대기', desc: '접수된 신고는 운영 기준에 따라 검토됩니다.' },
    ],
    tip: '💡 허위 신고는 오히려 본인 계정에 불이익이 될 수 있습니다.'
  },

  escrow: {
    title: '안전결제 시스템',
    icon: '🔒',
    steps: [
      { step: '01', title: '구매자 결제', desc: '구매자가 결제를 진행하면 금액이 안전하게 예치됩니다.' },
      { step: '02', title: '판매자 발송', desc: '판매자는 상품을 발송하고 배송 정보를 입력합니다.' },
      { step: '03', title: '구매자 수령 확인', desc: '구매자가 상품 상태를 확인한 뒤 수령 확인을 진행합니다.' },
      { step: '04', title: '판매자 정산', desc: '거래가 정상 완료되면 판매자에게 정산됩니다.' },
    ],
    tip: '💡 안전결제는 구매자와 판매자 모두를 보호하기 위한 구조입니다.'
  },

  penalty: {
    title: '패널티 정책',
    icon: '⛔',
    steps: [
      { step: '01', title: '경고', desc: '가벼운 규정 위반은 경고 처리될 수 있습니다.' },
      { step: '02', title: '기능 제한', desc: '반복 위반 시 상품 등록, 채팅, 커뮤니티 활동이 제한될 수 있습니다.' },
      { step: '03', title: '계정 정지', desc: '사기, 가품 판매, 악성 행위는 계정 정지로 이어질 수 있습니다.' },
      { step: '04', title: '이의 제기', desc: '제재에 이의가 있는 경우 고객센터를 통해 문의할 수 있습니다.' },
    ],
    tip: '💡 좋은 거래 문화를 유지하는 것이 플랫폼 전체 신뢰도를 높입니다.'
  },

  feeguide: {
    title: '수수료 안내',
    icon: '💰',
    steps: [
      { step: '01', title: '고정 수수료', desc: '리셀그라운드는 2.5% 고정 수수료 구조를 지향합니다.' },
      { step: '02', title: '실수령액 계산', desc: '실수령액은 판매가에서 2.5%를 제외한 금액입니다.' },
      { step: '03', title: '비교 확인', desc: '수수료 안내 페이지에서 타 플랫폼과 실수령액을 비교할 수 있습니다.' },
      { step: '04', title: '정산 확장 예정', desc: '정산 내역과 출금 기능은 추후 마이페이지에서 확장할 수 있습니다.' },
    ],
    tip: '💡 100만원 판매 시 리셀그라운드 기준 실수령액은 975,000원입니다.'
  },

  calc: {
    title: '실수령액 확인',
    icon: '🧮',
    steps: [
      { step: '01', title: '판매가 입력', desc: '판매하려는 상품 가격을 기준으로 계산합니다.' },
      { step: '02', title: '수수료 적용', desc: '판매가의 2.5%를 수수료로 계산합니다.' },
      { step: '03', title: '정산 금액 확인', desc: '판매가에서 수수료를 제외한 금액이 실수령액입니다.' },
      { step: '04', title: '타 플랫폼 비교', desc: '같은 판매가 기준으로 다른 플랫폼과 비교하면 차이를 쉽게 확인할 수 있습니다.' },
    ],
    tip: '💡 판매가 × 0.975 = 리셀그라운드 기준 실수령액입니다.'
  },

  schedule: {
    title: '정산 일정',
    icon: '📅',
    steps: [
      { step: '01', title: '거래 완료', desc: '구매자가 상품을 수령하고 거래가 완료되면 정산 단계로 넘어갑니다.' },
      { step: '02', title: '정산 대기', desc: '분쟁 가능 기간 또는 운영 정책에 따라 일정 기간 정산 대기 상태가 될 수 있습니다.' },
      { step: '03', title: '정산 처리', desc: '정산 조건이 충족되면 판매자 계좌로 정산됩니다.' },
      { step: '04', title: '내역 확인', desc: '추후 마이페이지에서 거래별 정산 내역을 확인할 수 있도록 확장할 수 있습니다.' },
    ],
    tip: '💡 정산 구조는 안전 거래와 연결되는 핵심 기능입니다.'
  },

  withdraw: {
    title: '출금 방법',
    icon: '🏦',
    steps: [
      { step: '01', title: '계좌 등록', desc: '본인 명의의 정산 계좌를 등록합니다.' },
      { step: '02', title: '출금 가능 금액 확인', desc: '정산 완료된 금액 중 출금 가능한 금액을 확인합니다.' },
      { step: '03', title: '출금 신청', desc: '출금 신청 버튼을 눌러 정산금을 출금합니다.' },
      { step: '04', title: '입금 확인', desc: '운영 정책에 따른 처리 기간 이후 계좌로 입금됩니다.' },
    ],
    tip: '💡 출금 기능은 실제 정산 시스템 구현 시 연결하면 됩니다.'
  },

  settlementStatus: {
    title: '정산 상태 확인',
    icon: '📊',
    steps: [
      { step: '01', title: '정산 대기', desc: '거래는 완료됐지만 아직 정산 처리 전인 상태입니다.' },
      { step: '02', title: '정산 완료', desc: '판매자에게 정산이 완료된 상태입니다.' },
      { step: '03', title: '정산 보류', desc: '분쟁이나 신고가 접수된 거래는 정산이 보류될 수 있습니다.' },
      { step: '04', title: '정산 취소', desc: '환불 또는 거래 취소가 확정된 경우 정산이 취소될 수 있습니다.' },
    ],
    tip: '💡 정산 상태는 판매자 신뢰와 거래 안정성 관리에 중요합니다.'
  },

  post: {
    title: '게시글 작성법',
    icon: '✍',
    steps: [
      { step: '01', title: '게시판 선택', desc: 'RESELL TALK, 자유게시판, 시세 분석, 거래 후기 등 목적에 맞는 게시판을 선택합니다.' },
      { step: '02', title: '제목 작성', desc: '내용을 한눈에 이해할 수 있는 제목을 작성합니다.' },
      { step: '03', title: '본문 작성', desc: '정보, 질문, 후기, 분석 내용을 구체적으로 작성합니다.' },
      { step: '04', title: '등록 완료', desc: '작성한 내용을 확인한 뒤 게시글 등록 버튼을 누릅니다.' },
    ],
    tip: '💡 좋은 정보성 글은 커뮤니티 신뢰도를 높이고 셀러 브랜딩에도 도움이 됩니다.'
  },

  board: {
    title: '자유게시판 이용',
    icon: '💬',
    steps: [
      { step: '01', title: '주제 선택', desc: '리셀, 패션, 시세, 거래 경험 등 자유롭게 이야기를 나눌 수 있습니다.' },
      { step: '02', title: '기본 매너 지키기', desc: '욕설, 비방, 허위 정보, 광고성 글은 피해야 합니다.' },
      { step: '03', title: '정보 공유', desc: '상품 정보, 시세 흐름, 판매 팁 등을 공유할 수 있습니다.' },
      { step: '04', title: '커뮤니티 활동', desc: '좋은 활동은 향후 셀러 신뢰도와 플랫폼 내 평판에 긍정적으로 작용할 수 있습니다.' },
    ],
    tip: '💡 리셀그라운드는 거래뿐 아니라 정보를 나누는 커뮤니티를 지향합니다.'
  },

  review: {
    title: '거래 후기 작성',
    icon: '⭐',
    steps: [
      { step: '01', title: '거래 완료 확인', desc: '거래가 완료된 뒤 후기를 작성할 수 있습니다.' },
      { step: '02', title: '후기 내용 작성', desc: '응답 속도, 상품 상태, 포장, 거래 매너 등을 구체적으로 작성합니다.' },
      { step: '03', title: '평점 반영', desc: '작성된 후기는 셀러 평판과 RG 셀러지수에 반영될 수 있습니다.' },
      { step: '04', title: '다른 사용자 도움', desc: '후기는 다른 구매자가 안전하게 거래하는 데 중요한 자료가 됩니다.' },
    ],
    tip: '💡 좋은 후기는 셀러 성장에 직접적인 도움이 됩니다.'
  },

 signal: {
  title: '신고 기능',
  icon: '🚨',
  steps: [
    { step: '01', title: '신고 사유 확인', desc: '허위 정보, 사기 의심, 욕설, 가품 의심, 외부 결제 유도 등 신고가 필요한 상황인지 확인합니다.' },
    { step: '02', title: '증거 자료 준비', desc: '문제가 된 게시글, 상품 페이지, 채팅 내용, 결제 요청 화면 등을 캡처해 보관합니다.' },
    { step: '03', title: '고객센터를 통한 접수', desc: '현재 신고 접수는 고객센터를 통해 진행할 수 있습니다. 고객센터에서 문의 유형을 선택한 뒤 신고 내용을 작성해주세요.' },
    { step: '04', title: '운영 검토', desc: '접수된 내용은 운영 기준에 따라 검토되며, 필요 시 추가 자료 요청 또는 조치가 진행될 수 있습니다.' },
  ],
  tip: '💡 신고 기능이 정식으로 분리되기 전까지는 고객센터를 통해 신고 내용을 접수해주세요.'
},
  rules: {
    title: '활동 규칙',
    icon: '📋',
    steps: [
      { step: '01', title: '존중 기반 소통', desc: '다른 사용자에게 불쾌감을 주는 표현은 피합니다.' },
      { step: '02', title: '허위 정보 금지', desc: '시세, 상품 상태, 정품 여부에 대한 허위 정보를 올리지 않습니다.' },
      { step: '03', title: '외부 거래 유도 금지', desc: '플랫폼 외부 결제나 외부 거래 유도는 제한될 수 있습니다.' },
      { step: '04', title: '건강한 커뮤니티 유지', desc: '정보 공유와 안전 거래를 중심으로 커뮤니티 문화를 만들어갑니다.' },
    ],
    tip: '💡 좋은 커뮤니티 문화는 플랫폼의 신뢰도를 높입니다.'
  }
};

function initGuide() {
  const tabs = document.querySelectorAll('.guide-tab');
  const cards = document.querySelectorAll('.guide-card');
  const grid = document.getElementById('guideGrid');
  const detail = document.getElementById('guideDetail');
  const body = document.getElementById('guideDetailBody');
  const backBtn = document.getElementById('guideBackBtn');

  if (!tabs.length || !cards.length || !grid || !detail || !body) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('act'));
      tab.classList.add('act');

      const cat = tab.dataset.guide;

      cards.forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });

      detail.style.display = 'none';
      grid.style.display = '';
    });
  });

  document.querySelectorAll('.guide-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      const data = GUIDE_DATA[key];

      if (!data) return;

      body.innerHTML = `
        <div class="guide-detail__title">
          <span class="guide-detail__icon">${data.icon}</span>
          <h2>${data.title}</h2>
        </div>

        <div class="guide-detail__steps">
          ${data.steps.map(s => `
            <div class="guide-step">
              <div class="guide-step__num">${s.step}</div>
              <div class="guide-step__content">
                <p class="guide-step__title">${s.title}</p>
                <p class="guide-step__desc">${s.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        ${data.tip ? `<div class="guide-tip">${data.tip}</div>` : ''}
      `;

      grid.style.display = 'none';
      detail.style.display = 'block';
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      detail.style.display = 'none';
      grid.style.display = '';
    });
  }
}
async function togglePostCardBookmark(btn) {
  if (!requireLogin()) return;

  const card = btn.closest('.pc');
  if (!card) return;

  const post = card._postData || {};
  const postId = card.dataset.postId || post.id || post.title;
  const user = getAuthUser ? getAuthUser() : null;

  if (!user?.email) {
    showToast('로그인 정보가 없습니다. 다시 로그인해주세요.', 'error');
    return;
  }

  if (!Array.isArray(DATA.bookmarks)) DATA.bookmarks = [];

  const idx = DATA.bookmarks.findIndex(item => {
    const saved = item.post || item;
    return String(item.postId || saved.id || saved.title) === String(postId);
  });

  try {
    if (idx >= 0) {
      DATA.bookmarks.splice(idx, 1);

      await fetch('https://resellground.di702934.workers.dev/api/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
        },
        body: JSON.stringify({
          user_email: user.email,
          post_id: postId
        })
      });

      btn.textContent = '북마크';
      btn.classList.remove('act', 'bm-active');
      showToast('북마크를 해제했어요.', 'info');
    } else {
      DATA.bookmarks.unshift({
        postId,
        post: { ...post, id: postId }
      });

      await fetch('https://resellground.di702934.workers.dev/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
        },
        body: JSON.stringify({
          id: `bookmark_${Date.now()}`,
          user_email: user.email,
          post_id: postId
        })
      });

      btn.textContent = '북마크 해제';
      btn.classList.add('act', 'bm-active');
      showToast('북마크에 저장됐어요.', 'success');
    }

    if (typeof refreshMpBookmarks === 'function') {
      refreshMpBookmarks();
    }
  } catch (err) {
    console.error(err);
    showToast('북마크 처리 중 오류가 발생했습니다.', 'warn');
    
  }
}
function initCommunityPostSync() {
  let tries = 0;

  const run = () => {
    if (
      typeof DATA === 'undefined' ||
      typeof renderPostCard !== 'function' ||
      !document.getElementById('postList')
    ) {
      if (tries < 20) {
        tries++;
        setTimeout(run, 100);
      }

      return;
    }

    refreshCommunityPostsFromDB();
  };

  run();
}

function initProductListSync() {
  let tries = 0;

  const run = () => {
    const hasData = typeof DATA !== 'undefined';
    const hasRenderer = typeof renderDropCard === 'function';
    const hasGrid = document.getElementById('dropsPageGrid');

    if (!hasData || !hasRenderer || !hasGrid) {
      if (tries < 20) {
        tries++;
        setTimeout(run, 100);
      }

      return;
    }

    refreshProductsFromDB();
  };

  run();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCommunityPostSync();
    initProductListSync();
  });
} else {
  initCommunityPostSync();
  initProductListSync();
}

/* ── 상품 상세 모달 열기 ── */
function openProductModal(product) {
  if (!product) return;

  const $ = id => document.getElementById(id);

  /* 이미지 */
  const img = $('pdProductImg');
  if (img) img.textContent = product.em || '📦';

  /* 배지 */
  const badge = $('pdProductBadge');
  if (badge) {
    badge.textContent = product.badgeTxt || '';
    badge.className = `pd-badge ${product.badgeCls || ''}`.trim();
  }

  /* 조회·관심 */
  const vc = $('pdViewCount');
  const it = $('pdInterest');
  if (vc) vc.textContent = product.view_count ?? product.viewCount ?? 0;
  if (it) it.textContent = product.interest ?? 0;

  /* 카테고리 */
  const cat = $('pdProductCat');
  if (cat) cat.textContent = product.cat || product.category || '';

  /* 상품명 */
  const name = $('pdProductName');
  if (name) name.textContent = product.name || '';

  /* 판매 상태 chip */
  const statusChip = $('pdProductStatus');
  if (statusChip) {
    const s = product.status || '판매중';
    statusChip.textContent = s;
    statusChip.className = `pd-status-chip ${s === '판매완료' ? 'sold' : s === '예약중' ? 'reserved' : 'selling'}`;
  }

  /* 가격 */
  const price = $('pdProductPrice');
  if (price) price.textContent = product.price || '';

  /* 태그 */
  const tags = $('pdProductTags');
  if (tags) {
    let html = '';
    if (product.tag === '빠른거래') html += `<span class="drop-tag fast">빠른거래</span>`;
    if (product.tag === '인증셀러') html += `<span class="drop-tag cert">인증셀러</span>`;
    if (product.tag === '협업모집') html += `<span class="drop-tag collab">협업모집</span>`;
    tags.innerHTML = html;
  }

  /* 셀러 */
  const sellerName = $('pdProductSeller');
  const sellerAv   = $('pdSellerAv');
  const sellerGrade = $('pdSellerGrade');
  if (sellerName) sellerName.textContent = product.seller || product.seller_name || '';
  if (sellerAv)   sellerAv.textContent   = product.em || '🔥';
  if (sellerGrade) {
    const tag = product.tag || '';
    sellerGrade.textContent = tag === '인증셀러' ? '✓ 인증 셀러' : '일반 셀러';
  }

  /* 상세 정보 */
  const cond  = $('pdCondition');
  const trade = $('pdTradeMethod');
  const posted = $('pdPostedAt');
  if (cond)   cond.textContent  = product.condition  || '—';
  if (trade)  trade.textContent = product.trade || product.trade_method || '—';
  if (posted) posted.textContent = product.postedAt  || product.created_at || '—';

  openModal('product');
}

/* ── 인기상품 카테고리 탭 ── */
document.querySelectorAll('[data-pop-cat]').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('[data-pop-cat]').forEach(b => b.classList.remove('act'));
    this.classList.add('act');
    S.popularCategory = this.dataset.popCat || '전체';
    S.popularPage = 1;
    S.popularHasMore = true;
    if (typeof loadPopularProducts === 'function') loadPopularProducts(false);
  });
});

/* ── 인기상품 더보기 버튼 ── */
const popularLoadMoreBtn = document.getElementById('popularLoadMoreBtn');
if (popularLoadMoreBtn) {
  popularLoadMoreBtn.addEventListener('click', () => {
    if (S.popularHasMore && !S.popularLoading) {
      S.popularPage++;
      if (typeof loadPopularProducts === 'function') loadPopularProducts(true);
    }
  });
}
async function openProductDetailFromDB(productId) {
  if (!productId) {
    showToast('상품 ID가 없습니다.', 'error');
    return;
  }

  try {
    const res = await fetch(
      `https://resellground.di702934.workers.dev/api/products/${encodeURIComponent(productId)}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error('상품 상세 정보를 불러오지 못했습니다.');
    }

    const data = await res.json();
    const product = data.product;

    if (!product) {
      throw new Error('상품 데이터가 없습니다.');
    }

    const drop = typeof normalizeProductToDrop === 'function'
      ? normalizeProductToDrop(product)
      : product;

    console.log('상품 상세 조회 성공:', product);

    if (typeof openProductModal === 'function') {
      openProductModal(drop);
      return;
    }

    showToast(`${product.name || '상품'} 조회 완료 · 조회수 ${product.views || 0}`, 'success');
  } catch (err) {
    console.error(err);
    showToast('상품 상세 정보를 불러오지 못했습니다.', 'error');
  }
}
window.openProductDetailFromDB = openProductDetailFromDB;

/* ═══════════════════════════════════════════════════════════════
   Work 1 — RG.categorySheet
   당근마켓 스타일 카테고리 캐스케이드 바텀시트 (범용 컴포넌트)
   사용법: RG.categorySheet.open({ onSelect })
═══════════════════════════════════════════════════════════════ */
window.RG = window.RG || {};

window.RG.categorySheet = (function () {
  let _overlay = null;
  let _stack   = [];   // [{items, title}] 뒤로가기 스택
  let _path    = [];   // [{id, label}]    선택 경로
  let _onSelect = null;

  /* ── DOM 생성 (최초 1회) ── */
  function _createDOM() {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.className = 'rg-category-sheet__overlay';
    _overlay.innerHTML = `
      <div class="rg-category-sheet" role="dialog" aria-modal="true">
        <div class="rg-category-sheet__hd">
          <button class="rg-category-sheet__back" id="rgCsBack" style="visibility:hidden" aria-label="뒤로">←</button>
          <span  class="rg-category-sheet__title" id="rgCsTitle">카테고리 선택</span>
          <button class="rg-category-sheet__close" id="rgCsClose" aria-label="닫기">✕</button>
        </div>
        <div class="rg-category-sheet__breadcrumb" id="rgCsBreadcrumb"></div>
        <ul  class="rg-category-sheet__list"       id="rgCsList" role="list"></ul>
      </div>`;
    document.body.appendChild(_overlay);

    _overlay.addEventListener('click', e => { if (e.target === _overlay) _close(); });
    document.getElementById('rgCsClose').addEventListener('click', _close);
    document.getElementById('rgCsBack').addEventListener('click',  _goBack);
  }

  /* ── 브레드크럼 렌더 ── */
  function _renderBreadcrumb() {
    const el = document.getElementById('rgCsBreadcrumb');
    if (!el) return;
    if (!_path.length) { el.innerHTML = ''; return; }
    el.innerHTML = _path.map((n, i) =>
      `<span class="rg-category-sheet__crumb${i === _path.length - 1 ? ' --last' : ''}">${n.label}</span>`
    ).join('<span class="rg-category-sheet__crumb-sep">›</span>');
  }

  /* ── 항목 렌더 ── */
  function _renderItems(items, title) {
    const listEl  = document.getElementById('rgCsList');
    const titleEl = document.getElementById('rgCsTitle');
    const backBtn = document.getElementById('rgCsBack');
    if (!listEl || !titleEl) return;

    titleEl.textContent          = title || '카테고리 선택';
    backBtn.style.visibility     = _stack.length ? 'visible' : 'hidden';

    listEl.innerHTML = items.map(item => {
      const hasChildren = !!(item.children && item.children.length);
      return `<li class="rg-category-sheet__item${hasChildren ? '' : ' --leaf'}"
                  data-id="${item.id}" data-label="${item.label}"
                  data-has-children="${hasChildren}" role="option" tabindex="0">
        ${item.icon ? `<span class="rg-category-sheet__item-icon">${item.icon}</span>` : '<span class="rg-category-sheet__item-icon"></span>'}
        <span class="rg-category-sheet__item-label">${item.label}</span>
        <span class="rg-category-sheet__item-arrow">${hasChildren ? '›' : ''}</span>
      </li>`;
    }).join('');

    listEl.querySelectorAll('.rg-category-sheet__item').forEach(el => {
      el.addEventListener('click',   () => _onItemClick(el, items));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') _onItemClick(el, items); });
    });
  }

  /* ── 항목 클릭 ── */
  function _onItemClick(el, items) {
    const id          = el.dataset.id;
    const label       = el.dataset.label;
    const hasChildren = el.dataset.hasChildren === 'true';
    const item        = items.find(i => i.id === id);
    if (!item) return;

    if (hasChildren) {
      _stack.push({ items, title: document.getElementById('rgCsTitle').textContent });
      _path.push({ id, label });
      _renderBreadcrumb();
      _renderItems(item.children, label);
    } else {
      _path.push({ id, label });
      const fullPath = _path.map(n => n.label).join(' > ');
      if (typeof _onSelect === 'function') _onSelect({ id, label, path: [..._path], fullPath });
      _close();
    }
  }

  /* ── 뒤로가기 ── */
  function _goBack() {
    if (!_stack.length) return;
    _path.pop();
    const prev = _stack.pop();
    _renderBreadcrumb();
    _renderItems(prev.items, prev.title);
  }

  /* ── 열기 ── */
  function open(opts) {
    opts      = opts || {};
    _onSelect = opts.onSelect || null;
    _stack    = [];
    _path     = [];

    _createDOM();
    _renderBreadcrumb();
    /* Fix 2: const는 window에 붙지 않으므로 직접 참조 */
    _renderItems((typeof RG_CATEGORIES !== 'undefined' ? RG_CATEGORIES : []), '카테고리 선택');
    _overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /* ── 닫기 ── */
  function _close() {
    if (_overlay) _overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  return { open };
})();

/* ── dropCat select → 카테고리 시트 연결 ── */
(function bindDropCatToSheet() {
  const select = document.getElementById('dropCat');
  if (!select) return;

  const wrap = select.closest('[style]') || select.parentElement;

  /* 트리거 버튼 생성 */
  const triggerBtn = document.createElement('button');
  triggerBtn.type      = 'button';
  triggerBtn.id        = 'dropCatTrigger';
  triggerBtn.className = 'rg-product-input rg-cs-trigger-btn';
  triggerBtn.innerHTML = `<span id="dropCatDisplay">카테고리 선택</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`;

  /* 원래 select 바로 앞에 삽입하고 숨기기 */
  select.parentNode.insertBefore(triggerBtn, select);
  select.style.display = 'none';

  triggerBtn.addEventListener('click', () => {
    window.RG.categorySheet.open({
      onSelect({ id, label, path, fullPath }) {
        document.getElementById('dropCatDisplay').textContent = fullPath;
        triggerBtn.classList.add('has-value');

        /* select value 업데이트 (없으면 option 추가) */
        let opt = [...select.options].find(o =>
          o.value === id || o.text === label || o.text.includes(label)
        );
        if (!opt) {
          opt = new Option(label, id);
          select.add(opt);
        }
        select.value = opt.value;

        /* 유효성 에러 숨기기 */
        const err = document.getElementById('dropCatErr');
        if (err) err.style.display = 'none';
      }
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════
   Work 2 — RG.chat 확장
   스크롤 고정 해제 + scrollToBottom 유틸
═══════════════════════════════════════════════════════════════ */
window.RG.chat = window.RG.chat || {};

window.RG.chat.scrollToBottom = function () {
  const area = document.getElementById('chatMsgs');
  if (area) requestAnimationFrame(() => { area.scrollTop = area.scrollHeight; });
};

/* 채팅 패널 크기 고정 → 내부 메시지 영역이 flex grow 하도록 클래스 추가 */
(function fixChatPanelScroll() {
  const panel = document.getElementById('chatPanel');
  if (panel) panel.classList.add('rg-chat-scroll-fixed');
})();


/* ═══════════════════════════════════════════════════════════════
   Work 3 — RG.chat.openFromProduct
   상품 상세 모달 → 판매자와 채팅 연결
═══════════════════════════════════════════════════════════════ */
window.RG.chat.openFromProduct = function (productCtx) {
  const ctx = productCtx || {};

  /* 로그인 확인 */
  if (!S.loggedIn) { openModal('login'); return; }

  /* 판매자명 읽기 (파라미터 없으면 현재 열린 모달 DOM에서) */
  const sellerName = ctx.seller || ctx.seller_name
    || document.getElementById('pdProductSeller')?.textContent?.trim() || '';
  const productName  = ctx.name  || document.getElementById('pdProductName')?.textContent?.trim()  || '';
  const productPrice = ctx.price || document.getElementById('pdProductPrice')?.textContent?.trim() || '';
  const productEm    = ctx.em    || document.getElementById('pdProductImg')?.textContent?.trim()    || '📦';

  if (!sellerName) { showToast('판매자 정보를 찾을 수 없어요.', 'error'); return; }

  /* 본인 상품 확인 */
  const user = (typeof getAuthUser === 'function') ? getAuthUser() : null;
  if (user && (user.nickname === sellerName || user.email === sellerName)) {
    showToast('본인 상품입니다.', 'info');
    return;
  }

  /* 상품 모달 닫기 */
  if (typeof closeModal === 'function') closeModal('product');

  /* 채팅 패널 열기 */
  const panel = document.getElementById('chatPanel');
  if (panel && !S.chatOpen) {
    S.chatOpen = true;
    panel.classList.add('open');
    const fab = document.getElementById('fabBtn');
    if (fab) fab.style.display = 'none';
  }

  /* 판매자와 대화 오픈 */
  if (typeof openChatWith === 'function') openChatWith(sellerName);

  /* 대화창 상단에 상품 카드 삽입 */
  // TODO: DB - conversations 테이블에서 (buyer_id, seller_id, product_id) 조합으로 기존 방 조회
  // TODO: DB - 없으면 신규 conversations INSERT
  setTimeout(() => {
    const area = document.getElementById('chatMsgs');
    if (!area) return;

    /* 중복 방지 */
    const existing = area.querySelector('.rg-chat-product-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = 'rg-chat-product-card';
    card.innerHTML = `
      <div class="rg-chat-product-card__inner">
        <div class="rg-chat-product-card__img">${productEm}</div>
        <div class="rg-chat-product-card__info">
          <p class="rg-chat-product-card__name">${productName}</p>
          <p class="rg-chat-product-card__price">${productPrice}</p>
        </div>
        <span class="rg-chat-product-card__badge">상품 문의</span>
      </div>`;
    /* Fix 4: 카드는 상단 고정, 스크롤도 상단으로 */
    area.insertBefore(card, area.firstChild);
    area.scrollTop = 0;
  }, 80);
};

/* ── 상품 모달의 채팅 버튼에 이벤트 연결 ──
   Fix 1: pd-chat-btn의 인라인 onclick이 stopPropagation()을 호출해서
   부모 modal에 위임하면 절대 실행 안 됨.
   버튼에 직접 addEventListener 등록해야 함.
   단, 버튼은 모달이 열릴 때마다 DOM에 있으므로 한 번만 바인딩하면 됨. */
(function bindProductModalChatBtn() {
  const btn = document.querySelector('#modal-product .pd-chat-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    /* 비로그인이면 인라인 onclick의 requireLogin()이 이미 처리 — 중복 방지 */
    if (!S.loggedIn) return;

    /* 로그인 상태면 채팅 연결 */
    window.RG.chat.openFromProduct();
  });
})();
