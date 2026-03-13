type ThemeMode = "system" | "dark" | "light";

const button = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
const labelNode = button?.querySelector<HTMLElement>("[data-theme-toggle-label]") ?? null;
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const labels: Record<ThemeMode, string> = {
  system: "Auto",
  dark: "Dark",
  light: "Light"
};

function resolveThemeMode(value: string | undefined): ThemeMode {
  return value === "dark" || value === "light" ? value : "system";
}

function applyTheme(root: HTMLElement, mode: ThemeMode) {
  root.dataset.themeMode = mode;
  root.dataset.theme =
    mode === "system" ? (mediaQuery.matches ? "dark" : "light") : mode;
}

function syncLabel(root: HTMLElement) {
  if (!button) return;
  const mode = resolveThemeMode(root.dataset.themeMode);
  const label = labels[mode];
  button.dataset.mode = mode;
  if (labelNode) {
    labelNode.textContent = label;
  }
  button.setAttribute("aria-label", `Theme: ${label}`);
}

function toggleTheme() {
  const root = document.documentElement;
  const current = resolveThemeMode(root.dataset.themeMode);
  const next =
    current === "system" ? "dark" : current === "dark" ? "light" : "system";
  localStorage.setItem("theme", next);
  applyTheme(root, next);
  syncLabel(root);
}

if (button) {
  syncLabel(document.documentElement);
  button.addEventListener("click", toggleTheme);
}

mediaQuery.addEventListener("change", () => {
  const root = document.documentElement;
  if (resolveThemeMode(root.dataset.themeMode) === "system") {
    applyTheme(root, "system");
    syncLabel(root);
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);

  if (
    isEditable ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    !event.shiftKey ||
    event.key.toLowerCase() !== "t"
  ) {
    return;
  }

  event.preventDefault();
  toggleTheme();
});
