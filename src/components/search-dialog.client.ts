import { buildSearchIndex, searchDocuments, type SearchIndexDocument } from "../lib/search";

type SearchDialogController = {
  root: HTMLElement;
  isOpen: () => boolean;
  openSearch: () => Promise<void>;
  closeSearch: () => void;
  contains: (target: Node) => boolean;
  focusTrigger: () => void;
};

let searchIndexPromise: Promise<SearchIndexDocument[]> | null = null;
const dialogs: SearchDialogController[] = [];

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

async function loadSearchIndex() {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch("/index.json")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Could not load search index");
      }

      return buildSearchIndex(await response.json());
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });

  return searchIndexPromise;
}

function closeOtherDialogs(current: SearchDialogController) {
  for (const dialog of dialogs) {
    if (dialog !== current) {
      dialog.closeSearch();
    }
  }
}

function createSearchDialog(root: HTMLElement): SearchDialogController | null {
  const trigger = root.querySelector<HTMLElement>("[data-search-trigger]");
  const form = root.querySelector<HTMLFormElement>("[data-search-form]");
  const input = root.querySelector<HTMLInputElement>("[data-search-input]");
  const panel = root.querySelector<HTMLElement>("[data-search-panel]");
  const results = root.querySelector<HTMLElement>("[data-search-results]");
  const status = root.querySelector<HTMLElement>("[data-search-status]");

  if (!trigger || !form || !input || !panel || !results || !status) {
    return null;
  }

  const searchTrigger = trigger;
  const searchForm = form;
  const searchInput = input;
  const resultsPanel = panel;
  const resultsList = results;
  const statusMessage = status;

  let isOpen = root.dataset.open === "true";
  let activeIndex = -1;
  const resultIdPrefix = `${searchInput.id}-result`;

  function syncInputState() {
    searchInput.setAttribute("aria-expanded", isOpen ? "true" : "false");

    if (activeIndex >= 0) {
      searchInput.setAttribute("aria-activedescendant", `${resultIdPrefix}-${activeIndex}`);
      return;
    }

    searchInput.removeAttribute("aria-activedescendant");
  }

  function getResultLinks() {
    return Array.from(
      resultsList.querySelectorAll<HTMLAnchorElement>("[data-search-result-link]")
    );
  }

  function syncActiveResult(nextIndex: number, options: { focus?: boolean } = {}) {
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

  function clearResults() {
    statusMessage.textContent = "";
    statusMessage.hidden = true;
    resultsPanel.hidden = true;
    resultsList.replaceChildren();
    activeIndex = -1;
    syncInputState();
  }

  function renderResults(items: SearchIndexDocument[]) {
    resultsList.replaceChildren(
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
          element.dataset.searchResultMetaDivider = "";
          element.textContent = "·";
          return element;
        };

        listItem.dataset.searchResultItem = "";
        link.href = item.url;
        link.id = `${resultIdPrefix}-${itemIndex}`;
        link.dataset.searchResultLink = "";
        link.setAttribute("role", "option");
        title.dataset.searchResultTitle = "";
        title.textContent = item.title;
        meta.dataset.searchResultMeta = "";
        date.dataset.searchResultDate = "";
        category.dataset.searchResultCategory = "";
        tags.dataset.searchResultTags = "";
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
    if (!query.trim()) {
      clearResults();
      return;
    }

    try {
      const items = await loadSearchIndex();
      const matches = searchDocuments(items, query);
      resultsPanel.hidden = false;
      statusMessage.hidden = matches.length > 0;
      statusMessage.textContent = matches.length > 0 ? "" : "No matching posts yet.";
      renderResults(matches);
    } catch {
      resultsPanel.hidden = false;
      statusMessage.hidden = false;
      statusMessage.textContent = "Search index unavailable. You can still browse posts.";
      resultsList.replaceChildren();
      activeIndex = -1;
      syncInputState();
    }
  }

  function closeSearch() {
    root.dataset.open = "false";
    isOpen = false;
    searchInput.value = "";
    clearResults();
  }

  async function openSearch() {
    root.dataset.open = "true";
    isOpen = true;
    searchInput.value = "";
    await runSearch("");
    searchInput.focus();
    syncInputState();
  }

  const controller: SearchDialogController = {
    root,
    isOpen: () => isOpen,
    openSearch,
    closeSearch,
    contains: (target) => root.contains(target),
    focusTrigger: () => searchTrigger.focus()
  };

  syncInputState();

  searchTrigger.addEventListener("click", async () => {
    if (isOpen) {
      closeSearch();
      return;
    }

    closeOtherDialogs(controller);
    await openSearch();
  });

  searchInput.addEventListener("input", (event) => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    void runSearch(target.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    const links = getResultLinks();
    if (links.length === 0) {
      return;
    }

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

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  resultsList.addEventListener("focusin", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }

    const links = getResultLinks();
    const nextIndex = links.indexOf(target);
    if (nextIndex >= 0) {
      syncActiveResult(nextIndex);
    }
  });

  resultsList.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }

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
        searchInput.focus();
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

  return controller;
}

for (const root of document.querySelectorAll<HTMLElement>("[data-search-root]")) {
  const dialog = createSearchDialog(root);
  if (dialog) {
    dialogs.push(dialog);
  }
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  for (const dialog of dialogs) {
    if (dialog.isOpen() && !dialog.contains(target)) {
      dialog.closeSearch();
    }
  }
});

document.addEventListener("keydown", (event) => {
  const openDialogs = dialogs.filter((dialog) => dialog.isOpen());

  if (event.key === "Escape" && openDialogs.length > 0) {
    openDialogs.forEach((dialog) => dialog.closeSearch());
    openDialogs[0]?.focusTrigger();
    return;
  }

  if (event.key !== "/" || openDialogs.length > 0 || isEditableTarget(event.target)) {
    return;
  }

  const primaryDialog = dialogs[0];
  if (!primaryDialog) {
    return;
  }

  event.preventDefault();
  void primaryDialog.openSearch();
});
