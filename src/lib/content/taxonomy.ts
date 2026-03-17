export const POST_CATEGORIES = [
  "building",
  "tooling",
  "teaching",
  "working",
  "thinking"
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

type PostCategoryMeta = {
  slug: PostCategory;
  label: string;
  description: string;
};

export const POST_CATEGORY_META: Record<PostCategory, PostCategoryMeta> = {
  building: {
    slug: "building",
    label: "Building",
    description: "Things I build and ship."
  },
  tooling: {
    slug: "tooling",
    label: "Tooling",
    description: "Tools, workflows, and automation I actually use."
  },
  teaching: {
    slug: "teaching",
    label: "Teaching",
    description: "Teaching practice, pedagogy, and language work."
  },
  working: {
    slug: "working",
    label: "Working",
    description: "Client work, delivery, business, and operations."
  },
  thinking: {
    slug: "thinking",
    label: "Thinking",
    description: "Notes, essays, and reflections across the whole site."
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export function getPostCategoryMeta(category: PostCategory) {
  return POST_CATEGORY_META[category];
}
