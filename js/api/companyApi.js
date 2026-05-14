import { client } from "../api/supabase.js";

export async function fetchCompanyById(id) {
  const { data: company, error } = await client
    .from("FIRMA")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { company, error };
}

export async function createCompany(companyData) {
  const { error } = await client.from("FIRMA").insert(companyData).select().single();

  return { error };
}

export async function updateCompany(id, companyData) {
  const { error } = await client.from("FIRMA").update(companyData).eq("id", id);

  return { error };
}
