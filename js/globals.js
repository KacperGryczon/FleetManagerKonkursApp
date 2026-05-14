import { showAlert } from "./ui/alertService.js";
import { showView } from "./ui/menuService.js";
import { getCompanyIdForUser, getCurrentUser, getUserRole } from "./auth/authService.js";
import { loadDashboardData, applyRoleRestrictions } from "./main.js";
import { handleCreateCompany, handleUpdateCompanySettings } from "./services/companyService.js";
import { handleAddVehicle, loadAndRenderVehicles } from "./services/vehicleService.js";
import { handleAddDriver, loadAndRenderDrivers } from "./services/driverService.js";
import {
  handleAddDocument,
  loadDocumentsForCompany,
  renderDocuments,
  getDocumentsCache,
} from "./services/documentService.js";
import {
  handleAddUser,
  handleUpdateUserProfile,
  handleChangePassword,
  loadAndRenderUsers,
} from "./services/userService.js";
import { client } from "./api/supabase.js";

window.createFirmaFromForm = async function () {
  const nazwa = document.getElementById("firmaNazwa")?.value.trim();
  const email = document.getElementById("firmaAdres")?.value.trim();

  if (await handleCreateCompany(nazwa, email)) {
    await new Promise((r) => setTimeout(r, 500));

    await applyRoleRestrictions();

    showView("viewDashboard", "Pulpit", loadDashboardData);
  }
};

window.cancelCreateFirmaFromForm = async function () {
  showView("viewDashboard", "Pulpit");
};

window.dodajPojazdFromForm = async function () {
  const firmaId = await getCompanyIdForUser();

  console.log("dodajPojazdFromForm: firmaId =", firmaId);

  if (!firmaId) {
    showAlert(false, "Nie znaleziono firmy. Nie masz przypisanej firmy lub brakuje dostępu.");
    return;
  }

  const vehicleData = {
    typ: document.getElementById("selectTypPojazdu")?.value.trim() || "",
    numer_rejestracyjny: document.getElementById("pojazdNumerRejestracyjny")?.value.trim() || "",
    marka: document.getElementById("pojazdMarka")?.value.trim() || "",
    model: document.getElementById("pojazdModel")?.value.trim() || "",
    rok_produkcji: parseInt(document.getElementById("pojazdRokProdukcji")?.value.trim() || "0", 10),
    vin: document.getElementById("pojazdNumerVIN")?.value.trim() || "",
    przypisany_kierowca_id:
      document.getElementById("PojazdPrzypisanyKierowca")?.value.trim() || null,
  };

  if (!vehicleData.typ) {
    showAlert(false, "Wybierz typ pojazdu");
    return;
  }

  console.log("dodajPojazdFromForm: Wysyłanie danych:", vehicleData, "dla firmy:", firmaId);

  if (await handleAddVehicle(vehicleData, firmaId)) {
    showView("viewPojazdy", "Pojazdy");

    document.getElementById("selectTypPojazdu").value = "";
    document.getElementById("pojazdNumerRejestracyjny").value = "";
    document.getElementById("pojazdMarka").value = "";
    document.getElementById("pojazdModel").value = "";
    document.getElementById("pojazdRokProdukcji").value = "";
    document.getElementById("pojazdNumerVIN").value = "";
    document.getElementById("PojazdPrzypisanyKierowca").value = "";
  }
};

window.cancelCreatePojazdFromForm = async function () {
  showView("viewPojazdy", "Pojazdy");
};

window.dodajKierowcęFromForm = async function () {
  const firmaId = await getCompanyIdForUser();

  const driverData = {
    imie_nazwisko: `${document.getElementById("kierowcaImie")?.value.trim()} ${document.getElementById("kierowcaNazwisko")?.value.trim()}`,
    email: document.getElementById("kierowcaMail")?.value.trim() || "",
    telefon: document.getElementById("kierowcaTelefon")?.value.trim() || "",
  };

  if (await handleAddDriver(driverData, firmaId)) {
    showView("viewKierowcy", "Kierowcy");

    document.getElementById("kierowcaImie").value = "";
    document.getElementById("kierowcaNazwisko").value = "";
    document.getElementById("kierowcaMail").value = "";
    document.getElementById("kierowcaTelefon").value = "";
  }
};

window.cancelCreateKierowcęFromForm = async function () {
  showView("viewKierowcy", "Kierowcy");
};

window.dodajDokumentFromForm = async function () {
  const firmaId = await getCompanyIdForUser();

  const documentData = {
    nazwa: document.getElementById("dokumentNazwa")?.value.trim() || "",
    dataWaznosci: document.getElementById("dokumentDataWaznosci")?.value || "",
    typPrzypisania: document.getElementById("dokumentTypPrzypisania")?.value || "Pojazd",
    file: document.getElementById("fileInput")?.files[0] || null,
    wlascicielId: document.getElementById("dokumentWlascicielId")?.value || "",
  };

  if (await handleAddDocument(documentData, firmaId)) {
    showView("viewDokumenty", "Dokumenty");

    document.getElementById("dokumentNazwa").value = "";
    document.getElementById("dokumentDataWaznosci").value = "";
    document.getElementById("dokumentTypPrzypisania").value = "Pojazd";
    document.getElementById("fileInput").value = "";
    document.getElementById("dokumentWlascicielWrapper").style.display = "none";
  }
};

window.cancelCreateDokumentFromForm = async function () {
  showView("viewDokumenty", "Dokumenty");
};

window.dodajUżytkownikaFromForm = async function () {
  const firmaId = await getCompanyIdForUser();

  const userData = {
    email: document.getElementById("użytkownikMail")?.value.trim() || "",
    rola: document.getElementById("selectTypUżytkownika")?.value || "Operator",
    kierowcaId: document.getElementById("selectKierowca")?.value || null,
    imie: document.getElementById("użytkownikImie")?.value.trim() || "",
    nazwisko: document.getElementById("użytkownikNazwisko")?.value.trim() || "",
    password: document.getElementById("użytkownikHaslo")?.value.trim() || "",
  };

  if (await handleAddUser(userData, firmaId)) {
    showView("viewUżytkownicy", "Użytkownicy");

    document.getElementById("selectTypUżytkownika").value = "Operator";
    document.getElementById("użytkownikMail").value = "";
    document.getElementById("użytkownikImie").value = "";
    document.getElementById("użytkownikNazwisko").value = "";
    document.getElementById("użytkownikHaslo").value = "";
    document.getElementById("selectKierowca").value = "";
  }
};

window.cancelCreateUżytkownikaFromForm = async function () {
  showView("viewUżytkownicy", "Użytkownicy");
};

window.acceptZmianyUser = async function () {
  const imie = document.getElementById("userImie")?.value.trim() || "";
  const nazwisko = document.getElementById("userNazwisko")?.value.trim() || "";
  const telefon = document.getElementById("userTelefon")?.value.trim() || "";

  if (await handleUpdateUserProfile(imie, nazwisko, telefon)) {
    const { loadDashboardData } = await import("./main.js");
    await loadDashboardData();
    showView("viewDashboard", "Pulpit");
  }
};

window.cancelZmianyUser = async function () {
  showView("viewDashboard", "Pulpit");
};

window.acceptZmianyHasla = async function () {
  const currentPassword = document.getElementById("userHaslo")?.value.trim() || "";
  const newPassword = document.getElementById("userNoweHaslo")?.value.trim() || "";
  const newPasswordConfirm = document.getElementById("userNoweHasloPowtorz")?.value.trim() || "";

  if (await handleChangePassword(currentPassword, newPassword, newPasswordConfirm)) {
    showView("viewDashboard", "Pulpit");

    document.getElementById("userHaslo").value = "";
    document.getElementById("userNoweHaslo").value = "";
    document.getElementById("userNoweHasloPowtorz").value = "";
  }
};

window.acceptZmianyFirmy = async function () {
  const companyData = {
    nazwa: document.getElementById("firmaDaneNazwa")?.value.trim() || "",
    email: document.getElementById("firmaMail")?.value.trim() || "",
    adres: document.getElementById("firmaDaneAdres")?.value.trim() || "",
    nip: document.getElementById("firmaNIP")?.value.trim() || "",
    regon: document.getElementById("firmaREGON")?.value.trim() || "",
    numer_licencji: document.getElementById("firmaNumerLicencji")?.value.trim() || "",
  };

  if (await handleUpdateCompanySettings(companyData)) {
    showView("viewDashboard", "Pulpit");
  }
};

window.cancelZmianyFirmy = async function () {
  showView("viewDashboard", "Pulpit");
};

window.goToDashboard = async function () {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const { data: userRecord } = await client
    .from("UZYTKOWNIK")
    .select("firma_id")
    .eq("auth_id", currentUser.id)
    .maybeSingle();

  if (!userRecord || !userRecord.firma_id) {
    showView("viewCreateFirma", "Dodaj firmę");
    return;
  }

  showView("viewDashboard", "Pulpit");
};
