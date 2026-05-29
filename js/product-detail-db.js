/**
 * product-detail-db.js
 * 상품 상세 모달 — DB 실데이터 표시 보강 패치
 * 기존 openProductModal 실행 후 브랜드·설명·조회수·등록일 표시를 보완합니다.
 */
(function () {
  'use strict';

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  function isIsoLike(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);
  }

  function injectStyles() {
    if (document.getElementById('pd-db-patch-style')) return;

    const style = document.createElement('style');
    style.id = 'pd-db-patch-style';
    style.textContent = `
      #pdBrandRow .pd-detail__val {
        color: var(--brand, #111827);
        font-weight: 700;
      }
      .pd-desc-section {
        padding: 0 20px 4px;
      }
      .pd-desc-section + .pd-detail {
        padding-top: 10px;
      }
      .pd-desc-label {
        margin: 0 0 6px;
        color: var(--text-mute, #9ca3af);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .pd-desc-body {
        margin: 0;
        max-height: 120px;
        overflow-y: auto;
        color: var(--text, #111827);
        font-size: 13px;
        line-height: 1.7;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .pd-desc-body.is-expanded {
        max-height: none;
      }
      .pd-desc-toggle {
        display: none;
        margin-top: 4px;
        padding: 0;
        border: 0;
        background: none;
        color: var(--brand, #6366f1);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function injectModalElements() {
    const detailEl = document.querySelector('#modal-product .pd-detail');
    if (!detailEl) return;

    if (!document.getElementById('pdBrandRow')) {
      const row = document.createElement('div');
      row.className = 'pd-detail__row';
      row.id = 'pdBrandRow';
      row.innerHTML =
        '<span class="pd-detail__label">브랜드</span>' +
        '<span class="pd-detail__val" id="pdBrandVal">—</span>';
      detailEl.insertAdjacentElement('afterbegin', row);
    }

    if (!document.getElementById('pdDescSection')) {
      const section = document.createElement('div');
      section.id = 'pdDescSection';
      section.className = 'pd-desc-section';
      section.style.display = 'none';
      section.innerHTML =
        '<p class="pd-desc-label">상품 설명</p>' +
        '<p class="pd-desc-body" id="pdDescBody"></p>' +
        '<button class="pd-desc-toggle" id="pdDescToggle" type="button">더보기 ▾</button>';
      detailEl.insertAdjacentElement('beforebegin', section);

      const body = section.querySelector('#pdDescBody');
      const toggle = section.querySelector('#pdDescToggle');
      if (body && toggle) {
        toggle.addEventListener('click', function () {
          const expanded = body.classList.toggle('is-expanded');
          toggle.textContent = expanded ? '접기 ▴' : '더보기 ▾';
        });
      }
    }
  }

  let patched = false;

  function patchOpenProductModal() {
    if (patched || typeof window.openProductModal !== 'function') return;

    const original = window.openProductModal;
    patched = true;

    window.openProductModal = function patchedOpenProductModal(product) {
      original.call(this, product);
      if (!product) return;

      injectModalElements();

      const brandVal = document.getElementById('pdBrandVal');
      if (brandVal) {
        brandVal.textContent = product.brand || product.brand_name || '—';
      }

      const descSection = document.getElementById('pdDescSection');
      const descBody = document.getElementById('pdDescBody');
      const descToggle = document.getElementById('pdDescToggle');
      const desc = product.desc || product.description || '';

      if (descSection && descBody) {
        if (desc) {
          descBody.textContent = String(desc);
          descBody.classList.remove('is-expanded');
          descSection.style.display = '';
          if (descToggle) {
            descToggle.textContent = '더보기 ▾';
            requestAnimationFrame(function () {
              descToggle.style.display =
                descBody.scrollHeight > descBody.clientHeight + 2 ? 'block' : 'none';
            });
          }
        } else {
          descSection.style.display = 'none';
        }
      }

      const viewEl = document.getElementById('pdViewCount');
      if (viewEl) {
        const views = product.view_count ?? product.viewCount ?? product.views ?? product.interest ?? 0;
        viewEl.textContent = Number(views || 0).toLocaleString('ko-KR');
      }

      const postedEl = document.getElementById('pdPostedAt');
      if (postedEl) {
        const raw = product.postedAt || product.created_at || '';
        postedEl.textContent = isIsoLike(raw) ? fmtDate(raw) : (raw || '—');
      }
    };
  }

  function init() {
    injectStyles();
    injectModalElements();
    patchOpenProductModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
