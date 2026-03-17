import { buildSearchIndex, searchDocuments, type SearchIndexDocument } from "../lib/search";

const root = document.querySelector<HTMLElement>("[data-search-root]");
const trigger = root?.querySelector<HTMLElement>("[data-search-trigger]") ?? null;
const form = root?.querySelector<HTMLFormElement>("[data-search-form]") ?? null;
const input = root?.querySelector<HTMLInputElement>("#search-input") ?? null;
const panel = root?.querySelector<HTMLElement>("[data-search-panel]") ?? null;
const results = root?.querySelector<HTMLElement>("[data-search-results]") ?? null;
const status = root?.querySelector<HTMLElement>("[data-search-status]") ?? null;

let index: SearchIndexDocument[] = [];
let isOpen = false;
let activeIndex = -1;

function syncInputState() {
  if (!input) return;
  input.setAttribute("aria-expanded", isOpen ? "true" : "false");

  if (activeIndex >= 0) {
    input.setAttribute("aria-activedescendant", `search-result-${activeIndex}`);
    return;
  }

  input.removeAttribute("aria-activedescendant");
}

function getResultLinks() {
  if (!results) return [] as HTMLAnchorElement[];
  return Array.from(results.querySelectorAll<HTMLAnchorElement>("a"));
}

function syncActiveResult(nextIndex: number, options: { focus?: boolean } = { focus: false }) {
  const links = getResultLinks();
  links.forEach((link) => link.classList.remove("is-active"));

  if (links.length === 0) {
    activeIndex = -1;
    syncInputState();
    return;
  }

  const boundedIndex = Math.max(0, Math.min(nextIndex, links.length - 1));
  const activeLink = links[boundedIndex];
  activeLink.classList.add("is-active");
  activeIndex = boundedIndex;
  syncInputState();
  activeLink.scrollIntoView({ block: "nearest" });

  if (options.focus) {
    activeLink.focus();
  }
}

async function loadIndex() {
  if (index.length > 0) return index;
  const response = await fetch("/index.json");
  if (!response.ok) throw new Error("Could not load search index");
  index = buildSearchIndex(await response.json());
  return index;
}

function renderResults(items: SearchIndexDocument[]) {
  if (!results) return;
  results.replaceChildren(
    ...items.map((item, itemIndex) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");
      const title = document.createElement("strong");
      const meta = document.createElement("span");
      const date = document.createElement("span");
      const category = document.createElement("span");
      const tags = document.createElement("span");
      const divider = () => {
        const element = document.createElement("span");
        element.className = "result-meta-divider";
        element.textContent = "·";
        return element;
      };

      link.href = item.url;
      link.id = `search-result-${itemIndex}`;
      link.className = "search-result-link";
      link.setAttribute("role", "option");
      title.className = "result-title";
      title.textContent = item.title;
      meta.className = "result-meta";
      date.className = "result-date";
      category.className = "result-category";
      tags.className = "result-tags";
      date.textContent = item.dateLabel;
      category.textContent = item.category;
      tags.textContent = (item.tags ?? []).map((tag) => `#${tag}`).join(" ");

      link.append(title);
      if (item.dateLabel || item.category || (item.tags ?? []).length > 0) {
        if (item.dateLabel) {
          meta.append(date);
        }

        if (item.dateLabel && item.category) {
          meta.append(divider());
        }

        if (item.category) {
          meta.append(category);
        }

        if ((item.dateLabel || item.category) && (item.tags ?? []).length > 0) {
          meta.append(divider());
        }

        if ((item.tags ?? []).length > 0) {
          meta.append(tags);
        }

        link.append(meta);
      }
      listItem.append(link);
      return listItem;
    })
  );
  activeIndex = -1;
  syncInputState();
}

async function runSearch(query: string) {
  if (!status || !results || !panel) return;
  if (!query.trim()) {
    status.textContent = "";
    status.hidden = true;
    panel.hidden = true;
    results.replaceChildren();
    activeIndex = -1;
    syncInputState();
    return;
  }

  try {
    const items = await loadIndex();
    const matches = searchDocuments(items, query);
    panel.hidden = false;
    status.hidden = matches.length > 0;
    status.textContent = matches.length > 0 ? "" : "No matching posts yet.";
    renderResults(matches);
  } catch {
    panel.hidden = false;
    status.hidden = false;
    status.textContent = "Search index unavailable. You can still browse posts.";
    results.replaceChildren();
    activeIndex = -1;
    syncInputState();
  }
}

function closeSearch() {
  if (!root) return;
  root.dataset.open = "false";
  isOpen = false;
  if (input) {
    input.value = "";
  }
  if (status) {
    status.textContent = "";
    status.hidden = true;
  }
  if (panel) {
    panel.hidden = true;
  }
  results?.replaceChildren();
  activeIndex = -1;
  syncInputState();
}

async function openSearch() {
  if (!root) return;
  root.dataset.open = "true";
  isOpen = true;
  if (input) {
    input.value = "";
    await runSearch("");
    input.focus();
  }
  syncInputState();
}

if (trigger && root) {
  trigger.addEventListener("click", async () => {
    if (isOpen) {
      closeSearch();
      return;
    }

    await openSearch();
  });
}

document.addEventListener("click", (event) => {
  if (!isOpen || !root || !trigger) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (root.contains(target) || trigger.contains(target)) return;
  closeSearch();
});

if (input) {
  input.addEventListener("input", (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) return;
    runSearch(target.value);
  });

  input.addEventListener("keydown", (event) => {
    const links = getResultLinks();
    if (links.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      syncActiveResult(activeIndex < 0 ? 0 : activeIndex + 1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      syncActiveResult(activeIndex < 0 ? links.length - 1 : activeIndex - 1);
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      event.stopPropagation();
      links[activeIndex]?.click();
    }

    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      syncActiveResult(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      syncActiveResult(links.length - 1);
    }
  });
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

if (results) {
  results.addEventListener("focusin", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    const links = getResultLinks();
    const nextIndex = links.indexOf(target);
    if (nextIndex >= 0) {
      syncActiveResult(nextIndex);
    }
  });

  results.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) return;
    const links = getResultLinks();
    const currentIndex = links.indexOf(target);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      syncActiveResult(currentIndex + 1, { focus: true });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex <= 0) {
        activeIndex = -1;
        syncInputState();
        input?.focus();
        return;
      }
      syncActiveResult(currentIndex - 1, { focus: true });
    }

    if (event.key === "Home") {
      event.preventDefault();
      syncActiveResult(0, { focus: true });
    }

    if (event.key === "End") {
      event.preventDefault();
      syncActiveResult(links.length - 1, { focus: true });
    }
  });
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);

  if (event.key === "Escape" && isOpen) {
    closeSearch();
    trigger?.focus();
  }

  if (event.key === "/" && !isOpen) {
    if (isEditable) {
      return;
    }
    event.preventDefault();
    void openSearch();
  }
});
