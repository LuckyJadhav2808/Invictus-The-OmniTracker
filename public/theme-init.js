(function () {
  try {
    var stored = localStorage.getItem("theme");
    // Light is the default theme across onboarding, login, and all spaces
    // unless the user has explicitly selected and saved "dark".
    var isDark = stored === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    var storedColor =
      localStorage.getItem("invictus-color-theme") || "classic";
    document.documentElement.setAttribute("data-color-theme", storedColor);
  } catch (e) {}
})();
