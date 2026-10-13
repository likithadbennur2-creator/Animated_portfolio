const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "LIGHT" : "DARK";
}

let savedTheme = "light";
try {
  savedTheme = localStorage.getItem("aiTheme") || "light";
} catch (e) {}

applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const next =
    document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";

  applyTheme(next);

  try {
    localStorage.setItem("aiTheme", next);
  } catch (e) {}
});