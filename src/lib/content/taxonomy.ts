export const POST_CATEGORIES = [
  'construire',
  'outils',
  'enseigner',
  'travailler',
  'penser'
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

type PostCategoryMeta = {
  slug: PostCategory;
  label: string;
  description: string;
};

export const POST_CATEGORY_META: Record<PostCategory, PostCategoryMeta> = {
  construire: {
    slug: 'construire',
    label: 'Construire',
    description: 'Pourquoi et comment je construis mes outils ou systèmes.'
  },
  outils: {
    slug: 'outils',
    label: 'Outiller',
    description: "Les outils que j'utilise pour automatiser une partie de mon travail."
  },
  enseigner: {
    slug: 'enseigner',
    label: 'Enseigner',
    description: "Mes idées et pratiques pour l'enseignement du FLE et sa pédagogie."
  },
  travailler: {
    slug: 'travailler',
    label: 'Travailler',
    description: "Comment j'organise mon travail d'enseignant du FLE et d'entrepeneur."
  },
  penser: {
    slug: 'penser',
    label: 'Penser',
    description: 'Les réflexions que je partage sur les langues, les technologies et bien plus !'
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export function getPostCategoryMeta(category: PostCategory) {
  return POST_CATEGORY_META[category];
}
