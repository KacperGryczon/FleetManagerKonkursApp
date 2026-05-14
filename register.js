import { client } from "./js/api/supabase.js";
import { validatePassword } from "./js/utils/validators.js";

async function register() {
  const emailInput = document.getElementById("registerEmail");
  const passwordInput = document.getElementById("registerPassword");
  const confirmPasswordInput = document.getElementById("confirmed_password");
  const errorBoxElement = document.getElementById("register_error");

  if (!emailInput || !passwordInput || !confirmPasswordInput || !errorBoxElement) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmed = confirmPasswordInput.value;

  errorBoxElement.style.color = "red";
  errorBoxElement.innerText = "";

  if (!validatePassword(password)) {
    errorBoxElement.innerText = "Hasło musi mieć min. 10 znaków, cyfrę i znak specjalny.";
    return;
  }

  if (password !== confirmed) {
    errorBoxElement.innerText = "Hasła się nie zgadzają.";
    return;
  }

  const { data: userRow } = await client
    .from("UZYTKOWNIK")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  const isOwnerRegistration = !userRow;

  const { data: signupData, error: signupError } = await client.auth.signUp({
    email,
    password,
  });

  if (signupError) {
    errorBoxElement.innerText = "Nie udało się utworzyć konta.";
    return;
  }

  const userFromSignup = signupData?.user;
  let user = userFromSignup;

  if (!user) {
    const { data: authData } = await client.auth.getUser();
    user = authData.user;
  }

  if (!user) {
    errorBoxElement.innerText = "Konto utworzone, ale musisz potwierdzić email i zalogować się.";
    return;
  }

  if (isOwnerRegistration) {
    await client.from("UZYTKOWNIK").insert({
      email,
      auth_id: user.id,
      rola: "Właściciel",
      status: "aktywny",
    });

    errorBoxElement.style.color = "green";
    errorBoxElement.innerText = "Konto właściciela utworzone. Zaloguj się i utwórz firmę.";
    window.location.href = "index.html";
    return;
  }

  if (userRow.status === "zaproszony") {
    await client
      .from("UZYTKOWNIK")
      .update({ status: "aktywny", auth_id: user.id })
      .eq("email", email);

    errorBoxElement.style.color = "green";
    errorBoxElement.innerText = "Konto aktywowane. Możesz się zalogować.";
    return;
  }

  errorBoxElement.innerText = "Nie możesz założyć konta. Skontaktuj się z administratorem.";
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    register();
  }
});

window.register = register;
