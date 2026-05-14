export function getStatusLabel(status) {
  const statusMap = {
    ok: "Ważny",
    wygasa: "Wygasa",
    niewazny: "Nieważny",
  };
  return statusMap[status] || status;
}

export function getStatusColors(status) {
  const colorMap = {
    ok: {
      background: "rgba(52, 243, 52, 0.43)",
      border: "rgba(52, 243, 52, 0.53)",
    },
    wygasa: {
      background: "rgba(243, 163, 52, 0.43)",
      border: "rgba(243, 163, 52, 0.53)",
    },
    niewazny: {
      background: "rgba(255, 0, 0, 0.43)",
      border: "rgba(255, 0, 0, 0.53)",
    },
  };
  return colorMap[status] || colorMap.ok;
}

export function formatPhoneNumber(value) {
  let v = value.replace("+48 ", "").replace(/\D/g, "");

  if (v.length > 9) {
    v = v.slice(0, 9);
  }

  let formatted = "";
  if (v.length > 0) formatted = v.slice(0, 3);
  if (v.length > 3) formatted += " " + v.slice(3, 6);
  if (v.length > 6) formatted += " " + v.slice(6, 9);

  return "+48 " + formatted;
}

export function parseDriverName(fullName) {
  const parts = fullName.split(" ");
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
