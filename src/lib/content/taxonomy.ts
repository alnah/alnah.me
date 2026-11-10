import { slugify } from "./format.ts";

export const POST_CATEGORIES = [
  'construire',
  'outiller',
  'enseigner',
  'travailler',
  'penser'
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

type PostCategoryMeta = {
  label: string;
  description: string;
};

export const POST_CATEGORY_META: Record<PostCategory, PostCategoryMeta> = {
  construire: {
    label: 'Construire',
    description: "J'explique comment j'utilise mes outils ensemble pour créer des systèmes. Découvrez comment et pourquoi la technologie permet d'améliorer la qualité de l'enseignement des langues."
  },
  outiller: {
    label: 'Outiller',
    description: "Gagnez du temps dans votre quotidien grâce à de nouveaux outils. Je présente une sélection d'outils et astuces pour automatiser une partie du travail et se concentrer sur l'essentiel."
  },
  enseigner: {
    label: 'Enseigner',
    description: "Découvrez comment apprendre ou enseigner le français langue étrangère (FLE). Je partage mes retours d'expérience ainsi que mes pratiques pédagogiques pour inspirer de bonnes pratiques."
  },
  travailler: {
    label: 'Travailler',
    description: "Ces articles sont dédiés à l'organisation de mon quotidien d'enseignant et d'entrepreneur. Je partage mes méthodes de travail et mes idées pour développer mon activité."
  },
  penser: {
    label: 'Penser',
    description: "Ce sont mes analyses ou mes réflexions autour des langues, de l'impact des technologies, de l'évolution de mon travail, et bien d'autres sujets qui questionnent notre métier."
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export type TagSummary = {
  label: string;
  count: number;
  slug: string;
};

/**
 * Merge tags by slug so spelling variants ("Pédagogie", "pedagogie") share a
 * single archive. The label is the most frequent variant, ties keep the first
 * seen, and the count is the number of distinct posts carrying the tag.
 */
export function summarizeTags(tagLists: string[][]): TagSummary[] {
  const bySlug = new Map<string, { labels: Map<string, number>; count: number }>();

  for (const tags of tagLists) {
    const slugsInPost = new Set<string>();

    for (const label of tags) {
      const slug = slugify(label);
      const entry = bySlug.get(slug) ?? { labels: new Map<string, number>(), count: 0 };

      entry.labels.set(label, (entry.labels.get(label) ?? 0) + 1);

      if (!slugsInPost.has(slug)) {
        entry.count += 1;
        slugsInPost.add(slug);
      }

      bySlug.set(slug, entry);
    }
  }

  return [...bySlug.entries()]
    .map(([slug, entry]) => {
      let label = "";
      let bestCount = -1;

      for (const [candidate, count] of entry.labels) {
        if (count > bestCount) {
          label = candidate;
          bestCount = count;
        }
      }

      return { label, count: entry.count, slug };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getPostCategoryMeta(category: PostCategory) {
  return { slug: category, ...POST_CATEGORY_META[category] };
}
