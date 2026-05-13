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