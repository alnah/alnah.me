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
    description: "Why and how I build things."
  },
  tooling: {
    slug: "tooling",
    label: "Tooling",
    description: "Tools and workflows for automation."
  },
  teaching: {
    slug: "teaching",
    label: "Teaching",
    description: "Teaching practices and language pedagogy."
  },
  working: {
    slug: "working",
    label: "Working",
    description: "Organizing for delivery and business operations."
  },
  thinking: {
    slug: "thinking",
    label: "Thinking",
    description: "Thoughts on language, technology, and more."
  }
};

export function isPostCategory(value: string): value is PostCategory {
  return POST_CATEGORIES.includes(value as PostCategory);
}

export function getPostCategoryMeta(category: PostCategory) {
  return POST_CATEGORY_META[category];
}
