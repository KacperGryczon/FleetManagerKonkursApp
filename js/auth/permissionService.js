import { getUserRole } from "./authService.js";

const PERMISSIONS = {
  Właściciel: {
    canManageFleet: true,
    canManageDrivers: true,
    canManageDocuments: true,
    canManageUsers: true,
    canViewAll: true,
    canViewOwn: true,
  },
  Administrator: {
    canManageFleet: true,
    canManageDrivers: true,
    canManageDocuments: true,
    canManageUsers: true,
    canViewAll: true,
    canViewOwn: true,
  },
  Kierowca: {
    canManageFleet: false,
    canManageDrivers: false,
    canManageDocuments: false,
    canManageUsers: false,
    canViewAll: false,
    canViewOwn: true,
  },
  Przeglądający: {
    canManageFleet: false,
    canManageDrivers: false,
    canManageDocuments: false,
    canManageUsers: false,
    canViewAll: true,
    canViewOwn: false,
  },
};

export async function can(action) {
  const role = await getUserRole();
  return PERMISSIONS[role]?.[action] === true;
}

export function getBlockedViews(role) {
  const viewRestrictions = {
    Kierowca: ["viewPojazdy", "viewDodajPojazd", "viewUżytkownicy", "viewUstawieniaFirmy"],
    Przeglądający: [
      "viewDodajPojazd",
      "viewDodajKierowce",
      "viewDodajDokument",
      "viewUstawieniaFirmy",
    ],
  };

  return viewRestrictions[role] || [];
}

export function getMenuVisibility(role) {
  const menuMap = {
    Właściciel: [
      "viewDashboard",
      "viewPojazdy",
      "viewKierowcy",
      "viewDokumenty",
      "viewUżytkownicy",
      "viewUstawieniaFirmy",
      "viewUstawieniaProfilu",
    ],
    Administrator: [
      "viewDashboard",
      "viewPojazdy",
      "viewKierowcy",
      "viewDokumenty",
      "viewUżytkownicy",
      "viewUstawieniaFirmy",
      "viewUstawieniaProfilu",
    ],
    Przeglądający: [
      "viewDashboard",
      "viewPojazdy",
      "viewKierowcy",
      "viewDokumenty",
      "viewUżytkownicy",
      "viewUstawieniaProfilu",
    ],
    Kierowca: ["viewDashboard", "viewMojePojazdy", "viewMojeDokumenty", "viewUstawieniaProfilu"],
  };

  return menuMap[role] || [];
}
