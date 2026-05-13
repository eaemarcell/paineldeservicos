const modal = document.getElementById("ticketModal");

const openModal = document.getElementById("openModal");

const closeModal = document.getElementById("closeModal");

const cancelModal = document.getElementById("cancelModal");

openModal.onclick = () => {
  modal.classList.add("active");
};

closeModal.onclick = () => {
  modal.classList.remove("active");
};

cancelModal.onclick = () => {
  modal.classList.remove("active");
};

window.onclick = (event) => {
  if (event.target === modal) {
    modal.classList.remove("active");
  }
};