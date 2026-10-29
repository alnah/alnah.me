import type {
  GitHubCommit,
  GitHubContributionCalendar,
  GitHubPublicEvent,
  GitHubRepo,
  RecentActivityItem
} from "./github";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const GITHUB_REST_ENDPOINT = "https://api.github.com";
const GITHUB_FETCH_TIMEOUT_MS = 8000;
const GITHUB_REST_API_VERSION = "2022-11-28";
const GITHUB_USER_AGENT = "alnah.me";

type GitHubContributionCalendarResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: GitHubContributionCalendar;
      };
    };
  };
  errors?: Array<{ message: string }>;
};

export function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

function createGitHubGraphQLHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": GITHUB_USER_AGENT
  };
}

function createGitHubRestHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": GITHUB_USER_AGENT,
    "X-GitHub-Api-Version": GITHUB_REST_API_VERSION
  };
}

async function fetchGitHubJson<T>(
  url: string | URL,
  init: RequestInit,
  context: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GITHUB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`${context} failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${context} timed out after ${GITHUB_FETCH_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchContributionCalendar(username: string, token: string) {
  const payload = await fetchGitHubJson<GitHubContributionCalendarResponse>(
    GITHUB_GRAPHQL_ENDPOINT,
    {
      method: "POST",
      headers: createGitHubGraphQLHeaders(token),
      body: JSON.stringify({
        query: `
          query GitHubActivity($login: String!) {
            user(login: $login) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  months {
                    firstDay
                    name
                    totalWeeks
                    year
                  }
                  weeks {
                    firstDay
                    contributionDays {
                      contributionCount
                      contributionLevel
                      date
                      weekday
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          login: username
        }
      })
    },
    "GitHub GraphQL request"
  );

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    throw new Error("Missing contribution calendar in GitHub GraphQL response");
  }

  return calendar;
}

export async function fetchPublicEvents(username: string, token: string) {
  const events = await fetchGitHubJson<GitHubPublicEvent[]>(
    `${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=30`,
    {
      headers: createGitHubRestHeaders(token)
    },
    "GitHub public events request"
  );

  if (!Array.isArray(events)) {
    throw new Error("Unexpected GitHub public events payload");
  }

  return events;
}

export async function fetchOwnedRepos(username: string, token: string, limit: number) {
  const repos = await fetchGitHubJson<GitHubRepo[]>(
    `${GITHUB_REST_ENDPOINT}/users/${username}/repos?sort=pushed&per_page=${Math.max(limit * 2, 10)}&type=owner`,
    {
      headers: createGitHubRestHeaders(token)
    },
    "GitHub repos request"
  );

  if (!Array.isArray(repos)) {
    throw new Error("Unexpected GitHub repos payload");
  }

  return repos
    .filter((repo) => repo && !repo.fork && !repo.archived && typeof repo.full_name === "string")
    .slice(0, Math.max(limit * 2, 10));
}

export async function fetchLatestRepoCommit(
  repo: GitHubRepo,
  token: string
): Promise<RecentActivityItem | null> {
  if (typeof repo.full_name !== "string") {
    return null;
  }

  const branch = typeof repo.default_branch === "string" ? repo.default_branch : undefined;
  const commitsUrl = new URL(`${GITHUB_REST_ENDPOINT}/repos/${repo.full_name}/commits`);
  commitsUrl.searchParams.set("per_page", "1");
  if (branch) {
    commitsUrl.searchParams.set("sha", branch);
  }

  const commits = await fetchGitHubJson<GitHubCommit[]>(
    commitsUrl,
    {
      headers: createGitHubRestHeaders(token)
    },
    `GitHub commits request for ${repo.full_name}`
  );

  if (!Array.isArray(commits) || commits.length === 0) {
    return null;
  }

  const latestCommit = commits[0];
  const message =
    typeof latestCommit.commit?.message === "string"
      ? latestCommit.commit.message.split("\n")[0]
      : null;
  const url = typeof latestCommit.html_url === "string" ? latestCommit.html_url : repo.html_url;
  const date =
    typeof latestCommit.commit?.author?.date === "string"
      ? latestCommit.commit.author.date
      : repo.pushed_at;

  return {
    date: typeof date === "string" ? date : "",
    summary: message
      ? `Dernier commit sur ${repo.full_name} : ${message}.`
      : `Activité récente sur ${repo.full_name}.`,
    url: typeof url === "string" ? url : null
  };
}
