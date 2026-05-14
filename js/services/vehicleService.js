import {
  fetchVehicles,
  fetchVehicleById,
  createVehicle,
  deleteVehicle,
  fetchAvailableDrivers,
  updateVehicle,
} from "../api/vehicleApi.js";
import { showAlert } from "../ui/alertService.js";
import { validateVehicleRegistration, validateProductionYear } from "../utils/validators.js";
import { can } from "../auth/permissionService.js";

export async function loadAndRenderVehicles(firmaId) {
  const container = document.getElementById("pojazdyRows");
  if (!container) return;

  container.innerHTML = "";

  const { vehicles, error } = await fetchVehicles(firmaId);

  if (error) {
    showAlert(false, "Błąd podczas pobierania pojazdów.");
    return;
  }

  if (!vehicles || vehicles.length === 0) {
    container.innerHTML = `
      <div class="brakPojazdow">
        <p>Nie masz jeszcze żadnych pojazdów.</p>
      </div>
    `;
    return;
  }

  vehicles.forEach((vehicle) => {
    const driverName = vehicle.KIEROWCA ? vehicle.KIEROWCA.imie_nazwisko : "-";

    const row = document.createElement("div");
    row.classList.add("table", "table-row");
    row.innerHTML = `
      <div class="div1">${vehicle.typ}</div>
      <div class="div2">${vehicle.numer_rejestracyjny}</div>
      <div class="div3">${vehicle.marka} ${vehicle.model}</div>
      <div class="div4">${driverName}</div>
      <div class="div5">
        <button data-details="pojazd" data-id="${vehicle.id}">
          <i class="fa-regular fa-eye"></i>Szczegóły
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

export async function populateDriverSelect(firmaId) {
  const select = document.getElementById("PojazdPrzypisanyKierowca");
  if (!select) return;

  select.innerHTML = `<option value="">Brak przypisania</option>`;

  const { drivers, error } = await fetchAvailableDrivers(firmaId);

  if (error) {
    return;
  }

  if (drivers && drivers.length > 0) {
    drivers.forEach((driver) => {
      const option = document.createElement("option");
      option.value = driver.id;
      option.textContent = driver.imie_nazwisko;
      select.appendChild(option);
    });
  }
}

export async function handleAddVehicle(vehicleFormData, firmaId) {
  if (!validateVehicleRegistration(vehicleFormData.numer_rejestracyjny)) {
    showAlert(false, "Podaj numer rejestracyjny");
    return false;
  }

  if (!vehicleFormData.marka) {
    showAlert(false, "Podaj markę pojazdu");
    return false;
  }

  if (!vehicleFormData.model) {
    showAlert(false, "Podaj model pojazdu");
    return false;
  }

  if (!vehicleFormData.vin) {
    showAlert(false, "Podaj numer VIN");
    return false;
  }

  if (!validateProductionYear(vehicleFormData.rok_produkcji)) {
    showAlert(false, "Rok produkcji nie jest poprawny.");
    return false;
  }

  if (!(await can("canManageFleet"))) {
    showAlert(false, "Nie masz uprawnień do dodawania pojazdów");
    return false;
  }

  const vehicleData = {
    firma_id: firmaId,
    ...vehicleFormData,
  };

  const { error } = await createVehicle(vehicleData);

  if (error) {
    showAlert(false, "Nie udało się dodać pojazdu.");
    return false;
  }

  await loadAndRenderVehicles(firmaId);

  showAlert(true, "Pojazd został dodany.");
  return true;
}

export async function handleDeleteVehicle(vehicleId) {
  if (!(await can("canManageFleet"))) {
    showAlert(false, "Nie masz uprawnień do usuwania pojazdów");
    return false;
  }

  const { error } = await deleteVehicle(vehicleId);

  if (error) {
    showAlert(false, "Nie udało się usunąć pojazdu");
    return false;
  }

  showAlert(true, "Pojazd został usunięty");
  return true;
}

export async function getVehicleDetails(vehicleId) {
  const { vehicle, error } = await fetchVehicleById(vehicleId);

  if (error) {
    showAlert(false, "Nie znaleziono pojazdu");
    return null;
  }

  return vehicle;
}

export async function handleAssignVehicleToDriver(vehicleId, driverId) {
  if (!vehicleId) {
    showAlert(false, "Brak ID pojazdu");
    return false;
  }

  if (!(await can("canManageFleet"))) {
    showAlert(false, "Nie masz uprawnień do przypisywania pojazdów");
    return false;
  }

  if (!driverId) {
    showAlert(false, "Wybierz kierowcę");
    return false;
  }

  const { error } = await updateVehicle(vehicleId, {
    przypisany_kierowca_id: driverId,
  });

  if (error) {
    console.error("Błąd przypisania pojazdu:", error);
    showAlert(false, "Nie udało się przypisać pojazdu");
    return false;
  }

  showAlert(true, "Pojazd został przypisany");
  return true;
}
