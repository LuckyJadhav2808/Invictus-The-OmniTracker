(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
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
