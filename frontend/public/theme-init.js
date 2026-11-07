try {
  const theme = localStorage.getItem("eikon-theme");
  if (theme === "dark") document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
} catch {}

const locale = window.location.pathname.match(/^\/(ro|en)(?:\/|$)/)?.[1];
if (locale) document.documentElement.lang = locale;
