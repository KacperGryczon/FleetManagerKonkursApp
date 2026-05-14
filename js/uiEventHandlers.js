import { getCompanyIdForUser } from "./auth/authService.js";
import {
  loadAvailableDriversForUserForm,
  getDriverInfoForUserForm,
} from "./services/driverService.js";
import { parseDriverName } from "./utils/formatters.js";
import { client } from "./api/supabase.js";

export function setupDocumentTypeChangeHandler() {
  const documentTypeSelect = document.getElementById("dokumentTypPrzypisania");

  if (!documentTypeSelect) return;

  documentTypeSelect.addEventListener("change", async () => {
    const typ = documentTypeSelect.value;
    const wrapper = document.getElementById("dokumentWlascicielWrapper");
    const select = document.getElementById("dokumentWlascicielId");

    if (typ === "Firma") {
      wrapper.style.display = "none";
      select.innerHTML = "";
      return;
    }

    wrapper.style.display = "block";
    select.innerHTML = `<option>Ładowanie...</option>`;

    const firmaId = await getCompanyIdForUser();
    if (!firmaId) return;

    if (typ === "Pojazd") {
      const { data: vehicles } = await client
        .from("POJAZD")
        .select("id, numer_rejestracyjny")
        .eq("firma_id", firmaId);

      select.innerHTML = vehicles
        .map((v) => `<option value="${v.id}">${v.numer_rejestracyjny}</option>`)
        .join("");

      document.getElementById("dokumentWlascicielText").innerText = "Wybierz pojazd";
    }

    if (typ === "Kierowca") {
      const { data: drivers } = await client
        .from("KIEROWCA")
        .select("id, imie_nazwisko")
        .eq("firma_id", firmaId);

      select.innerHTML = drivers
        .map((d) => `<option value="${d.id}">${d.imie_nazwisko}</option>`)
        .join("");

      document.getElementById("dokumentWlascicielText").innerText = "Wybierz właściciela";
    }
  });
}

export function setupDriverSelectForUserHandler() {
  const driverSelect = document.getElementById("selectKierowca");

  if (!driverSelect) return;

  driverSelect.addEventListener("change", async () => {
    const kierowcaId = driverSelect.value;

    if (!kierowcaId) {
      document.getElementById("użytkownikMail").value = "";
      document.getElementById("użytkownikImie").value = "";
      document.getElementById("użytkownikNazwisko").value = "";
      return;
    }

    const driver = await getDriverInfoForUserForm(kierowcaId);

    if (driver) {
      const { firstName, lastName } = parseDriverName(driver.imie_nazwisko);

      document.getElementById("użytkownikMail").value = driver.email;
      document.getElementById("użytkownikImie").value = firstName;
      document.getElementById("użytkownikNazwisko").value = lastName;
    }
  });
}

export function setupUIEventHandlers() {
  setupDocumentTypeChangeHandler();
  setupUserRoleChangeHandler();
  setupDriverSelectForUserHandler();
}

function setupUserRoleChangeHandler() {
  const userRoleSelect = document.getElementById("selectTypUżytkownika");

  if (!userRoleSelect) return;

  const kierowcaSelectWrapper = document.getElementById("kierowcaSelectWrapper");
  const kierowcaDaneWrapper = document.getElementById("kierowcaDane");
  const emailInput = document.getElementById("użytkownikMail");

  const updateRoleUI = async (rola) => {
    if (rola === "Kierowca") {
      if (kierowcaSelectWrapper) kierowcaSelectWrapper.style.display = "block";
      if (kierowcaDaneWrapper) kierowcaDaneWrapper.style.display = "grid";
      if (emailInput) emailInput.readOnly = true;

      const firmaId = await getCompanyIdForUser();
      await loadAvailableDriversForUserForm(firmaId);
    } else {
      if (kierowcaSelectWrapper) kierowcaSelectWrapper.style.display = "none";
      if (kierowcaDaneWrapper) kierowcaDaneWrapper.style.display = "none";
      if (emailInput) emailInput.readOnly = false;

      document.getElementById("użytkownikMail").value = "";
      document.getElementById("użytkownikImie").value = "";
      document.getElementById("użytkownikNazwisko").value = "";
    }
  };

  userRoleSelect.addEventListener("change", async () => {
    await updateRoleUI(userRoleSelect.value);
  });

  updateRoleUI(userRoleSelect.value);
}
