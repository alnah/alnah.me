import { buildSearchIndex, type SearchIndexDocument } from "../../lib/search";

let searchIndexPromise: Promise<SearchIndexDocument[]> | null = null;

/**
 * Fetch and index the search documents once per page load, then reuse the
 * promise so repeated searches never refetch.
 */
export async function loadSearchIndex(): Promise<SearchIndexDocument[]> {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch("/index.json")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Impossible de charger l'index de recherche");
      }

      return buildSearchIndex(await response.json());
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });

  return searchIndexPromise;
}
