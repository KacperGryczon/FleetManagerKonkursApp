export function openModal(htmlContent) {
  const modal = document.getElementById("detailsModal");
  const body = document.getElementById("modalBody");

  if (!modal || !body) return;

  body.innerHTML = htmlContent;
  modal.style.display = "flex";
}

export function closeModal() {
  const modal = document.getElementById("detailsModal");
  if (modal) {
    modal.style.display = "none";
  }
}

export function initModalHandlers() {
  const modalCloseBtn = document.querySelector(".modal-close");
  const modal = document.getElementById("detailsModal");

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeModal);
  }

  if (modal) {
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }
}

export function hideDeleteButtons(userRole) {
  if (userRole === "Kierowca" || userRole === "Przeglądający") {
    document.querySelectorAll(".usunPojazdBtn, .usunDokumentBtn").forEach((el) => {
      el.style.display = "none";
    });
  }
}
