import { client } from "../api/supabase.js";

let cachedUserRole = null;
let cachedCompanyId = null;
let roleExpiresAt = 0;
let companyIdExpiresAt = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getCurrentUser() {
  const { data } = await client.auth.getUser();
  return data.user || null;
}

export async function getCurrentSession() {
  const { data } = await client.auth.getSession();
  return data.session || null;
}

export function invalidateRoleCache() {
  cachedUserRole = null;
  roleExpiresAt = 0;
}

export function invalidateCompanyCache() {
  cachedCompanyId = null;
  companyIdExpiresAt = 0;
}

export async function getUserRole() {
  const now = Date.now();

  if (cachedUserRole !== null && now < roleExpiresAt) {
    return cachedUserRole;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  try {
    const { data: userRecord, error } = await client
      .from("UZYTKOWNIK")
      .select("rola")
      .eq("auth_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Błąd pobierania roli:", error);
      return null;
    }

    const role = userRecord?.rola || null;
    cachedUserRole = role;
    roleExpiresAt = now + CACHE_DURATION;

    return role;
  } catch (err) {
    console.error("Wyjątek przy pobieraniu roli:", err);
    return null;
  }
}

export async function getCompanyIdForUser() {
  const now = Date.now();

  if (cachedCompanyId !== null && now < companyIdExpiresAt) {
    return cachedCompanyId;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    console.error("getCompanyIdForUser: Brak zalogowanego użytkownika");
    return null;
  }

  const { data: companyFromUser, error: companyError } = await client
    .from("FIRMA")
    .select("id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (companyError) {
    console.error("Błąd pobierania firmy po user_id:", companyError);
  }

  if (companyFromUser?.id) {
    console.log("getCompanyIdForUser: Znaleziono firmę po user_id:", companyFromUser.id);
    cachedCompanyId = companyFromUser.id;
    companyIdExpiresAt = now + CACHE_DURATION;
    return companyFromUser.id;
  }

  const { data: userRecord, error: userError } = await client
    .from("UZYTKOWNIK")
    .select("firma_id")
    .eq("auth_id", currentUser.id)
    .maybeSingle();

  if (userError) {
    console.error("Błąd pobierania firma_id z UZYTKOWNIK:", userError);
  }

  if (!userRecord) {
    console.error("getCompanyIdForUser: Nie znaleziono wpisu użytkownika w UZYTKOWNIK");
    return null;
  }

  const firmaId = userRecord?.firma_id;
  if (!firmaId) {
    console.error("getCompanyIdForUser: Użytkownik nie ma przypisanej firmy (firma_id jest null)");
    return null;
  }

  console.log("getCompanyIdForUser: Znaleziono firmę z UZYTKOWNIK:", firmaId);
  cachedCompanyId = firmaId;
  companyIdExpiresAt = now + CACHE_DURATION;
  return firmaId;
}

export async function checkSession(redirectIfLoggedIn = false) {
  const currentUser = await getCurrentUser();

  if (currentUser && redirectIfLoggedIn) {
    window.location.href = "dashboard.html";
  }

  return currentUser;
}

export async function logout() {
  await client.auth.signOut();
  window.location.href = "index.html";
}

export async function ensureUserHasRole() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const { data: existing } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("email", currentUser.email)
    .maybeSingle();

  if (existing) return;

  const { data: company } = await client
    .from("FIRMA")
    .select("id")
    .eq("user_id", currentUser.id)
    .single();

  if (!company) {
    return;
  }

  await client.from("UZYTKOWNIK").insert({
    firma_id: company.id,
    email: currentUser.email,
    rola: "Właściciel",
    status: "aktywny",
  });
}
