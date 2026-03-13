import type { GitHubActivityConfig } from "../config/site";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const GITHUB_REST_ENDPOINT = "https://api.github.com";
const GITHUB_FETCH_TIMEOUT_MS = 8000;

type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

type ContributionDay = {
  contributionCount: number;
  contributionLevel: ContributionLevel;
  date: string;
  weekday: number;
};

type ContributionWeek = {
  firstDay: string;
  contributionDays: ContributionDay[];
};

type ContributionMonth = {
  firstDay: string;
  name: string;
  totalWeeks: number;
  year: number;
};

type RecentActivityItem = {
  date: string;
  summary: string;
  url: string | null;
};

export type GitHubActivityData = {
  hasLiveData: boolean;
  profileUrl: string;
  totalContributions: number | null;
  months: Array<ContributionMonth & { weekIndex: number }>;
  weeks: ContributionWeek[];
  recentActivity: RecentActivityItem[];
};

function getGitHubToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

async function fetchJson(url: string | URL, init: RequestInit, context: string) {
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

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`${context} timed out after ${GITHUB_FETCH_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createFallbackActivity(config: GitHubActivityConfig): GitHubActivityData {
  const items = config.items ?? [];

  return {
    hasLiveData: false,
    profileUrl: config.profileUrl,
    totalContributions: null,
    months: [],
    weeks: [],
    recentActivity: items.map((summary) => ({
      date: "",
      summary,
      url: config.profileUrl
    }))
  };
}

async function fetchContributionCalendar(username: string, token: string) {
  const payload = await fetchJson(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "alnah.io"
    },
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
  }, "GitHub GraphQL request");

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error: { message: string }) => error.message).join("; "));
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    throw new Error("Missing contribution calendar in GitHub GraphQL response");
  }

  return calendar as {
    totalContributions: number;
    months: ContributionMonth[];
    weeks: ContributionWeek[];
  };
}

function formatRepoUrl(repoName: string) {
  return `https://github.com/${repoName}`;
}

function normalizeRecentEvent(event: any): RecentActivityItem | null {
  const repoName = event.repo?.name;
  const repoUrl = typeof repoName === "string" ? formatRepoUrl(repoName) : null;
  const createdAt = typeof event.created_at === "string" ? event.created_at : "";

  if (event.type === "PushEvent" && repoName) {
    const commitCount = Array.isArray(event.payload?.commits) ? event.payload.commits.length : 0;
    const branch = typeof event.payload?.ref === "string" ? event.payload.ref.split("/").pop() : null;
    return {
      date: createdAt,
      summary: `Pushed ${commitCount || "new"} commit${commitCount === 1 ? "" : "s"} to ${repoName}${branch ? ` on ${branch}` : ""}.`,
      url: repoUrl
    };
  }

  if (event.type === "PullRequestEvent" && repoName) {
    const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
    const prUrl = typeof event.payload?.pull_request?.html_url === "string" ? event.payload.pull_request.html_url : repoUrl;
    return {
      date: createdAt,
      summary: `${action.charAt(0).toUpperCase()}${action.slice(1)} a pull request in ${repoName}.`,
      url: prUrl
    };
  }

  if (event.type === "ReleaseEvent" && repoName) {
    const releaseUrl = typeof event.payload?.release?.html_url === "string" ? event.payload.release.html_url : repoUrl;
    return {
      date: createdAt,
      summary: `Published a release in ${repoName}.`,
      url: releaseUrl
    };
  }

  if (event.type === "CreateEvent" && repoName) {
    const refType = typeof event.payload?.ref_type === "string" ? event.payload.ref_type : "resource";
    const ref = typeof event.payload?.ref === "string" ? event.payload.ref : "";
    return {
      date: createdAt,
      summary: `Created ${refType}${ref ? ` ${ref}` : ""} in ${repoName}.`,
      url: repoUrl
    };
  }

  if (event.type === "IssuesEvent" && repoName) {
    const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
    const issueUrl = typeof event.payload?.issue?.html_url === "string" ? event.payload.issue.html_url : repoUrl;
    return {
      date: createdAt,
      summary: `${action.charAt(0).toUpperCase()}${action.slice(1)} an issue in ${repoName}.`,
      url: issueUrl
    };
  }

  if (event.type === "IssueCommentEvent" && repoName) {
    const issueUrl = typeof event.payload?.issue?.html_url === "string" ? event.payload.issue.html_url : repoUrl;
    return {
      date: createdAt,
      summary: `Commented on an issue in ${repoName}.`,
      url: issueUrl
    };
  }

  if (event.type === "ForkEvent" && repoName) {
    const forkUrl = typeof event.payload?.forkee?.html_url === "string" ? event.payload.forkee.html_url : repoUrl;
    return {
      date: createdAt,
      summary: `Forked ${repoName}.`,
      url: forkUrl
    };
  }

  if (event.type === "WatchEvent" && repoName) {
    return {
      date: createdAt,
      summary: `Starred ${repoName}.`,
      url: repoUrl
    };
  }

  return null;
}

async function fetchRecentActivity(username: string, token: string) {
  const events = await fetchJson(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=30`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "alnah.io",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  }, "GitHub public events request");

  if (!Array.isArray(events)) {
    throw new Error("Unexpected GitHub public events payload");
  }

  const seen = new Set<string>();

  return events
    .map(normalizeRecentEvent)
    .filter((event): event is RecentActivityItem => Boolean(event))
    .filter((event) => {
      const key = `${event.summary}::${event.url ?? ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

async function fetchRecentCommitActivity(username: string, token: string, limit: number) {
  const repos = await fetchJson(
    `${GITHUB_REST_ENDPOINT}/users/${username}/repos?sort=pushed&per_page=${Math.max(limit * 2, 10)}&type=owner`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "alnah.io",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    },
    "GitHub repos request"
  );

  if (!Array.isArray(repos)) {
    throw new Error("Unexpected GitHub repos payload");
  }

  const candidateRepos = repos
    .filter((repo) => repo && !repo.fork && !repo.archived && typeof repo.full_name === "string")
    .slice(0, Math.max(limit * 2, 10));

  const commitItems = await Promise.all(
    candidateRepos.map(async (repo) => {
      const branch = typeof repo.default_branch === "string" ? repo.default_branch : undefined;
      const commitsUrl = new URL(`${GITHUB_REST_ENDPOINT}/repos/${repo.full_name}/commits`);
      commitsUrl.searchParams.set("per_page", "1");
      if (branch) {
        commitsUrl.searchParams.set("sha", branch);
      }

      const commits = await fetchJson(commitsUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "alnah.io",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }, `GitHub commits request for ${repo.full_name}`);

      if (!Array.isArray(commits) || commits.length === 0) {
        return null;
      }

      const latestCommit = commits[0];
      const message = typeof latestCommit.commit?.message === "string"
        ? latestCommit.commit.message.split("\n")[0]
        : null;
      const url = typeof latestCommit.html_url === "string" ? latestCommit.html_url : repo.html_url;
      const date = typeof latestCommit.commit?.author?.date === "string"
        ? latestCommit.commit.author.date
        : repo.pushed_at;

      return {
        date,
        summary: message
          ? `Latest commit in ${repo.full_name}: ${message}.`
          : `Recent work landed in ${repo.full_name}.`,
        url: typeof url === "string" ? url : null
      } satisfies RecentActivityItem;
    })
  );

  return commitItems.filter((item): item is RecentActivityItem => Boolean(item)).slice(0, limit);
}

export async function getGitHubActivity(config: GitHubActivityConfig): Promise<GitHubActivityData> {
  const token = getGitHubToken();

  if (!token) {
    return createFallbackActivity(config);
  }

  try {
    const [calendar, recentEvents] = await Promise.all([
      fetchContributionCalendar(config.username, token),
      fetchRecentActivity(config.username, token)
    ]);

    let recentActivity = recentEvents;

    if (recentActivity.length < 5) {
      const supplemental = await fetchRecentCommitActivity(
        config.username,
        token,
        5 - recentActivity.length
      );
      const seen = new Set(recentActivity.map((item) => `${item.summary}::${item.url ?? ""}`));
      for (const item of supplemental) {
        const key = `${item.summary}::${item.url ?? ""}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        recentActivity.push(item);
        if (recentActivity.length === 5) {
          break;
        }
      }
    }

    const weekIndexByMonthStart = new Map(
      calendar.months.map((month) => {
        const weekIndex = calendar.weeks.findIndex((week) =>
          week.contributionDays.some((day) => day.date === month.firstDay)
        );
        return [month.firstDay, weekIndex >= 0 ? weekIndex : 0] as const;
      })
    );

    return {
      hasLiveData: true,
      profileUrl: config.profileUrl,
      totalContributions: calendar.totalContributions,
      months: calendar.months.map((month) => ({
        ...month,
        weekIndex: weekIndexByMonthStart.get(month.firstDay) ?? 0
      })),
      weeks: calendar.weeks,
      recentActivity
    };
  } catch (error) {
    console.warn("[github-activity] falling back to static content", error);
    return createFallbackActivity(config);
  }
}
