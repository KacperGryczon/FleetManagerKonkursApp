import { fetchCompanyById, createCompany, updateCompany } from "../api/companyApi.js";
import { showAlert } from "../ui/alertService.js";
import { validateEmail } from "../utils/validators.js";
import { client } from "../api/supabase.js";
import { getCurrentUser, getCompanyIdForUser } from "../auth/authService.js";

export async function handleCreateCompany(companyName, companyEmail) {
  if (!companyName || !companyName.trim()) {
    showAlert(false, "Podaj nazwę firmy.");
    return false;
  }

  if (!validateEmail(companyEmail)) {
    showAlert(false, "Podaj poprawny adres email.");
    return false;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    showAlert(false, "Brak zalogowanego użytkownika.");
    return false;
  }

  const { error } = await createCompany({
    nazwa: companyName,
    email: companyEmail,
    user_id: currentUser.id,
  });

  if (error) {
    console.error("Błąd tworzenia firmy:", error);
    showAlert(false, "Nie udało się dodać firmy.");
    return false;
  }

  const { data: firma, error: firmaError } = await client
    .from("FIRMA")
    .select("id")
    .eq("user_id", currentUser.id)
    .single();

  if (firmaError || !firma) {
    console.error("Błąd pobierania firmy:", firmaError);
    showAlert(false, "Nie udało się pobrać danych firmy.");
    return false;
  }

  const { data: userRecord, error: getUserError } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("auth_id", currentUser.id)
    .maybeSingle();

  if (getUserError) {
    console.error("Błąd pobierania danych użytkownika:", getUserError);
  }

  if (!userRecord) {
    const { error: insertError } = await client.from("UZYTKOWNIK").insert({
      auth_id: currentUser.id,
      email: currentUser.email,
      firma_id: firma.id,
      rola: "Właściciel",
      status: "aktywny",
    });

    if (insertError) {
      console.error("Błąd tworzenia wpisu użytkownika:", insertError);
      showAlert(false, "Nie udało się zaktualizować profilu.");
      return false;
    }
  } else {
    const { error: updateError } = await client
      .from("UZYTKOWNIK")
      .update({ firma_id: firma.id })
      .eq("auth_id", currentUser.id);

    if (updateError) {
      console.error("Błąd aktualizacji profilu:", updateError);
      showAlert(false, "Nie udało się zaktualizować profilu.");
      return false;
    }
  }

  showAlert(true, "Firma została dodana.");
  return true;
}

export async function loadCompanySettings() {
  const currentUser = await getCurrentUser();

  if (!currentUser) return null;

  const companyId = await getCompanyIdForUser();

  if (!companyId) return null;

  const { company, error } = await fetchCompanyById(companyId);

  if (error) return null;

  return company;
}

export async function renderCompanySettings() {
  const company = await loadCompanySettings();

  if (!company) {
    showAlert(false, "Nie udało się pobrać danych firmy.");
    return;
  }

  document.getElementById("firmaDaneNazwa").value = company.nazwa || "";
  document.getElementById("firmaMail").value = company.email || "";
  document.getElementById("firmaDaneAdres").value = company.adres || "";
  document.getElementById("firmaNIP").value = company.nip || "";
  document.getElementById("firmaREGON").value = company.regon || "";
  document.getElementById("firmaNumerLicencji").value = company.numer_licencji || "";
}

export async function handleUpdateCompanySettings(companyData) {
  const companyId = await getCompanyIdForUser();

  if (!companyId) {
    showAlert(false, "Nie znaleziono firmy użytkownika.");
    return false;
  }

  const { error } = await updateCompany(companyId, companyData);

  if (error) {
    showAlert(false, "Nie udało się zapisać zmian.");
    return false;
  }

  showAlert(true, "Zapisano zmiany.");
  return true;
}
