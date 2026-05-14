import { formatPhoneNumber } from "./formatters.js";

export function initPhoneMask(inputId) {
  const phoneInput = document.getElementById(inputId);
  if (!phoneInput) return;

  if (phoneInput.value.trim() === "") {
    phoneInput.value = "+48 ";
  }

  phoneInput.addEventListener("input", () => {
    const value = phoneInput.value;

    if (!value.startsWith("+48 ")) {
      phoneInput.value = "+48 ";
      return;
    }

    phoneInput.value = formatPhoneNumber(value);
  });
}
