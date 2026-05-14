export function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) {
    loader.classList.remove("hidden");
  }
}

export function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) {
    loader.classList.add("hidden");
  }
}
