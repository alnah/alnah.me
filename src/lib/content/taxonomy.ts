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
    description: 'Pourquoi et comment je construis des choses.'
  },
  outils: {
    slug: 'outils',
    label: 'Outils',
    description: "Outils et workflows pour l'automatisation."
  },
  enseigner: {
    slug: 'enseigner',
    label: 'Enseigner',
    description: "Pratiques d'enseignement et pédagogie des langues."
  },
  travailler: {
    slug: 'travailler',
    label: 'Travailler',
    description: 'Organisation du travail, livraison et opérations.'
  },
  penser: {
    slug: 'penser',
    label: 'Penser',
    description: 'Réflexions sur les langues, la technologie et plus encore.'
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export function getPostCategoryMeta(category: PostCategory) {
  return POST_CATEGORY_META[category];
}
