import { showLoader, hideLoader } from "./loaderService.js";
import { showAlert } from "./alertService.js";
import { getUserRole, getCompanyIdForUser } from "../auth/authService.js";
import { getBlockedViews } from "../auth/permissionService.js";

let currentViewId = null;

export function setCurrentViewId(viewId) {
  currentViewId = viewId;
}

export function getCurrentViewId() {
  return currentViewId;
}

export async function showView(viewId, title, loadViewDataCallback) {
  if (currentViewId === viewId) {
    return;
  }

  showLoader();

  const role = await getUserRole();
  const blockedViews = getBlockedViews(role);

  if (blockedViews.includes(viewId)) {
    hideLoader();
    if (viewId !== "viewDashboard") {
      return showView("viewDashboard", "Pulpit", async () => {
        await loadDashboardData?.();
      });
    }
    return;
  }

  document.querySelectorAll(".inView").forEach((view) => {
    view.classList.remove("visible");
  });

  const viewElement = document.getElementById(viewId);
  if (!viewElement) {
    hideLoader();
    return;
  }

  viewElement.classList.add("visible");

  const formViews = [
    "viewDodajPojazd",
    "viewDodajKierowcę",
    "viewDodajDokument",
    "viewDodajUzytkownika",
  ];
  if (formViews.includes(viewId)) {
    viewElement.querySelectorAll("input").forEach((el) => {
      el.value = "";
    });
  }

  if (title) {
    const titleElement = document.getElementById("viewTitle");
    if (titleElement) {
      titleElement.innerText = title;
    }
  }

  if (loadViewDataCallback) {
    await loadViewDataCallback();
  }

  hideLoader();
  setActiveMenu(viewId);
  currentViewId = viewId;
}

function setActiveMenu(viewId) {
  document.querySelectorAll(".viewButton").forEach((btn) => {
    btn.classList.remove("active");
  });

  const viewMenuMapping = {
    viewDashboard: "viewDashboard",
    viewPojazdy: "viewPojazdy",
    viewDodajPojazd: "viewPojazdy",
    viewKierowcy: "viewKierowcy",
    viewDodajKierowcę: "viewKierowcy",
    viewDokumenty: "viewDokumenty",
    viewDodajDokument: "viewDokumenty",
    viewUżytkownicy: "viewUżytkownicy",
    viewDodajUzytkownika: "viewUżytkownicy",
    viewUstawieniaFirmy: "viewUstawieniaFirmy",
    viewUstawieniaProfilu: "viewUstawieniaProfilu",
    viewMojeDokumenty: "viewMojeDokumenty",
    viewMojePojazdy: "viewMojePojazdy",
  };

  const targetView = viewMenuMapping[viewId];
  if (!targetView) return;

  const btn = document.querySelector(`.viewButton[data-view="${targetView}"]`);
  if (btn) btn.classList.add("active");
}

export function initMenuToggle() {
  const menuButton = document.getElementById("menuBarOpen");
  const menuBar = document.getElementById("menuBar");
  const menuCloseBtn = document.getElementById("menuCloseBtn");
  let menuOverlay = document.getElementById("menuOverlay");

  if (!menuOverlay) {
    menuOverlay = document.createElement("div");
    menuOverlay.id = "menuOverlay";
    menuOverlay.className = "menuOverlay";
    document.body.appendChild(menuOverlay);
  }

  if (menuButton) {
    menuButton.addEventListener("click", () => {
      menuBar.classList.toggle("open");
      menuOverlay.classList.toggle("active");
      console.log("siema");
    });
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener("click", () => {
      menuBar.classList.remove("open");
      menuOverlay.classList.remove("active");
    });
  }

  menuOverlay.addEventListener("click", () => {
    menuBar.classList.remove("open");
    menuOverlay.classList.remove("active");
  });

  document.querySelectorAll("#menuBar .viewButton").forEach((btn) => {
    btn.addEventListener("click", () => {
      menuBar.classList.remove("open");
      menuOverlay.classList.remove("active");
    });
  });
}

export function showMenu(menuItemIds) {
  menuItemIds.forEach((id) => {
    const btn = document.querySelector(`.viewButton[data-view="${id}"]`);
    if (btn) btn.style.display = "flex";
  });
}

export function hideAllMenuItems() {
  document.querySelectorAll(".addButton").forEach((btn) => {
    btn.style.display = "none";
  });

  document.querySelectorAll(".viewButton").forEach((btn) => {
    btn.style.display = "none";
  });
}

export function showAddButtons() {
  document.querySelectorAll(".addButton").forEach((btn) => {
    btn.style.display = "flex";
  });
}
