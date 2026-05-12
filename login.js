/* ═══════════════════════════════════════════
   login.js  —  Validação + UI + Canvas BG
   ═══════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────
   Canvas Background — partículas flutuantes
────────────────────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById('bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const PARTICLE_COUNT = 55;
  const COLOR = '79,142,247';

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset(true);
  }

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
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  resize();
  init();
  loop();
})();


/* ──────────────────────────────────────────
   Toggle visibilidade da senha
────────────────────────────────────────── */
(function initTogglePw() {
  const btn     = document.getElementById('togglePw');
  const input   = document.getElementById('password');
  const eyeShow = document.getElementById('eyeShow');
  const eyeHide = document.getElementById('eyeHide');

  if (!btn || !input) return;

  btn.addEventListener('click', function () {
    const isHidden = input.type === 'password';
    input.type     = isHidden ? 'text' : 'password';
    eyeShow.hidden = isHidden;
    eyeHide.hidden = !isHidden;
    btn.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
    input.focus();
  });
})();


/* ──────────────────────────────────────────
   Validação do formulário
────────────────────────────────────────── */
(function initForm() {
  const form        = document.getElementById('loginForm');
  const emailInput  = document.getElementById('email');
  const passInput   = document.getElementById('password');
  const btnSubmit   = document.getElementById('btnSubmit');
  const globalError = document.getElementById('globalError');
  const globalMsg   = document.getElementById('globalErrorMsg');

  if (!form) return;

  /* ── Helpers ── */
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }

  function setFieldError(inputEl, errId, show) {
    const errEl = document.getElementById(errId);
    const fieldEl = inputEl.closest('.field');
    if (show) {
      inputEl.classList.add('invalid');
      if (errEl) errEl.classList.add('visible');
    } else {
      inputEl.classList.remove('invalid');
      if (errEl) errEl.classList.remove('visible');
    }
  }

  function showGlobalError(msg) {
    globalMsg.textContent = msg;
    globalError.hidden = false;
    // Força o reflow para que a animação de shake re-execute
    globalError.classList.remove('alert-error');
    void globalError.offsetWidth;
    globalError.classList.add('alert-error');
  }

  function hideGlobalError() {
    globalError.hidden = true;
  }

  /* ── Limpeza de erros ao digitar ── */
  emailInput.addEventListener('input', function () {
    setFieldError(emailInput, 'err-email', false);
    hideGlobalError();
  });

  passInput.addEventListener('input', function () {
    setFieldError(passInput, 'err-password', false);
    hideGlobalError();
  });

  /* ── Submit ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const pass  = passInput.value;
    let valid   = true;

    /* Validar e-mail */
    if (!isValidEmail(email)) {
      setFieldError(emailInput, 'err-email', true);
      valid = false;
    }

    /* Validar senha */
    if (pass.length < 6) {
      setFieldError(passInput, 'err-password', true);
      valid = false;
    }

    if (!valid) return;

    /* Loading */
    btnSubmit.classList.add('loading');
    btnSubmit.disabled = true;
    hideGlobalError();

    try {
      /* ── Envio via fetch (AJAX) ──
         O servidor (auth.php) deve retornar JSON:
           { success: true }               → redirecionar
           { success: false, message: '' } → mostrar erro
      */
      const res  = await fetch(form.action, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          email:    email,
          password: pass,
          remember: document.getElementById('remember').checked ? '1' : '0',
        }),
      });

      const data = await res.json();

      if (data.success) {
        /* Redirecionar para o dashboard */
        window.location.href = data.redirect || 'dashboard.php';
      } else {
        showGlobalError(data.message || 'E-mail ou senha incorretos.');
      }

    } catch (err) {
      showGlobalError('Falha na conexão. Tente novamente.');
    } finally {
      btnSubmit.classList.remove('loading');
      btnSubmit.disabled = false;
    }
  });
})();
