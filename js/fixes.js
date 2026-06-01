'use strict';
/* ================================================================
   fixes.js — 4가지 기능 재구현
   기존 코드 일절 수정 없이 이 파일에서만 추가
================================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     1. 카테고리 캐스케이드 바텀시트
        - 상품 등록 페이지: #pregCatBtn 클릭 시 오픈
        - 드롭 빠른등록:    #dropCat select를 버튼으로 대체
  ============================================================ */
  (function setupCategorySheet() {

    /* ── 카테고리 데이터 ── */
    var CATS = [
      { id:'clothing', label:'의류', icon:'👕', children:[
        { id:'mens', label:'남성의류', children:[
          { id:'mens_top',   label:'상의',   children:[
            {id:'tshirt',label:'티셔츠'},{id:'hoodie',label:'후드·맨투맨'},
            {id:'shirt', label:'셔츠'},  {id:'knit',  label:'니트·가디건'},
          ]},
          { id:'mens_outer', label:'아우터', children:[
            {id:'jacket',label:'재킷'},{id:'coat', label:'코트'},
            {id:'padded',label:'패딩'},{id:'vest', label:'조끼'},
          ]},
          { id:'mens_bottom',label:'하의',   children:[
            {id:'pants', label:'팬츠·슬랙스'},{id:'jeans', label:'청바지'},
            {id:'shorts',label:'반바지'},
          ]},
        ]},
        { id:'womens', label:'여성의류', children:[
          { id:'womens_top',  label:'상의',         children:[
            {id:'wtshirt',label:'티셔츠·블라우스'},{id:'wknit',label:'니트'},
          ]},
          { id:'womens_dress',label:'원피스·스커트', children:[
            {id:'dress',label:'원피스'},{id:'skirt',label:'스커트'},
          ]},
        ]},
        { id:'unisex', label:'유니섹스', children:[
          {id:'u_hoodie',label:'후드·맨투맨'},{id:'u_tshirt',label:'티셔츠'},
        ]},
      ]},
      { id:'shoes', label:'신발', icon:'👟', children:[
        { id:'sneakers',   label:'스니커즈', children:[
          {id:'hi_top',label:'하이탑'},{id:'lo_top',label:'로우탑'},{id:'platform',label:'플랫폼'},
        ]},
        { id:'sandals',    label:'샌들·슬리퍼', children:[
          {id:'sandal',label:'샌들'},{id:'slipper',label:'슬리퍼'},
        ]},
        { id:'boots',      label:'부츠', children:[
          {id:'ankle_boot',label:'앵클부츠'},{id:'long_boot',label:'롱부츠'},
        ]},
        { id:'dress_shoes',label:'구두·로퍼', children:[
          {id:'loafer',label:'로퍼'},{id:'oxford',label:'옥스포드'},
        ]},
      ]},
      { id:'bag', label:'가방', icon:'👜', children:[
        {id:'backpack',label:'백팩'},{id:'shoulder',label:'숄더백'},
        {id:'tote',    label:'토트백'},{id:'clutch', label:'클러치'},
      ]},
      { id:'accessory', label:'패션잡화', icon:'🧣', children:[
        { id:'hat',    label:'모자',  children:[
          {id:'cap',label:'볼캡·스냅백'},{id:'beanie',label:'비니'},{id:'bucket',label:'버킷햇'},
        ]},
        { id:'wallet', label:'지갑', children:[
          {id:'long_wallet',label:'장지갑'},{id:'short_wallet',label:'반지갑'},{id:'card_wallet',label:'카드지갑'},
        ]},
        {id:'belt',   label:'벨트'},
        {id:'scarf',  label:'스카프·머플러'},
        {id:'glasses',label:'안경·선글라스'},
      ]},
      { id:'luxury', label:'명품', icon:'💎', children:[
        {id:'lux_bag',    label:'명품 가방'},{id:'lux_wallet', label:'명품 지갑'},
        {id:'lux_clothes',label:'명품 의류'},{id:'lux_shoes',  label:'명품 신발'},
      ]},
      { id:'watch',   label:'시계',     icon:'⌚', children:[
        {id:'mech',   label:'기계식'},{id:'quartz', label:'쿼츠'},
        {id:'smart',  label:'스마트워치'},{id:'vintage',label:'빈티지'},
      ]},
      { id:'jewelry', label:'주얼리',   icon:'💍', children:[
        {id:'necklace',label:'목걸이'},{id:'ring',    label:'반지'},
        {id:'bracelet',label:'팔찌'},  {id:'earring', label:'귀걸이'},
      ]},
      { id:'tech',    label:'테크·가전',icon:'💻', children:[
        {id:'phone', label:'스마트폰'},{id:'laptop',label:'노트북·태블릿'},
        {id:'audio', label:'음향기기'},{id:'camera',label:'카메라'},
      ]},
      { id:'etc',     label:'기타',     icon:'📦' },
    ];

    /* ── 바텀시트 DOM ── */
    var overlay = document.createElement('div');
    overlay.id        = 'fixCatOverlay';
    overlay.className = 'fix-cat-overlay';
    overlay.innerHTML =
      '<div class="fix-cat-sheet">' +
        '<div class="fix-cat-hd">' +
          '<button id="fixCatBack" class="fix-cat-nav-btn" style="visibility:hidden">←</button>' +
          '<span   id="fixCatTitle" class="fix-cat-title">카테고리 선택</span>' +
          '<button id="fixCatClose" class="fix-cat-nav-btn">✕</button>' +
        '</div>' +
        '<div id="fixCatBreadcrumb" class="fix-cat-breadcrumb"></div>' +
        '<ul  id="fixCatList"       class="fix-cat-list"></ul>' +
      '</div>';
    document.body.appendChild(overlay);

    var stack    = [];
    var path     = [];
    var onSelect = null;

    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function renderBreadcrumb() {
      var el = document.getElementById('fixCatBreadcrumb');
      if (!el) return;
      if (!path.length) { el.innerHTML = ''; return; }
      el.innerHTML = path.map(function(n, i) {
        var cls = 'fix-cat-crumb' + (i === path.length - 1 ? ' fix-cat-crumb--last' : '');
        return '<span class="' + cls + '">' + n.label + '</span>';
      }).join('<span class="fix-cat-sep">›</span>');
    }

    function renderItems(items, title) {
      var listEl  = document.getElementById('fixCatList');
      var titleEl = document.getElementById('fixCatTitle');
      var backBtn = document.getElementById('fixCatBack');
      if (!listEl || !titleEl) return;

      titleEl.textContent      = title || '카테고리 선택';
      backBtn.style.visibility = stack.length ? 'visible' : 'hidden';
      listEl.innerHTML = '';

      items.forEach(function(item) {
        var hasChildren = !!(item.children && item.children.length);
        var li = document.createElement('li');
        li.className  = 'fix-cat-item' + (hasChildren ? '' : ' fix-cat-item--leaf');
        li.tabIndex   = 0;
        li.innerHTML  =
          '<span class="fix-cat-icon">' + (item.icon || '') + '</span>' +
          '<span class="fix-cat-label">' + item.label + '</span>' +
          '<span class="fix-cat-arrow">' + (hasChildren ? '›' : '') + '</span>';

        function choose() {
          if (hasChildren) {
            stack.push({ items: items, title: titleEl.textContent });
            path.push({ id: item.id, label: item.label });
            renderBreadcrumb();
            renderItems(item.children, item.label);
          } else {
            path.push({ id: item.id, label: item.label });
            var fullPath = path.map(function(n){ return n.label; }).join(' > ');
            if (typeof onSelect === 'function') onSelect({ id: item.id, label: item.label, path: path.slice(), fullPath: fullPath });
            close();
          }
        }

        li.addEventListener('click',   choose);
        li.addEventListener('keydown', function(e){ if (e.key === 'Enter') choose(); });
        listEl.appendChild(li);
      });
    }

    function open(opts) {
      opts     = opts || {};
      onSelect = opts.onSelect || null;
      stack    = [];
      path     = [];
      renderBreadcrumb();
      renderItems(CATS, '카테고리 선택');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    document.getElementById('fixCatClose').addEventListener('click', close);
    document.getElementById('fixCatBack').addEventListener('click', function() {
      if (!stack.length) return;
      path.pop();
      var prev = stack.pop();
      renderBreadcrumb();
      renderItems(prev.items, prev.title);
    });
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });

    /* ── 상품 등록 페이지: pregCatBtn 연결 ── */
    var pregCatBtn   = document.getElementById('pregCatBtn');
    var pregCatHidden = document.getElementById('pregCat');
    var pregCatLabel = document.getElementById('pregCatLabel');

    if (pregCatBtn) {
      pregCatBtn.addEventListener('click', function() {
        open({
          onSelect: function(result) {
            if (pregCatHidden) pregCatHidden.value = result.path[0].id;
            if (pregCatLabel) pregCatLabel.textContent = result.fullPath;
            pregCatBtn.classList.add('has-value');
            var err = document.getElementById('pregCatErr');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
          }
        });
      });
    }

    /* ── 드롭 빠른등록 폼: dropCat select 대체 ── */
    var dropCatSelect = document.getElementById('dropCat');
    if (dropCatSelect && !document.getElementById('fixDropCatBtn')) {
      var dropCatWrap = dropCatSelect.parentElement;

      var dropBtn = document.createElement('button');
      dropBtn.type      = 'button';
      dropBtn.id        = 'fixDropCatBtn';
      dropBtn.className = 'rg-product-input fix-cat-trigger';
      dropBtn.innerHTML = '<span id="fixDropCatLabel">카테고리 선택</span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>';

      dropCatWrap.insertBefore(dropBtn, dropCatSelect);
      dropCatSelect.style.display = 'none';

      dropBtn.addEventListener('click', function() {
        open({
          onSelect: function(result) {
            var label = document.getElementById('fixDropCatLabel');
            if (label) label.textContent = result.fullPath;
            dropBtn.classList.add('has-value');

            /* select에 option 추가 후 값 세팅 */
            var opt = null;
            for (var i = 0; i < dropCatSelect.options.length; i++) {
              if (dropCatSelect.options[i].value === result.path[0].id) { opt = dropCatSelect.options[i]; break; }
            }
            if (!opt) {
              opt = new Option(result.path[0].label, result.path[0].id);
              dropCatSelect.add(opt);
            }
            dropCatSelect.value = opt.value;

            var err = document.getElementById('dropCatErr');
            if (err) err.style.display = 'none';
          }
        });
      });
    }

  })(); /* end setupCategorySheet */


  /* ============================================================
     2. 채팅창 드래그 이동
        cursor:move 있는 헤더를 잡고 채팅창 이동
  ============================================================ */
  (function setupChatDrag() {
    var panel = document.getElementById('chatPanel');
    var hd    = document.querySelector('#chatPanel .chat-panel__hd');
    if (!panel || !hd) return;

    var dragging = false;
    var ox = 0, oy = 0;   /* 마우스-패널 왼쪽위 오프셋 */

    function startDrag(clientX, clientY) {
      /* position:fixed + bottom/right → left/top 으로 전환 */
      var rect = panel.getBoundingClientRect();
      panel.style.right  = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left   = rect.left + 'px';
      panel.style.top    = rect.top  + 'px';

      ox = clientX - rect.left;
      oy = clientY - rect.top;
      dragging = true;
      panel.classList.add('is-dragging');
    }

    function doDrag(clientX, clientY) {
      if (!dragging) return;
      var newLeft = clientX - ox;
      var newTop  = clientY - oy;
      /* 화면 밖 방지 */
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - panel.offsetWidth));
      newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - panel.offsetHeight));
      panel.style.left = newLeft + 'px';
      panel.style.top  = newTop  + 'px';
    }

    function endDrag() {
      dragging = false;
      panel.classList.remove('is-dragging');
    }

    /* 마우스 */
    hd.addEventListener('mousedown', function(e) {
      if (e.target.closest('button')) return;   /* 버튼 클릭은 드래그 제외 */
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function(e) { doDrag(e.clientX, e.clientY); });
    document.addEventListener('mouseup',   endDrag);

    /* 터치 */
    hd.addEventListener('touchstart', function(e) {
      if (e.target.closest('button')) return;
      var t = e.touches[0];
      startDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function(e) {
      if (!dragging) return;
      e.preventDefault();
      var t = e.touches[0];
      doDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('touchend', endDrag);

  })(); /* end setupChatDrag */


  /* ============================================================
     3. 판매 상품 → 채팅 연결
        상품 모달 💬채팅 클릭 → 판매자 채팅창 오픈 + 상품 카드
  ============================================================ */
  (function setupProductChat() {
    var pdModal = document.getElementById('modal-product');
    if (!pdModal) return;

    pdModal.addEventListener('click', function(e) {
      var btn = e.target.closest('.pd-chat-btn');
      if (!btn) return;

      /* 로그인 상태 확인 */
      if (!window.S || !window.S.loggedIn) {
        if (typeof openModal === 'function') openModal('login');
        return;
      }

      /* 판매자, 상품 정보 읽기 */
      var sellerName = (document.getElementById('pdProductSeller') || {}).textContent || '';
      sellerName = sellerName.trim();
      var productName  = ((document.getElementById('pdProductName')  || {}).textContent || '').trim();
      var productPrice = ((document.getElementById('pdProductPrice') || {}).textContent || '').trim();
      var productEm    = ((document.getElementById('pdProductImg')   || {}).textContent || '📦').trim();

      if (!sellerName) {
        if (typeof showToast === 'function') showToast('판매자 정보를 찾을 수 없어요.', 'error');
        return;
      }

      /* 본인 상품 확인 */
      var user = (typeof getAuthUser === 'function') ? getAuthUser() : null;
      if (user && (user.nickname === sellerName || user.email === sellerName)) {
        if (typeof showToast === 'function') showToast('본인 상품입니다.', 'info');
        return;
      }

      /* 상품 모달 닫기 */
      if (typeof closeModal === 'function') closeModal('product');

      /* 채팅 패널 열기 */
      var panel = document.getElementById('chatPanel');
      if (panel && window.S && !window.S.chatOpen) {
        window.S.chatOpen = true;
        panel.classList.add('open');
        var fab = document.getElementById('fabBtn');
        if (fab) fab.style.display = 'none';
      }

      /* 채팅 대화 오픈 */
      if (typeof openChatWith === 'function') {
        openChatWith(sellerName);
      }

      /* 상품 카드 삽입 */
      // TODO: DB - conversations 테이블 조회/생성
      setTimeout(function() {
        var area = document.getElementById('chatMsgs');
        if (!area) return;

        /* 중복 제거 */
        var old = area.querySelector('.fix-product-card');
        if (old) old.remove();

        var card = document.createElement('div');
        card.className = 'fix-product-card';
        card.innerHTML =
          '<div class="fix-product-card__inner">' +
            '<div class="fix-product-card__em">' + productEm + '</div>' +
            '<div class="fix-product-card__info">' +
              '<p class="fix-product-card__name">' + productName + '</p>' +
              '<p class="fix-product-card__price">' + productPrice + '</p>' +
            '</div>' +
            '<span class="fix-product-card__badge">상품 문의</span>' +
          '</div>';

        area.insertBefore(card, area.firstChild);
        area.scrollTop = 0;
      }, 100);

    }); /* end pdModal click */

  })(); /* end setupProductChat */


  /* ============================================================
     4. 마이페이지 프로필 — 편집 모드 + 저장 버튼
        기본 읽기전용, "프로필 편집" 버튼 누른 후에만 수정 가능
  ============================================================ */
  (function setupProfileEdit() {
    var panel = document.getElementById('mp-panel-profile');
    if (!panel) return;

    /* ── 대상 input/textarea 수집 (checkbox·hidden 제외) ── */
    var fields = Array.from(
      panel.querySelectorAll('input:not([type=checkbox]):not([type=hidden]), textarea')
    );

    var origVals = {};
    var editing  = false;
    var dirty    = false;

    /* ── 값 스냅샷 ── */
    function snapshot() {
      fields.forEach(function(el, i) { origVals[i] = el.value; });
    }

    /* ── dirty 여부 ── */
    function checkDirty() {
      dirty = fields.some(function(el, i) { return el.value !== origVals[i]; });
      if (saveBtn) {
        saveBtn.disabled = !dirty;
        saveBtn.style.opacity = dirty ? '1' : '0.4';
      }
    }

    /* ── 모드 전환 ── */
    function setEdit(on) {
      editing = on;
      fields.forEach(function(el) {
        el.readOnly = !on;
        if (on) {
          el.style.background   = '';
          el.style.borderColor  = '';
          el.style.cursor       = '';
          el.style.pointerEvents = '';
        } else {
          el.style.background   = 'var(--bg-soft, #f9fafb)';
          el.style.borderColor  = 'transparent';
          el.style.cursor       = 'default';
          el.style.pointerEvents = 'none';
        }
      });

      editBtn.textContent = on ? '취소' : '프로필 편집';
      if (saveBtn) saveBtn.style.display = on ? 'inline-flex' : 'none';

      if (!on) {
        /* 취소 → 원래 값 복원 */
        fields.forEach(function(el, i) { el.value = origVals[i]; });
        dirty = false;
        if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.4'; }
      }
    }

    /* ── 버튼 생성 ── */
    /* 기존 mpSaveBtn 숨기기 */
    var legacyBtn = document.getElementById('mpSaveBtn');
    if (legacyBtn) legacyBtn.style.display = 'none';

    /* 편집 버튼 */
    var editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.id        = 'fixProfileEditBtn';
    editBtn.className = 'btn btn--outline-brand btn--sm';
    editBtn.style.cssText = 'margin-bottom:16px;margin-right:8px;';
    editBtn.textContent = '프로필 편집';
    editBtn.addEventListener('click', function() { setEdit(!editing); });

    /* 저장 버튼 */
    var saveBtn = document.createElement('button');
    saveBtn.type      = 'button';
    saveBtn.id        = 'fixProfileSaveBtn';
    saveBtn.className = 'btn btn--p btn--sm';
    saveBtn.style.cssText = 'margin-bottom:16px;display:none;opacity:0.4;';
    saveBtn.textContent = '저장하기';
    saveBtn.disabled  = true;
    saveBtn.addEventListener('click', function() {
      if (!dirty) return;
      // TODO: DB - profiles 테이블 UPDATE
      snapshot();
      dirty = false;
      setEdit(false);
      if (typeof showToast === 'function') showToast('저장되었습니다.', 'success');
    });

    /* mp-sec-title 바로 앞에 삽입 */
    var secTitle = panel.querySelector('.mp-sec-title');
    if (secTitle) {
      panel.insertBefore(saveBtn, secTitle);
      panel.insertBefore(editBtn, secTitle);
    } else {
      panel.prepend(saveBtn);
      panel.prepend(editBtn);
    }

    /* ── 초기화 ── */
    snapshot();
    setEdit(false);

    /* ── 변경 감지 ── */
    fields.forEach(function(el) {
      el.addEventListener('input',  checkDirty);
      el.addEventListener('change', checkDirty);
    });

    /* ── 브라우저 닫기/새로고침 경고 ── */
    window.addEventListener('beforeunload', function(e) {
      if (dirty && editing) {
        e.preventDefault();
        e.returnValue = '저장하지 않은 변경사항이 있습니다.';
      }
    });

    /* ── SPA 탭 이탈 경고 ── */
    document.querySelectorAll('[data-mp-tab]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (!dirty || !editing) return;
        if (!confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
          e.stopImmediatePropagation();
        } else {
          dirty = false;
          setEdit(false);
        }
      }, true);
    });

    document.querySelectorAll('[data-goto]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (!dirty || !editing) return;
        if (!confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
          e.stopImmediatePropagation();
          e.preventDefault();
        } else {
          dirty = false;
          setEdit(false);
        }
      }, true);
    });

  })(); /* end setupProfileEdit */

}); /* end DOMContentLoaded */
