const modal = document.getElementById("ticketModal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

openModal.onclick = () => {
  modal.classList.add("active");
  document.body.style.overflow = 'hidden';
};

closeModal.onclick = () => {
  modal.classList.remove("active");
  document.body.style.overflow = 'auto';
};

cancelModal.onclick = () => {
  modal.classList.remove("active");
  document.body.style.overflow = 'auto';
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.classList.remove("active");
    document.body.style.overflow = 'auto';
  }
};

// CUSTOM SELECTS
document.querySelectorAll('.custom-select').forEach(select => {
  const selected = select.querySelector('.custom-select-selected');
  const options = select.querySelectorAll('.custom-select-options li');
  const hidden = select.nextElementSibling;

  selected.addEventListener('click', (e) => {
    e.stopPropagation();
    // fecha os outros
    document.querySelectorAll('.custom-select').forEach(s => {
      if (s !== select) s.classList.remove('open');
    });
    select.classList.toggle('open');
  });

  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.dataset.value;
      selected.innerHTML = `${value} <span class="arrow">▾</span>`;
      hidden.value = value;
      options.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      select.classList.remove('open');
    });
  });
});

// fecha ao clicar fora
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
});

// MODAL VISUALIZAR CHAMADO
function abrirChamado(dados) {
  document.getElementById('view-id').textContent = dados.id;
  document.getElementById('view-titulo').textContent = dados.titulo;
  document.getElementById('view-prioridade').textContent = dados.prioridade;
  document.getElementById('view-especialista').textContent = dados.especialista;
  document.getElementById('view-por').textContent = dados.por;
  document.getElementById('view-data').textContent = dados.cadastrado;
  document.getElementById('view-descricao').textContent = dados.descricao;

  const statusEl = document.getElementById('view-status');
  statusEl.className = `badge ${dados.status}`;
  statusEl.textContent = dados.statusLabel;

  document.getElementById('viewModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.getElementById('closeViewModal').onclick = fecharViewModal;
document.getElementById('closeViewModal2').onclick = fecharViewModal;

function fecharViewModal() {
  document.getElementById('viewModal').classList.remove('active');
  document.body.style.overflow = 'auto';
}

window.addEventListener('click', (e) => {
  if (e.target === document.getElementById('viewModal')) fecharViewModal();
});

// CHAT DINÂMICO

document.getElementById('sendMessage').addEventListener('click', () => {

  const input = document.getElementById('chatInput');
  const chatBox = document.querySelector('.chat-box');

  if (!input.value.trim()) return;

  const message = document.createElement('div');
  message.classList.add('chat-message', 'client');

 const agora = new Date();

const dataHora =
  agora.toLocaleDateString('pt-BR') +
  ' às ' +
  agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

message.innerHTML = `
  <div class="chat-user">
    Cliente
  </div>

  <div class="chat-bubble">
    ${input.value}
  </div>

  <div class="chat-time">
    ${dataHora}
  </div>
`;

  chatBox.appendChild(message);

  chatBox.scrollTop = chatBox.scrollHeight;

  input.value = '';
});

