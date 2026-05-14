import { getDocumentsCache, fetchDocumentOwnerName } from "./documentService.js";
import { calculateDocumentStatus } from "../utils/documentStatusCalculator.js";
import { getStatusLabel } from "../utils/formatters.js";
import { getUserRole } from "../auth/authService.js";
import { fetchVehiclesForDriver } from "../api/vehicleApi.js";

export async function renderUpcomingDocuments(kierowcaId = null) {
  const container = document.getElementById("nadchodzaceTiles");
  if (!container) return;

  const documents = getDocumentsCache() || [];
  container.innerHTML = "";

  if (documents.length === 0) {
    container.innerHTML = "<p>Brak nadchodzących terminów.</p>";
    return;
  }

  const role = await getUserRole();
  let filteredDocs = documents;

  if (role === "Kierowca" && kierowcaId) {
    const { vehicles, error } = await fetchVehiclesForDriver(kierowcaId);
    const vehicleIds = !error && vehicles ? vehicles.map((v) => v.id) : [];

    filteredDocs = documents.filter((doc) => {
      if (doc.typ_wlasciciela === "Kierowca" && doc.wlasciciel_id === kierowcaId) {
        return true;
      }
      if (doc.typ_wlasciciela === "Pojazd" && vehicleIds.includes(doc.wlasciciel_id)) {
        return true;
      }
      return false;
    });
  }

  const upcoming = filteredDocs
    .filter((doc) => doc.status === "wygasa" || doc.status === "niewazny")
    .sort((a, b) => new Date(a.data_waznosci) - new Date(b.data_waznosci));

  if (upcoming.length === 0) {
    container.innerHTML = "<p>Brak nadchodzących terminów.</p>";
    return;
  }

  for (const doc of upcoming) {
    const przypisanieNazwa = await fetchDocumentOwnerName(doc);

    const tile = document.createElement("div");
    tile.classList.add("tile");

    if (doc.status === "niewazny") {
      tile.classList.add("expired");
    }

    tile.innerHTML = `
      <div class="info">
        <p class="infoBold">${doc.typ_dokumentu}</p>
        <p>${doc.typ_wlasciciela}: ${przypisanieNazwa}</p>
      </div>
      <div class="terminWygasniecia">
        ${doc.status === "niewazny" ? "Nieważny" : "Wygasa: " + doc.data_waznosci}
      </div>
    `;

    container.appendChild(tile);
  }
}
