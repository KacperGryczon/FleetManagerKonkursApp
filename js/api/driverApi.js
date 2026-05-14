import { client } from "../api/supabase.js";

export async function fetchDrivers(firmaId) {
  const { data: drivers, error } = await client
    .from("KIEROWCA")
    .select("id, imie_nazwisko, telefon, email")
    .eq("firma_id", firmaId)
    .order("imie_nazwisko", { ascending: true });

  return { drivers, error };
}

export async function fetchDriverById(id) {
  const { data: driver, error } = await client.from("KIEROWCA").select("*").eq("id", id).single();

  return { driver, error };
}

export async function checkDriverExists(email) {
  const { data: driver, error } = await client
    .from("KIEROWCA")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return { driver, error };
}

export async function createDriver(driverData) {
  const { error } = await client.from("KIEROWCA").insert(driverData);
  return { error };
}

export async function updateDriver(id, driverData) {
  const { error } = await client.from("KIEROWCA").update(driverData).eq("id", id);

  return { error };
}

export async function deleteDriver(id) {
  const { error } = await client.from("KIEROWCA").delete().eq("id", id);
  return { error };
}

export async function fetchAvailableDriversForUser(firmaId) {
  const { data: drivers, error: driversError } = await client
    .from("KIEROWCA")
    .select("id, imie_nazwisko")
    .eq("firma_id", firmaId);

  if (driversError) {
    return { drivers: [], error: driversError };
  }

  const { data: assignedUsers, error: usersError } = await client
    .from("UZYTKOWNIK")
    .select("kierowca_id")
    .not("kierowca_id", "is", null);

  if (usersError) {
    return { drivers, error: usersError };
  }

  const occupiedDriverIds = new Set(assignedUsers.map((u) => u.kierowca_id));
  const availableDrivers = drivers.filter((d) => !occupiedDriverIds.has(d.id));

  return { drivers: availableDrivers, error: null };
}

export async function fetchDriverInfoForUser(kierowcaId) {
  const { data: driver, error } = await client
    .from("KIEROWCA")
    .select("imie_nazwisko, email")
    .eq("id", kierowcaId)
    .single();

  return { driver, error };
}
