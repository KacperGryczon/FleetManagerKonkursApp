import {
  fetchDrivers,
  fetchDriverById,
  checkDriverExists,
  createDriver,
  updateDriver,
  deleteDriver,
  fetchAvailableDriversForUser,
  fetchDriverInfoForUser,
} from "../api/driverApi.js";
import { showAlert } from "../ui/alertService.js";
import { validateEmail, validateDriverName } from "../utils/validators.js";
import { can } from "../auth/permissionService.js";

export async function loadAndRenderDrivers(firmaId) {
  const container = document.getElementById("kierowcyRows");
  if (!container) return;

  container.innerHTML = "";

  const { drivers, error } = await fetchDrivers(firmaId);

  if (error) {
    showAlert(false, "Brak uprawnień do pobrania kierowców.");
    return;
  }

  if (!drivers || drivers.length === 0) {
    container.innerHTML = `
      <div class="brakPojazdow">
        <p>Nie masz jeszcze żadnych kierowców.</p>
      </div>
    `;
    return;
  }

  drivers.forEach((driver) => {
    const row = document.createElement("div");
    row.classList.add("table", "table-row");
    row.innerHTML = `
      <div class="kierowcaDiv1">${driver.imie_nazwisko}</div>
      <div class="kierowcaDiv2">${driver.telefon || "-"}</div>
      <div class="kierowcaDiv3">${driver.email || "-"}</div>
      <div class="kierowcaDiv4">
        <button data-details="kierowca" data-id="${driver.id}">
          <i class="fa-regular fa-eye"></i>Szczegóły
        </button>
      </div>
    `;
    container.appendChild(row);
  });
}

export async function handleAddDriver(driverFormData, firmaId) {
  const { imie_nazwisko, email, telefon } = driverFormData;

  if (!validateDriverName(imie_nazwisko)) {
    showAlert(false, "Podaj imię i nazwisko");
    return false;
  }

  if (!validateEmail(email)) {
    showAlert(false, "Podaj poprawny adres e-mail");
    return false;
  }

  if (!(await can("canManageDrivers"))) {
    showAlert(false, "Nie masz uprawnień do dodawania kierowców");
    return false;
  }

  const { driver: existingDriver, error: checkError } = await checkDriverExists(email);

  if (checkError) {
    showAlert(false, "Błąd podczas sprawdzania kierowcy");
    return false;
  }

  if (!existingDriver) {
    const { error } = await createDriver({
      email,
      imie_nazwisko,
      telefon,
      firma_id: firmaId,
    });

    if (error) {
      showAlert(false, "Błąd podczas dodawania kierowcy");
      return false;
    }
  } else {
    const { error } = await updateDriver(existingDriver.id, {
      imie_nazwisko,
      telefon,
    });

    if (error) {
      showAlert(false, "Błąd podczas aktualizacji kierowcy");
      return false;
    }
  }

  await loadAndRenderDrivers(firmaId);

  showAlert(true, "Kierowca został dodany");
  return true;
}

export async function handleDeleteDriver(driverId) {
  if (!(await can("canManageDrivers"))) {
    showAlert(false, "Nie masz uprawnień do usuwania kierowców");
    return false;
  }

  const { error } = await deleteDriver(driverId);

  if (error) {
    showAlert(false, "Nie udało się usunąć kierowcy");
    return false;
  }

  showAlert(true, "Kierowca został usunięty");
  return true;
}

export async function getDriverDetails(driverId) {
  const { driver, error } = await fetchDriverById(driverId);

  if (error) {
    showAlert(false, "Nie znaleziono kierowcy");
    return null;
  }

  return driver;
}

export async function loadAvailableDriversForUserForm(firmaId) {
  const select = document.getElementById("selectKierowca");
  if (!select) return;

  select.innerHTML = `<option value="">Wybierz kierowcę</option>`;

  const { drivers, error } = await fetchAvailableDriversForUser(firmaId);

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

export async function getDriverInfoForUserForm(kierowcaId) {
  const { driver, error } = await fetchDriverInfoForUser(kierowcaId);

  if (error || !driver) {
    return null;
  }

  return driver;
}
