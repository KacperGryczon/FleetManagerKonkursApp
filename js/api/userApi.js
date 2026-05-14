import { client } from "../api/supabase.js";

export async function fetchUsers(firmaId) {
  const { data: users, error } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("firma_id", firmaId)
    .order("data_utworzenia", { ascending: false });

  return { users, error };
}

export async function fetchUserById(id) {
  const { data: user, error } = await client
    .from("UZYTKOWNIK")
    .select("*, FIRMA:firma_id (nazwa)")
    .eq("id", id)
    .single();

  return { user, error };
}

export async function fetchUserByEmail(email) {
  const { data: user, error } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  return { user, error };
}

export async function fetchUserByAuthId(authId) {
  const { data: user, error } = await client
    .from("UZYTKOWNIK")
    .select("id, kierowca_id")
    .eq("auth_id", authId)
    .maybeSingle();

  return { user, error };
}

export async function createUser(userData) {
  const { error } = await client.from("UZYTKOWNIK").insert(userData);
  return { error };
}

export async function updateUser(id, userData) {
  const { error } = await client.from("UZYTKOWNIK").update(userData).eq("id", id);

  return { error };
}

export async function deleteUser(id) {
  const { error } = await client.from("UZYTKOWNIK").delete().eq("id", id);
  return { error };
}

export async function fetchUserProfile(email) {
  const { data: user, error } = await client
    .from("UZYTKOWNIK")
    .select("imie, nazwisko, telefon, email")
    .eq("email", email)
    .maybeSingle();

  return { user, error };
}
