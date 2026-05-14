import { client } from "./js/api/supabase.js";
import { showAlert } from "./js/ui/alertService.js";

async function login() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginErrorElement = document.getElementById("login_error");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (loginErrorElement) {
      loginErrorElement.innerText = "Niepoprawne hasło albo email.";
    }
    return;
  }

  const { data: authData } = await client.auth.getUser();

  const { data: userRecord } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("auth_id", authData.user.id)
    .maybeSingle();

  if (!userRecord) {
    await client.from("UZYTKOWNIK").insert({
      email: authData.user.email,
      auth_id: authData.user.id,
      rola: "Właściciel",
      status: "aktywny",
    });
  }

  window.location.href = "dashboard.html";
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    login();
  }
});

window.login = login;
