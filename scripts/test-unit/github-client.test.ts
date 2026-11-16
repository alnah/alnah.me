import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchContributionCalendar,
  fetchLatestRepoCommit,
  fetchOwnedRepos,
  fetchPublicEvents,
  getGitHubToken
} from "../../src/lib/github-client.ts";
import type { GitHubRepo } from "../../src/lib/github-types.ts";

type FetchCall = { url: string; init?: RequestInit };

function urlOf(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return input;
  }

  return input instanceof URL ? input.toString() : input.url;
}

function stubFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>
) {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (input, init) => {
    const url = urlOf(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;

  return {
    calls,
    restore() {
      globalThis.fetch = original;
    }
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

const calendar = {
  totalContributions: 3,
  months: [],
  weeks: []
};

test("github client: token comes from the environment", () => {
  const previousToken = process.env.GITHUB_TOKEN;
  const previousGhToken = process.env.GH_TOKEN;

  try {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    assert.equal(getGitHubToken(), "");

    process.env.GH_TOKEN = "gh-token";
    assert.equal(getGitHubToken(), "gh-token");

    process.env.GITHUB_TOKEN = "github-token";
    assert.equal(getGitHubToken(), "github-token", "GITHUB_TOKEN wins over GH_TOKEN");
  } finally {
    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previousToken;
    }

    if (previousGhToken === undefined) {
      delete process.env.GH_TOKEN;
    } else {
      process.env.GH_TOKEN = previousGhToken;
    }
  }
});

test("github client: contribution calendar sends an authenticated query", async () => {
  const stub = stubFetch(() => jsonResponse({ data: { user: { contributionsCollection: { contributionCalendar: calendar } } } }));

  try {
    const result = await fetchContributionCalendar("alnah", "secret");
    assert.deepEqual(result, calendar);

    const [call] = stub.calls;
    assert.match(call.url, /api\.github\.com\/graphql$/);
    assert.equal(
      (call.init?.headers as Record<string, string>).Authorization,
      "Bearer secret"
    );
    assert.match(String(call.init?.body), /"login":"alnah"/);
  } finally {
    stub.restore();
  }
});

test("github client: GraphQL errors are surfaced", async () => {
  const stub = stubFetch(() => jsonResponse({ errors: [{ message: "bad token" }, { message: "rate limit" }] }));

  try {
    await assert.rejects(
      fetchContributionCalendar("alnah", "secret"),
      /bad token; rate limit/
    );
  } finally {
    stub.restore();
  }
});

test("github client: missing calendar is an error", async () => {
  const stub = stubFetch(() => jsonResponse({ data: { user: {} } }));

  try {
    await assert.rejects(
      fetchContributionCalendar("alnah", "secret"),
      /Missing contribution calendar/
    );
  } finally {
    stub.restore();
  }
});

test("github client: HTTP errors and timeouts are explicit", async () => {
  const failing = stubFetch(() => jsonResponse({}, 500));

  try {
    await assert.rejects(
      fetchPublicEvents("alnah", "secret"),
      /GitHub public events request failed with status 500/
    );
  } finally {
    failing.restore();
  }

  const aborting = stubFetch(() => {
    throw new DOMException("aborted", "AbortError");
  });

  try {
    await assert.rejects(
      fetchPublicEvents("alnah", "secret"),
      /GitHub public events request timed out/
    );
  } finally {
    aborting.restore();
  }
});

test("github client: public events must be an array", async () => {
  const stub = stubFetch(() => jsonResponse({ not: "an array" }));

  try {
    await assert.rejects(fetchPublicEvents("alnah", "secret"), /Unexpected GitHub public events payload/);
  } finally {
    stub.restore();
  }
});

test("github client: owned repos drop forks and archived projects", async () => {
  const repos = [
    { full_name: "a/keep", fork: false, archived: false },
    { full_name: "a/fork", fork: true, archived: false },
    { full_name: "a/archived", fork: false, archived: true },
    { full_name: "a/keep-two", fork: false, archived: false },
    { fork: false, archived: false }
  ];
  const stub = stubFetch(() => jsonResponse(repos));

  try {
    const result = await fetchOwnedRepos("alnah", "secret", 1);
    assert.deepEqual(
      result.map((repo) => repo.full_name),
      ["a/keep", "a/keep-two"]
    );
    assert.match(stub.calls[0].url, /per_page=10/);
  } finally {
    stub.restore();
  }
});

test("github client: latest commit maps to a recent activity item", async () => {
  const repo = {
    full_name: "alnah/site",
    default_branch: "main",
    html_url: "https://github.com/alnah/site",
    pushed_at: "2026-11-01T00:00:00Z"
  } as GitHubRepo;

  const empty = stubFetch(() => jsonResponse([]));

  try {
    assert.equal(await fetchLatestRepoCommit(repo, "secret"), null);
  } finally {
    empty.restore();
  }

  const withCommit = stubFetch(() =>
    jsonResponse([
      {
        html_url: "https://github.com/alnah/site/commit/abc",
        commit: {
          message: "fix: thing\n\nlong body",
          author: { date: "2026-11-02T00:00:00Z" }
        }
      }
    ])
  );

  try {
    const item = await fetchLatestRepoCommit(repo, "secret");
    assert.deepEqual(item, {
      date: "2026-11-02T00:00:00Z",
      summary: "Dernier commit sur alnah/site : fix: thing.",
      url: "https://github.com/alnah/site/commit/abc"
    });
  } finally {
    withCommit.restore();
  }
});
