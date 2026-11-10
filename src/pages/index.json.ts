import { getPublishedPosts } from "../lib/content.ts";
import { createSearchDocument } from "../lib/search.ts";

export async function GET() {
  const posts = await getPublishedPosts();
  const body = posts.map(createSearchDocument);

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
