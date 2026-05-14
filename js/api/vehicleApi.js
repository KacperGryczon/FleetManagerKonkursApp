import { client } from "../api/supabase.js";

export async function fetchVehicles(firmaId) {
  const { data: vehicles, error } = await client
    .from("POJAZD")
    .select(
      "id, numer_rejestracyjny, typ, marka, model, vin, rok_produkcji, przypisany_kierowca_id, KIEROWCA:przypisany_kierowca_id (imie_nazwisko)"
    )
    .eq("firma_id", firmaId)
    .order("numer_rejestracyjny", { ascending: true });

  return { vehicles, error };
}

export async function fetchVehiclesForDriver(kierowcaId) {
  const { data: vehicles, error } = await client
    .from("POJAZD")
    .select("*")
    .eq("przypisany_kierowca_id", kierowcaId);

  return { vehicles, error };
}

export async function fetchVehicleById(id) {
  const { data: vehicle, error } = await client
    .from("POJAZD")
    .select("*, KIEROWCA:przypisany_kierowca_id (imie_nazwisko)")
    .eq("id", id)
    .single();

  return { vehicle, error };
}

export async function createVehicle(vehicleData) {
  const { error } = await client.from("POJAZD").insert(vehicleData);
  return { error };
}

export async function deleteVehicle(id) {
  const { error } = await client.from("POJAZD").delete().eq("id", id);
  return { error };
}

export async function fetchAvailableDrivers(firmaId) {
  const { data: drivers, error } = await client
    .from("KIEROWCA")
    .select("id, imie_nazwisko")
    .eq("firma_id", firmaId);

  return { drivers, error };
}

export async function updateVehicle(id, updateData) {
  const { error } = await client.from("POJAZD").update(updateData).eq("id", id);

  return { error };
}
