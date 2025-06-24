// client/admin.js

const loginForm = document.getElementById("admin-login-form");
const passwordInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const dashboard = document.getElementById("admin-dashboard");

const ADMIN_PASSWORD = "password"; // TODO: Secure later w/ real auth

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (passwordInput.value === ADMIN_PASSWORD) {
    loginForm.classList.add("hidden");
    loginError.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadCalendar();
  } else {
    loginError.classList.remove("hidden");
  }
});

function loadCalendar() {
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    height: "auto",
    events: [], // will pull from backend later
  });

  calendar.render();
}
