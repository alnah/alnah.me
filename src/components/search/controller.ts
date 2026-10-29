import { searchDocuments } from "../../lib/search";
import { loadSearchIndex } from "./index-store";
import { createResultsRenderer } from "./results";

export type SearchDialogController = {
  root: HTMLElement;
  isOpen: () => boolean;
  openSearch: () => Promise<void>;
  closeSearch: () => void;
  contains: (target: Node) => boolean;
  focusTrigger: () => void;
};

const dialogs: SearchDialogController[] = [];

const EMPTY_RESULTS_MESSAGE = "Aucun article correspondant pour le moment.";
const UNAVAILABLE_MESSAGE =
  "L'index de recherche est indisponible. Vous pouvez toujours parcourir les articles.";

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function closeOtherDialogs(current: SearchDialogController) {
  for (const dialog of dialogs) {
    if (dialog !== current) {
      dialog.closeSearch();
    }
  }
}

export function createSearchDialog(root: HTMLElement): SearchDialogController | null {
  const trigger = root.querySelector<HTMLElement>("[data-search-trigger]");
  const form = root.querySelector<HTMLFormElement>("[data-search-form]");
  const input = root.querySelector<HTMLInputElement>("[data-search-input]");
  const resultsList = root.querySelector<HTMLElement>("[data-search-results]");
  const renderer = createResultsRenderer(root);

  if (!trigger || !form || !input || !resultsList || !renderer) {
    return null;
  }

  const searchTrigger = trigger;
  const searchForm = form;
  const searchInput = input;
  const results = resultsList;

  let isOpen = root.dataset.open === "true";

  async function runSearch(query: string) {
    if (!query.trim()) {
      renderer?.clear();
      return;
    }

    try {
      const items = await loadSearchIndex();
      const matches = searchDocuments(items, query);
      renderer?.renderResults(matches, EMPTY_RESULTS_MESSAGE);
    } catch {
      renderer?.showStatus(UNAVAILABLE_MESSAGE);
    }
  }

  function closeSearch() {
    root.dataset.open = "false";
    isOpen = false;
    searchInput.value = "";
    renderer?.clear();
    renderer?.setExpanded(false);
  }

  async function openSearch() {
    root.dataset.open = "true";
    isOpen = true;
    searchInput.value = "";
    renderer?.setExpanded(true);
    await runSearch("");
    searchInput.focus();
  }

  const controller: SearchDialogController = {
    root,
    isOpen: () => isOpen,
    openSearch,
    closeSearch,
    contains: (target) => root.contains(target),
    focusTrigger: () => searchTrigger.focus()
  };

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
    const links = renderer.getLinks();
    if (links.length === 0) {
      return;
    }

    const activeIndex = renderer.getActiveIndex();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      renderer.syncActiveResult(activeIndex < 0 ? 0 : activeIndex + 1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      renderer.syncActiveResult(activeIndex < 0 ? links.length - 1 : activeIndex - 1);
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      event.stopPropagation();
      links[activeIndex]?.click();
    }

    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      renderer.syncActiveResult(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      renderer.syncActiveResult(links.length - 1);
    }
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  results.addEventListener("focusin", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }

    const nextIndex = renderer.getLinks().indexOf(target);
    if (nextIndex >= 0) {
      renderer.syncActiveResult(nextIndex);
    }
  });

  results.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement)) {
      return;
    }

    const links = renderer.getLinks();
    const currentIndex = links.indexOf(target);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      renderer.syncActiveResult(currentIndex + 1, { focus: true });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex <= 0) {
        renderer.resetActive();
        searchInput.focus();
        return;
      }

      renderer.syncActiveResult(currentIndex - 1, { focus: true });
    }

    if (event.key === "Home") {
      event.preventDefault();
      renderer.syncActiveResult(0, { focus: true });
    }

    if (event.key === "End") {
      event.preventDefault();
      renderer.syncActiveResult(links.length - 1, { focus: true });
    }
  });

  return controller;
}

export function registerSearchDialogs() {
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
}
