export function calculateDocumentStatus(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDateTime = new Date(expiryDate);
  expiryDateTime.setHours(0, 0, 0, 0);

  if (expiryDateTime < today) {
    return "niewazny";
  }

  const daysDifference = Math.floor((expiryDateTime - today) / (1000 * 60 * 60 * 24));

  if (daysDifference <= 30) {
    return "wygasa";
  }

  return "ok";
}

export function calculateDaysUntilExpiry(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryDateTime = new Date(expiryDate);
  expiryDateTime.setHours(0, 0, 0, 0);

  return Math.floor((expiryDateTime - today) / (1000 * 60 * 60 * 24));
}
