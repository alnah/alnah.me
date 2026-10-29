import type { SearchIndexDocument } from "../../lib/search";

export type ResultsRenderer = {
  setExpanded: (isOpen: boolean) => void;
  renderResults: (items: SearchIndexDocument[], emptyMessage: string) => void;
  showStatus: (message: string) => void;
  clear: () => void;
  syncActiveResult: (index: number, options?: { focus?: boolean }) => void;
  resetActive: () => void;
  getLinks: () => HTMLAnchorElement[];
  getActiveIndex: () => number;
};

function createDivider() {
  const element = document.createElement("span");
  element.dataset.searchResultMetaDivider = "";
  element.textContent = "·";
  return element;
}

function buildResultItem(item: SearchIndexDocument, index: number, idPrefix: string) {
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  const title = document.createElement("strong");
  const meta = document.createElement("span");
  const date = document.createElement("span");
  const category = document.createElement("span");
  const tags = document.createElement("span");
  const tagList = item.tags ?? [];

  listItem.dataset.searchResultItem = "";
  link.href = item.url;
  link.id = `${idPrefix}-${index}`;
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
  tags.textContent = tagList.map((tag) => `#${tag}`).join(" ");

  link.append(title);

  if (item.dateLabel || item.category || tagList.length > 0) {
    if (item.dateLabel) {
      meta.append(date);
    }

    if (item.dateLabel && item.category) {
      meta.append(createDivider());
    }

    if (item.category) {
      meta.append(category);
    }

    if ((item.dateLabel || item.category) && tagList.length > 0) {
      meta.append(createDivider());
    }

    if (tagList.length > 0) {
      meta.append(tags);
    }

    link.append(meta);
  }

  listItem.append(link);
  return listItem;
}

/**
 * Owns the results list: DOM rendering, the active result, and the matching
 * ARIA state. The controller keeps the dialog lifecycle.
 */
export function createResultsRenderer(root: HTMLElement): ResultsRenderer | null {
  const input = root.querySelector<HTMLInputElement>("[data-search-input]");
  const panel = root.querySelector<HTMLElement>("[data-search-panel]");
  const list = root.querySelector<HTMLElement>("[data-search-results]");
  const status = root.querySelector<HTMLElement>("[data-search-status]");

  if (!input || !panel || !list || !status) {
    return null;
  }

  const resultsInput = input;
  const resultsPanel = panel;
  const resultsList = list;
  const statusMessage = status;
  const resultIdPrefix = `${resultsInput.id}-result`;

  let activeIndex = -1;

  function syncActiveDescendant() {
    if (activeIndex >= 0) {
      resultsInput.setAttribute("aria-activedescendant", `${resultIdPrefix}-${activeIndex}`);
      return;
    }

    resultsInput.removeAttribute("aria-activedescendant");
  }

  function getLinks() {
    return Array.from(
      resultsList.querySelectorAll<HTMLAnchorElement>("[data-search-result-link]")
    );
  }

  function resetActive() {
    activeIndex = -1;
    syncActiveDescendant();
  }

  function syncActiveResult(nextIndex: number, options: { focus?: boolean } = {}) {
    const links = getLinks();
    links.forEach((link) => link.classList.remove("is-active"));

    if (links.length === 0) {
      resetActive();
      return;
    }

    const boundedIndex = Math.max(0, Math.min(nextIndex, links.length - 1));
    const activeLink = links[boundedIndex];
    activeLink.classList.add("is-active");
    activeIndex = boundedIndex;
    syncActiveDescendant();
    activeLink.scrollIntoView({ block: "nearest" });

    if (options.focus) {
      activeLink.focus();
    }
  }

  function clear() {
    statusMessage.textContent = "";
    statusMessage.hidden = true;
    resultsPanel.hidden = true;
    resultsList.replaceChildren();
    resetActive();
  }

  function showStatus(message: string) {
    resultsPanel.hidden = false;
    statusMessage.hidden = false;
    statusMessage.textContent = message;
    resultsList.replaceChildren();
    resetActive();
  }

  function renderResults(items: SearchIndexDocument[], emptyMessage: string) {
    resultsList.replaceChildren(
      ...items.map((item, index) => buildResultItem(item, index, resultIdPrefix))
    );
    resultsPanel.hidden = false;
    statusMessage.hidden = items.length > 0;
    statusMessage.textContent = items.length > 0 ? "" : emptyMessage;
    resetActive();
  }

  return {
    setExpanded: (isOpen) => resultsInput.setAttribute("aria-expanded", isOpen ? "true" : "false"),
    renderResults,
    showStatus,
    clear,
    syncActiveResult,
    resetActive,
    getLinks,
    getActiveIndex: () => activeIndex
  };
}
