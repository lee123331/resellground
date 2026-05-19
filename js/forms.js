'use strict';

/* ═══════════════════════════════════════════════════
   FORMS.JS — 완전한 폼 검증 & UX 시스템
   - 실시간 validation
   - 비밀번호 토글 / 강도 측정
   - 파일 업로드 (미리보기, 제한, 삭제)
   - 가격 포맷 (₩ 콤마)
   - 글자수 카운터
   - 중복 클릭 방지
   - 폼 초기화
   - 임시저장 (localStorage)
   - XSS 방지 (textContent)
═══════════════════════════════════════════════════ */

/* ─── VALIDATORS ─── */
const V = {
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  tel: v => /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/.test(v.replace(/\s/g,'')),
  pw: v => v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v),
  required: v => v.trim().length > 0,
};

/* ─── FIELD ERROR HELPERS ─── */
function setErr(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) { inp.classList.add('err'); inp.classList.remove('ok'); }
  if (err) { err.textContent = msg; err.classList.add('show'); }
}
function setOk(inputId, errId) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) { inp.classList.remove('err'); inp.classList.add('ok'); }
  if (err) err.classList.remove('show');
}
function clearField(inputId, errId) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) { inp.classList.remove('err','ok'); }
  if (err) err.classList.remove('show');
}

/* ─── BUTTON LOADING STATE ─── */
function btnLoad(btn, text='처리 중...') {
  btn.disabled = true;
  btn.dataset.origText = btn.textContent;
  btn.classList.add('btn--load');
  btn.textContent = text;
}
function btnReset(btn) {
  btn.disabled = false;
  btn.classList.remove('btn--load');
  btn.textContent = btn.dataset.origText || '제출';
}

/* ─── FORM RESET ─── */
function resetForm(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('input,textarea,select').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
    else el.value = '';
    el.classList.remove('err','ok');
  });
  formEl.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  formEl.querySelectorAll('.char-count-cur').forEach(el => el.textContent = '0');
  formEl.querySelectorAll('.pw-strength-bar').forEach(el => { el.style.width='0'; el.className='pw-strength-bar'; });
  clearImagePreviews(formEl);
}

/* ─── XSS-SAFE TEXT INSERT ─── */
function safeText(el, text) {
  if (el) el.textContent = text;
}
function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem('rg_user') || 'null');
  } catch (e) {
    return null;
  }
}

function applyLoginState() {
  const token = localStorage.getItem('rg_token');
  const user = getAuthUser();

  const isLoggedIn = !!(token && user);

  if (typeof S !== 'undefined') {
    S.loggedIn = isLoggedIn;
  }

  const loginBtn = document.getElementById('loginBtn');
  const profileBtn = document.getElementById('profileBtn');

  if (isLoggedIn) {
    if (loginBtn) {
      loginBtn.style.display = '';
      loginBtn.textContent = '마이페이지';
    }

    if (profileBtn) {
      profileBtn.setAttribute('aria-label', '마이페이지');
    }
  } else {
    if (loginBtn) {
      loginBtn.style.display = '';
      loginBtn.textContent = '로그인';
    }

    if (profileBtn) {
      profileBtn.setAttribute('aria-label', '로그인');
    }
  }

  if (typeof updateDrawerState === 'function') {
    updateDrawerState();
  }
}

function logout() {
  localStorage.removeItem('rg_token');
  localStorage.removeItem('rg_user');

  if (typeof S !== 'undefined') {
    S.loggedIn = false;
  }

  applyLoginState();

  showToast('로그아웃되었습니다.', 'success');
  navigateTo('home');
}
/* ─── CHAR COUNTER ─── */
function initCharCounter(textareaId, counterId, max) {
  const ta = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  if (!ta || !counter) return;
  ta.maxLength = max;
  const update = () => {
    const len = ta.value.length;
    safeText(counter, len);
    counter.parentElement && counter.parentElement.classList.toggle('char-near-limit', len > max * 0.9);
  };
  ta.addEventListener('input', update);
  update();
}

/* ─── PASSWORD TOGGLE ─── */
function initPwToggle(inputId, btnId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!inp || !btn) return;
  btn.addEventListener('click', () => {
    const isText = inp.type === 'text';
    inp.type = isText ? 'password' : 'text';
    btn.innerHTML = isText
      ? '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    btn.setAttribute('aria-label', isText ? '비밀번호 숨기기' : '비밀번호 보기');
    inp.focus();
  });
}

/* ─── PASSWORD STRENGTH ─── */
function calcPwStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: 'weak',   label: '약함',   pct: 33 };
  if (score <= 4) return { level: 'medium', label: '보통',   pct: 66 };
  return               { level: 'strong', label: '강함',   pct: 100 };
}

function initPwStrength(inputId, barId, labelId) {
  const inp = document.getElementById(inputId);
  const bar = document.getElementById(barId);
  const lbl = document.getElementById(labelId);
  if (!inp) return;
  inp.addEventListener('input', () => {
    const s = calcPwStrength(inp.value);
    if (bar) { bar.style.width = inp.value ? s.pct + '%' : '0'; bar.className = `pw-strength-bar ${s.level}`; }
    if (lbl) { safeText(lbl, inp.value ? s.label : ''); lbl.className = `pw-strength-label ${s.level}`; }
  });
}

/* ─── REAL-TIME VALIDATION ─── */
function initRealTimeValidation(inputId, errId, validatorFn, errMsg) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  let touched = false;
  inp.addEventListener('blur', () => { touched = true; validate(); });
  inp.addEventListener('input', () => { if (touched) validate(); });
  function validate() {
    if (!inp.value.trim()) { clearField(inputId, errId); return; }
    if (validatorFn(inp.value)) setOk(inputId, errId);
    else setErr(inputId, errId, errMsg);
  }
}

/* ─── PHONE FORMAT ─── */
function formatTel(val) {
  const n = val.replace(/\D/g, '');
  if (n.length <= 3) return n;
  if (n.length <= 7) return `${n.slice(0,3)}-${n.slice(3)}`;
  if (n.length <= 11) return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
  return `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7,11)}`;
}
function initTelFormat(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.addEventListener('input', () => {
    const pos = inp.selectionStart;
    inp.value = formatTel(inp.value);
    // 커서 위치 복원
    try { inp.setSelectionRange(pos, pos); } catch(e) {}
  });
}

/* ─── PRICE FORMAT ─── */
function formatPrice(val) {
  const n = val.replace(/\D/g, '');
  return n ? Number(n).toLocaleString('ko-KR') : '';
}
function initPriceFormat(inputId, displayId) {
  const inp = document.getElementById(inputId);
  const disp = document.getElementById(displayId);
  if (!inp) return;
  inp.addEventListener('input', () => {
    const raw = inp.value.replace(/\D/g, '');
    inp.value = raw; // input은 숫자만
    if (disp) safeText(disp, raw ? `₩ ${Number(raw).toLocaleString('ko-KR')}` : '');
  });
}

/* ─── FILE UPLOAD ─── */
const FILE_CONFIG = { maxCount: 10, maxSizeMB: 5, accepts: ['image/jpeg','image/png','image/webp'] };

function initFileUpload(areaId, inputId, previewId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!area || !input || !preview) return;

  let files = [];

  // 클릭으로 열기
  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') input.click(); });

  // 드래그앤드롭
  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag-over');
    handleFiles([...e.dataTransfer.files]);
  });

  input.addEventListener('change', () => handleFiles([...input.files]));

  function handleFiles(newFiles) {
    const errors = [];
    newFiles.forEach(f => {
      if (!FILE_CONFIG.accepts.includes(f.type)) {
        errors.push(`${f.name}: JPG/PNG/WebP만 업로드 가능합니다.`); return;
      }
      if (f.size > FILE_CONFIG.maxSizeMB * 1024 * 1024) {
        errors.push(`${f.name}: 파일 크기가 ${FILE_CONFIG.maxSizeMB}MB를 초과합니다.`); return;
      }
      if (files.length >= FILE_CONFIG.maxCount) {
        errors.push(`최대 ${FILE_CONFIG.maxCount}장까지 업로드 가능합니다.`); return;
      }
      files.push(f);
    });
    if (errors.length) showToast(errors[0], 'error');
    renderPreviews();
    updateAreaText();
    // input 초기화 (같은 파일 재선택 가능하도록)
    input.value = '';
  }

  function renderPreviews() {
    preview.innerHTML = '';
    files.forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        const item = document.createElement('div');
        item.className = 'upload-preview-item';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = f.name;
        const info = document.createElement('div');
        info.className = 'upload-preview-info';
        const name = document.createElement('span');
        name.className = 'upload-preview-name';
        safeText(name, f.name.length > 20 ? f.name.slice(0,20)+'…' : f.name);
        const size = document.createElement('span');
        size.className = 'upload-preview-size';
        safeText(size, `${(f.size/1024/1024).toFixed(1)}MB`);
        const delBtn = document.createElement('button');
        delBtn.className = 'upload-preview-del';
        delBtn.type = 'button';
        delBtn.setAttribute('aria-label', `${f.name} 삭제`);
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', () => { files.splice(i,1); renderPreviews(); updateAreaText(); });
        info.append(name, size, delBtn);
        item.append(img, info);
        preview.appendChild(item);
      };
      reader.readAsDataURL(f);
    });
  }

  function updateAreaText() {
    const countEl = area.querySelector('.upload-count');
    if (countEl) safeText(countEl, `${files.length}/${FILE_CONFIG.maxCount}장 선택됨`);
  }
}

function clearImagePreviews(formEl) {
  formEl.querySelectorAll('.upload-preview-item').forEach(el => el.remove());
}

/* ─── DRAFT SAVE (localStorage) ─── */
function initDraftSave(formId, key) {
  const form = document.getElementById(formId);
  if (!form) return;
  // 불러오기
  try {
    const saved = localStorage.getItem(`draft_${key}`);
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && el.type !== 'password' && el.type !== 'checkbox') el.value = val;
      });
    }
  } catch(e) {}
  // 자동 저장
  form.querySelectorAll('input:not([type=password]):not([type=checkbox]),textarea,select').forEach(inp => {
    inp.addEventListener('input', () => saveDraft(form, key));
  });
}

function saveDraft(form, key) {
  try {
    const data = {};
    form.querySelectorAll('input:not([type=password]):not([type=checkbox]),textarea,select').forEach(el => {
      if (el.id) data[el.id] = el.value;
    });
    localStorage.setItem(`draft_${key}`, JSON.stringify(data));
  } catch(e) {}
}

function clearDraft(key) {
  try { localStorage.removeItem(`draft_${key}`); } catch(e) {}
}
function updatePostDraftCount() {
  const countEl = document.getElementById('postDraftCount');
  if (!countEl) return;

  let hasDraft = false;

  try {
    const saved = localStorage.getItem('draft_post');
    if (saved) {
      const data = JSON.parse(saved);

      hasDraft = Object.entries(data).some(([key, value]) => {
        if (key === '__tags') {
          return Array.isArray(value) && value.length > 0;
        }

        return String(value || '').trim().length > 0;
      });
    }
  } catch (e) {
    hasDraft = false;
  }

  countEl.textContent = `임시저장 ${hasDraft ? 1 : 0}`;
}

function savePostDraftAndCount() {
  const formEl = document.getElementById('postFormInner');
  if (!formEl) return;

  saveDraft(formEl, 'post');

  try {
    const raw = localStorage.getItem('draft_post');
    const data = raw ? JSON.parse(raw) : {};

    data.__tags = [...document.querySelectorAll('#postTagSelect .tag-opt.sel')]
      .map(tag => tag.dataset.tag || tag.textContent.trim());

    localStorage.setItem('draft_post', JSON.stringify(data));
  } catch (e) {}

  updatePostDraftCount();
}

function restorePostDraftTags() {
  try {
    const raw = localStorage.getItem('draft_post');
    if (!raw) {
      updatePostDraftCount();
      return;
    }

    const data = JSON.parse(raw);
    const savedTags = Array.isArray(data.__tags) ? data.__tags : [];

    document.querySelectorAll('#postTagSelect .tag-opt').forEach(tag => {
      const tagName = tag.dataset.tag || tag.textContent.trim();
      tag.classList.toggle('sel', savedTags.includes(tagName));
    });
  } catch (e) {}

  updatePostDraftCount();
}

function initPostDraftControls() {
  const draftBtn = document.getElementById('postDraftBtn');
  const formEl = document.getElementById('postFormInner');

  if (draftBtn && draftBtn.dataset.boundDraftBtn !== '1') {
    draftBtn.dataset.boundDraftBtn = '1';

    draftBtn.addEventListener('click', () => {
      savePostDraftAndCount();
      showToast('임시저장되었습니다.', 'success');
    });
  }

  if (formEl && formEl.dataset.boundDraftCount !== '1') {
    formEl.dataset.boundDraftCount = '1';

    formEl
      .querySelectorAll('input:not([type=password]):not([type=checkbox]), textarea, select')
      .forEach(el => {
        el.addEventListener('input', updatePostDraftCount);
        el.addEventListener('change', updatePostDraftCount);
      });
  }

  restorePostDraftTags();
}
/* ─── CLOSE GUARD (닫기 전 확인) ─── */
function initCloseGuard(modalId, formId, draftKey) {
  const modal = document.getElementById(`modal-${modalId}`);
  if (!modal) return;
  const closeBtn = modal.querySelector('[data-close]');
  if (!closeBtn) return;
  const origClose = () => closeModal(modalId);
  closeBtn.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    const form = document.getElementById(formId);
    const hasContent = form && [...form.querySelectorAll('input,textarea')]
      .some(el => el.type !== 'checkbox' && el.type !== 'password' && el.value.trim());
    if (hasContent) {
      if (confirm('작성 중인 내용이 있어요. 임시저장하고 닫을까요?\n취소를 누르면 내용을 유지합니다.')) {
        saveDraft(form, draftKey);
        origClose();
      }
    } else {
      origClose();
    }
  });
}

/* ═══════════════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════════════ */
function initLoginForm() {
  // 비밀번호 토글
  initPwToggle('loginPw', 'loginPwToggle');

  // 실시간 검증
  initRealTimeValidation('loginEmail','loginEmailErr', V.email, '올바른 이메일 형식을 입력해주세요.');

  document.getElementById('doLoginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    let ok = true;

    clearField('loginEmail','loginEmailErr'); clearField('loginPw','loginPwErr');
    if (!V.email(email)) { setErr('loginEmail','loginEmailErr','올바른 이메일 형식을 입력해주세요.'); ok=false; }
    if (!pw) { setErr('loginPw','loginPwErr','비밀번호를 입력해주세요.'); ok=false; }
    if (!ok) return;

   const btn = document.getElementById('doLoginBtn');
btnLoad(btn, '로그인 중...');

fetch('https://backend.di702934.workers.dev/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password: pw
  })
})
  .then(async res => {
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '로그인에 실패했습니다.');
    }

    return data;
  })
 .then(data => {
  localStorage.setItem('rg_token', data.token);
  localStorage.setItem('rg_user', JSON.stringify(data.user));

  applyLoginState();

  closeModal('login');
  showToast('로그인되었습니다! 환영합니다. 🎉', 'success');
})
  .catch(err => {
    showToast(err.message, 'error');
  })
  .finally(() => {
    btnReset(btn);
  });
  });
}

/* ═══════════════════════════════════════════════════
   SIGNUP FORM
═══════════════════════════════════════════════════ */
function initSignupForm() {
  initPwToggle('signupPw', 'signupPwToggle');
  initPwToggle('signupPw2', 'signupPw2Toggle');
 
  initTelFormat('signupTel');

  // 실시간 검증
  initRealTimeValidation('signupNick','signupNickErr', V.required, '닉네임을 입력해주세요.');
  initRealTimeValidation('signupEmail','signupEmailErr', V.email, '올바른 이메일 형식을 입력해주세요.');

  // 비밀번호 강도 실시간
  const pwInp = document.getElementById('signupPw');
  if (pwInp) {
    pwInp.addEventListener('input', () => {
      const v = pwInp.value;
      if (!v) { clearField('signupPw','signupPwErr'); return; }
      if (V.pw(v)) setOk('signupPw','signupPwErr');
      else setErr('signupPw','signupPwErr','영문+숫자 포함 8자 이상 입력해주세요.');
      // 확인 비번도 재검증
      const pw2 = document.getElementById('signupPw2');
      if (pw2 && pw2.value) {
        if (pw2.value === v) setOk('signupPw2','signupPw2Err');
        else setErr('signupPw2','signupPw2Err','비밀번호가 일치하지 않습니다.');
      }
    });
  }

  // 비번 확인 실시간
  const pw2Inp = document.getElementById('signupPw2');
  if (pw2Inp) {
    pw2Inp.addEventListener('input', () => {
      const pw = document.getElementById('signupPw')?.value;
      if (!pw2Inp.value) { clearField('signupPw2','signupPw2Err'); return; }
      if (pw2Inp.value === pw) setOk('signupPw2','signupPw2Err');
      else setErr('signupPw2','signupPw2Err','비밀번호가 일치하지 않습니다.');
    });
  }

  document.getElementById('doSignupBtn').addEventListener('click', () => {
    const nick = document.getElementById('signupNick').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pw = document.getElementById('signupPw').value;
    const pw2 = document.getElementById('signupPw2').value;
    const terms = document.getElementById('agreeTerms').checked;
    let ok = true;

    if (!V.required(nick)) { setErr('signupNick','signupNickErr','닉네임을 입력해주세요.'); ok=false; }
    else setOk('signupNick','signupNickErr');
    if (!V.email(email)) { setErr('signupEmail','signupEmailErr','올바른 이메일을 입력해주세요.'); ok=false; }
    else setOk('signupEmail','signupEmailErr');
    if (!V.pw(pw)) { setErr('signupPw','signupPwErr','영문+숫자 포함 8자 이상 입력해주세요.'); ok=false; }
    else setOk('signupPw','signupPwErr');
    if (pw !== pw2) { setErr('signupPw2','signupPw2Err','비밀번호가 일치하지 않습니다.'); ok=false; }
    else if (pw2) setOk('signupPw2','signupPw2Err');
    if (!terms) { showToast('이용약관 동의가 필요합니다.', 'error'); ok=false; }
    if (!ok) return;

    const btn = document.getElementById('doSignupBtn');
    btnLoad(btn, '가입 중...');
    setTimeout(() => {
      btnReset(btn);
      resetForm(document.getElementById('signup-pane'));
      closeModal('login');
      showToast('회원가입이 완료되었습니다! 환영해요 🎉', 'success');
    }, 1500);
  });
}

/* ═══════════════════════════════════════════════════
   PREREG FORM
═══════════════════════════════════════════════════ */
function initPreregForm() {
  initCharCounter('prIntro', 'introCount', 500);
  initTelFormat('prTel');
  initDraftSave('preregBody', 'prereg');
  initCloseGuard('prereg', 'preregBody', 'prereg');

  // 실시간 검증
  initRealTimeValidation('prName','prNameErr', V.required, '이름을 입력해주세요.');
  initRealTimeValidation('prEmail','prEmailErr', V.email, '올바른 이메일을 입력해주세요.');

document.getElementById('preregSubmitBtn').addEventListener('click', () => {
const name = document.getElementById('prName').value.trim();
const email = document.getElementById('prEmail').value.trim();
const tel = document.getElementById('prTel').value.trim();
const instagram = document.getElementById('prInstagram').value.trim();
const intro = document.getElementById('prIntro').value.trim();
const agree = document.getElementById('preregAgree').checked;
  let ok = true;
  let firstError = '';

  if (!V.required(name)) {
    setErr('prName','prNameErr','이름을 입력해주세요.');
    ok = false;
    firstError ||= '이름을 입력해주세요.';
  } else {
    setOk('prName','prNameErr');
  }

  if (!V.email(email)) {
    setErr('prEmail','prEmailErr','올바른 이메일을 입력해주세요.');
    ok = false;
    firstError ||= '올바른 이메일을 입력해주세요.';
  } else {
    setOk('prEmail','prEmailErr');
  }

  if (!tel) {
    const telEl = document.getElementById('prTel');
    telEl.classList.add('err');
    ok = false;
    firstError ||= '연락처를 입력해주세요.';
  } else {
    document.getElementById('prTel').classList.remove('err');
  }
  if (!instagram) {
  const instaEl = document.getElementById('prInstagram');
  instaEl.classList.add('err');
  ok = false;
  firstError ||= '인스타그램 아이디를 입력해주세요.';
} else {
  document.getElementById('prInstagram').classList.remove('err');
}

  if (!intro) {
    const introEl = document.getElementById('prIntro');
    introEl.classList.add('err');
    ok = false;
    firstError ||= '소개글을 입력해주세요.';
  } else {
    document.getElementById('prIntro').classList.remove('err');
  }

  if (!agree) {
    document.getElementById('preregAgreeErr').classList.add('show');
    ok = false;
    firstError ||= '개인정보 수집 동의가 필요합니다.';
  } else {
    document.getElementById('preregAgreeErr').classList.remove('show');
  }

  if (!ok) {
    showToast(firstError, 'error');
    return;
  }

  const btn = document.getElementById('preregSubmitBtn');
  btnLoad(btn, '제출 중...');
  setTimeout(() => {
    btnReset(btn);
    clearDraft('prereg');
    document.getElementById('preregBody').style.display = 'none';
    document.getElementById('preregSuccess').style.display = 'block';
    setTimeout(() => {
      closeModal('prereg');
      resetForm(document.getElementById('preregBody'));
      document.getElementById('preregBody').style.display = 'block';
      document.getElementById('preregSuccess').style.display = 'none';
    }, 3200);
  }, 1500);
});
}
/* ═══════════════════════════════════════════════════
   PRODUCT IMAGE UPLOADER — 상품 등록 이미지 프리뷰
═══════════════════════════════════════════════════ */
window.RG = window.RG || {};

window.RG.initProductImageUploader = function () {
  const modal = document.getElementById('modal-addDrop');
  if (!modal) return null;

  const dropzone = modal.querySelector('.rg-dropzone');
  const previewGrid = modal.querySelector('.rg-preview-grid');
  const countEl = modal.querySelector('.rg-img-section__count');
  const fileInput = modal.querySelector('.rg-dropzone input[type="file"]');

  if (!dropzone || !previewGrid || !fileInput) return null;

  if (dropzone.dataset.boundUploader === '1') {
    return window.RG._productUploader || null;
  }

  dropzone.dataset.boundUploader = '1';

  const MAX_IMAGES = 5;
  const MAX_MB = 10;

  let images = [];

  function updateCount() {
    if (countEl) countEl.textContent = `${images.length} / ${MAX_IMAGES}`;
    fileInput.disabled = images.length >= MAX_IMAGES;
  }

  function render() {
    if (images.length === 0) {
      dropzone.style.display = 'flex';
      previewGrid.style.display = 'none';
      previewGrid.innerHTML = '';
      updateCount();
      return;
    }

    dropzone.style.display = 'none';
    previewGrid.style.display = 'grid';
    previewGrid.innerHTML = '';

    images.forEach((img, i) => {
      previewGrid.appendChild(createThumb(img, i));
    });

    if (images.length < MAX_IMAGES) {
      previewGrid.appendChild(createAddSlot());
    }

    updateCount();
  }

  function createThumb(img, i) {
    const wrap = document.createElement('div');
    wrap.className = 'rg-thumb';
    wrap.draggable = true;
    wrap.dataset.index = i;

    const el = document.createElement('img');
    el.src = img.url;
    el.alt = `상품 이미지 ${i + 1}`;
    wrap.appendChild(el);

    const del = document.createElement('button');
    del.className = 'rg-thumb__del';
    del.type = 'button';
    del.textContent = '✕';
    del.setAttribute('aria-label', `이미지 ${i + 1} 삭제`);

    del.addEventListener('click', e => {
      e.stopPropagation();
      URL.revokeObjectURL(img.url);
      images.splice(i, 1);
      render();
    });

    wrap.appendChild(del);

    if (i === 0) {
      const badge = document.createElement('div');
      badge.className = 'rg-thumb__main-badge';
      badge.textContent = '대표';
      wrap.appendChild(badge);
    }

    wrap.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', String(i));
      setTimeout(() => wrap.classList.add('is-dragging'), 0);
    });

    wrap.addEventListener('dragend', () => {
      wrap.classList.remove('is-dragging');
    });

    wrap.addEventListener('dragover', e => {
      e.preventDefault();
      wrap.classList.add('is-dragover');
    });

    wrap.addEventListener('dragleave', () => {
      wrap.classList.remove('is-dragover');
    });

    wrap.addEventListener('drop', e => {
      e.preventDefault();
      wrap.classList.remove('is-dragover');

      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (Number.isNaN(fromIdx) || fromIdx === i) return;

      const [moved] = images.splice(fromIdx, 1);
      images.splice(i, 0, moved);
      render();
    });

    return wrap;
  }

  function createAddSlot() {
    const label = document.createElement('label');
    label.className = 'rg-thumb-add';
    label.innerHTML = `
      <span class="rg-thumb-add__plus">+</span>
      <span>추가</span>
    `;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.style.display = 'none';

    input.addEventListener('change', e => {
      handleFiles(e.target.files);
      input.value = '';
    });

    label.appendChild(input);
    return label;
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (images.length >= MAX_IMAGES) {
        showToast(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`, 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드할 수 있어요.', 'error');
        return;
      }

      if (file.size > MAX_MB * 1024 * 1024) {
        showToast(`${file.name}은 ${MAX_MB}MB를 초과해요.`, 'error');
        return;
      }

      images.push({
        file,
        url: URL.createObjectURL(file)
      });
    });

    render();
  }

  fileInput.addEventListener('change', e => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('is-dragover');
  });

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
    handleFiles(e.dataTransfer.files);
  });

  render();

  return {
    getImages: () => images,
    reset() {
      images.forEach(img => URL.revokeObjectURL(img.url));
      images = [];
      render();
    }
  };
};
/* ═══════════════════════════════════════════════════
   ADD DROP FORM
═══════════════════════════════════════════════════ */
function initDropForm() {
  initCharCounter('dropDesc', 'dropDescCount', 1000);
  initPriceFormat('dropPrice', 'dropPriceDisplay');
  initDraftSave('dropFormInner', 'drop');
  initCloseGuard('addDrop', 'dropFormInner', 'drop');

  // 새 상품 이미지 업로더 초기화
  if (window.RG && typeof window.RG.initProductImageUploader === 'function') {
    window.RG._productUploader = window.RG.initProductImageUploader();
  }

  // 실시간 검증
  initRealTimeValidation('dropName', 'dropNameErr', V.required, '상품명을 입력해주세요.');

  // 가격 입력 시 기존 가격 표시 + 실수령액 계산
  const priceInp = document.getElementById('dropPrice');
  const netEl = document.getElementById('product-net-price');

  if (priceInp && priceInp.dataset.boundNetPrice !== '1') {
    priceInp.dataset.boundNetPrice = '1';

    priceInp.addEventListener('input', () => {
      const price = Number(priceInp.value || 0);
      const net = Math.floor(price * 0.975);

      if (priceInp.value) setOk('dropPrice', 'dropPriceErr');
      else clearField('dropPrice', 'dropPriceErr');

      if (netEl) {
        netEl.textContent = price > 0
          ? `${net.toLocaleString('ko-KR')}원`
          : '—';
      }
    });
  }

  // 상태 라디오 버튼 → 기존 dropCond hidden select에 값 반영
  document.querySelectorAll('input[name="product-condition"]').forEach(radio => {
    if (radio.dataset.boundCond === '1') return;
    radio.dataset.boundCond = '1';

    radio.addEventListener('change', () => {
      const condEl = document.getElementById('dropCond');
      if (condEl) {
        condEl.value = radio.value;
        setOk('dropCond', 'dropCondErr');
      }
    });
  });

  // 거래 방식 체크박스 → 기존 dropTrade hidden select에 값 반영
  document.querySelectorAll('input[name="product-trade"]').forEach(chk => {
    if (chk.dataset.boundTrade === '1') return;
    chk.dataset.boundTrade = '1';

    chk.addEventListener('change', () => {
      const checked = [...document.querySelectorAll('input[name="product-trade"]:checked')]
        .map(el => el.value);

      const tradeEl = document.getElementById('dropTrade');

      if (tradeEl) {
        if (checked.includes('전국 안전결제') && checked.includes('근거리 직거래')) {
          tradeEl.value = '전국+직거래 모두';
        } else if (checked.includes('근거리 직거래')) {
          tradeEl.value = '근거리 직거래';
        } else {
          tradeEl.value = '전국 안전결제';
        }
      }
    });
  });

  const submitBtn = document.getElementById('dropSubmitBtn');

  if (!submitBtn || submitBtn.dataset.boundDropSubmit === '1') return;
  submitBtn.dataset.boundDropSubmit = '1';

  submitBtn.addEventListener('click', () => {
    const name = document.getElementById('dropName').value.trim();
    const price = document.getElementById('dropPrice').value;
    const cat = document.getElementById('dropCat').value;
    const cond = document.getElementById('dropCond').value;

    const uploadedImages = window.RG?._productUploader?.getImages
      ? window.RG._productUploader.getImages()
      : [];

    let ok = true;

    if (!V.required(name)) {
      setErr('dropName', 'dropNameErr', '상품명을 입력해주세요.');
      ok = false;
    } else {
      setOk('dropName', 'dropNameErr');
    }

    if (!price) {
      setErr('dropPrice', 'dropPriceErr', '가격을 입력해주세요.');
      ok = false;
    } else {
      setOk('dropPrice', 'dropPriceErr');
    }

    if (!cat) {
      setErr('dropCat', 'dropCatErr', '카테고리를 선택해주세요.');
      ok = false;
    } else {
      setOk('dropCat', 'dropCatErr');
    }

    if (!cond) {
      setErr('dropCond', 'dropCondErr', '상태를 선택해주세요.');
      ok = false;
    } else {
      setOk('dropCond', 'dropCondErr');
    }

    if (uploadedImages.length === 0) {
      showToast('상품 이미지를 최소 1장 등록해주세요.', 'error');
      ok = false;
    }

    if (!ok) return;

    btnLoad(submitBtn, '등록 중...');

    setTimeout(() => {
      btnReset(submitBtn);
      clearDraft('drop');

      const formEl = document.getElementById('dropFormInner');
      if (formEl) resetForm(formEl);

      if (window.RG?._productUploader?.reset) {
        window.RG._productUploader.reset();
      }

      if (netEl) netEl.textContent = '—';

      closeModal('addDrop');

if (typeof refreshProductsFromDB === 'function') {
  refreshProductsFromDB();
}

showToast('상품이 DB에 등록되었습니다! 🎉', 'success');
    }, 1200);
  });
}
function compressPostImage(file, options = {}) {
  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 1600;
  const startQuality = options.quality || 0.82;
  const maxOutputBytes = options.maxOutputBytes || 900 * 1024;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 첨부할 수 있어요.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const ratio = Math.min(1, maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = startQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while ((dataUrl.length * 0.75) > maxOutputBytes && quality > 0.45) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          dataUrl,
          width,
          height,
          outputKB: Math.round((dataUrl.length * 0.75) / 1024)
        });
      };

      img.onerror = () => reject(new Error('이미지를 처리하지 못했어요.'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
    reader.readAsDataURL(file);
  });
}
function insertIntoPostContent(text, wrapMode = false) {
  const contentEl = document.getElementById('postContent');
  if (!contentEl) return;

  const start = contentEl.selectionStart ?? contentEl.value.length;
  const end = contentEl.selectionEnd ?? contentEl.value.length;
  const selected = contentEl.value.slice(start, end);

  let inserted = text;

  if (wrapMode) {
    inserted = text.replace('{{selected}}', selected || '강조할 문장');
  }

  contentEl.value =
    contentEl.value.slice(0, start) +
    inserted +
    contentEl.value.slice(end);

  const nextPos = start + inserted.length;
  contentEl.focus();
  contentEl.setSelectionRange(nextPos, nextPos);

contentEl.dispatchEvent(new Event('input', { bubbles: true }));
savePostDraftAndCount();
}

function initPostEditorTools() {
  const imageBtn = document.getElementById('postImageBtn');
  const imageInput = document.getElementById('postImageInput');
  const linkBtn = document.getElementById('postLinkBtn');
  const boldBtn = document.getElementById('postBoldBtn');
  const priceBtn = document.getElementById('postPriceBtn');
  const emojiBtn = document.getElementById('postEmojiBtn');

  const bindOnce = (el, key, fn) => {
    if (!el || el.dataset[key] === '1') return;
    el.dataset[key] = '1';
    el.addEventListener('click', fn);
  };

  bindOnce(imageBtn, 'boundImage', () => {
    if (imageInput) imageInput.click();
  });

  if (imageInput && imageInput.dataset.boundImageInput !== '1') {
    imageInput.dataset.boundImageInput = '1';

    imageInput.addEventListener('change', () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;

      const okTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!okTypes.includes(file.type)) {
        showToast('JPG, PNG, WebP 이미지만 업로드할 수 있어요.', 'error');
        imageInput.value = '';
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
  showToast('이미지는 15MB 이하 파일만 첨부할 수 있어요.', 'error');
  imageInput.value = '';
  return;
}

compressPostImage(file)
  .then(({ dataUrl, outputKB }) => {
    insertIntoPostContent(`\n\n![${file.name}](${dataUrl})\n\n`);
    showToast(`이미지가 압축되어 추가되었습니다. (${outputKB}KB)`, 'success');
  })
  .catch(err => {
    showToast(err.message || '이미지 첨부에 실패했어요.', 'error');
  })
  .finally(() => {
    imageInput.value = '';
  });
    });
  }

  bindOnce(linkBtn, 'boundLink', () => {
    const url = prompt('삽입할 링크 URL을 입력해주세요.');
    if (!url) return;

    const text = prompt('링크에 표시할 텍스트를 입력해주세요.') || '링크';
    insertIntoPostContent(`[${text}](${url})`);
  });

  bindOnce(boldBtn, 'boundBold', () => {
    insertIntoPostContent('**{{selected}}**', true);
  });

  bindOnce(priceBtn, 'boundPrice', () => {
    insertIntoPostContent(
      '\n\n[시세 정보]\n상품명: \n현재 시세: ₩\n최근 변동: \n의견: \n'
    );
  });

  bindOnce(emojiBtn, 'boundEmoji', () => {
    const emoji = prompt('넣을 이모지를 입력해주세요. 예: 🔥 💎 👟 📈') || '🔥';
    insertIntoPostContent(emoji);
  });

  document.querySelectorAll('#postTagSelect .tag-opt').forEach(tag => {
    if (tag.dataset.boundTag === '1') return;
    tag.dataset.boundTag = '1';

   tag.addEventListener('click', () => {
  tag.classList.toggle('sel');
  savePostDraftAndCount();
});
  });
}
/* ═══════════════════════════════════════════════════
   WRITE POST FORM — 게시물 등록
═══════════════════════════════════════════════════ */
function initPostForm() {
  const btn = document.getElementById('postSubmitBtn');
  const titleEl = document.getElementById('postTitle');
  const contentEl = document.getElementById('postContent');
  const boardEl = document.getElementById('postBoard');
  const formEl = document.getElementById('postFormInner');

  if (!btn || !titleEl || !contentEl) return;

  // 중복 이벤트 방지
  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  initCharCounter('postContent', 'postContentCount', 5000);
  initDraftSave('postFormInner', 'post');
  initCloseGuard('writePost', 'postFormInner', 'post');
  initPostEditorTools();
  initPostDraftControls();

  const settingsToggle = document.getElementById('postSettingsToggle');
const settingsPanel = document.getElementById('postSettingsPanel');

if (settingsToggle && settingsPanel && settingsToggle.dataset.bound !== '1') {
  settingsToggle.dataset.bound = '1';

  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('closed');
    settingsToggle.classList.toggle('closed');
  });
}

  btn.addEventListener('click', () => {
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();
    const board = boardEl ? boardEl.value : 'RESELL TALK';

    let ok = true;

    titleEl.classList.remove('err');
    contentEl.classList.remove('err');

    if (!title) {
      titleEl.classList.add('err');
      ok = false;
    }

    if (!content) {
      contentEl.classList.add('err');
      ok = false;
    }

    if (!ok) {
      showToast('제목과 내용을 입력해주세요.', 'error');
      return;
    }

    if (!Array.isArray(DATA.userPosts)) DATA.userPosts = [];
    if (!Array.isArray(DATA.posts)) DATA.posts = [];
    if (!Array.isArray(DATA.bookmarks)) DATA.bookmarks = [];

    const selectedTags = [...document.querySelectorAll('#postTagSelect .tag-opt.sel')]
      .map(tag => tag.dataset.tag || tag.textContent.trim());

    const user = getAuthUser();

    const newPost = {
      id: `post_${Date.now()}`,
      av: 'av-a',
      em: '📝',
      author: user?.nickname || user?.email || '나',
      authorTier: '',
      time: '방금 전',
      badge: board || 'RESELL TALK',
      tags: selectedTags,
      title,
      content,
      preview: typeof getPostPreview === 'function'
  ? getPostPreview({ content })
  : (content.length > 90 ? content.slice(0, 90) + '…' : content),
      likes: 0,
      comments: 0,
      views: 0,

      // DB 연동 시 사용할 예비 필드
      dbPending: true
    };

    const submitBtn = document.getElementById('postSubmitBtn');
    btnLoad(submitBtn, '등록 중...');

    setTimeout(() => {
      DATA.userPosts.unshift(newPost);
      DATA.posts.unshift(newPost);

      const postList = document.getElementById('postList');
      if (postList && typeof renderPostCard === 'function') {
        postList.innerHTML = '';
        DATA.posts.forEach(post => {
          postList.appendChild(renderPostCard(post));
        });
      }


      btnReset(submitBtn);
      clearDraft('post');

      if (formEl) resetForm(formEl);

      document.querySelectorAll('#postTagSelect .tag-opt.sel')
        .forEach(tag => tag.classList.remove('sel'));
        updatePostDraftCount();

      closeModal('writePost');
      showToast('게시글이 등록되었습니다! 🎉', 'success');

      if (typeof openPostDetail === 'function') {
        setTimeout(() => openPostDetail(newPost), 250);
      }

     fetch('https://backend.di702934.workers.dev/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
  },
  body: JSON.stringify({
    ...newPost,
    board: board || 'RESELL TALK',
    author_email: user?.email || ''
  })
})
  .then(async res => {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'DB 저장에 실패했습니다.');
    }

    return data;
  })
  .then(() => {
    console.log('게시글 DB 저장 완료');
  })
  .catch(err => {
    console.error(err);
    showToast('화면에는 등록됐지만 DB 저장에 실패했어요.', 'warn');
  });
    }, 600);
  });
}
/* ═══════════════════════════════════════════════════
   SUPPORT / MYPAGE
═══════════════════════════════════════════════════ */
function initSupportForm() {
  const btn = document.getElementById('supportBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btnLoad(btn, '전송 중...');
    setTimeout(() => { btnReset(btn); showToast('문의가 접수되었습니다. 빠르게 답변드리겠습니다.', 'success'); }, 1000);
  });
}

function initMypageForm() {
  const btn = document.getElementById('mpSaveBtn');
  if (!btn) return;
  initTelFormat('mpTel');
  initCharCounter('mpBio', 'mpBioCount', 200);
  btn.addEventListener('click', () => {
    btnLoad(btn, '저장 중...');
    setTimeout(() => { btnReset(btn); showToast('프로필이 저장되었습니다.', 'success'); }, 800);
  });
}

/* ═══════════════════════════════════════════════════
   BOOT — 전체 초기화
═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initSignupForm();
  initPreregForm();
  initDropForm();
  initPostForm();
  initSupportForm();
  initMypageForm();

  document.addEventListener('click', (e) => {
    const logoutTarget = e.target.closest('#logoutBtnPc, #logoutBtnM, [data-logout]');

    if (!logoutTarget) return;

    e.preventDefault();
    e.stopPropagation();

    logout();
  });

  applyLoginState();
});
