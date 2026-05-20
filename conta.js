// conta.js

document.addEventListener('DOMContentLoaded', () => {

  // --- TOAST ---
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
  }

  // --- INICIAIS DO AVATAR ---
  function getInitials(name) {
    return name.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  function updateAvatars(nome) {
    const initials = getInitials(nome || 'U');
    document.getElementById('avatarBig').textContent = initials;
    document.getElementById('sidebarAvatar').textContent = initials;
  }

  // --- SALVAR INFORMAÇÕES PESSOAIS ---
  document.getElementById('btnSalvarInfo').addEventListener('click', () => {
    const nome  = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();

    if (!nome) return showToast('Nome não pode ser vazio.', 'error');
    if (!email || !email.includes('@')) return showToast('E-mail inválido.', 'error');

    // Atualiza hero e sidebar
    document.getElementById('heroNome').textContent = nome;
    document.getElementById('heroEmail').textContent = email;
    document.getElementById('sidebarNome').textContent = nome.split(' ')[0];
    updateAvatars(nome);

    showToast('✓ Informações salvas com sucesso!', 'success');
  });

  document.getElementById('btnCancelarInfo').addEventListener('click', () => {
    document.getElementById('inputNome').value  = document.getElementById('heroNome').textContent;
    document.getElementById('inputEmail').value = document.getElementById('heroEmail').textContent;
    showToast('Alterações descartadas.', 'success');
  });

  // --- MOSTRAR/OCULTAR SENHA ---
  document.querySelectorAll('.eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  // --- FORÇA DA SENHA ---
  const novaSenhaInput = document.getElementById('inputNovaSenha');
  const strengthFill   = document.getElementById('strengthFill');
  const strengthLabel  = document.getElementById('strengthLabel');

  const rules = {
    'rule-len':    s => s.length >= 8,
    'rule-upper':  s => /[A-Z]/.test(s),
    'rule-num':    s => /[0-9]/.test(s),
    'rule-symbol': s => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s),
  };

  novaSenhaInput.addEventListener('input', () => {
    const s = novaSenhaInput.value;
    let score = 0;

    Object.entries(rules).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (fn(s)) { el.classList.add('valid'); score++; }
      else        { el.classList.remove('valid'); }
    });

    const levels = ['', 'fraca', 'media', 'boa', 'forte'];
    const labels = ['', 'Fraca', 'Média', 'Boa', 'Forte'];
    strengthFill.className = `strength-fill ${levels[score]}`;
    strengthLabel.textContent = s.length ? labels[score] : '';

    checkMatch();
  });

  // --- CONFIRMAR SENHA ---
  const confirmarInput = document.getElementById('inputConfirmarSenha');
  const matchHint      = document.getElementById('matchHint');

  function checkMatch() {
    const a = novaSenhaInput.value;
    const b = confirmarInput.value;
    if (!b) { matchHint.textContent = ''; matchHint.className = 'match-hint'; return; }
    if (a === b) {
      matchHint.textContent = '✓ Senhas coincidem';
      matchHint.className = 'match-hint ok';
    } else {
      matchHint.textContent = '✗ Senhas não coincidem';
      matchHint.className = 'match-hint error';
    }
  }

  confirmarInput.addEventListener('input', checkMatch);

  // --- SALVAR SENHA ---
  document.getElementById('btnSalvarSenha').addEventListener('click', () => {
    const atual     = document.getElementById('inputSenhaAtual').value;
    const nova      = novaSenhaInput.value;
    const confirmar = confirmarInput.value;

    if (!atual)    return showToast('Informe sua senha atual.', 'error');
    if (!nova)     return showToast('Informe a nova senha.', 'error');
    if (nova !== confirmar) return showToast('As senhas não coincidem.', 'error');

    const allValid = Object.values(rules).every(fn => fn(nova));
    if (!allValid) return showToast('A nova senha não atende aos requisitos.', 'error');

    // Limpa campos
    document.getElementById('inputSenhaAtual').value  = '';
    novaSenhaInput.value    = '';
    confirmarInput.value    = '';
    strengthFill.className  = 'strength-fill';
    strengthLabel.textContent = '';
    matchHint.textContent   = '';
    matchHint.className     = 'match-hint';
    document.querySelectorAll('.password-rules li').forEach(li => li.classList.remove('valid'));

    showToast('✓ Senha alterada com sucesso!', 'success');
  });

  document.getElementById('btnCancelarSenha').addEventListener('click', () => {
    ['inputSenhaAtual', 'inputNovaSenha', 'inputConfirmarSenha'].forEach(id => {
      document.getElementById(id).value = '';
    });
    strengthFill.className = 'strength-fill';
    strengthLabel.textContent = '';
    matchHint.textContent = '';
    matchHint.className = 'match-hint';
    document.querySelectorAll('.password-rules li').forEach(li => li.classList.remove('valid'));
  });

  // --- LOGOUT ---
  function handleLogout() {
    window.location.href = 'login.html';
  }

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('logoutBtn2').addEventListener('click', handleLogout);

});
