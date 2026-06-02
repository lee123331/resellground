/**
 * product-detail-db.js
 * 상품 상세 모달 — DB 실데이터 표시 패치
 *
 * ✅ 표시 항목: 상품명·브랜드·카테고리·가격·상품상태·거래방식·설명·판매자명·조회수·등록일
 * ❌ 기존 코드(data.js / render.js / ui.js / forms.js / app.js) 무수정
 * 📌 index.html <body> 마지막 줄에 <script src="js/product-detail-db.js"></script> 추가 필요
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
   * 1. 유틸
   * ───────────────────────────────────────────────────────────── */

  /** ISO 날짜 → 한국어 상대시간 / 절대날짜 */
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;            // 파싱 실패면 원문 그대로
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60)    return '방금 전';
    if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  /** ISO 날짜 문자열인지 판별 */
  function isIsoDate(str) {
    return typeof str === 'string' && /^\d{4}-\d{2}-\d{2}/.test(str);
  }

  /* ─────────────────────────────────────────────────────────────
   * 2. CSS 주입 — 브랜드·설명 새 UI 스타일
   * ───────────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('pd-db-patch-style')) return;
    const s = document.createElement('style');
    s.id = 'pd-db-patch-style';
    s.textContent = `
      /* ── 브랜드 행 ── */
      #pdBrandRow .pd-detail__val {
        color: var(--brand, #111);
        font-weight: 700;
      }

      /* ── 설명 섹션 ── */
      .pd-desc-section {
        padding: 0 20px 4px;
      }
      .pd-desc-section + .pd-detail {
        padding-top: 10px;
      }
      .pd-desc-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: .06em;
        text-transform: uppercase;
        color: var(--text-mute, #9ca3af);
        margin: 0 0 6px;
      }
      .pd-desc-body {
        font-size: 13px;
        line-height: 1.7;
        color: var(--text, #111827);
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 120px;
        overflow-y: auto;
      }
      /* 접기/펼치기 버튼 */
      .pd-desc-toggle {
        display: none;
        margin-top: 4px;
        font-size: 12px;
        color: var(--brand, #6366f1);
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font-weight: 600;
      }
      .pd-desc-body.is-expanded {
        max-height: none;
      }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────────────────────
   * 3. DOM 주입 — 브랜드 행 + 설명 섹션 (최초 1회)
   * ───────────────────────────────────────────────────────────── */
  function injectModalElements() {
    const detailEl = document.querySelector('#modal-product .pd-detail');
    if (!detailEl) return;

    /* 브랜드 행 — pd-detail 맨 위에 삽입 */
    if (!document.getElementById('pdBrandRow')) {
      const row = document.createElement('div');
      row.className = 'pd-detail__row';
      row.id = 'pdBrandRow';
      row.innerHTML =
        '<span class="pd-detail__label">브랜드</span>' +
        '<span class="pd-detail__val" id="pdBrandVal">—</span>';
      detailEl.insertAdjacentElement('afterbegin', row);
    }

    /* 설명 섹션 — pd-detail 바로 위(divider 뒤)에 삽입 */
    if (!document.getElementById('pdDescSection')) {
      const sec = document.createElement('div');
      sec.id = 'pdDescSection';
      sec.className = 'pd-desc-section';
      sec.style.display = 'none';          // 설명 없으면 숨김
      sec.innerHTML =
        '<p class="pd-desc-label">상품 설명</p>' +
        '<p class="pd-desc-body" id="pdDescBody"></p>' +
        '<button class="pd-desc-toggle" id="pdDescToggle" type="button">더보기 ▾</button>';
      detailEl.insertAdjacentElement('beforebegin', sec);

      /* 더보기 / 접기 토글 */
      const toggleBtn = sec.querySelector('#pdDescToggle');
      const bodyEl    = sec.querySelector('#pdDescBody');
      if (toggleBtn && bodyEl) {
        toggleBtn.addEventListener('click', function () {
          const expanded = bodyEl.classList.toggle('is-expanded');
          toggleBtn.textContent = expanded ? '접기 ▴' : '더보기 ▾';
        });
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * 4. openProductModal 패치
   *    — 원본 실행 후 누락 항목(브랜드·설명·조회수·등록일) 보완
   * ───────────────────────────────────────────────────────────── */
  let _patched = false;

  function patchOpenProductModal() {
    if (_patched) return;
    const original = window.openProductModal;
    if (typeof original !== 'function') return;

    _patched = true;

    window.openProductModal = function patchedOpenProductModal(product) {
      /* ① 원본 함수 실행 (상품명·카테고리·가격·상태·거래방식·판매자명 처리) */
      original.call(this, product);

      if (!product) return;

      /* ② 브랜드 */
      const brandVal = document.getElementById('pdBrandVal');
      if (brandVal) {
        brandVal.textContent = product.brand || '—';
      }

      /* ③ 설명 */
      const descSection = document.getElementById('pdDescSection');
      const descBody    = document.getElementById('pdDescBody');
      const descToggle  = document.getElementById('pdDescToggle');
      const rawDesc = product.desc || product.description || '';

      if (descSection && descBody) {
        if (rawDesc) {
          descBody.innerHTML = rawDesc.replace(/\n/g, '<br>');
          descSection.style.display = '';

          /* 120 px 초과 여부에 따라 더보기 버튼 노출 결정 */
          // 렌더 후 스크롤 높이 체크
          requestAnimationFrame(function () {
            if (descToggle) {
              const overflow = descBody.scrollHeight > descBody.clientHeight + 2;
              descToggle.style.display = overflow ? 'block' : 'none';
              // 열 때마다 초기 상태로 리셋
              descBody.classList.remove('is-expanded');
              descToggle.textContent = '더보기 ▾';
            }
          });
        } else {
          descSection.style.display = 'none';
        }
      }

      /* ④ 조회수 보정
       *    normalizeProductToDrop → views 키로 매핑
       *    기존 openProductModal → view_count ?? viewCount ?? 0 읽어 항상 0
       */
      const vcEl = document.getElementById('pdViewCount');
      if (vcEl) {
        const views =
          product.view_count ??
          product.viewCount  ??
          product.views      ??
          0;
        vcEl.textContent = Number(views).toLocaleString('ko-KR');
      }

      /* ⑤ 등록일 포맷
       *    ISO 날짜면 상대시간/절대날짜로 변환, 아니면 원문 유지
       */
      const postedEl = document.getElementById('pdPostedAt');
      if (postedEl) {
        const raw = product.postedAt || product.created_at || '';
        postedEl.textContent = isIsoDate(raw) ? fmtDate(raw) : (raw || '—');
      }
    };
  }

  /* ─────────────────────────────────────────────────────────────
   * 5. 초기화
   * ───────────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectModalElements();
    patchOpenProductModal();
  }

  /* DOM 준비 타이밍에 맞춰 실행 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // 이 스크립트는 </body> 직전 마지막 태그 → DOM이미 파싱 완료
    init();
  }

})();
