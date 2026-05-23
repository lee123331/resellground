HEAD
'use strict';

/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   FORMS.JS ???�전????검�?& UX ?�스??
   - ?�시�?validation
   - 비�?번호 ?��? / 강도 측정
   - ?�일 ?�로??(미리보기, ?�한, ??��)
   - 가�??�맷 (??콤마)
   - 글?�수 카운??
   - 중복 ?�릭 방�?
   - ??초기??
   - ?�시?�??(localStorage)
   - XSS 방�? (textContent)
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/

/* ?�?�?� VALIDATORS ?�?�?� */
const V = {
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  tel: v => /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/.test(v.replace(/\s/g,'')),
  pw: v => v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v),
  required: v => v.trim().length > 0,
};

/* ?�?�?� FIELD ERROR HELPERS ?�?�?� */
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

/* ?�?�?� BUTTON LOADING STATE ?�?�?� */
function btnLoad(btn, text='처리 �?..') {
  btn.disabled = true;
  btn.dataset.origText = btn.textContent;
  btn.classList.add('btn--load');
  btn.textContent = text;
}
function btnReset(btn) {
  btn.disabled = false;
  btn.classList.remove('btn--load');
  btn.textContent = btn.dataset.origText || '?�출';
}

/* ?�?�?� FORM RESET ?�?�?� */
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

/* ?�?�?� XSS-SAFE TEXT INSERT ?�?�?� */
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
      loginBtn.textContent = '마이?�이지';
    }

    if (profileBtn) {
      profileBtn.setAttribute('aria-label', '마이?�이지');
    }
  } else {
    if (loginBtn) {
      loginBtn.style.display = '';
      loginBtn.textContent = '로그??;
    }

    if (profileBtn) {
      profileBtn.setAttribute('aria-label', '로그??);
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

  showToast('로그?�웃?�었?�니??', 'success');
  navigateTo('home');
}
/* ?�?�?� CHAR COUNTER ?�?�?� */
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

/* ?�?�?� PASSWORD TOGGLE ?�?�?� */
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
    btn.setAttribute('aria-label', isText ? '비�?번호 ?�기�? : '비�?번호 보기');
    inp.focus();
  });
}

/* ?�?�?� PASSWORD STRENGTH ?�?�?� */
function calcPwStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: 'weak',   label: '?�함',   pct: 33 };
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

/* ?�?�?� REAL-TIME VALIDATION ?�?�?� */
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

/* ?�?�?� PHONE FORMAT ?�?�?� */
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
    // 커서 ?�치 복원
    try { inp.setSelectionRange(pos, pos); } catch(e) {}
  });
}

/* ?�?�?� PRICE FORMAT ?�?�?� */
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
    inp.value = raw; // input?� ?�자�?
    if (disp) safeText(disp, raw ? `??${Number(raw).toLocaleString('ko-KR')}` : '');
  });
}

/* ?�?�?� FILE UPLOAD ?�?�?� */
const FILE_CONFIG = { maxCount: 10, maxSizeMB: 5, accepts: ['image/jpeg','image/png','image/webp'] };

function initFileUpload(areaId, inputId, previewId) {
  const area = document.getElementById(areaId);
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!area || !input || !preview) return;

  let files = [];

  // ?�릭?�로 ?�기
  area.addEventListener('click', () => input.click());
  area.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') input.click(); });

  // ?�래그앤?�롭
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
        errors.push(`${f.name}: JPG/PNG/WebP�??�로??가?�합?�다.`); return;
      }
      if (f.size > FILE_CONFIG.maxSizeMB * 1024 * 1024) {
        errors.push(`${f.name}: ?�일 ?�기가 ${FILE_CONFIG.maxSizeMB}MB�?초과?�니??`); return;
      }
      if (files.length >= FILE_CONFIG.maxCount) {
        errors.push(`최�? ${FILE_CONFIG.maxCount}?�까지 ?�로??가?�합?�다.`); return;
      }
      files.push(f);
    });
    if (errors.length) showToast(errors[0], 'error');
    renderPreviews();
    updateAreaText();
    // input 초기??(같�? ?�일 ?�선??가?�하?�록)
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
        safeText(name, f.name.length > 20 ? f.name.slice(0,20)+'?? : f.name);
        const size = document.createElement('span');
        size.className = 'upload-preview-size';
        safeText(size, `${(f.size/1024/1024).toFixed(1)}MB`);
        const delBtn = document.createElement('button');
        delBtn.className = 'upload-preview-del';
        delBtn.type = 'button';
        delBtn.setAttribute('aria-label', `${f.name} ??��`);
        delBtn.textContent = '??;
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
    if (countEl) safeText(countEl, `${files.length}/${FILE_CONFIG.maxCount}???�택??);
  }
}

function clearImagePreviews(formEl) {
  formEl.querySelectorAll('.upload-preview-item').forEach(el => el.remove());
}

/* ?�?�?� DRAFT SAVE (localStorage) ?�?�?� */
function initDraftSave(formId, key) {
  const form = document.getElementById(formId);
  if (!form) return;
  // 불러?�기
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
  // ?�동 ?�??
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

  countEl.textContent = `?�시?�??${hasDraft ? 1 : 0}`;
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
      showToast('?�시?�?�되?�습?�다.', 'success');
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
/* ?�?�?� CLOSE GUARD (?�기 ???�인) ?�?�?� */
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
      if (confirm('?�성 중인 ?�용???�어?? ?�시?�?�하�??�을까요?\n취소�??�르�??�용???��??�니??')) {
        saveDraft(form, draftKey);
        origClose();
      }
    } else {
      origClose();
    }
  });
}

/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   LOGIN FORM
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initLoginForm() {
  // 비�?번호 ?��?
  initPwToggle('loginPw', 'loginPwToggle');

  // ?�시�?검�?
  initRealTimeValidation('loginEmail','loginEmailErr', V.email, '?�바�??�메???�식???�력?�주?�요.');

  document.getElementById('doLoginBtn').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPw').value;
    let ok = true;

    clearField('loginEmail','loginEmailErr'); clearField('loginPw','loginPwErr');
    if (!V.email(email)) { setErr('loginEmail','loginEmailErr','?�바�??�메???�식???�력?�주?�요.'); ok=false; }
    if (!pw) { setErr('loginPw','loginPwErr','비�?번호�??�력?�주?�요.'); ok=false; }
    if (!ok) return;

   const btn = document.getElementById('doLoginBtn');
btnLoad(btn, '로그??�?..');

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
      throw new Error(data.message || '로그?�에 ?�패?�습?�다.');
    }

    return data;
  })
 .then(data => {
  localStorage.setItem('rg_token', data.token);
  localStorage.setItem('rg_user', JSON.stringify(data.user));

  applyLoginState();

  closeModal('login');
  showToast('로그?�되?�습?�다! ?�영?�니?? ?��', 'success');
})
  .catch(err => {
    showToast(err.message, 'error');
  })
  .finally(() => {
    btnReset(btn);
  });
  });
}

/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   SIGNUP FORM
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initSignupForm() {
  initPwToggle('signupPw', 'signupPwToggle');
  initPwToggle('signupPw2', 'signupPw2Toggle');
 
  initTelFormat('signupTel');

  // ?�시�?검�?
  initRealTimeValidation('signupNick','signupNickErr', V.required, '?�네?�을 ?�력?�주?�요.');
  initRealTimeValidation('signupEmail','signupEmailErr', V.email, '?�바�??�메???�식???�력?�주?�요.');

  // 비�?번호 강도 ?�시�?
  const pwInp = document.getElementById('signupPw');
  if (pwInp) {
    pwInp.addEventListener('input', () => {
      const v = pwInp.value;
      if (!v) { clearField('signupPw','signupPwErr'); return; }
      if (V.pw(v)) setOk('signupPw','signupPwErr');
      else setErr('signupPw','signupPwErr','?�문+?�자 ?�함 8???�상 ?�력?�주?�요.');
      // ?�인 비번???��?�?
      const pw2 = document.getElementById('signupPw2');
      if (pw2 && pw2.value) {
        if (pw2.value === v) setOk('signupPw2','signupPw2Err');
        else setErr('signupPw2','signupPw2Err','비�?번호가 ?�치?��? ?�습?�다.');
      }
    });
  }

  // 비번 ?�인 ?�시�?
  const pw2Inp = document.getElementById('signupPw2');
  if (pw2Inp) {
    pw2Inp.addEventListener('input', () => {
      const pw = document.getElementById('signupPw')?.value;
      if (!pw2Inp.value) { clearField('signupPw2','signupPw2Err'); return; }
      if (pw2Inp.value === pw) setOk('signupPw2','signupPw2Err');
      else setErr('signupPw2','signupPw2Err','비�?번호가 ?�치?��? ?�습?�다.');
    });
  }

  document.getElementById('doSignupBtn').addEventListener('click', () => {
    const nick = document.getElementById('signupNick').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pw = document.getElementById('signupPw').value;
    const pw2 = document.getElementById('signupPw2').value;
    const terms = document.getElementById('agreeTerms').checked;
    let ok = true;

    if (!V.required(nick)) { setErr('signupNick','signupNickErr','?�네?�을 ?�력?�주?�요.'); ok=false; }
    else setOk('signupNick','signupNickErr');
    if (!V.email(email)) { setErr('signupEmail','signupEmailErr','?�바�??�메?�을 ?�력?�주?�요.'); ok=false; }
    else setOk('signupEmail','signupEmailErr');
    if (!V.pw(pw)) { setErr('signupPw','signupPwErr','?�문+?�자 ?�함 8???�상 ?�력?�주?�요.'); ok=false; }
    else setOk('signupPw','signupPwErr');
    if (pw !== pw2) { setErr('signupPw2','signupPw2Err','비�?번호가 ?�치?��? ?�습?�다.'); ok=false; }
    else if (pw2) setOk('signupPw2','signupPw2Err');
    if (!terms) { showToast('?�용?��? ?�의가 ?�요?�니??', 'error'); ok=false; }
    if (!ok) return;

    const btn = document.getElementById('doSignupBtn');
    btnLoad(btn, '가??�?..');
    setTimeout(() => {
      btnReset(btn);
      resetForm(document.getElementById('signup-pane'));
      closeModal('login');
      showToast('?�원가?�이 ?�료?�었?�니?? ?�영?�요 ?��', 'success');
    }, 1500);
  });
}

/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   PREREG FORM
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initPreregForm() {
  initCharCounter('prIntro', 'introCount', 500);
  initTelFormat('prTel');
  initDraftSave('preregBody', 'prereg');
  initCloseGuard('prereg', 'preregBody', 'prereg');

  // ?�시�?검�?
  initRealTimeValidation('prName','prNameErr', V.required, '?�름???�력?�주?�요.');
  initRealTimeValidation('prEmail','prEmailErr', V.email, '?�바�??�메?�을 ?�력?�주?�요.');

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
    setErr('prName','prNameErr','?�름???�력?�주?�요.');
    ok = false;
    firstError ||= '?�름???�력?�주?�요.';
  } else {
    setOk('prName','prNameErr');
  }

  if (!V.email(email)) {
    setErr('prEmail','prEmailErr','?�바�??�메?�을 ?�력?�주?�요.');
    ok = false;
    firstError ||= '?�바�??�메?�을 ?�력?�주?�요.';
  } else {
    setOk('prEmail','prEmailErr');
  }

  if (!tel) {
    const telEl = document.getElementById('prTel');
    telEl.classList.add('err');
    ok = false;
    firstError ||= '?�락처�? ?�력?�주?�요.';
  } else {
    document.getElementById('prTel').classList.remove('err');
  }
  if (!instagram) {
  const instaEl = document.getElementById('prInstagram');
  instaEl.classList.add('err');
  ok = false;
  firstError ||= '?�스?�그램 ?�이?��? ?�력?�주?�요.';
} else {
  document.getElementById('prInstagram').classList.remove('err');
}

  if (!intro) {
    const introEl = document.getElementById('prIntro');
    introEl.classList.add('err');
    ok = false;
    firstError ||= '?�개글???�력?�주?�요.';
  } else {
    document.getElementById('prIntro').classList.remove('err');
  }

  if (!agree) {
    document.getElementById('preregAgreeErr').classList.add('show');
    ok = false;
    firstError ||= '개인?�보 ?�집 ?�의가 ?�요?�니??';
  } else {
    document.getElementById('preregAgreeErr').classList.remove('show');
  }

  if (!ok) {
    showToast(firstError, 'error');
    return;
  }

  const btn = document.getElementById('preregSubmitBtn');
  btnLoad(btn, '?�출 �?..');
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
/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   PRODUCT IMAGE UPLOADER ???�품 ?�록 ?��?지 ?�리�?
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
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
    el.alt = `?�품 ?��?지 ${i + 1}`;
    wrap.appendChild(el);

    const del = document.createElement('button');
    del.className = 'rg-thumb__del';
    del.type = 'button';
    del.textContent = '??;
    del.setAttribute('aria-label', `?��?지 ${i + 1} ??��`);

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
      badge.textContent = '?�??;
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
      <span>추�?</span>
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
        showToast(`?��?지??최�? ${MAX_IMAGES}?�까지 ?�록?????�어??`, 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('?��?지 ?�일�??�로?�할 ???�어??', 'error');
        return;
      }

      if (file.size > MAX_MB * 1024 * 1024) {
        showToast(`${file.name}?� ${MAX_MB}MB�?초과?�요.`, 'error');
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

  let tradeMethod = document.getElementById('dropTrade')?.value || '?�국 ?�전결제';

  if (checkedTrade.includes('?�국 ?�전결제') && checkedTrade.includes('근거�?직거??)) {
    tradeMethod = '?�국+직거??모두';
  } else if (checkedTrade.includes('근거�?직거??)) {
    tradeMethod = '근거�?직거??;
  } else if (checkedTrade.includes('?�국 ?�전결제')) {
    tradeMethod = '?�국 ?�전결제';
  }

  return {
    id: `product_${Date.now()}`,
    seller_email: user?.email || '',
    seller_name: user?.nickname || user?.email || '??,
    name: document.getElementById('dropName')?.value.trim() || '',
    brand: document.getElementById('dropBrand')?.value.trim() || '',
    category: document.getElementById('dropCat')?.value || '',
    price: getCleanPriceValue('dropPrice'),
    condition: document.getElementById('dropCond')?.value || '',
    trade_method: tradeMethod,
    description: document.getElementById('dropDesc')?.value.trim() || '',
    images: getProductImageMeta(),
    status: '?�매�?
  };
}
/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   ADD DROP FORM
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initDropForm() {
  initCharCounter('dropDesc', 'dropDescCount', 1000);
  initPriceFormat('dropPrice', 'dropPriceDisplay');
  initDraftSave('dropFormInner', 'drop');
  initCloseGuard('addDrop', 'dropFormInner', 'drop');

  if (window.RG && typeof window.RG.initProductImageUploader === 'function') {
    window.RG._productUploader = window.RG.initProductImageUploader();
  }

  initRealTimeValidation('dropName', 'dropNameErr', V.required, '?�품명을 ?�력?�주?�요.');

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
          ? `${net.toLocaleString('ko-KR')}??
          : '??;
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
        if (checked.includes('?�국 ?�전결제') && checked.includes('근거�?직거??)) {
          tradeEl.value = '?�국+직거??모두';
        } else if (checked.includes('근거�?직거??)) {
          tradeEl.value = '근거�?직거??;
        } else {
          tradeEl.value = '?�국 ?�전결제';
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
      setErr('dropName', 'dropNameErr', '?�품명을 ?�력?�주?�요.');
      ok = false;
    } else {
      setOk('dropName', 'dropNameErr');
    }

    if (!product.price) {
      setErr('dropPrice', 'dropPriceErr', '가격을 ?�력?�주?�요.');
      ok = false;
    } else {
      setOk('dropPrice', 'dropPriceErr');
    }

    if (!product.category) {
      setErr('dropCat', 'dropCatErr', '카테고리�??�택?�주?�요.');
      ok = false;
    } else {
      setOk('dropCat', 'dropCatErr');
    }

    if (!product.condition) {
      setErr('dropCond', 'dropCondErr', '?�태�??�택?�주?�요.');
      ok = false;
    } else {
      setOk('dropCond', 'dropCondErr');
    }

    if (!product.images.length) {
      showToast('?�품 ?��?지�?최소 1???�록?�주?�요.', 'error');
      ok = false;
    }

    if (!ok) return;

    btnLoad(submitBtn, '?�록 �?..');

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
        throw new Error(data.message || '?�품 DB ?�?�에 ?�패?�습?�다.');
      }

      clearDraft('drop');

      const formEl = document.getElementById('dropFormInner');
      if (formEl) resetForm(formEl);

      if (window.RG?._productUploader?.reset) {
        window.RG._productUploader.reset();
      }

      if (netEl) netEl.textContent = '??;

      closeModal('addDrop');

      if (typeof refreshProductsFromDB === 'function') {
        refreshProductsFromDB();
      }

      showToast('?�품??DB???�록?�었?�니?? ?��', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || '?�품 ?�록 �??�류가 발생?�습?�다.', 'error');
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
      reject(new Error('?��?지 ?�일�?첨�??????�어??'));
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

      img.onerror = () => reject(new Error('?��?지�?처리?��? 못했?�요.'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('?��?지�??��? 못했?�요.'));
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
    inserted = text.replace('{{selected}}', selected || '강조??문장');
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
        showToast('JPG, PNG, WebP ?��?지�??�로?�할 ???�어??', 'error');
        imageInput.value = '';
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
  showToast('?��?지??15MB ?�하 ?�일�?첨�??????�어??', 'error');
  imageInput.value = '';
  return;
}

compressPostImage(file)
  .then(({ dataUrl, outputKB }) => {
    insertIntoPostContent(`\n\n![${file.name}](${dataUrl})\n\n`);
    showToast(`?��?지가 ?�축?�어 추�??�었?�니?? (${outputKB}KB)`, 'success');
  })
  .catch(err => {
    showToast(err.message || '?��?지 첨�????�패?�어??', 'error');
  })
  .finally(() => {
    imageInput.value = '';
  });
    });
  }

  bindOnce(linkBtn, 'boundLink', () => {
    const url = prompt('?�입??링크 URL???�력?�주?�요.');
    if (!url) return;

    const text = prompt('링크???�시???�스?��? ?�력?�주?�요.') || '링크';
    insertIntoPostContent(`[${text}](${url})`);
  });

  bindOnce(boldBtn, 'boundBold', () => {
    insertIntoPostContent('**{{selected}}**', true);
  });

  bindOnce(priceBtn, 'boundPrice', () => {
    insertIntoPostContent(
      '\n\n[?�세 ?�보]\n?�품�? \n?�재 ?�세: ??n최근 변?? \n?�견: \n'
    );
  });

  bindOnce(emojiBtn, 'boundEmoji', () => {
    const emoji = prompt('?�을 ?�모지�??�력?�주?�요. ?? ?�� ?�� ?�� ?��') || '?��';
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
/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   WRITE POST FORM ??게시�??�록
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initPostForm() {
  const btn = document.getElementById('postSubmitBtn');
  const titleEl = document.getElementById('postTitle');
  const contentEl = document.getElementById('postContent');
  const boardEl = document.getElementById('postBoard');
  const formEl = document.getElementById('postFormInner');

  if (!btn || !titleEl || !contentEl) return;

  // 중복 ?�벤??방�?
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
      showToast('?�목�??�용???�력?�주?�요.', 'error');
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
      em: '?��',
      author: user?.nickname || user?.email || '??,
      authorTier: '',
      time: '방금 ??,
      badge: board || 'RESELL TALK',
      tags: selectedTags,
      title,
      content,
      preview: typeof getPostPreview === 'function'
  ? getPostPreview({ content })
  : (content.length > 90 ? content.slice(0, 90) + '?? : content),
      likes: 0,
      comments: 0,
      views: 0,

      // DB ?�동 ???�용???�비 ?�드
      dbPending: true
    };

    const submitBtn = document.getElementById('postSubmitBtn');
    btnLoad(submitBtn, '?�록 �?..');

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
      showToast('게시글???�록?�었?�니?? ?��', 'success');

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
      throw new Error(data.message || 'DB ?�?�에 ?�패?�습?�다.');
    }

    return data;
  })
  .then(() => {
    console.log('게시글 DB ?�???�료');
  })
  .catch(err => {
    console.error(err);
    showToast('?�면?�는 ?�록?��?�?DB ?�?�에 ?�패?�어??', 'warn');
  });
    }, 600);
  });
}
/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   SUPPORT / MYPAGE
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
function initSupportForm() {
  const btn = document.getElementById('supportBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btnLoad(btn, '?�송 �?..');
    setTimeout(() => { btnReset(btn); showToast('문의가 ?�수?�었?�니?? 빠르�??��??�리겠습?�다.', 'success'); }, 1000);
  });
}

function initMypageForm() {
  const btn = document.getElementById('mpSaveBtn');
  if (!btn) return;
  initTelFormat('mpTel');
  initCharCounter('mpBio', 'mpBioCount', 200);
  btn.addEventListener('click', () => {
    btnLoad(btn, '?�??�?..');
    setTimeout(() => { btnReset(btn); showToast('?�로?�이 ?�?�되?�습?�다.', 'success'); }, 800);
  });
}

/* ?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??
   BOOT ???�체 초기??
?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═?�═??*/
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
'38cb74f (update product ui work)'
