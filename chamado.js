/* ═══════════════════════════════════════════
   chamado.js  —  Validação + Dropzone + Canvas
   ═══════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   Canvas Background (igual ao login)
────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const COUNT = 55;
  const COLOR = '79,142,247';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() { this.reset(true); }

  Particle.prototype.reset = function (initial) {
    this.x  = Math.random() * W;
    this.y  = initial ? Math.random() * H : H + 10;
    this.r  = Math.random() * 1.4 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.25;
    this.vy = -(Math.random() * 0.4 + 0.1);
    this.a  = Math.random() * 0.35 + 0.05;
  };

  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10) this.reset(false);
  };

  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLOR},${this.a})`;
    ctx.fill();
  };

  function init() {
    particles = [];
    for (let i = 0; i < COUNT; i++) particles.push(new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init(); loop();
})();


/* ──────────────────────────────────────────
   Dropzone — drag & drop + click
────────────────────────────────────────── */
(function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('anexo');
  const content   = document.getElementById('dropzoneContent');
  if (!dropzone || !fileInput) return;

  const MAX_MB = 10;

  function showFile(file) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    content.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <p class="file-name">${escapeHtml(file.name)}</p>
      <small>${sizeMB} MB — clique para trocar</small>
    `;
    content.classList.add('has-file');
  }

  function resetDropzone() {
    content.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p><strong>Clique ou arraste</strong> um arquivo aqui</p>
      <small>PNG, JPG, PDF, TXT, LOG, ZIP</small>
    `;
    content.classList.remove('has-file');
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return resetDropzone();
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`O arquivo excede ${MAX_MB} MB. Escolha um menor.`);
      this.value = '';
      return resetDropzone();
    }
    showFile(file);
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('over');
  });

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`O arquivo excede ${MAX_MB} MB.`);
      return;
    }
    // Transferir para o input
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    showFile(file);
  });
})();


/* ──────────────────────────────────────────
   Contador de caracteres do textarea
────────────────────────────────────────── */
(function initCharCount() {
  const textarea  = document.getElementById('descricao');
  const charCount = document.getElementById('charCount');
  if (!textarea || !charCount) return;

  textarea.addEventListener('input', function () {
    const len = this.value.length;
    charCount.textContent = `${len} / 2000`;
    charCount.style.color = len > 1800 ? 'var(--c-alto)' : 'var(--muted)';
  });
})();


/* ──────────────────────────────────────────
   Máscara de telefone
────────────────────────────────────────── */
(function initPhoneMask() {
  const tel = document.getElementById('telefone');
  if (!tel) return;

  tel.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    this.value = v;
  });
})();


/* ──────────────────────────────────────────
   Validação e submit
────────────────────────────────────────── */
(function initForm() {
  const form         = document.getElementById('chamadoForm');
  const btnSubmit    = document.getElementById('btnSubmit');
  const successAlert = document.getElementById('successAlert');
  const errorAlert   = document.getElementById('errorAlert');
  const errorMsg     = document.getElementById('errorMsg');
  if (!form) return;

  /* ── Helpers ── */
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  function setError(inputEl, errId, show) {
    const errEl = document.getElementById(errId);
    if (show) {
      inputEl.classList.add('invalid');
      if (errEl) errEl.classList.add('visible');
    } else {
      inputEl.classList.remove('invalid');
      if (errEl) errEl.classList.remove('visible');
    }
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorAlert.hidden = false;
    successAlert.hidden = true;
    errorAlert.classList.remove('alert-error');
    void errorAlert.offsetWidth;
    errorAlert.classList.add('alert-error');
  }

  function hideAlerts() {
    errorAlert.hidden = true;
    successAlert.hidden = true;
  }

  /* ── Limpar erros ao digitar ── */
  ['nome','email','empresa','servico','titulo','descricao'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => setError(el, `err-${id}`, false));
    el.addEventListener('change', () => setError(el, `err-${id}`, false));
  });

  /* ── Submit ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlerts();

    const nome      = document.getElementById('nome');
    const email     = document.getElementById('email');
    const empresa   = document.getElementById('empresa');
    const servico   = document.getElementById('servico');
    const titulo    = document.getElementById('titulo');
    const descricao = document.getElementById('descricao');
    const priorEl   = document.querySelector('input[name="prioridade"]:checked');

    let valid = true;

    if (!nome.value.trim() || nome.value.trim().length < 3) {
      setError(nome, 'err-nome', true); valid = false;
    }
    if (!isValidEmail(email.value)) {
      setError(email, 'err-email', true); valid = false;
    }
    if (!empresa.value.trim()) {
      setError(empresa, 'err-empresa', true); valid = false;
    }
    if (!servico.value) {
      setError(servico, 'err-servico', true); valid = false;
    }
    if (!priorEl) {
      document.getElementById('err-prioridade').classList.add('visible'); valid = false;
    } else {
      document.getElementById('err-prioridade').classList.remove('visible');
    }
    if (!titulo.value.trim()) {
      setError(titulo, 'err-titulo', true); valid = false;
    }
    if (!descricao.value.trim() || descricao.value.trim().length < 20) {
      setError(descricao, 'err-descricao', true); valid = false;
    }

    if (!valid) return;

    /* Loading */
    btnSubmit.classList.add('loading');
    btnSubmit.disabled = true;

    try {
      const formData = new FormData(form);

      const res  = await fetch(form.action, { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        successAlert.hidden = false;
        form.reset();
        // Resetar dropzone
        document.getElementById('dropzoneContent').innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p><strong>Clique ou arraste</strong> um arquivo aqui</p>
          <small>PNG, JPG, PDF, TXT, LOG, ZIP</small>
        `;
        document.getElementById('dropzoneContent').classList.remove('has-file');
        document.getElementById('charCount').textContent = '0 / 2000';
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        showError(data.message || 'Erro ao abrir chamado. Tente novamente.');
      }

    } catch (err) {
      showError('Falha na conexão. Verifique sua internet e tente novamente.');
    } finally {
      btnSubmit.classList.remove('loading');
      btnSubmit.disabled = false;
    }
  });
})();
