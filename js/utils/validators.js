const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 10;

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function validatePassword(password) {
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return password.length >= PASSWORD_MIN_LENGTH && hasNumber && hasSpecial;
}

export function validateDriverName(name) {
  return name && name.trim().length > 0;
}

export function validateVehicleRegistration(registration) {
  return registration && registration.trim().length > 0;
}

export function validateProductionYear(year) {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
}

export function validateDocumentDate(date, minDate = null) {
  if (!minDate) {
    minDate = new Date().toISOString().split("T")[0];
  }
  return date >= minDate;
}
