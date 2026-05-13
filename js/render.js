'use strict';
/* ═══════════════════════════════════════════
   리셀그라운드 — 렌더링 함수
═══════════════════════════════════════════ */

/* 셀러 등급 배지 */
function tierBadge(seller) {
  const map = {
    'verified': `<span class="tier-badge verified">✓ 인증 셀러</span>`,
    'trusted':  `<span class="tier-badge trusted">★ 신뢰 셀러</span>`,
    '':         `<span class="tier-badge normal">일반 셀러</span>`,
  };
  const weekly = seller.weeklyTop ? `<span class="tier-badge weekly">🏆 주간 TOP</span>` : '';
  return (map[seller.tierCls] || '') + weekly;
}

/* RG 셀러지수 */
function sellerScore(rate) {
  const score = Math.round(rate * 9);
  const color = score >= 850 ? '#059669' : score >= 750 ? '#d97706' : '#dc2626';
  return `<span style="color:${color};font-weight:800">${score}점</span>`;
}

/* 상품 태그 */
function dropStatusTag(drop) {
  if (drop.status === '판매완료') return `<span class="drop-tag sold">판매완료</span>`;
  if (drop.status === '예약중')   return `<span class="drop-tag reserved">예약중</span>`;
  if (drop.tag === '협업모집')    return `<span class="drop-tag collab">협업모집</span>`;
  if (drop.tag === '빠른거래')    return `<span class="drop-tag fast">빠른거래</span>`;
  if (drop.tag === '인증셀러')    return `<span class="drop-tag cert">인증셀러</span>`;
  return '';
}

/* 게시글 태그 */
function postTags(tags) {
  if (!tags || !tags.length) return '';
  const map = {
    '협업모집':  'tag-collab',
    '인증셀러':  'tag-cert',
    '빠른거래':  'tag-fast',
    '판매완료':  'tag-sold',
    '시세정보':  'tag-info',
    '거래후기':  'tag-review',
  };
  return tags.map(t => `<span class="post-tag ${map[t]||'tag-info'}">${t}</span>`).join('');
}

/* ── SELLER CARD ── */
function renderSellerCard(seller, index) {
  const div = document.createElement('div');
  div.className = 'sc';
  div.dataset.sellerId = seller.id;
  div.innerHTML = `
    <span class="sc__rank">${String(index+1).padStart(2,'0')}</span>
    <div class="sc__av ${seller.av}">${seller.em}</div>
    <div class="sc__tier-row">${tierBadge(seller)}</div>
    <p class="sc__name">
      ${seller.name}
      ${seller.onlineNow ? '<span class="sc__online"><span class="sc__online-dot"></span>온라인</span>' : ''}
    </p>
    <p class="sc__handle">${seller.handle} · ${seller.loc}</p>
    <div class="sc__live-signals">
      <span class="sc__signal">⏱ ${seller.lastTrade} 응답</span>
      <span class="sc__signal sc__signal--hot">🔥 이번 주 ${seller.weekTrades}건</span>
    </div>
    <div class="sc__tags">${seller.tags.map(t=>`<span class="sc__tag">${t}</span>`).join('')}</div>
    <div class="sc__stats">
      <div><p class="sc__sn">${seller.sales}</p><p class="sc__sl">판매</p></div>
      <div><p class="sc__sn">${seller.rating}</p><p class="sc__sl">평점</p></div>
      <div><p class="sc__sn">${seller.followers}</p><p class="sc__sl">팔로워</p></div>
    </div>
    <div class="sc__trust-row">
      <div class="sc__trust-item">
        <span class="sc__trust-label">거래성공률</span>
        <span class="sc__trust-val" style="color:var(--three)">${seller.successRate}%</span>
      </div>
      <div class="sc__trust-item">
        <span class="sc__trust-label">응답속도</span>
        <span class="sc__trust-val">${seller.replyTime}</span>
      </div>
      <div class="sc__trust-item">
        <span class="sc__trust-label">발송</span>
        <span class="sc__trust-val">${seller.shippingTime}</span>
      </div>
    </div>
    <div class="sc__temp-row">
  <span class="sc__temp-label">RG 셀러지수</span>
  ${sellerScore(seller.successRate)}
  <div class="sc__temp-bar"><div class="sc__temp-fill" style="width:${seller.successRate}%"></div></div>
</div>
    <button class="sc__follow" data-follow="${seller.name}">팔로우</button>
  `;
  div.querySelector('.sc__follow').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!S.loggedIn) { openModal('login'); return; }
    const btn = e.target;
    const isActive = btn.classList.toggle('act');
    btn.textContent = isActive ? '팔로잉 ✓' : '팔로우';
    showToast(isActive ? `@${seller.name}을 팔로우했습니다.` : `팔로우를 취소했습니다.`, 'info');
  });
  return div;
}

/* ── DROP CARD (이미지 중심, 오버레이) ── */
function renderDropCard(drop) {
  const div = document.createElement('div');
  div.className = 'dc';
  if (drop.status === '판매완료') div.classList.add('dc--sold');
  div.innerHTML = `
    <div class="dc__img">
      <div class="dc__img-bg">${drop.em}</div>
      <div class="dc__img-inner">${drop.em}</div>
      <span class="dc__badge ${drop.badgeCls}">${drop.badgeTxt}</span>
      ${dropStatusTag(drop)}
      <div class="dc__overlay">
        <p class="dc__overlay-price">${drop.price}</p>
        <button class="dc__overlay-btn" onclick="event.stopPropagation();requireLogin()">거래하기 →</button>
        <button class="dc__overlay-bm" onclick="event.stopPropagation();toggleBookmark(this)" aria-label="북마크">🔖</button>
      </div>
    </div>
    <div class="dc__body">
      <p class="dc__cat">${drop.cat}</p>
      <p class="dc__name">${drop.name}</p>
      <p class="dc__seller">
        by <strong>${drop.seller}</strong>
        ${drop.postedAt ? `<span class="dc__posted-at">· ${drop.postedAt}</span>` : ''}
      </p>
      <div class="dc__foot">
        <p class="dc__price">${drop.price}</p>
        <p class="dc__int">관심 <strong>${drop.interest}</strong>명</p>
      </div>
    </div>
  `;
  return div;
}

/* ── RANK ITEM ── */
function renderRankItem(item) {
  const div = document.createElement('div');
  div.className = 'ri';
  div.innerHTML = `
    <span class="ri__num${item.top?' top':''}">${String(item.rank).padStart(2,'0')}</span>
    <div class="ri__av ${item.av}">${item.em}</div>
    <div>
      <p class="ri__name">${item.name} ${item.weeklyTop?'<span class="badge-weekly">🏆 주간TOP</span>':''}</p>
      <p class="ri__spec">${item.spec}</p>
    </div>
    <div><p class="ri__count">${item.count}</p><p class="ri__cl">거래</p></div>
  `;
  return div;
}

/* ── POST CARD (태그 포함) ── */
function renderPostCard(post) {
  const tierIcon = post.authorTier==='verified' ? '✓' : post.authorTier==='trusted' ? '★' : '';
  const tierClass = post.authorTier==='verified' ? 'post-author-verified' : post.authorTier==='trusted' ? 'post-author-trusted' : '';
  const div = document.createElement('article');
  div.className = 'pc';
  div.innerHTML = `
    <div class="pc__hd">
      <div class="pc__av ${post.av}">${post.em}</div>
      <span class="pc__author ${tierClass}">${post.author}${tierIcon?`<span class="pc__tier-icon">${tierIcon}</span>`:''}</span>
      <span class="pc__badge">${post.badge}</span>
      <span class="pc__time">${post.time}</span>
    </div>
    <div class="pc__tags">${postTags(post.tags)}</div>
    <h3 class="pc__title">${post.title}</h3>
    <p class="pc__preview">${post.preview}</p>
    <div class="pc__foot">
      <span>👍 ${post.likes}</span>
      <span>💬 ${post.comments}</span>
      <span>👁 ${post.views}</span>
      <button class="pc__action-btn" onclick="event.stopPropagation();requireLogin()">북마크</button>
    </div>
  `;

  // 게시물 고유 ID 부여
  const postId = post.id || (Date.now() + Math.random()).toString(36);
  div.dataset.postId = postId;
  div._postData = post;

  // 게시글 카드 클릭 시 상세보기 열기
  div.addEventListener('click', (e) => {
    if (e.target.closest('.pc__action-btn')) return;

    if (typeof openPostDetail === 'function') {
      openPostDetail({ ...post, id: postId });
    }
  });

  return div;
}

/* ── MARKET CARD ── */
function renderMarketCard(item) {
  const maxB = Math.max(...item.bars);
  const div = document.createElement('div');
  div.className = 'mkc';
  div.innerHTML = `
    <p class="mkc__cat">${item.cat}</p>
    <p class="mkc__name">${item.name}</p>
    <p class="mkc__price">${item.price}</p>
    <p class="mkc__chg ${item.up?'up':'dn'}">${item.up?'↑':'↓'} ${item.change}</p>
    <div class="mkc__bars">${item.bars.map(b=>`<div class="mkc__bar" style="height:${Math.round(b/maxB*100)}%"></div>`).join('')}</div>
  `;
  return div;
}

/* ── POPULAR CARD (이미지 중심) ── */
function renderPopularCard(drop, i) {
  const div = document.createElement('div');
  div.className = 'pop';
  div.innerHTML = `
    <div class="pop__img">
      <div class="pop__img-inner">${drop.em}</div>
      <span class="pop__rank${i<3?' top':''}">${String(i+1).padStart(2,'0')}</span>
      ${drop.status==='판매완료'?'<span class="pop__sold-overlay">판매완료</span>':''}
    </div>
    <div class="pop__body">
      <p class="pop__brand">${drop.cat}</p>
      <p class="pop__name">${drop.name}</p>
      <div class="pop__foot">
        <p class="pop__price">${drop.price}</p>
        <p class="pop__views">👁 ${drop.interest*12}</p>
      </div>
    </div>
  `;
  return div;
}

/* ── FEED ITEM (신뢰 배지 포함) ── */
function renderFeedItem(d) {
  const div = document.createElement('div');
  div.className = 'feed-item';
  div.innerHTML = `
    <div class="feed-av ${d.av}">${d.em}</div>
    <div>
      <p class="feed-user">${d.user}${d.trust?`<span class="feed-trust-badge ${d.trust==='인증'?'feed-trust-verified':'feed-trust-trusted'}">${d.trust==='인증'?'✓':'★'} ${d.trust}</span>`:''}</p>
      <p class="feed-action">${d.action} <strong>${d.item}</strong></p>
      <p class="feed-time">방금 전</p>
    </div>
    <div>
      <p class="feed-price">${d.price}</p>
      <p class="feed-badge">${d.badge}</p>
    </div>
  `;
  return div;
}

/* ── 실시간 거래 로그 ── */
function renderTradeLog(log) {
  const div = document.createElement('div');
  div.className = 'trade-log-item';
  const isUp = log.change && log.change.startsWith('+');
  const isDn = log.change && log.change.startsWith('-');
  div.innerHTML = `
    <span class="trade-log-em">${log.em}</span>
    <div class="trade-log-info">
      <span class="trade-log-item-name">${log.item}</span>
      <span class="trade-log-price">${log.price}</span>
    </div>
    <div class="trade-log-right">
      <span class="trade-log-action ${log.action==='거래 완료'?'action-done':log.action==='새 드롭'?'action-new':'action-change'}">${log.action}</span>
      ${log.change ? `<span class="trade-log-change ${isUp?'up':isDn?'dn':''}">${log.change}</span>` : ''}
      <span class="trade-log-time">${log.time}</span>
    </div>
  `;
  return div;
}

/* ── INIT GRIDS ── */
function initGrids() {
  const homeSG = document.getElementById('homeSellerGrid');
  if (homeSG) { homeSG.innerHTML=''; DATA.sellers.slice(0,4).forEach((s,i)=>homeSG.appendChild(renderSellerCard(s,i))); }

  const fullSG = document.getElementById('fullSellerGrid');
  if (fullSG) { fullSG.innerHTML=''; DATA.sellers.forEach((s,i)=>fullSG.appendChild(renderSellerCard(s,i))); }

  const homeDG = document.getElementById('homeDropsGrid');
  if (homeDG) {
    homeDG.innerHTML='';
    const hero = DATA.drops[0];
    const heroEl = document.createElement('div');
    heroEl.className='dc';
    heroEl.innerHTML=`
      <div class="dc__img lg">
        <div class="dc__img-bg">${hero.em}</div>
        <div class="dc__img-inner" style="font-size:80px">${hero.em}</div>
        <span class="dc__badge ${hero.badgeCls}">${hero.badgeTxt}</span>
        ${dropStatusTag(hero)}
        <div class="dc__overlay">
          <p class="dc__overlay-price">${hero.price}</p>
          <button class="dc__overlay-btn" onclick="requireLogin()">거래하기 →</button>
        </div>
      </div>
      <div class="dc__body">
        <p class="dc__cat">${hero.cat}</p>
        <p class="dc__name lg">${hero.name}</p>
        <p class="dc__seller">by <strong>${hero.seller}</strong></p>
        <div class="dc__foot"><p class="dc__price lg">${hero.price}</p><p class="dc__int">관심 <strong>${hero.interest}</strong>명</p></div>
      </div>`;
    homeDG.appendChild(heroEl);
    const side = document.createElement('div');
    side.className='g-drops-side';
    DATA.drops.slice(1,3).forEach(d=>side.appendChild(renderDropCard(d)));
    homeDG.appendChild(side);
  }

  const dpg = document.getElementById('dropsPageGrid');
  if (dpg) { dpg.innerHTML=''; DATA.drops.forEach(d=>dpg.appendChild(renderDropCard(d))); }

  ['homeRankList','fullRankList'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.innerHTML=''; DATA.rankings.forEach(r=>el.appendChild(renderRankItem(r)));}
  });

  const pl=document.getElementById('postList');
  if(pl){pl.innerHTML=''; DATA.posts.forEach(p=>pl.appendChild(renderPostCard(p)));}

  const mg=document.getElementById('marketGrid');
  if(mg){mg.innerHTML=''; DATA.markets.forEach(m=>mg.appendChild(renderMarketCard(m)));}

  const pg=document.getElementById('popularGrid');
  if(pg){pg.innerHTML=''; DATA.drops.forEach((d,i)=>pg.appendChild(renderPopularCard(d,i)));}

  const hpg=document.getElementById('homePopularGrid');
  if(hpg){hpg.innerHTML=''; DATA.drops.slice(0,4).forEach((d,i)=>hpg.appendChild(renderPopularCard(d,i)));}

  /* 실시간 거래 로그 */
  const tl=document.getElementById('tradeLogList');
  if(tl){tl.innerHTML=''; DATA.tradeLogs.forEach(l=>tl.appendChild(renderTradeLog(l)));}

  /* 피드 초기 */
  const fl=document.getElementById('feedList');
  if(fl){
    fl.innerHTML='';
    const init=[
      {av:'av-a',em:'🔥',user:'@sneaker.kang',action:'거래 완료 —',item:'Nike Dunk Low Panda',price:'₩189K',badge:'직거래',trust:'인증'},
      {av:'av-b',em:'💎',user:'@luxe.j',action:'새 드롭 —',item:'Gucci Ophidia',price:'₩1.2M',badge:'안전결제',trust:'인증'},
      {av:'av-c',em:'⌚',user:'@watch.yk',action:'가격 상승 —',item:'Rolex GMT-Master II +3.1%',price:'₩14.8M',badge:'시세',trust:'신뢰'},
      {av:'av-d',em:'👟',user:'@kicks.p',action:'협업 모집 —',item:'Air Jordan 1 Chicago',price:'₩620K',badge:'협업',trust:''},
      {av:'av-e',em:'👜',user:'@luxe.j',action:'거래 완료 —',item:'Chanel Classic Flap',price:'₩8.4M',badge:'직거래',trust:'인증'},
    ];
    init.forEach(d=>fl.appendChild(renderFeedItem(d)));
  }
}

/* ── 북마크 토글 ── */
function toggleBookmark(btn) {
  if (!S.loggedIn) { openModal('login'); return; }
  btn.classList.toggle('bm-active');
  btn.textContent = btn.classList.contains('bm-active') ? '🔖' : '🔖';
  showToast(btn.classList.contains('bm-active') ? '북마크에 저장됐어요.' : '북마크를 해제했어요.', 'info');
}
