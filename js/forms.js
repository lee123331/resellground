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

fetch('https://resellground.di702934.workers.dev/api/auth/login', {
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
function getCleanPriceValue(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return 0;

  const raw = String(el.value || '').replace(/[^\d]/g, '');
  return raw ? Number(raw) : 0;
}

function getProductImageMeta() {
  const uploadedImages = window.RG?._productUploader?.getImages
    ? window.RG._productUploader.getImages()
    : [];

  return uploadedImages.map((img, index) => ({
    name: img.file?.name || `image_${index + 1}`,
    type: img.file?.type || '',
    size: img.file?.size || 0,
    order: index,
    is_main: index === 0
  }));
}

function getDropFormData() {
  const user = getAuthUser ? getAuthUser() : null;

  const checkedTrade = [...document.querySelectorAll('input[name="product-trade"]:checked')]
    .map(el => el.value);

  let tradeMethod = document.getElementById('dropTrade')?.value || '전국 안전결제';

  if (checkedTrade.includes('전국 안전결제') && checkedTrade.includes('근거리 직거래')) {
    tradeMethod = '전국+직거래 모두';
  } else if (checkedTrade.includes('근거리 직거래')) {
    tradeMethod = '근거리 직거래';
  } else if (checkedTrade.includes('전국 안전결제')) {
    tradeMethod = '전국 안전결제';
  }

  return {
    id: `product_${Date.now()}`,
    seller_email: user?.email || '',
    seller_name: user?.nickname || user?.email || '나',
    name: document.getElementById('dropName')?.value.trim() || '',
    brand: document.getElementById('dropBrand')?.value.trim() || '',
    brand_id: document.getElementById('dropBrandId')?.value || null,
    category: document.getElementById('dropCat')?.value || '',
    price: getCleanPriceValue('dropPrice'),
    condition: document.getElementById('dropCond')?.value || '',
    trade_method: tradeMethod,
    description: document.getElementById('dropDesc')?.value.trim() || '',
    images: getProductImageMeta(),
    status: '판매중'
  };
}
/* ═══════════════════════════════════════════════════
   ADD DROP FORM
═══════════════════════════════════════════════════ */
function initDropForm() {
  initCharCounter('dropDesc', 'dropDescCount', 1000);
  initPriceFormat('dropPrice', 'dropPriceDisplay');
  initDraftSave('dropFormInner', 'drop');
  initCloseGuard('addDrop', 'dropFormInner', 'drop');

  if (window.RG && typeof window.RG.initProductImageUploader === 'function') {
    window.RG._productUploader = window.RG.initProductImageUploader();
  }

  initRealTimeValidation('dropName', 'dropNameErr', V.required, '상품명을 입력해주세요.');

  const priceInp = document.getElementById('dropPrice');
  const netEl = document.getElementById('product-net-price');

  if (priceInp && priceInp.dataset.boundNetPrice !== '1') {
    priceInp.dataset.boundNetPrice = '1';

    priceInp.addEventListener('input', () => {
      const price = getCleanPriceValue('dropPrice');
      const net = Math.floor(price * 0.975);

      if (price > 0) setOk('dropPrice', 'dropPriceErr');
      else clearField('dropPrice', 'dropPriceErr');

      if (netEl) {
        netEl.textContent = price > 0
          ? `${net.toLocaleString('ko-KR')}원`
          : '—';
      }
    });
  }

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

  submitBtn.addEventListener('click', async () => {
    const product = getDropFormData();

    let ok = true;

    if (!V.required(product.name)) {
      setErr('dropName', 'dropNameErr', '상품명을 입력해주세요.');
      ok = false;
    } else {
      setOk('dropName', 'dropNameErr');
    }

    if (!product.price) {
      setErr('dropPrice', 'dropPriceErr', '가격을 입력해주세요.');
      ok = false;
    } else {
      setOk('dropPrice', 'dropPriceErr');
    }

    if (!product.category) {
      setErr('dropCat', 'dropCatErr', '카테고리를 선택해주세요.');
      ok = false;
    } else {
      setOk('dropCat', 'dropCatErr');
    }

    if (!product.condition) {
      setErr('dropCond', 'dropCondErr', '상태를 선택해주세요.');
      ok = false;
    } else {
      setOk('dropCond', 'dropCondErr');
    }

    if (!product.images.length) {
      showToast('상품 이미지를 최소 1장 등록해주세요.', 'error');
      ok = false;
    }

    if (!ok) return;

    btnLoad(submitBtn, '등록 중...');

    try {
      const res = await fetch('https://resellground.di702934.workers.dev/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
        },
        body: JSON.stringify(product)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || '상품 DB 저장에 실패했습니다.');
      }

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
    } catch (err) {
      console.error(err);
      showToast(err.message || '상품 등록 중 오류가 발생했습니다.', 'error');
    } finally {
      btnReset(submitBtn);
    }
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

     fetch('https://resellground.di702934.workers.dev/api/posts', {
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
   PRODUCT REGISTER PAGE  — 상품 등록 전용 페이지
═══════════════════════════════════════════════════ */

/* ── 카테고리 트리 (상품 타입 기반) ── */
const CATEGORY_TREE = [
  { id:'clothing', label:'의류', icon:'👕', children:[
    { id:'mens', label:'남성의류', children:[
      { id:'mens_top', label:'상의', children:[
        { id:'mens_tshirt',  label:'티셔츠' },
        { id:'mens_sweat',   label:'맨투맨 · 후드티' },
        { id:'mens_shirt',   label:'셔츠' },
        { id:'mens_knit',    label:'니트 · 가디건' },
        { id:'mens_top_etc', label:'남성 상의 기타' },
      ]},
      { id:'mens_bottom', label:'하의', children:[
        { id:'mens_jeans',       label:'청바지' },
        { id:'mens_slacks',      label:'슬랙스 · 치노팬츠' },
        { id:'mens_shorts',      label:'반바지' },
        { id:'mens_jogger',      label:'트레이닝 · 조거팬츠' },
        { id:'mens_bottom_etc',  label:'남성 하의 기타' },
      ]},
      { id:'mens_outer', label:'아우터', children:[
        { id:'mens_jacket',      label:'자켓 · 블레이저' },
        { id:'mens_coat',        label:'코트' },
        { id:'mens_padding',     label:'패딩 · 점퍼' },
        { id:'mens_zip',         label:'집업 · 플리스' },
        { id:'mens_outer_etc',   label:'남성 아우터 기타' },
      ]},
    ]},
    { id:'womens', label:'여성의류', children:[
      { id:'womens_top', label:'상의', children:[
        { id:'womens_tshirt',   label:'티셔츠 · 탑' },
        { id:'womens_blouse',   label:'블라우스 · 셔츠' },
        { id:'womens_knit',     label:'니트 · 가디건' },
        { id:'womens_top_etc',  label:'여성 상의 기타' },
      ]},
      { id:'womens_bottom', label:'하의', children:[
        { id:'womens_jeans',       label:'청바지' },
        { id:'womens_skirt',       label:'스커트' },
        { id:'womens_slacks',      label:'슬랙스 · 팬츠' },
        { id:'womens_bottom_etc',  label:'여성 하의 기타' },
      ]},
      { id:'womens_dress',  label:'원피스' },
      { id:'womens_outer', label:'아우터', children:[
        { id:'womens_jacket',      label:'자켓 · 블레이저' },
        { id:'womens_coat',        label:'코트' },
        { id:'womens_padding',     label:'패딩 · 점퍼' },
        { id:'womens_outer_etc',   label:'여성 아우터 기타' },
      ]},
    ]},
    { id:'unisex', label:'공용 (유니섹스)', children:[
      { id:'unisex_top',   label:'상의' },
      { id:'unisex_bottom',label:'하의' },
      { id:'unisex_outer', label:'아우터' },
    ]},
    { id:'clothing_etc', label:'의류 기타' },
  ]},
  { id:'shoes', label:'신발', icon:'👟', children:[
    { id:'sneakers', label:'스니커즈', children:[
      { id:'hightop',      label:'하이탑' },
      { id:'lowtop',       label:'로우탑' },
      { id:'slipon',       label:'슬립온' },
      { id:'sneakers_etc', label:'스니커즈 기타' },
    ]},
    { id:'dress_shoes',  label:'구두 · 로퍼' },
    { id:'sandals',      label:'샌들 · 슬리퍼' },
    { id:'boots',        label:'부츠 · 워커' },
    { id:'shoes_etc',    label:'신발 기타' },
  ]},
  { id:'accessory', label:'패션잡화', icon:'👜', children:[
    { id:'bag', label:'가방', children:[
      { id:'backpack',    label:'백팩' },
      { id:'shoulder',    label:'숄더백 · 크로스백' },
      { id:'tote',        label:'토트백' },
      { id:'clutch',      label:'클러치 · 파우치' },
      { id:'bag_etc',     label:'가방 기타' },
    ]},
    { id:'wallet', label:'지갑 · 소품', children:[
      { id:'longwallet',  label:'장지갑' },
      { id:'shortwallet', label:'반지갑' },
      { id:'cardwallet',  label:'카드지갑' },
      { id:'keycase',     label:'키케이스 · 소품' },
    ]},
    { id:'hat', label:'모자', children:[
      { id:'cap',         label:'볼캡 · 스냅백' },
      { id:'beanie',      label:'비니' },
      { id:'bucket',      label:'버킷햇' },
      { id:'hat_etc',     label:'모자 기타' },
    ]},
    { id:'belt',         label:'벨트' },
    { id:'scarf',        label:'스카프 · 넥타이' },
    { id:'glasses',      label:'선글라스 · 안경테' },
    { id:'acc_etc',      label:'잡화 기타' },
  ]},
  { id:'luxury', label:'명품', icon:'💎', children:[
    { id:'lux_bag',      label:'명품 가방' },
    { id:'lux_wallet',   label:'명품 지갑 · 소품' },
    { id:'lux_clothes',  label:'명품 의류' },
    { id:'lux_shoes',    label:'명품 신발' },
    { id:'lux_jewelry',  label:'명품 주얼리 · 액세서리' },
    { id:'lux_etc',      label:'명품 기타' },
  ]},
  { id:'watch', label:'시계', icon:'⌚', children:[
    { id:'mech_watch',     label:'기계식 시계' },
    { id:'quartz_watch',   label:'쿼츠 시계' },
    { id:'smartwatch',     label:'스마트워치' },
    { id:'vintage_watch',  label:'빈티지 시계' },
    { id:'watch_etc',      label:'시계 기타' },
  ]},
  { id:'jewelry', label:'주얼리 · 액세서리', icon:'💍', children:[
    { id:'necklace',  label:'목걸이' },
    { id:'ring',      label:'반지' },
    { id:'bracelet',  label:'팔찌 · 뱅글' },
    { id:'earring',   label:'귀걸이' },
    { id:'jewelry_etc', label:'주얼리 기타' },
  ]},
  { id:'tech', label:'테크 · 가전', icon:'💻', children:[
    { id:'phone',     label:'스마트폰' },
    { id:'laptop',    label:'노트북 · 태블릿' },
    { id:'audio',     label:'이어폰 · 헤드폰' },
    { id:'camera',    label:'카메라' },
    { id:'game',      label:'게임기 · 콘솔' },
    { id:'tech_etc',  label:'가전 기타' },
  ]},
  { id:'etc', label:'기타', icon:'📦', children:[] },
];

/* 최상위 카테고리 → 사이즈맵 키 매핑 */
const CAT_TO_SIZE_KEY = {
  shoes:    '신발',
  clothing: '의류',
};

/* 카테고리별 사이즈 옵션 */
const PREG_SIZE_MAP = {
  '신발': [
    { group: '한국 사이즈 (mm)', sizes: ['210','215','220','225','230','235','240','245','250','255','260','265','270','275','280','285','290','295','300','305','310'] },
    { group: '유럽 사이즈 (EU)',  sizes: ['35','35.5','36','36.5','37','37.5','38','38.5','39','39.5','40','40.5','41','41.5','42','42.5','43','43.5','44','44.5','45','45.5','46','46.5','47','47.5','48'] }
  ],
  '의류': [
    { group: '한국 사이즈', sizes: ['44','55','66','77','88','95','100','105','110','FREE'] },
    { group: '국제 사이즈',  sizes: ['XS','S','M','L','XL','2XL','3XL'] }
  ],
};

function initProductRegisterPage() {
  /* ── 이미지 업로더 ── */
  const dropzone  = document.getElementById('pregDropzone');
  const fileInput = document.getElementById('pregFileInput');
  const thumbGrid = document.getElementById('pregThumbGrid');
  const imgCount  = document.getElementById('pregImgCount');
  if (!dropzone || !fileInput) return;

  const MAX_IMG = 10, MAX_MB = 10;
  let images = [];

  function syncCount() {
    if (imgCount) imgCount.textContent = `${images.length} / ${MAX_IMG}`;
  }

  function renderThumbs() {
    if (!thumbGrid) return;
    if (images.length === 0) {
      thumbGrid.style.display = 'none';
      thumbGrid.innerHTML = '';
      dropzone.querySelector('#pregDropContent') &&
        (dropzone.querySelector('#pregDropContent').style.display = '');
      syncCount(); return;
    }
    dropzone.querySelector('#pregDropContent') &&
      (dropzone.querySelector('#pregDropContent').style.display = 'none');
    thumbGrid.style.display = 'grid';
    thumbGrid.innerHTML = '';
    images.forEach((img, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'preg-thumb';
      wrap.draggable = true;
      wrap.dataset.idx = i;
      const el = document.createElement('img');
      el.src = img.url; el.alt = `상품 이미지 ${i+1}`;
      wrap.appendChild(el);
      if (i === 0) {
        const badge = document.createElement('span');
        badge.className = 'preg-thumb__badge';
        badge.textContent = '대표';
        wrap.appendChild(badge);
      }
      const del = document.createElement('button');
      del.className = 'preg-thumb__del'; del.type = 'button'; del.textContent = '✕';
      del.setAttribute('aria-label', `이미지 ${i+1} 삭제`);
      del.addEventListener('click', e => {
        e.stopPropagation();
        URL.revokeObjectURL(img.url);
        images.splice(i, 1);
        renderThumbs();
      });
      wrap.appendChild(del);
      /* drag-to-reorder */
      wrap.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', String(i));
        setTimeout(() => wrap.classList.add('is-dragging'), 0);
      });
      wrap.addEventListener('dragend', () => wrap.classList.remove('is-dragging'));
      wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('is-dragover'); });
      wrap.addEventListener('dragleave', () => wrap.classList.remove('is-dragover'));
      wrap.addEventListener('drop', e => {
        e.preventDefault(); wrap.classList.remove('is-dragover');
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(from) || from === i) return;
        const [moved] = images.splice(from, 1);
        images.splice(i, 0, moved);
        renderThumbs();
      });
      thumbGrid.appendChild(wrap);
    });
    if (images.length < MAX_IMG) {
      const addSlot = document.createElement('label');
      addSlot.className = 'preg-thumb-add';
      addSlot.innerHTML = '<span>+</span><span>추가</span>';
      const addInput = document.createElement('input');
      addInput.type = 'file'; addInput.multiple = true; addInput.accept = 'image/*'; addInput.style.display = 'none';
      addInput.addEventListener('change', e => { handleFiles(e.target.files); addInput.value = ''; });
      addSlot.appendChild(addInput);
      thumbGrid.appendChild(addSlot);
    }
    syncCount();
  }

  function handleFiles(files) {
    Array.from(files).forEach(f => {
      if (images.length >= MAX_IMG) { showToast(`이미지는 최대 ${MAX_IMG}장까지 등록할 수 있어요.`, 'error'); return; }
      if (!f.type.startsWith('image/')) { showToast('이미지 파일만 업로드할 수 있어요.', 'error'); return; }
      if (f.size > MAX_MB * 1024 * 1024) { showToast(`${f.name}: 파일 크기가 ${MAX_MB}MB를 초과해요.`, 'error'); return; }
      images.push({ file: f, url: URL.createObjectURL(f) });
    });
    renderThumbs();
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => { handleFiles(e.target.files); fileInput.value = ''; });
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('is-dragover');
    handleFiles(e.dataTransfer.files);
  });

  /* ── 카테고리 캐스케이드 ── */
  const catHidden  = document.getElementById('pregCat');
  const catBtn     = document.getElementById('pregCatBtn');
  const catLabel   = document.getElementById('pregCatLabel');
  const catOverlay = document.getElementById('pregCatOverlay');
  const catSheet   = document.getElementById('pregCatSheet');
  const catTitle   = document.getElementById('pregCatSheetTitle');
  const catBackBtn = document.getElementById('pregCatBackBtn');
  const catCloseBtn= document.getElementById('pregCatCloseBtn');
  const catBreadcrumb = document.getElementById('pregCatBreadcrumb');
  const catList    = document.getElementById('pregCatList');

  let catPath = [];   // 선택된 노드 배열 (depth별)
  let catStack = [];  // 렌더 스택 [{title, items}]

  function findNode(tree, id) {
    for (const n of tree) {
      if (n.id === id) return n;
      if (n.children && n.children.length) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function renderCatLevel(items, title) {
    if (catTitle) catTitle.textContent = title;
    if (catBackBtn) catBackBtn.style.visibility = catStack.length > 0 ? 'visible' : 'hidden';

    // 브레드크럼
    if (catBreadcrumb) {
      if (catPath.length === 0) {
        catBreadcrumb.innerHTML = '';
      } else {
        catBreadcrumb.innerHTML = catPath.map((n, i) =>
          `${i > 0 ? '<span class="cat-crumb-sep">›</span>' : ''}
           <span class="cat-crumb-item">${n.icon ? n.icon + ' ' : ''}${n.label}</span>`
        ).join('');
      }
    }

    if (!catList) return;
    catList.innerHTML = '';
    items.forEach(item => {
      const hasChildren = item.children && item.children.length > 0;
      const div = document.createElement('div');
      div.className = 'cat-item';
      div.innerHTML = `
        ${item.icon ? `<span class="cat-item__icon">${item.icon}</span>` : '<span class="cat-item__icon" style="opacity:0"></span>'}
        <span class="cat-item__label">${item.label}</span>
        ${hasChildren
          ? `<span class="cat-item__arrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg></span>`
          : `<span class="cat-item__check" style="display:none">✓</span>`
        }
      `;
      div.addEventListener('click', () => {
        if (hasChildren) {
          catStack.push({ title, items });
          catPath.push(item);
          renderCatLevel(item.children, item.label);
        } else {
          // 리프 선택 → 확정
          catPath.push(item);
          const fullLabel = catPath.map(n => n.label).join(' > ');
          const topId = catPath[0].id;
          if (catHidden) catHidden.value = topId;
          if (catLabel) { catLabel.textContent = fullLabel; }
          if (catBtn) catBtn.classList.add('has-value');

          // 사이즈 맵 업데이트
          const sizeKey = CAT_TO_SIZE_KEY[topId] || '';
          updateSizeOptions(sizeKey);

          closeCatOverlay();
        }
      });
      catList.appendChild(div);
    });
  }

  function openCatOverlay() {
    catStack = [];
    catPath  = [];
    renderCatLevel(CATEGORY_TREE, '카테고리 선택');
    if (catOverlay) catOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCatOverlay() {
    if (catOverlay) catOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (catBtn) catBtn.addEventListener('click', openCatOverlay);
  if (catCloseBtn) catCloseBtn.addEventListener('click', closeCatOverlay);
  if (catOverlay) catOverlay.addEventListener('click', e => { if (e.target === catOverlay) closeCatOverlay(); });

  if (catBackBtn) {
    catBackBtn.addEventListener('click', () => {
      if (catStack.length > 0) {
        catPath.pop();
        const prev = catStack.pop();
        renderCatLevel(prev.items, prev.title);
      }
    });
  }

  /* ── 사이즈 옵션 갱신 ── */
  const sizeWrap = document.getElementById('pregSizeWrap');
  const sizeSel  = document.getElementById('pregSize');
  function updateSizeOptions(key) {
    if (!sizeSel) return;
    const groups = PREG_SIZE_MAP[key] || [];
    sizeSel.innerHTML = '<option value="">선택</option>';
    if (!groups.length) {
      if (sizeWrap) sizeWrap.style.display = 'none';
      return;
    }
    groups.forEach(({ group, sizes }) => {
      const og = document.createElement('optgroup');
      og.label = group;
      sizes.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        og.appendChild(o);
      });
      sizeSel.appendChild(og);
    });
    if (sizeWrap) sizeWrap.style.display = '';
  }
  updateSizeOptions('');

  /* ══════════════════════════════════════════
     브랜드 자동완성 (API + 로컬 폴백)
  ══════════════════════════════════════════ */

  /* 로컬 폴백 리스트 (API 실패 시 사용) */
  const BRAND_FALLBACK = [
    {id:null,name_en:'Nike',name_ko:'나이키'},{id:null,name_en:'Jordan',name_ko:'조던'},
    {id:null,name_en:'Adidas',name_ko:'아디다스'},{id:null,name_en:'New Balance',name_ko:'뉴발란스'},
    {id:null,name_en:'Supreme',name_ko:'슈프림'},{id:null,name_en:'Off-White',name_ko:'오프화이트'},
    {id:null,name_en:'Louis Vuitton',name_ko:'루이비통'},{id:null,name_en:'Chanel',name_ko:'샤넬'},
    {id:null,name_en:'Gucci',name_ko:'구찌'},{id:null,name_en:'Rolex',name_ko:'롤렉스'},
    {id:null,name_en:'Omega',name_ko:'오메가'},{id:null,name_en:'Cartier',name_ko:'까르띠에'},
    {id:null,name_en:'Apple',name_ko:'애플'},{id:null,name_en:'Samsung',name_ko:'삼성'},
    {id:null,name_en:'The North Face',name_ko:'노스페이스'},{id:null,name_en:"Arc'teryx",name_ko:'아크테릭스'},
  ];

  /**
   * initBrandAutocomplete
   * @param {string} inputId   - 텍스트 input id
   * @param {string} hiddenId  - hidden brand_id input id
   * @param {string} [errId]   - 에러 메시지 p id
   */
  function initBrandAutocomplete(inputId, hiddenId, errId) {
    const inp    = document.getElementById(inputId);
    const hidden = hiddenId ? document.getElementById(hiddenId) : null;
    const errEl  = errId    ? document.getElementById(errId)    : null;
    if (!inp) return;

    /* 드롭다운 생성 */
    const wrap = inp.closest('.preg-field') || inp.parentElement;
    if (wrap) wrap.style.position = 'relative';

    const dropdown = document.createElement('div');
    dropdown.className = 'preg-brand-dropdown';
    inp.insertAdjacentElement('afterend', dropdown);

    let activeIdx      = -1;
    let confirmed      = false;   // 목록에서 선택했는지 여부
    let debounceTimer  = null;

    /* ── 에러 표시 / 숨기기 ── */
    function showErr(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.style.display = msg ? 'block' : 'none';
    }
    function clearErr() { showErr(''); }

    /* ── API 호출 (실패 시 로컬 폴백) ── */
    async function fetchBrands(q) {
      try {
        const res  = await fetch(`${API_BASE}/api/brands/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.brands) && data.brands.length) {
          return data.brands;
        }
      } catch (_) { /* network error → fallback */ }

      /* 로컬 폴백 */
      const ql = q.toLowerCase();
      const starts   = BRAND_FALLBACK.filter(b =>
        b.name_en.toLowerCase().startsWith(ql) || b.name_ko.startsWith(ql));
      const contains = BRAND_FALLBACK.filter(b =>
        !b.name_en.toLowerCase().startsWith(ql) && !b.name_ko.startsWith(ql) &&
        (b.name_en.toLowerCase().includes(ql) || b.name_ko.includes(ql)));
      return [...starts, ...contains].slice(0, 8);
    }

    /* ── 강조 헬퍼 ── */
    function highlight(text, q) {
      if (!q) return text;
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) return text;
      return text.slice(0, idx)
        + '<mark>' + text.slice(idx, idx + q.length) + '</mark>'
        + text.slice(idx + q.length);
    }

    /* ── 드롭다운 렌더링 ── */
    async function showSuggestions(q) {
      activeIdx = -1;
      if (!q) { dropdown.style.display = 'none'; return; }

      const brands = await fetchBrands(q);
      if (!brands.length) { dropdown.style.display = 'none'; return; }

      dropdown.innerHTML = brands.slice(0, 8).map((b, i) => {
        const enHi = highlight(b.name_en, q);
        const koHi = highlight(b.name_ko || '', q);
        return `<div class="preg-brand-item" data-brand="${b.name_en}"
                  data-brand-id="${b.id ?? ''}" data-i="${i}">
          <span class="brand-en">${enHi}</span>
          ${b.name_ko ? `<span class="brand-ko">${koHi}</span>` : ''}
        </div>`;
      }).join('');

      dropdown.querySelectorAll('.preg-brand-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          selectBrand(item);
        });
      });
      dropdown.style.display = 'block';
    }

    /* ── 브랜드 선택 ── */
    function selectBrand(item) {
      inp.value        = item.dataset.brand;
      if (hidden) hidden.value = item.dataset.brandId || '';
      confirmed        = true;
      activeIdx        = -1;
      dropdown.style.display = 'none';
      clearErr();
    }

    /* ── 키보드 강조 ── */
    function highlightItem(i) {
      dropdown.querySelectorAll('.preg-brand-item')
        .forEach((el, idx) => el.classList.toggle('active', idx === i));
    }

    /* ── 이벤트 ── */
    inp.addEventListener('input', () => {
      confirmed = false;
      if (hidden) hidden.value = '';
      clearErr();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => showSuggestions(inp.value.trim()), 200);
    });

    inp.addEventListener('focus', () => {
      if (inp.value.trim()) showSuggestions(inp.value.trim());
    });

    inp.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
        /* 텍스트가 있는데 목록에서 선택 안 한 경우 → 필드 초기화 */
        if (inp.value.trim() && !confirmed) {
          inp.value = '';
          if (hidden) hidden.value = '';
          showErr('목록에서 브랜드를 선택해주세요.');
        }
      }, 200);
    });

    inp.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.preg-brand-item');
      if (!items.length || dropdown.style.display === 'none') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        highlightItem(activeIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        highlightItem(activeIdx);
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        selectBrand(items[activeIdx]);
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    /* 붙여넣기 시 confirmed 리셋 → blur 때 자동 초기화됨 */
    inp.addEventListener('paste', () => {
      confirmed = false;
      if (hidden) hidden.value = '';
    });
  }

  /* pregBrand */
  initBrandAutocomplete('pregBrand', 'pregBrandId', 'pregBrandErr');
  /* dropBrand (드롭 빠른등록 폼) */
  initBrandAutocomplete('dropBrand', 'dropBrandId', 'dropBrandErr');

  /* ── 정가품 검수 서비스 안내 모달 ── */
  const verifyInfoBtn   = document.getElementById('pregVerifyInfoBtn');
  const verifyOverlay   = document.getElementById('verifyInfoOverlay');
  const verifyCloseBtn  = document.getElementById('verifyInfoCloseBtn');
  if (verifyInfoBtn && verifyOverlay) {
    verifyInfoBtn.addEventListener('click', () => {
      verifyOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    const closeVerify = () => { verifyOverlay.classList.remove('open'); document.body.style.overflow = ''; };
    if (verifyCloseBtn) verifyCloseBtn.addEventListener('click', closeVerify);
    verifyOverlay.addEventListener('click', e => { if (e.target === verifyOverlay) closeVerify(); });
  }

  /* ── 판매가 → 수수료 계산 ── */
  const priceInp     = document.getElementById('pregPrice');
  const priceDisplay = document.getElementById('pregPriceDisplay');
  const feeDisplay   = document.getElementById('pregFeeDisplay');
  const netDisplay   = document.getElementById('pregNetDisplay');
  function updateFeeCalc() {
    const raw = String(priceInp ? priceInp.value : '').replace(/[^\d]/g, '');
    const price = raw ? Number(raw) : 0;
    const fee   = Math.round(price * 0.025);
    const net   = price - fee;
    const fmt   = n => n > 0 ? `₩${n.toLocaleString('ko-KR')}` : '—';
    if (priceDisplay) priceDisplay.textContent = fmt(price);
    if (feeDisplay)   feeDisplay.textContent   = price > 0 ? `- ₩${fee.toLocaleString('ko-KR')}` : '—';
    if (netDisplay)   netDisplay.textContent   = fmt(net);
  }
  if (priceInp) priceInp.addEventListener('input', updateFeeCalc);

  /* ── 설명 글자 수 ── */
  const descTA   = document.getElementById('pregDesc');
  const descCnt  = document.getElementById('pregDescCount');
  if (descTA && descCnt) {
    descTA.addEventListener('input', () => {
      descCnt.textContent = descTA.value.length;
    });
  }

  /* ── 거래 방식 → 직거래 지역 표시 ── */
  const locationWrap = document.getElementById('pregLocationWrap');
  document.querySelectorAll('input[name="pregTrade"]').forEach(chk => {
    chk.addEventListener('change', () => {
      const hasLocal = [...document.querySelectorAll('input[name="pregTrade"]:checked')]
        .some(el => el.value === '근거리 직거래');
      if (locationWrap) locationWrap.style.display = hasLocal ? '' : 'none';
    });
  });

  /* ── 뒤로 가기 ── */
  const backBtn = document.getElementById('pregBackBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (typeof navigateTo === 'function') navigateTo('drops');
  });

  /* ── 임시저장 ── */
  function saveDraftPreg() {
    const data = {
      cat: catHidden?.value || '',
      catLabel: catLabel?.textContent || '',
      brand: document.getElementById('pregBrand')?.value || '',
      brandId: document.getElementById('pregBrandId')?.value || '',
      name: document.getElementById('pregName')?.value || '',
      model: document.getElementById('pregModel')?.value || '',
      size: sizeSel?.value || '',
      cond: document.querySelector('input[name="pregCond"]:checked')?.value || '',
      price: priceInp?.value || '',
      retail: document.getElementById('pregRetail')?.value || '',
      desc: descTA?.value || ''
    };
    try { localStorage.setItem('draft_preg', JSON.stringify(data)); } catch(e) {}
  }
  function loadDraftPreg() {
    try {
      const saved = JSON.parse(localStorage.getItem('draft_preg') || 'null');
      if (!saved) return;
      if (saved.cat && catHidden) {
        catHidden.value = saved.cat;
        if (catLabel) { catLabel.textContent = saved.catLabel || saved.cat; catBtn && catBtn.classList.add('has-value'); }
        updateSizeOptions(CAT_TO_SIZE_KEY[saved.cat] || saved.cat);
      }
      const fields = ['brand','name','model','price','retail','desc'];
      fields.forEach(f => {
        const el = document.getElementById(`preg${f.charAt(0).toUpperCase()+f.slice(1)}`);
        if (el && saved[f]) el.value = saved[f];
      });
      /* brand_id 복원 — draft에서 복원 시 선택 상태로 간주 */
      const brandIdEl = document.getElementById('pregBrandId');
      if (brandIdEl && saved.brandId) brandIdEl.value = saved.brandId;
      if (saved.size && sizeSel) sizeSel.value = saved.size;
      if (saved.cond) {
        const r = document.querySelector(`input[name="pregCond"][value="${saved.cond}"]`);
        if (r) r.checked = true;
      }
      if (saved.price) updateFeeCalc();
      if (saved.desc && descCnt) descCnt.textContent = saved.desc.length;
    } catch(e) {}
  }
  loadDraftPreg();

  [document.getElementById('pregSaveBtn'), document.getElementById('pregSaveBtnB')].forEach(btn => {
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      saveDraftPreg();
      showToast('임시저장되었습니다.', 'success');
    });
  });

  /* ── 등록하기 ── */
  function submitPreg(btn) {
    if (!btn || btn.dataset.busy === '1') return;
    /* 유효성 검사 */
    let ok = true;
    const reqFields = [
      { id: 'pregCat',   errId: 'pregCatErr',   msg: '카테고리를 선택해주세요.' },
      { id: 'pregBrand', errId: 'pregBrandErr', msg: '브랜드를 입력해주세요.' },
      { id: 'pregName',  errId: 'pregNameErr',  msg: '상품명을 입력해주세요.' },
      { id: 'pregPrice', errId: 'pregPriceErr', msg: '판매가를 입력해주세요.' }
    ];
    reqFields.forEach(({ id, errId, msg }) => {
      const el = document.getElementById(id);
      const err = document.getElementById(errId);
      if (!el || !el.value.trim()) {
        if (el) el.classList.add('err');
        if (err) { err.textContent = msg; err.classList.add('show'); }
        ok = false;
      } else {
        if (el) el.classList.remove('err');
        if (err) err.classList.remove('show');
      }
    });

    /* 브랜드를 목록에서 선택했는지 추가 검증 */
    const brandIdEl  = document.getElementById('pregBrandId');
    const brandInpEl = document.getElementById('pregBrand');
    const brandErrEl = document.getElementById('pregBrandErr');
    if (brandInpEl?.value.trim() && !brandIdEl?.value) {
      if (brandInpEl) brandInpEl.classList.add('err');
      if (brandErrEl) { brandErrEl.textContent = '목록에서 브랜드를 선택해주세요.'; brandErrEl.classList.add('show'); }
      ok = false;
    }
    const condChecked = document.querySelector('input[name="pregCond"]:checked');
    const condErr = document.getElementById('pregCondErr');
    if (!condChecked) {
      if (condErr) { condErr.textContent = '상품 상태를 선택해주세요.'; condErr.classList.add('show'); }
      ok = false;
    } else {
      if (condErr) condErr.classList.remove('show');
    }
    if (images.length === 0) { showToast('상품 사진을 최소 1장 등록해주세요.', 'error'); ok = false; }
    if (!ok) return;

    /* 제출 */
    const user = (typeof getAuthUser === 'function') ? getAuthUser() : null;
    const tradeVals = [...document.querySelectorAll('input[name="pregTrade"]:checked')].map(el => el.value);
    let tradeMethod = '전국 안전결제';
    if (tradeVals.includes('전국 안전결제') && tradeVals.includes('근거리 직거래')) tradeMethod = '전국+직거래 모두';
    else if (tradeVals.includes('근거리 직거래')) tradeMethod = '근거리 직거래';

    const product = {
      id: `product_${Date.now()}`,
      seller_email: user?.email || '',
      seller_name:  user?.nickname || user?.email || '익명',
      category:     document.getElementById('pregCat')?.value || '',
      brand:        document.getElementById('pregBrand')?.value.trim() || '',
      brand_id:     document.getElementById('pregBrandId')?.value || null,
      name:         document.getElementById('pregName')?.value.trim() || '',
      model:        document.getElementById('pregModel')?.value.trim() || '',
      size:         sizeSel?.value || '',
      condition:    condChecked?.value || '',
      price:        Number(String(priceInp?.value || '0').replace(/[^\d]/g, '')),
      retail_price: Number(String(document.getElementById('pregRetail')?.value || '0').replace(/[^\d]/g, '')),
      description:  descTA?.value.trim() || '',
      trade_method: tradeMethod,
      location:     document.getElementById('pregLocation')?.value.trim() || '',
      status:       '판매중',
      images: images.map((img, idx) => ({
        name: img.file?.name || `image_${idx+1}`,
        type: img.file?.type || '',
        size: img.file?.size || 0,
        order: idx,
        is_main: idx === 0
      }))
    };

    btn.dataset.busy = '1';
    const origText = btn.textContent;
    btn.textContent = '등록 중…'; btn.disabled = true;

    fetch('https://resellground.di702934.workers.dev/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('rg_token') || ''}`
      },
      body: JSON.stringify(product)
    })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || '상품 등록에 실패했습니다.');
      return data;
    })
    .then(() => {
      localStorage.removeItem('draft_preg');
      images.forEach(img => URL.revokeObjectURL(img.url));
      images = []; renderThumbs();
      document.querySelectorAll('#page-product-register .preg-input').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
        el.classList.remove('err','ok');
      });
      document.querySelectorAll('input[name="pregCond"], input[name="pregTrade"]').forEach(el => el.checked = false);
      if (descTA) descTA.value = '';
      if (descCnt) descCnt.textContent = '0';
      updateFeeCalc();
      showToast('상품이 등록되었습니다! 🎉', 'success');
      if (typeof navigateTo === 'function') navigateTo('drops');
      if (typeof refreshProductsFromDB === 'function') refreshProductsFromDB();
    })
    .catch(err => {
      showToast(err.message || '상품 등록 중 오류가 발생했습니다.', 'error');
    })
    .finally(() => {
      btn.textContent = origText; btn.disabled = false; btn.dataset.busy = '';
    });
  }

  [document.getElementById('pregSubmitBtn'), document.getElementById('pregSubmitBtnB')].forEach(btn => {
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => submitPreg(btn));
  });

  /* ── 입력 시 에러 제거 ── */
  ['pregCat','pregBrand','pregName','pregPrice'].forEach(id => {
    const el = document.getElementById(id);
    const err = document.getElementById(`${id}Err`);
    if (el) el.addEventListener('input', () => {
      el.classList.remove('err');
      if (err) err.classList.remove('show');
    });
    if (el && el.tagName === 'SELECT') el.addEventListener('change', () => {
      el.classList.remove('err');
      if (err) err.classList.remove('show');
    });
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
  initProductRegisterPage();

  document.addEventListener('click', (e) => {
    const logoutTarget = e.target.closest('#logoutBtnPc, #logoutBtnM, [data-logout]');

    if (!logoutTarget) return;

    e.preventDefault();
    e.stopPropagation();

    logout();
  });

  applyLoginState();
});

/* ═══════════════════════════════════════════════════════════════
   Work 4 — RG.forms.saveProfileSettings
   마이페이지 프로필 설정을 편집 모드 진입 후 저장하는 방식으로 변경
   - 기본 상태: 모든 입력창 readonly (읽기 전용)
   - "프로필 편집" 버튼 클릭 → 편집 모드 (입력 활성화)
   - 변경사항 있을 때만 저장 버튼 활성화
   - 저장 or 취소 → 읽기 모드 복귀
   - 미저장 상태로 페이지 이탈 시 confirm
═══════════════════════════════════════════════════════════════ */
window.RG = window.RG || {};
window.RG.forms = window.RG.forms || {};

(function initProfileSettings() {
  /* 마이페이지 프로필 패널이 없으면 패스 */
  const panel = document.getElementById('mp-panel-profile');
  if (!panel) return;

  /* ── 폼 입력 요소 수집 (체크박스·hidden 제외) ── */
  const inputs = Array.from(
    panel.querySelectorAll('input:not([type=checkbox]):not([type=hidden]), textarea, select')
  );

  let _origValues = {};
  let _isDirty    = false;
  let _isEditing  = false;

  /* ── 초기값 스냅샷 ── */
  function _snapshot() {
    inputs.forEach((el, i) => { _origValues[i] = el.value; });
  }

  /* ── dirty 체크 ── */
  function _checkDirty() {
    _isDirty = inputs.some((el, i) => el.value !== _origValues[i]);
    _updateSaveBtnState();
  }

  /* ── 저장 버튼 활성/비활성 ── */
  function _updateSaveBtnState() {
    const btn = document.getElementById('rgProfileSaveBtn');
    if (!btn) return;
    btn.disabled = !_isDirty;
    btn.classList.toggle('rg-settings-save-btn--active', _isDirty);
  }

  /* ── 편집 모드 토글 ── */
  function _setEditMode(editing) {
    _isEditing = editing;

    inputs.forEach(el => {
      el.readOnly = !editing;
      el.classList.toggle('rg-profile-readonly', !editing);
    });

    const editBtn = document.getElementById('rgProfileEditBtn');
    const saveBtn = document.getElementById('rgProfileSaveBtn');
    const cancelBtn = document.getElementById('rgProfileCancelBtn');

    if (editBtn) editBtn.textContent = editing ? '취소' : '프로필 편집';
    if (saveBtn)  saveBtn.style.display  = editing ? 'inline-flex' : 'none';
    if (cancelBtn) cancelBtn.style.display = editing ? 'inline-flex' : 'none';

    if (!editing) {
      /* 취소 시 원래 값 복원 */
      inputs.forEach((el, i) => { el.value = _origValues[i]; });
      _isDirty = false;
      _updateSaveBtnState();
    }
  }

  /* ── 저장 실행 ── */
  window.RG.forms.saveProfileSettings = function () {
    if (!_isDirty) return;

    const data = {};
    inputs.forEach(el => { if (el.id) data[el.id] = el.value; });

    // TODO: DB - profiles 테이블 UPDATE (닉네임, 소개글, SNS 링크 등)
    window.RG.user = Object.assign(window.RG.user || {}, data);

    _snapshot();
    _isDirty = false;
    _setEditMode(false);

    showToast('저장되었습니다.', 'success');
  };

  /* ── 버튼 주입 ── */
  function _injectButtons() {
    const titleEl = panel.querySelector('.mp-sec-title');
    if (!titleEl || document.getElementById('rgProfileEditBtn')) return;

    /* 버튼 행 wrapper */
    const row = document.createElement('div');
    row.className  = 'rg-profile-btn-row';
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:16px;';

    /* 편집/취소 버튼 */
    const editBtn = document.createElement('button');
    editBtn.id        = 'rgProfileEditBtn';
    editBtn.className = 'btn btn--outline-brand btn--sm rg-settings-save-btn';
    editBtn.textContent = '프로필 편집';
    editBtn.addEventListener('click', () => _setEditMode(!_isEditing));

    /* 저장 버튼 */
    const saveBtn = document.createElement('button');
    saveBtn.id        = 'rgProfileSaveBtn';
    saveBtn.className = 'btn btn--p btn--sm rg-settings-save-btn rg-settings-save-btn--active';
    saveBtn.textContent = '저장하기';
    saveBtn.style.display = 'none';
    saveBtn.disabled  = true;
    saveBtn.addEventListener('click', window.RG.forms.saveProfileSettings);

    /* 기존 mpSaveBtn 숨기기 (app.js 핸들러 유지, 시각만 숨김) */
    const legacySave = document.getElementById('mpSaveBtn');
    if (legacySave) legacySave.style.display = 'none';

    row.appendChild(editBtn);
    row.appendChild(saveBtn);
    titleEl.parentNode.insertBefore(row, titleEl.nextSibling);
  }

  /* ── 초기화 실행 ── */
  _injectButtons();
  _snapshot();
  _setEditMode(false);  /* 기본 = 읽기 모드 */

  /* 변경 감지 */
  inputs.forEach(el => {
    el.addEventListener('input',  _checkDirty);
    el.addEventListener('change', _checkDirty);
  });

  /* ── 페이지 이탈 경고 ── */
  /* 브라우저 탭 닫기 / 새로고침 */
  window.addEventListener('beforeunload', e => {
    if (_isDirty && _isEditing) {
      e.preventDefault();
      e.returnValue = '저장하지 않은 변경사항이 있습니다.';
    }
  });

  /* SPA 내비게이션: 다른 mp 탭 이동 시 */
  document.querySelectorAll('[data-mp-tab]').forEach(link => {
    link.addEventListener('click', e => {
      if (_isDirty && _isEditing) {
        if (!confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) {
          e.stopImmediatePropagation();
        } else {
          _isDirty = false;
          _setEditMode(false);
        }
      }
    }, true); /* capture=true → 기존 리스너보다 먼저 실행 */
  });

  /* SPA 내비게이션: 하단 바 / 사이드 링크 이동 시 */
  document.querySelectorAll('[data-goto]').forEach(link => {
    link.addEventListener('click', () => {
      if (_isDirty && _isEditing) {
        if (!confirm('저장하지 않은 변경사항이 있습니다. 나가시겠습니까?')) return;
        _isDirty = false;
        _setEditMode(false);
      }
    });
  });
})();
