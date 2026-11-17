import type { TagSummary } from "./taxonomy.ts";

export type PageMetadata = {
  title: string;
  description: string;
};

// Archive pages render their title and description in the page head and in
// their generated social image, so both surfaces read the same metadata.
export const ARTICLES_PAGE_META: PageMetadata = {
  title: "Articles",
  description:
    "Parcourez l'historique de mes articles grâce aux archives. Elles sont organisées par page et par catégorie."
};

export const CATEGORIES_PAGE_META: PageMetadata = {
  title: "Catégories",
  description: "Parcourez les articles par catégorie."
};

export function categoryArchiveMeta(category: {
  label: string;
  description: string;
}): PageMetadata {
  return {
    title: `Articles classés dans ${category.label}`,
    description: category.description
  };
}

export function tagArchiveMeta(tag: Pick<TagSummary, "label">): PageMetadata {
  return {
    title: `Articles étiquetés ${tag.label}`,
    description: `Découvrez tous les articles du blog associés à l'étiquette #${tag.label}.`
  };
}
