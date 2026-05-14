import { client } from "../api/supabase.js";

export async function fetchDocuments(firmaId) {
  const { data: documents, error } = await client
    .from("DOKUMENT")
    .select("*")
    .eq("firma_id", firmaId)
    .order("data_waznosci", { ascending: true });

  return { documents, error };
}

export async function fetchDocumentsForDriver(kierowcaId) {
  const { data: driverDocuments, error: driverDocError } = await client
    .from("DOKUMENT")
    .select("*")
    .eq("typ_wlasciciela", "Kierowca")
    .eq("wlasciciel_id", kierowcaId);

  return { documents: driverDocuments, error: driverDocError };
}

export async function fetchDocumentsForVehicles(vehicleIds) {
  if (vehicleIds.length === 0) {
    return { documents: [], error: null };
  }

  const { data: vehicleDocuments, error } = await client
    .from("DOKUMENT")
    .select("*")
    .eq("typ_wlasciciela", "Pojazd")
    .in("wlasciciel_id", vehicleIds);

  return { documents: vehicleDocuments || [], error };
}

export async function fetchDocumentById(id) {
  const { data: document, error } = await client.from("DOKUMENT").select("*").eq("id", id).single();

  return { document, error };
}

export async function fetchVehicleNameForDocument(vehicleId) {
  const { data, error } = await client
    .from("POJAZD")
    .select("numer_rejestracyjny")
    .eq("id", vehicleId)
    .single();

  return { name: data?.numer_rejestracyjny || "—", error };
}

export async function fetchDriverNameForDocument(driverId) {
  const { data, error } = await client
    .from("KIEROWCA")
    .select("imie_nazwisko")
    .eq("id", driverId)
    .single();

  return { name: data?.imie_nazwisko || "—", error };
}

export async function fetchCompanyNameForDocument(companyId) {
  const { data, error } = await client.from("FIRMA").select("nazwa").eq("id", companyId).single();

  return { name: data?.nazwa || "Firma", error };
}

export async function createDocument(documentData) {
  const { error } = await client.from("DOKUMENT").insert(documentData);
  return { error };
}

export async function uploadDocumentFile(filePath, file) {
  const { error } = await client.storage.from("dokumenty").upload(filePath, file);

  return { error };
}

export async function getDocumentFileUrl(filePath) {
  const { data } = await client.storage.from("dokumenty").getPublicUrl(filePath);
  return data?.publicUrl || null;
}

export async function deleteDocument(id) {
  const { error } = await client.from("DOKUMENT").delete().eq("id", id);
  return { error };
}

export async function updateDocument(id, updateData) {
  const { error } = await client.from("DOKUMENT").update(updateData).eq("id", id);

  return { error };
}

export async function fetchDocumentsForPublicView() {
  const { data: documents, error } = await client
    .from("DOKUMENT")
    .select("*")
    .order("data_waznosci", { ascending: true });

  return { documents, error };
}

export async function fetchVehiclesForPublicView() {
  const { data: vehicles, error } = await client
    .from("POJAZD")
    .select(
      "id, typ, numer_rejestracyjny, marka, model, przypisany_kierowca_id, KIEROWCA:przypisany_kierowca_id (imie_nazwisko)"
    )
    .order("numer_rejestracyjny", { ascending: true });

  return { vehicles, error };
}

export async function fetchDriversForPublicView() {
  const { data: drivers, error } = await client
    .from("KIEROWCA")
    .select("id, imie_nazwisko, telefon, email")
    .order("imie_nazwisko", { ascending: true });

  return { drivers, error };
}
