import {
  fetchUsers,
  fetchUserById,
  fetchUserByEmail,
  fetchUserByAuthId,
  createUser,
  updateUser,
  deleteUser,
  fetchUserProfile,
} from "../api/userApi.js";
import { updateDriver, checkDriverExists } from "../api/driverApi.js";
import { showAlert } from "../ui/alertService.js";
import { validateEmail, validatePassword, validateDriverName } from "../utils/validators.js";
import { client } from "../api/supabase.js";
import { getCurrentUser, getCurrentSession } from "../auth/authService.js";
import { getCompanyIdForUser } from "../auth/authService.js";
import { can } from "../auth/permissionService.js";

let usersCache = [];

export function getUsersCache() {
  return usersCache;
}

export function setUsersCache(users) {
  usersCache = users;
}

export async function loadAndRenderUsers(firmaId) {
  const { users, error } = await fetchUsers(firmaId);

  if (error) {
    return false;
  }

  usersCache = users || [];
  renderUsers(usersCache);
  return true;
}

function renderUsers(userList) {
  const container = document.getElementById("użytkownicyRows");
  if (!container) return;

  container.innerHTML = "";

  userList.forEach((user) => {
    const row = document.createElement("div");
    row.classList.add("table", "table-row");
    row.innerHTML = `
      <div class="uzytkownicyDiv1">${user.email}</div>
      <div class="uzytkownicyDiv2">
        <div class="${user.rola}">${user.rola}</div>
      </div>
      <div class="uzytkownicyDiv3">${user.status}</div>
      <div class="uzytkownicyDiv4">
        <button data-details="uzytkownik" data-id="${user.id}">
          <i class="fa-regular fa-eye"></i>Szczegóły
        </button>
      </div>
    `;

    container.appendChild(row);
  });
}

export async function handleAddUser(userFormData, firmaId) {
  const { email, rola, kierowcaId, imie, nazwisko, password } = userFormData;

  if (!validateEmail(email)) {
    showAlert(false, "Podaj poprawny email.");
    return false;
  }

  if (!validatePassword(password)) {
    showAlert(false, "Hasło musi mieć min. 10 znaków, cyfrę i znak specjalny.");
    return false;
  }

  const currentSession = await getCurrentSession();
  const accessToken = currentSession?.access_token;
  const refreshToken = currentSession?.refresh_token;

  if (!accessToken || !refreshToken) {
    showAlert(false, "Nie udało się pobrać sesji właściciela.");
    return false;
  }

  const { data: newUserData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    showAlert(false, "Nie udało się utworzyć konta.");
    return false;
  }

  const newUserId = newUserData?.user?.id;

  if (!newUserId) {
    showAlert(false, "Nie udało się utworzyć konta użytkownika.");
    return false;
  }

  await client.auth.signOut();
  await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const { error: insertError } = await createUser({
    auth_id: newUserId,
    email,
    rola,
    imie,
    nazwisko,
    kierowca_id: kierowcaId,
    firma_id: firmaId,
    status: "aktywny",
  });

  if (insertError) {
    showAlert(false, "Nie udało się dodać użytkownika do firmy.");
    return false;
  }

  await loadAndRenderUsers(firmaId);

  showAlert(true, "Użytkownik został dodany.");
  return true;
}

export async function handleDeleteUser(userId) {
  if (!(await can("canManageUsers"))) {
    showAlert(false, "Nie masz uprawnień do usuwania użytkowników");
    return false;
  }

  const { error } = await deleteUser(userId);

  if (error) {
    showAlert(false, "Nie udało się usunąć użytkownika");
    return false;
  }

  showAlert(true, "Użytkownik został usunięty");
  return true;
}

export async function getUserDetails(userId) {
  const { user, error } = await fetchUserById(userId);

  if (error) {
    showAlert(false, "Nie znaleziono użytkownika");
    return null;
  }

  return user;
}

export async function loadUserProfile() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const { user, error } = await fetchUserProfile(currentUser.email);

  if (error) {
    return null;
  }

  return user;
}

export async function renderUserProfile() {
  const user = await loadUserProfile();

  if (!user) {
    showAlert(false, "Nie udało się pobrać danych profilu.");
    return;
  }

  document.getElementById("userImie").value = user.imie || "";
  document.getElementById("userNazwisko").value = user.nazwisko || "";
  document.getElementById("userTelefon").value = user.telefon || "+48 ";
}

export async function handleUpdateUserProfile(imie, nazwisko, telefon) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    showAlert(false, "Brak zalogowanego użytkownika.");
    return false;
  }

  const { user: userRecord, error: userError } = await fetchUserByAuthId(currentUser.id);

  if (userError) {
    showAlert(false, "Błąd pobierania użytkownika.");
    return false;
  }

  if (!userRecord) {
    showAlert(false, "Nie znaleziono użytkownika w bazie.");
    return false;
  }

  const { error } = await updateUser(userRecord.id, {
    imie,
    nazwisko,
    telefon,
  });

  if (error) {
    showAlert(false, "Błąd aktualizacji użytkownika.");
    return false;
  }

  let driverId = userRecord.kierowca_id;

  const { driver: existingDriver, error: driverLookupError } = await checkDriverExists(
    currentUser.email
  );

  if (driverLookupError) {
    console.error("Driver lookup error:", driverLookupError);
  }

  if (!driverId && existingDriver?.id) {
    driverId = existingDriver.id;

    const { error: linkError } = await updateUser(userRecord.id, {
      kierowca_id: driverId,
    });

    if (linkError) {
      console.warn("Nie udało się zaktualizować powiązania kierowcy:", linkError);
    }
  }

  if (driverId) {
    const driverUpdateData = {
      imie_nazwisko: `${imie} ${nazwisko}`,
      telefon,
    };

    const { error: driverError } = await updateDriver(driverId, driverUpdateData);

    if (driverError) {
      console.error("Driver update error:", driverError);
      showAlert(false, "Profil zapisano, ale nie udało się zaktualizować kierowcy.");
      return false;
    }
  }

  showAlert(true, "Zapisano zmiany.");
  return true;
}

export async function handleUpdateUserFromAdmin(userId, imie, nazwisko, telefon) {
  if (!(await can("canManageUsers"))) {
    showAlert(false, "Nie masz uprawnień do edycji użytkownika");
    return false;
  }

  const { error: updateError } = await updateUser(userId, {
    imie,
    nazwisko,
    telefon,
  });

  if (updateError) {
    showAlert(false, "Błąd aktualizacji użytkownika");
    return false;
  }

  const { data: userRecord, error: userLookupError } = await client
    .from("UZYTKOWNIK")
    .select("kierowca_id")
    .eq("id", userId)
    .single();

  if (userLookupError) {
    console.error("Error looking up user:", userLookupError);
    showAlert(true, "Użytkownik został zaktualizowany, ale kierowca nie mógł być zaktualizowany");
    return true;
  }

  if (userRecord?.kierowca_id) {
    const { error: driverError } = await updateDriver(userRecord.kierowca_id, {
      imie_nazwisko: `${imie} ${nazwisko}`,
      telefon,
    });

    if (driverError) {
      console.error("Driver update error:", driverError);
      showAlert(true, "Użytkownik został zaktualizowany, ale kierowca nie mógł być zaktualizowany");
      return true;
    }
  }

  showAlert(true, "Użytkownik został zaktualizowany");
  return true;
}

export async function handleChangePassword(currentPassword, newPassword, newPasswordConfirm) {
  if (newPassword !== newPasswordConfirm) {
    showAlert(false, "Nowe hasła nie są takie same.");
    return false;
  }

  if (!validatePassword(newPassword)) {
    showAlert(false, "Hasło musi mieć min. 10 znaków, zawierać cyfrę i znak specjalny.");
    return false;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    showAlert(false, "Brak zalogowanego użytkownika.");
    return false;
  }

  const { error: loginError } = await client.auth.signInWithPassword({
    email: currentUser.email,
    password: currentPassword,
  });

  if (loginError) {
    showAlert(false, "Obecne hasło jest nieprawidłowe.");
    return false;
  }

  const { error: updateError } = await client.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    showAlert(false, "Nie udało się zmienić hasła.");
    return false;
  }

  showAlert(true, "Hasło zostało zmienione.");
  return true;
}
