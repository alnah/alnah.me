import type { APIRoute } from "astro";
import { SITE } from "../../../config/site.ts";
import {
  derivePostMeta,
  getPublishedPosts,
  type PostEntry
} from "../../../lib/content/index.ts";
import { renderSocialImage } from "../../../lib/social-image.ts";

export async function getStaticPaths() {
  const posts = await getPublishedPosts();

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post }
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: PostEntry };
  const png = await renderSocialImage({
    title: derivePostMeta(post).title,
    description: post.data.description,
    authorName: SITE.author.name
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png"
    }
  });
};
