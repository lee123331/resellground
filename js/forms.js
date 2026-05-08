'use strict';

console.log('forms.js 최신 파일 로드됨');

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

fetch('http://localhost:8787/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password: pw
  })
})
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '로그인에 실패했습니다.');
    return data;
  })
  .then(data => {
    localStorage.setItem('rg_token', data.token);
    localStorage.setItem('rg_user', JSON.stringify(data.user));

    S.loggedIn = true;
    closeModal('login');
    showToast('로그인되었습니다! 환영합니다. 🎉', 'success');

    const lBtn = document.getElementById('loginBtn');
    lBtn.textContent = '마이페이지';
    lBtn.onclick = () => navigateTo('mypage');
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
console.log('회원가입 API 호출 시작', { nick, email });
fetch('http://localhost:8787/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nickname: nick,
    email,
    password: pw,
    phone: document.getElementById('signupTel')?.value.trim() || null
  })
})
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '회원가입에 실패했습니다.');
    return data;
  })
  .then(() => {
    resetForm(document.getElementById('signup-pane'));
    showToast('회원가입이 완료되었습니다! 로그인해주세요 🎉', 'success');

    document.querySelector('[data-tab="login-pane"]')?.click();
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
   ADD DROP FORM
═══════════════════════════════════════════════════ */
function initDropForm() {
  initCharCounter('dropDesc', 'dropDescCount', 1000);
  initFileUpload('uploadArea', 'fileInput', 'imagePreview');
  initPriceFormat('dropPrice', 'dropPriceDisplay');
  initDraftSave('dropFormInner', 'drop');
  initCloseGuard('addDrop', 'dropFormInner', 'drop');

  // 실시간 검증
  initRealTimeValidation('dropName','dropNameErr', V.required, '상품명을 입력해주세요.');

  // 가격 실시간
  const priceInp = document.getElementById('dropPrice');
  if (priceInp) {
    priceInp.addEventListener('input', () => {
      if (priceInp.value) setOk('dropPrice','dropPriceErr');
      else clearField('dropPrice','dropPriceErr');
    });
  }

  document.getElementById('dropSubmitBtn').addEventListener('click', () => {
    const name = document.getElementById('dropName').value.trim();
    const price = document.getElementById('dropPrice').value;
    const cat = document.getElementById('dropCat').value;
    const cond = document.getElementById('dropCond').value;
    let ok = true;

    if (!V.required(name)) { setErr('dropName','dropNameErr','상품명을 입력해주세요.'); ok=false; }
    else setOk('dropName','dropNameErr');
    if (!price) { setErr('dropPrice','dropPriceErr','가격을 입력해주세요.'); ok=false; }
    else setOk('dropPrice','dropPriceErr');
    if (!cat) { setErr('dropCat','dropCatErr','카테고리를 선택해주세요.'); ok=false; }
    else setOk('dropCat','dropCatErr');
    if (!cond) { setErr('dropCond','dropCondErr','상태를 선택해주세요.'); ok=false; }
    else setOk('dropCond','dropCondErr');
    if (!ok) return;

    const btn = document.getElementById('dropSubmitBtn');
    btnLoad(btn, '등록 중...');
    setTimeout(() => {
      btnReset(btn);
      clearDraft('drop');
      resetForm(document.getElementById('dropFormInner'));
      closeModal('addDrop');
      showToast('상품이 성공적으로 등록되었습니다! 🎉', 'success');
    }, 1200);
  });
}

/* ═══════════════════════════════════════════════════
   WRITE POST FORM
═══════════════════════════════════════════════════ */
function initPostForm() {
  const draftBtn = document.getElementById('postDraftBtn');
if (draftBtn) {
  draftBtn.addEventListener('click', () => {
    const form = document.getElementById('postFormInner');
    saveDraft(form, 'post');
    showToast('게시글이 임시저장되었습니다.', 'success');
  });
}
  initCharCounter('postContent', 'postCount', 5000);
  initDraftSave('postFormInner', 'post');
  initCloseGuard('writePost', 'postFormInner', 'post');

  initRealTimeValidation('postTitle','postTitleErr', V.required, '제목을 입력해주세요.');

  document.getElementById('postSubmitBtn').addEventListener('click', () => {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    let ok = true;

    if (!V.required(title)) { setErr('postTitle','postTitleErr','제목을 입력해주세요.'); ok=false; }
    else setOk('postTitle','postTitleErr');
if (!content) {
  const ta = document.getElementById('postContent');
  ta.classList.add('err');

  showToast('내용을 입력해주세요.', 'error');
  ok = false;
} else {
  document.getElementById('postContent').classList.remove('err');
}

if (!ok) return;

const btn = document.getElementById('postSubmitBtn');
    btnLoad(btn, '등록 중...');
    setTimeout(() => {
      btnReset(btn);
      clearDraft('post');
      resetForm(document.getElementById('postFormInner'));
      closeModal('writePost');
      showToast('게시글이 등록되었습니다! 🎉', 'success');
    }, 1000);
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
});
