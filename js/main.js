import { client } from "./api/supabase.js";
import {
  getCurrentUser,
  ensureUserHasRole,
  getUserRole,
  getCompanyIdForUser,
} from "./auth/authService.js";
import { getMenuVisibility, can } from "./auth/permissionService.js";
import {
  showView,
  initMenuToggle,
  showMenu,
  hideAllMenuItems,
  showAddButtons,
} from "./ui/menuService.js";
import { showLoader, hideLoader } from "./ui/loaderService.js";
import { initModalHandlers, hideDeleteButtons, closeModal, openModal } from "./ui/modalService.js";
import { showAlert } from "./ui/alertService.js";
import { initPhoneMask } from "./utils/phoneMask.js";

import {
  loadAndRenderVehicles,
  populateDriverSelect,
  handleAddVehicle,
  handleDeleteVehicle,
  getVehicleDetails,
  handleAssignVehicleToDriver,
} from "./services/vehicleService.js";
import {
  loadAndRenderDrivers,
  handleAddDriver,
  handleDeleteDriver,
  getDriverDetails,
  loadAvailableDriversForUserForm,
  getDriverInfoForUserForm,
} from "./services/driverService.js";
import {
  loadDocumentsForCompany,
  renderDocuments,
  updateDocumentDashboardTiles,
  applyDocumentFilters,
  handleAddDocument,
  handleDeleteDocument,
  getDocumentDetails,
  fetchDocumentOwnerName,
  getDocumentsCache,
  setDocumentsCache,
  loadDocumentsForDriverDashboard,
  handleUpdateDocument,
} from "./services/documentService.js";
import {
  loadAndRenderUsers,
  handleAddUser,
  handleDeleteUser,
  getUserDetails,
  loadUserProfile,
  handleUpdateUserProfile,
  handleChangePassword,
  renderUserProfile,
} from "./services/userService.js";
import { renderUpcomingDocuments } from "./services/dashboardService.js";
import {
  handleCreateCompany,
  loadCompanySettings,
  handleUpdateCompanySettings,
  renderCompanySettings,
} from "./services/companyService.js";
import { getStatusLabel, getStatusColors } from "./utils/formatters.js";
import { calculateDocumentStatus } from "./utils/documentStatusCalculator.js";
import { fetchDocumentsForPublicView } from "./api/documentApi.js";
import { fetchAvailableDrivers } from "./api/vehicleApi.js";
import { setupUIEventHandlers } from "./uiEventHandlers.js";
import "./globals.js";

let currentUserRole = null;

window.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const userMailElement = document.getElementById("userInfo-userMail");
  if (userMailElement) {
    userMailElement.innerText = currentUser.email;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.href = "index.html";
    });
  }

  setTimeout(initMenuToggle, 100);

  const { data: userRecord } = await client
    .from("UZYTKOWNIK")
    .select("firma_id")
    .eq("email", currentUser.email)
    .maybeSingle();

  if (userRecord && userRecord.firma_id) {
    await showView("viewDashboard", "Pulpit", async () => {
      currentUserRole = await getUserRole();
      await applyRoleRestrictions();
      await loadDashboardData();
    });
  } else {
    await showView("viewCreateFirma", "Dodaj firmę");
  }

  currentUserRole = await getUserRole();
});

export async function applyRoleRestrictions() {
  const role = await getUserRole();

  hideAllMenuItems();

  const visibleMenuIds = getMenuVisibility(role);
  showMenu(visibleMenuIds);

  if (role === "Właściciel" || role === "Administrator") {
    showAddButtons();
  }

  const szybkieAkcje = document.getElementById("szybkieAkcje");
  const szybkieAkcjeTitle = document.getElementById("szybkieAkcjeTitle");
  if (role === "Kierowca" || role === "Przeglądający") {
    if (szybkieAkcje) szybkieAkcje.style.display = "none";
    if (szybkieAkcjeTitle) szybkieAkcjeTitle.style.display = "none";
  }
}

export async function loadDashboardData() {
  const role = await getUserRole();
  const firmaId = await getCompanyIdForUser();

  if (!firmaId) return;

  if (role === "Kierowca") {
    const { data: userRecord } = await client
      .from("UZYTKOWNIK")
      .select("kierowca_id")
      .eq("email", (await getCurrentUser()).email)
      .single();

    if (userRecord?.kierowca_id) {
      await loadDocumentsForDriverDashboard(userRecord.kierowca_id);
      updateDocumentDashboardTiles();
      renderUpcomingDocuments(userRecord.kierowca_id);
    }

    return;
  }

  if (role === "Przeglądający") {
    const { documents, error: docError } = await fetchDocumentsForPublicView();

    if (!docError) {
      setDocumentsCache(documents || []);
      updateDocumentDashboardTiles();
      renderUpcomingDocuments();
    }

    return;
  }

  await loadDocumentsForCompany(firmaId);
  updateDocumentDashboardTiles();
  renderUpcomingDocuments();
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-view]");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const viewId = btn.dataset.view;
  const title = btn.dataset.title;

  const role = await getUserRole();
  const firmaId = await getCompanyIdForUser();

  let loadCallback = null;

  if (viewId === "viewPojazdy") {
    loadCallback = () => loadAndRenderVehicles(firmaId);
  } else if (viewId === "viewDodajPojazd") {
    loadCallback = () => populateDriverSelect(firmaId);
  } else if (viewId === "viewKierowcy") {
    loadCallback = () => loadAndRenderDrivers(firmaId);
  } else if (viewId === "viewDokumenty") {
    loadCallback = async () => {
      await loadDocumentsForCompany(firmaId);
      await renderDocuments(getDocumentsCache());
      updateDocumentDashboardTiles();
    };
  } else if (viewId === "viewDashboard") {
    loadCallback = loadDashboardData;
  } else if (viewId === "viewUżytkownicy") {
    loadCallback = () => loadAndRenderUsers(firmaId);
  } else if (viewId === "viewUstawieniaFirmy") {
    loadCallback = renderCompanySettings;
  } else if (viewId === "viewUstawieniaProfilu") {
    loadCallback = renderUserProfile;
  } else if (viewId === "viewMojePojazdy") {
    loadCallback = async () => {
      const authUser = await client.auth.getUser();
      const user = authUser.data.user;

      if (!user) return;

      const { data: userRecord, error: userError } = await client
        .from("UZYTKOWNIK")
        .select("kierowca_id")
        .eq("auth_id", user.id)
        .single();

      if (userError || !userRecord || !userRecord.kierowca_id) {
        console.warn("Brak kierowca_id dla użytkownika");
        return;
      }

      const kierowcaId = userRecord.kierowca_id;

      const { data: vehicles, error: vehError } = await client
        .from("POJAZD")
        .select("*")
        .eq("przypisany_kierowca_id", kierowcaId);

      const container = document.getElementById("mojePojazdyRows");
      if (!container) return;

      container.innerHTML = "";

      if (vehError || !vehicles || vehicles.length === 0) {
        container.innerHTML = `
        <div class="brakPojazdow">
          <p>Nie masz żadnych przypisanych pojazdów.</p>
        </div>
      `;
        return;
      }

      vehicles.forEach((vehicle) => {
        const row = document.createElement("div");
        row.classList.add("table", "table-row");
        row.innerHTML = `
        <div>${vehicle.numer_rejestracyjny}</div>
        <div>${vehicle.marka}</div>
        <div>${vehicle.model}</div>
        <div>
          <button data-details="pojazd" data-id="${vehicle.id}">
            <i class="fa-regular fa-eye"></i>Szczegóły
          </button>
        </div>
      `;
        container.appendChild(row);
      });
    };
  } else if (viewId === "viewMojeDokumenty") {
    loadCallback = async () => {
      const authUser = await client.auth.getUser();
      const user = authUser.data.user;
      if (!user) return;

      const { data: userRecord } = await client
        .from("UZYTKOWNIK")
        .select("kierowca_id")
        .eq("auth_id", user.id)
        .single();

      const kierowcaId = userRecord?.kierowca_id;
      if (!kierowcaId) return;

      const { data: driverDocs } = await client
        .from("DOKUMENT")
        .select("*")
        .eq("typ_wlasciciela", "Kierowca")
        .eq("wlasciciel_id", kierowcaId);

      const { data: vehicles } = await client
        .from("POJAZD")
        .select("id, numer_rejestracyjny")
        .eq("przypisany_kierowca_id", kierowcaId);

      const vehicleIds = vehicles.map((v) => v.id);

      let vehicleDocs = [];
      if (vehicleIds.length > 0) {
        const { data } = await client
          .from("DOKUMENT")
          .select("*")
          .eq("typ_wlasciciela", "Pojazd")
          .in("wlasciciel_id", vehicleIds);

        vehicleDocs = data || [];
      }

      const documents = [...driverDocs, ...vehicleDocs];

      const container = document.getElementById("mojeDokumentyRows");
      container.innerHTML = "";

      if (documents.length === 0) {
        container.innerHTML = `
        <div class="brakPojazdow">
          <p>Nie masz żadnych dokumentów.</p>
        </div>
      `;
        return;
      }

      documents.forEach((doc) => {
        const row = document.createElement("div");
        row.classList.add("table", "table-row");

        const nazwa = doc.nazwa_dokumentu || doc.typ_dokumentu || "Dokument";

        const wlasciciel =
          doc.typ_wlasciciela === "Kierowca"
            ? "Ty"
            : vehicles.find((v) => v.id === doc.wlasciciel_id)?.numer_rejestracyjny || "Pojazd";

        const wygasa = doc.data_waznosci || "-";

        const label = getStatusLabel(doc.status);
        const colors = getStatusColors(doc.status);

        row.innerHTML = `
    <div>${nazwa}</div>
    <div>${wlasciciel}</div>
    <div>${wygasa}</div>
    <div>
      <span class="status-text" 
        style="
          background-color:${colors.background};
          border:2px solid ${colors.border};
          font-weight:bold;
          border-radius: 16px;
          padding: 8px 16px;
          text-align: center;
          display: inline-block;
        ">
        ${label}
      </span>
    </div>
    <div>
      <button data-details="dokument" data-id="${doc.id}">
        <i class="fa-regular fa-eye"></i>Szczegóły
      </button>
    </div>
  `;

        container.appendChild(row);
      });
    };
  }

  await showView(viewId, title, loadCallback);
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-details]");
  if (!btn) return;

  const id = btn.dataset.id;
  const type = btn.dataset.details;

  if (type === "pojazd") {
    const vehicle = await getVehicleDetails(id);
    if (vehicle) {
      const driverName = vehicle.KIEROWCA?.imie_nazwisko || "Brak";
      const hasDriver = vehicle.przypisany_kierowca_id !== null;

      const modal = document.getElementById("detailsModal");
      if (modal) {
        modal.dataset.pojazdId = id;
      }

      let assignButton = "";
      if (!hasDriver && (currentUserRole === "Właściciel" || currentUserRole === "Administrator")) {
        assignButton = `<button class="edytujBtn" onclick="window.assignVehicleHandler()">
          <i class="fa-solid fa-link"></i>Przypisz kierowcę
        </button>`;
      }

      openModal(`
        <div class="markaModel">
          <h2>${vehicle.numer_rejestracyjny}</h2>
          <p>${vehicle.marka} ${vehicle.model}</p>
        </div>
        <div class="danePojazdu">
          <div class="danePojazduTile">
            <p>Typ pojazdu</p>
            <h3>${vehicle.typ}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Rok produkcji</p>
            <h3>${vehicle.rok_produkcji}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Numer VIN</p>
            <h3>${vehicle.vin}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Marka i model</p>
            <h3>${vehicle.marka} ${vehicle.model}</h3>
          </div>
        </div>
        <p class="przypisanyKierowcaP">Przypisany kierowca</p>
        <div id="przypisanyKierowcaModal" class="przypisanyKierowca">
          <h3>${driverName}</h3>
        </div>
        ${assignButton}
        <button class="usunPojazdBtn" onclick="window.deleteVehicleHandler()">
          <i class="fa-solid fa-trash"></i>Usuń pojazd
        </button>
      `);

      hideDeleteButtons(currentUserRole);
    }
  } else if (type === "kierowca") {
    const driver = await getDriverDetails(id);
    if (driver) {
      const modal = document.getElementById("detailsModal");
      if (modal) {
        modal.dataset.kierowcaId = id;
      }

      openModal(`
        <div class="markaModel">
          <h2>${driver.imie_nazwisko}</h2>
          <p>Kierowca</p>
        </div>
        <p class="przypisanyKierowcaP">Adres email</p>
        <div class="przypisanyKierowca">
          <h3>${driver.email || "Brak"}</h3>
        </div>
        <p class="przypisanyKierowcaP">Numer telefonu</p>
        <div class="przypisanyKierowca">
          <h3>${driver.telefon || "Brak"}</h3>
        </div>
        <button class="usunPojazdBtn" onclick="window.deleteDriverHandler()">
          <i class="fa-solid fa-trash"></i>Usuń kierowcę
        </button>
      `);

      hideDeleteButtons(currentUserRole);
    }
  } else if (type === "dokument") {
    const doc = await getDocumentDetails(id);
    if (doc) {
      const ownerName = await fetchDocumentOwnerName(doc);
      const { background, border } = getStatusColors(doc.status);

      const modal = document.getElementById("detailsModal");
      if (modal) {
        modal.dataset.dokumentId = id;
        modal.dataset.dokumentTypWlasciciela = doc.typ_wlasciciela;
        modal.dataset.dokumentWlascicielId = doc.wlasciciel_id;
      }

      const resolveDocumentUrl = (plikUrl) => {
        if (!plikUrl) return null;

        if (typeof plikUrl === "string") {
          try {
            const parsed = JSON.parse(plikUrl);
            if (parsed && typeof parsed === "object") {
              plikUrl = parsed;
            } else {
              return plikUrl;
            }
          } catch (_err) {
            return plikUrl;
          }
        }

        if (typeof plikUrl === "object") {
          if (typeof plikUrl.publicUrl === "string" && plikUrl.publicUrl) {
            return plikUrl.publicUrl;
          }
          if (typeof plikUrl.url === "string" && plikUrl.url) {
            return plikUrl.url;
          }
          if (typeof plikUrl.public_url === "string" && plikUrl.public_url) {
            return plikUrl.public_url;
          }
          if (typeof plikUrl.path === "string" && plikUrl.path) {
            return plikUrl.path;
          }
          const firstUrl = Object.values(plikUrl).find(
            (value) => typeof value === "string" && value.startsWith("http")
          );
          return firstUrl || null;
        }

        return null;
      };

      const fileUrl = resolveDocumentUrl(doc.plik_url);
      const downloadLink = fileUrl
        ? `<a class="pobierzPlik" href="${fileUrl}" target="_blank" rel="noreferrer" download><i class="fa-solid fa-arrow-up-from-bracket"></i>Pobierz plik</a>`
        : "";

      let editButton = "";
      const currentUser = await getCurrentUser();
      const userRole = await getUserRole();

      let canEdit = false;
      if (userRole === "Właściciel" || userRole === "Administrator") {
        canEdit = true;
      } else if (userRole === "Kierowca") {
        if (doc.typ_wlasciciela === "Kierowca") {
          const { data: userRecord } = await client
            .from("UZYTKOWNIK")
            .select("kierowca_id")
            .eq("email", currentUser.email)
            .maybeSingle();

          if (userRecord?.kierowca_id === doc.wlasciciel_id) {
            canEdit = true;
          }
        } else if (doc.typ_wlasciciela === "Pojazd") {
          const { data: userRecord } = await client
            .from("UZYTKOWNIK")
            .select("kierowca_id")
            .eq("email", currentUser.email)
            .maybeSingle();

          if (userRecord?.kierowca_id) {
            const { data: vehicles } = await client
              .from("POJAZD")
              .select("id")
              .eq("przypisany_kierowca_id", userRecord.kierowca_id);

            const vehicleIds = vehicles?.map((v) => v.id) || [];
            if (vehicleIds.includes(doc.wlasciciel_id)) {
              canEdit = true;
            }
          }
        }
      }

      if (canEdit) {
        editButton = `<button class="edytujBtn" onclick="window.editDocumentHandler()">
          <i class="fa-solid fa-pen-to-square"></i>Edytuj
        </button>`;
      }

      openModal(`
        <div class="markaModel">
          <h2>${doc.typ_dokumentu}</h2>
          <div>
            <div class="status-text" style="background-color:${background}; border: 2px solid ${border}; font-weight:bold">
              ${getStatusLabel(doc.status)}
            </div>
          </div>
        </div>
        <div class="danePojazdu">
          <div class="danePojazduTile">
            <p>Typ dokumentu</p>
            <h3>${doc.typ_wlasciciela}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Data wygaśnięcia</p>
            <h3>${doc.data_waznosci}</h3>
          </div>
        </div>
        <p class="przypisanyKierowcaP">Przypisany do</p>
        <div id="przypisanyKierowcaModal" class="przypisanyKierowca">
          <h3>${ownerName}</h3>
        </div>
        ${downloadLink}
        ${editButton}
        <button class="usunPojazdBtn" onclick="window.deleteDocumentHandler()">
          <i class="fa-solid fa-trash"></i>Usuń dokument
        </button>
      `);

      hideDeleteButtons(currentUserRole);
    }
  } else if (type === "uzytkownik") {
    const user = await getUserDetails(id);
    if (user) {
      const disableDelete = currentUserRole === "Przeglądający" || user.rola === "Właściciel";
      const deleteBtn = disableDelete
        ? ""
        : `<button class="usunPojazdBtn" onclick="window.deleteUserHandler()"><i class="fa-solid fa-trash"></i>Usuń użytkownika</button>`;

      let editButton = "";
      if (!disableDelete && currentUserRole !== "Kierowca") {
        editButton = `<button class="edytujBtn" onclick="window.editUserHandler()"><i class="fa-solid fa-pen-to-square"></i>Edytuj</button>`;
      }

      const modal = document.getElementById("detailsModal");
      if (modal) {
        modal.dataset.uzytkownikId = id;
      }

      openModal(`
        <div class="markaModel">
          <h2>${user.email}</h2>
          <p class="${user.rola}">${user.rola}</p>
        </div>
        <div class="danePojazdu">
          <div class="danePojazduTile">
            <p>Rola</p>
            <h3>${user.rola}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Status</p>
            <h3>${user.status}</h3>
          </div>
          <div class="danePojazduTile">
            <p>Dane osobowe</p>
            <h3>${user.imie && user.nazwisko ? `${user.imie} ${user.nazwisko}` : "Brak"}</h3>
          </div>
        </div>
        <p class="przypisanyKierowcaP">Firma</p>
        <div class="przypisanyKierowca">
          <h3>${
            Array.isArray(user.FIRMA) ? user.FIRMA[0]?.nazwa || "Brak" : user.FIRMA?.nazwa || "Brak"
          }</h3>

        </div>
        ${deleteBtn}
      `);

      hideDeleteButtons(currentUserRole);
    }
  }
});

window.deleteVehicleHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const vehicleId = modal?.dataset.pojazdId;

  if (!vehicleId) {
    showAlert(false, "Nie znaleziono ID pojazdu");
    return;
  }

  if (await handleDeleteVehicle(vehicleId)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadAndRenderVehicles(firmaId);
  }
};

window.deleteDriverHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const driverId = modal?.dataset.kierowcaId;

  if (!driverId) {
    showAlert(false, "Nie znaleziono ID kierowcy");
    return;
  }

  if (await handleDeleteDriver(driverId)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadAndRenderDrivers(firmaId);
  }
};

window.deleteDocumentHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const documentId = modal?.dataset.dokumentId;

  if (!documentId) {
    showAlert(false, "Nie znaleziono ID dokumentu");
    return;
  }

  if (await handleDeleteDocument(documentId)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadDocumentsForCompany(firmaId);
    await renderDocuments(getDocumentsCache());
    updateDocumentDashboardTiles();
  }
};

window.deleteUserHandler = async () => {
  const role = await getUserRole();
  if (role === "Przeglądający") {
    showAlert(false, "Nie masz uprawnień do usuwania użytkowników.");
    return;
  }

  if (!(await can("canManageUsers"))) {
    showAlert(false, "Nie masz uprawnień do usuwania użytkowników.");
    return;
  }

  const modal = document.getElementById("detailsModal");
  const userId = modal?.dataset.uzytkownikId;

  if (!userId) {
    showAlert(false, "Nie znaleziono ID użytkownika");
    return;
  }

  if (await handleDeleteUser(userId)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadAndRenderUsers(firmaId);
  }
};

window.editUserHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const userId = modal?.dataset.uzytkownikId;

  if (!userId) {
    showAlert(false, "Nie znaleziono ID użytkownika");
    return;
  }

  const user = await getUserDetails(userId);
  if (!user) return;

  openModal(`
    <div class="header">
      <p>Edytuj użytkownika</p>
    </div>
    <div class="createDokumentForm createForm">
      <p>Imię</p>
      <input type="text" id="editUserImie" value="${user.imie || ""}" />
      <p>Nazwisko</p>
      <input type="text" id="editUserNazwisko" value="${user.nazwisko || ""}" />
      <p>Telefon</p>
      <input type="text" id="editUserTelefon" value="${user.telefon || ""}" />
      <div class="createFormButtons">
        <button class="acceptButton" onclick="window.saveEditedUser()">
          Zapisz zmiany
        </button>
        <button class="cancelButton" onclick="window.cancelEditUser()">
          Anuluj
        </button>
      </div>
    </div>
  `);
};

window.saveEditedUser = async () => {
  const modal = document.getElementById("detailsModal");
  const userId = modal?.dataset.uzytkownikId;

  const imie = document.getElementById("editUserImie")?.value.trim();
  const nazwisko = document.getElementById("editUserNazwisko")?.value.trim();
  const telefon = document.getElementById("editUserTelefon")?.value.trim();

  if (!imie || !nazwisko) {
    showAlert(false, "Imię i nazwisko są wymagane");
    return;
  }

  const { handleUpdateUserFromAdmin } = await import("./services/userService.js");
  if (await handleUpdateUserFromAdmin(userId, imie, nazwisko, telefon)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadAndRenderUsers(firmaId);
  }
};

window.cancelEditUser = () => {
  closeModal();
};

window.editDocumentHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const documentId = modal?.dataset.dokumentId;

  if (!documentId) {
    showAlert(false, "Nie znaleziono ID dokumentu");
    return;
  }

  const doc = await getDocumentDetails(documentId);
  if (!doc) return;

  openModal(`
    <div class="header">
      <p>Edytuj dokument</p>
    </div>
    <div class="createDokumentForm createForm">
      <p>Nazwa dokumentu</p>
      <input type="text" id="editDokumentNazwa" value="${doc.typ_dokumentu}" />
      <p>Data ważności</p>
      <input type="date" id="editDokumentDataWaznosci" value="${doc.data_waznosci}" />
      <div class="createFormButtons">
        <button class="acceptButton" onclick="window.saveEditedDocument()">
          Zapisz zmiany
        </button>
        <button class="cancelButton" onclick="window.cancelEditDocument()">
          Anuluj
        </button>
      </div>
    </div>
  `);
};

window.saveEditedDocument = async () => {
  const modal = document.getElementById("detailsModal");
  const documentId = modal?.dataset.dokumentId;

  const nazwa = document.getElementById("editDokumentNazwa")?.value.trim();
  const data = document.getElementById("editDokumentDataWaznosci")?.value;

  if (
    await handleUpdateDocument(documentId, {
      typ_dokumentu: nazwa,
      data_waznosci: data,
    })
  ) {
    closeModal();

    const firmaId = await getCompanyIdForUser();
    const role = await getUserRole();
    const { renderUpcomingDocuments } = await import("./services/dashboardService.js");

    if (role === "Kierowca") {
      const { data: userRecord } = await client
        .from("UZYTKOWNIK")
        .select("kierowca_id")
        .eq("email", (await getCurrentUser()).email)
        .single();

      if (userRecord?.kierowca_id) {
        await loadDocumentsForDriverDashboard(userRecord.kierowca_id);
        await renderUpcomingDocuments(userRecord.kierowca_id);
      }
    } else {
      await loadDocumentsForCompany(firmaId);
      renderUpcomingDocuments();
    }

    await renderDocuments(getDocumentsCache());
    updateDocumentDashboardTiles();
  }
};

window.cancelEditDocument = () => {
  closeModal();
};

window.assignVehicleHandler = async () => {
  const modal = document.getElementById("detailsModal");
  const vehicleId = modal?.dataset.pojazdId;

  if (!vehicleId) {
    showAlert(false, "Nie znaleziono ID pojazdu");
    return;
  }

  const firmaId = await getCompanyIdForUser();
  const { drivers, error } = await fetchAvailableDrivers(firmaId);

  if (error || !drivers || drivers.length === 0) {
    showAlert(false, "Brak dostępnych kierowców");
    return;
  }

  const driverOptions = drivers
    .map((d) => `<option value="${d.id}">${d.imie_nazwisko}</option>`)
    .join("");

  openModal(`
    <div class="header">
      <p>Przypisz pojazd kierowcy</p>
    </div>
    <div class="createDokumentForm createForm">
      <p>Wybierz kierowcę</p>
      <select id="selectKierowcaForVehicle">
        <option value="">-- Wybierz kierowcę --</option>
        ${driverOptions}
      </select>
      <div class="createFormButtons">
        <button class="acceptButton" onclick="window.saveAssignedVehicle()">
          Przypisz
        </button>
        <button class="cancelButton" onclick="window.cancelAssignVehicle()">
          Anuluj
        </button>
      </div>
    </div>
  `);
};

window.saveAssignedVehicle = async () => {
  const modal = document.getElementById("detailsModal");
  const vehicleId = modal?.dataset.pojazdId;
  const driverId = document.getElementById("selectKierowcaForVehicle")?.value;

  if (!driverId) {
    showAlert(false, "Wybierz kierowcę");
    return;
  }

  if (await handleAssignVehicleToDriver(vehicleId, driverId)) {
    closeModal();
    const firmaId = await getCompanyIdForUser();
    await loadAndRenderVehicles(firmaId);
  }
};

window.cancelAssignVehicle = () => {
  closeModal();
};

document.addEventListener("click", async (e) => {
  const role = await getUserRole();

  if (role === "Przeglądający") {
    if (e.target.closest(".addButton")) {
      e.preventDefault();
      showAlert(false, "Nie masz uprawnień do dodawania ani modyfikowania danych.");
      return;
    }
  }
});

window.addEventListener("load", async () => {
  await ensureUserHasRole();
  await applyRoleRestrictions();

  initModalHandlers();
  initPhoneMask("kierowcaTelefon");
  initPhoneMask("userTelefon");

  setupUIEventHandlers();

  const filterButtons = document.querySelectorAll(".filtry .buttons button");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.parentElement;
      group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyDocumentFilters();
    });
  });

  const fileInput = document.getElementById("fileInput");
  const uploadBox = document.querySelector(".upload-box");

  if (uploadBox && fileInput) {
    uploadBox.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        uploadBox.querySelector("p").textContent = fileInput.files[0].name;
      }
    });

    uploadBox.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadBox.classList.add("dragover");
    });

    uploadBox.addEventListener("dragleave", () => {
      uploadBox.classList.remove("dragover");
    });

    uploadBox.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadBox.classList.remove("dragover");

      const file = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;

      uploadBox.querySelector("p").textContent = file.name;
    });
  }
});

window.addEventListener("unload", () => {
  hideLoader();
});
