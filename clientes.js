/* =============================================
   CLIENTES.JS — AMT Cloud | Painel de Serviços
   ============================================= */

/* ---------- CANVAS BACKGROUND (igual dashboard.js) ---------- */
(function initCanvas() {
  const canvas = document.getElementById('bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((W * H) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.4,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        a: Math.random() * 0.5 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,194,255,${p.a})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(); });
})();

/* ---------- DADOS MOCKADOS ---------- */
let clientes = [
  {
    id: 1,
    nome: 'Empresa Alpha Ltda.',
    empresa: 'Alpha Sistemas',
    email: 'ti@alpha.com.br',
    login: 'alpha.admin',
    senha: 'Alpha@2025!',
    token: gerarToken(),
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'Beta Soluções S.A.',
    empresa: 'Beta Soluções',
    email: 'suporte@betasol.com',
    login: 'beta.suporte',
    senha: 'Bt$3cre2t',
    token: gerarToken(),
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Gama Tecnologia',
    empresa: 'Gama Tech',
    email: 'infra@gamatech.net',
    login: 'gama.infra',
    senha: 'GmTech#001',
    token: gerarToken(),
    status: 'inativo'
  }
];

let nextId = 4;
let deleteTarget = null; // id do cliente a deletar

/* ---------- UTILITÁRIOS ---------- */
function gerarToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'AMT-';
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) token += '-';
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function toast(msg, tipo = 'success') {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = `<span>${tipo === 'success' ? '✅' : '❌'}</span> ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function mascararSenha(s) {
  return '•'.repeat(Math.min(s.length, 10));
}

/* ---------- RENDERIZAÇÃO ---------- */
function render(lista) {
  const tbody = document.getElementById('clientesBody');
  const empty = document.getElementById('emptyState');
  const counter = document.getElementById('totalClientes');

  counter.textContent = `${lista.length} cliente${lista.length !== 1 ? 's' : ''}`;

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><span class="id-badge">#${String(c.id).padStart(3, '0')}</span></td>
      <td>
        <div class="client-info">
          <strong>${escHtml(c.nome)}</strong>
          <small>${escHtml(c.empresa)}</small>
        </div>
      </td>
      <td><span class="mono">${escHtml(c.login)}</span></td>
      <td>
        <div class="pass-wrap">
          <span class="pass-mask" id="pass-${c.id}">${mascararSenha(c.senha)}</span>
          <button class="btn-eye" onclick="toggleSenha(${c.id})" title="Mostrar/ocultar senha">👁</button>
        </div>
      </td>
      <td>
        <div class="token-wrap">
          <span class="token-value" title="${escHtml(c.token)}" id="token-val-${c.id}">${escHtml(c.token)}</span>
          <button class="btn-regen" onclick="regenarToken(${c.id})">🔄 Gerar novo token AMT</button>
        </div>
      </td>
      <td><span class="badge ${c.status}">${c.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
      <td>
        <div class="actions">
          <button class="btn-action" onclick="abrirEdicao(${c.id})">✏️ Editar</button>
          <button class="btn-action del" onclick="confirmarDelete(${c.id})">🗑️ Remover</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Mapa de visibilidade de senhas */
const senhasVisiveis = {};

window.toggleSenha = function(id) {
  senhasVisiveis[id] = !senhasVisiveis[id];
  const el = document.getElementById(`pass-${id}`);
  const c = clientes.find(x => x.id === id);
  if (!el || !c) return;
  el.textContent = senhasVisiveis[id] ? c.senha : mascararSenha(c.senha);
};

/* ---------- REGENERAR TOKEN (tabela) ---------- */
window.regenarToken = function(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  const novoToken = gerarToken();
  c.token = novoToken;

  // Exibe modal de confirmação/exibição do token
  document.getElementById('tokenGerado').textContent = novoToken;
  abrirModal('tokenModal');

  // Atualiza célula na tabela também
  const el = document.getElementById(`token-val-${id}`);
  if (el) { el.textContent = novoToken; el.title = novoToken; }
};

/* ---------- BUSCA ---------- */
document.getElementById('searchInput').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  const filtrado = q
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(q) ||
        c.login.toLowerCase().includes(q) ||
        c.empresa.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    : clientes;
  render(filtrado);
});

/* ---------- MODAL HELPERS ---------- */
function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}
function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

/* Fechar clicando fora */
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) fecharModal(m.id);
  });
});

/* ---------- MODAL CLIENTE (criar / editar) ---------- */
let modoEdicao = false;

function limparForm() {
  document.getElementById('clienteId').value = '';
  document.getElementById('inputNome').value = '';
  document.getElementById('inputEmail').value = '';
  document.getElementById('inputLogin').value = '';
  document.getElementById('inputSenha').value = '';
  document.getElementById('inputEmpresa').value = '';
  document.getElementById('inputToken').value = '';
}

document.getElementById('openModal').addEventListener('click', () => {
  modoEdicao = false;
  limparForm();
  document.getElementById('modalTitle').textContent = 'Novo Cliente';
  document.getElementById('modalSubtitle').textContent = 'Cadastre um novo cliente no sistema';
  document.getElementById('salvarBtn').textContent = 'Salvar Cliente';
  // Gera token inicial automaticamente
  document.getElementById('inputToken').value = gerarToken();
  abrirModal('clienteModal');
});

document.getElementById('closeModal').addEventListener('click',  () => fecharModal('clienteModal'));
document.getElementById('cancelModal').addEventListener('click', () => fecharModal('clienteModal'));

/* Gerar token dentro do modal */
document.getElementById('gerarTokenModal').addEventListener('click', () => {
  document.getElementById('inputToken').value = gerarToken();
});

/* Toggle senha no modal */
document.querySelector('.toggle-pass[data-target="inputSenha"]').addEventListener('click', function() {
  const inp = document.getElementById('inputSenha');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

/* Abrir edição */
window.abrirEdicao = function(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  modoEdicao = true;
  document.getElementById('clienteId').value = c.id;
  document.getElementById('inputNome').value = c.nome;
  document.getElementById('inputEmail').value = c.email;
  document.getElementById('inputLogin').value = c.login;
  document.getElementById('inputSenha').value = c.senha;
  document.getElementById('inputEmpresa').value = c.empresa;
  document.getElementById('inputToken').value = c.token;
  document.getElementById('modalTitle').textContent = 'Editar Cliente';
  document.getElementById('modalSubtitle').textContent = `Editando: ${c.nome}`;
  document.getElementById('salvarBtn').textContent = 'Atualizar Cliente';
  abrirModal('clienteModal');
};

/* Submit do formulário */
document.getElementById('clienteForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const nome    = document.getElementById('inputNome').value.trim();
  const email   = document.getElementById('inputEmail').value.trim();
  const login   = document.getElementById('inputLogin').value.trim();
  const senha   = document.getElementById('inputSenha').value.trim();
  const empresa = document.getElementById('inputEmpresa').value.trim();
  const token   = document.getElementById('inputToken').value.trim();

  if (!nome || !login || !senha) {
    toast('Preencha ao menos Nome, Login e Senha.', 'error');
    return;
  }

  if (modoEdicao) {
    const id = parseInt(document.getElementById('clienteId').value);
    const c  = clientes.find(x => x.id === id);
    if (c) { Object.assign(c, { nome, email, login, senha, empresa, token }); }
    toast('Cliente atualizado com sucesso!');
  } else {
    clientes.unshift({ id: nextId++, nome, email, login, senha, empresa, token, status: 'ativo' });
    toast('Cliente cadastrado com sucesso!');
  }

  fecharModal('clienteModal');
  render(clientes);
});

/* ---------- MODAL DELETE ---------- */
window.confirmarDelete = function(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  deleteTarget = id;
  document.getElementById('deleteNome').textContent = c.nome;
  abrirModal('deleteModal');
};

document.getElementById('closeDeleteModal').addEventListener('click', () => fecharModal('deleteModal'));
document.getElementById('cancelDelete').addEventListener('click',     () => fecharModal('deleteModal'));

document.getElementById('confirmDelete').addEventListener('click', () => {
  if (deleteTarget === null) return;
  clientes = clientes.filter(c => c.id !== deleteTarget);
  deleteTarget = null;
  fecharModal('deleteModal');
  render(clientes);
  toast('Cliente removido.');
});

/* ---------- MODAL TOKEN ---------- */
document.getElementById('closeTokenModal').addEventListener('click', () => fecharModal('tokenModal'));
document.getElementById('fecharTokenModal').addEventListener('click', () => fecharModal('tokenModal'));

document.getElementById('copyToken').addEventListener('click', () => {
  const t = document.getElementById('tokenGerado').textContent;
  navigator.clipboard.writeText(t).then(() => toast('Token copiado!'));
});

/* ---------- INIT ---------- */
render(clientes);