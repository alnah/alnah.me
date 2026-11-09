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
    description: "J'explique comment j'utilise mes outils ensemble pour créer des systèmes. Découvrez comment et pourquoi la technologie permet d'améliorer la qualité de l'enseignement des langues."
  },
  outils: {
    slug: 'outils',
    label: 'Outiller',
    description: "Gagnez du temps dans votre quotidien grâce à de nouveaux outils. Je présente une sélection d'outils et astuces pour automatiser une partie du travail et se concentrer sur l'essentiel."
  },
  enseigner: {
    slug: 'enseigner',
    label: 'Enseigner',
    description: "Découvrez comment apprendre ou enseigner le français langue étrangère (FLE). Je partage mes retours d'expérience ainsi que mes pratiques pédagogiques pour inspirer de bonnes pratiques."
  },
  travailler: {
    slug: 'travailler',
    label: 'Travailler',
    description: "Ces articles sont dédiés à l'organisation de mon quotidien d'enseignant et d'entrepreneur. Je partage mes méthodes de travail et mes idées pour développer mon activité."
  },
  penser: {
    slug: 'penser',
    label: 'Penser',
    description: "Ce sont mes analyses ou mes réflexions autour des langues, de l'impact des technologies, de l'évolution de mon travail, et bien d'autres sujets qui questionnent notre métier."
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export function getPostCategoryMeta(category: PostCategory) {
  return POST_CATEGORY_META[category];
}
