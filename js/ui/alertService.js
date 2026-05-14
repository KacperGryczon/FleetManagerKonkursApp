const ALERT_DISPLAY_TIME = 5000;

export function showAlert(isSuccess, message) {
  const alertBox = document.getElementById("alert");

  if (!alertBox) return;

  alertBox.className = "";
  alertBox.classList.add(isSuccess ? "success" : "error");
  alertBox.innerHTML = `<span>${message}</span>`;
  alertBox.classList.add("show");

  setTimeout(() => {
    alertBox.classList.remove("show");
  }, ALERT_DISPLAY_TIME);
}
