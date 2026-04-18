import type { GitHubActivityConfig } from "../config/site";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const GITHUB_REST_ENDPOINT = "https://api.github.com";
const GITHUB_FETCH_TIMEOUT_MS = 8000;
const GITHUB_REST_API_VERSION = "2022-11-28";
const GITHUB_USER_AGENT = "alnah.me";
const RECENT_ACTIVITY_LIMIT = 5;

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

type GitHubContributionCalendar = {
  totalContributions: number;
  months: ContributionMonth[];
  weeks: ContributionWeek[];
};

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

type GitHubEventBase = {
  type: string;
  created_at?: string;
  repo?: {
    name?: string;
  };
};

type GitHubPushEvent = GitHubEventBase & {
  type: "PushEvent";
  payload?: {
    commits?: unknown[];
    ref?: string;
  };
};

type GitHubPullRequestEvent = GitHubEventBase & {
  type: "PullRequestEvent";
  payload?: {
    action?: string;
    pull_request?: {
      html_url?: string;
    };
  };
};

type GitHubReleaseEvent = GitHubEventBase & {
  type: "ReleaseEvent";
  payload?: {
    release?: {
      html_url?: string;
    };
  };
};

type GitHubCreateEvent = GitHubEventBase & {
  type: "CreateEvent";
  payload?: {
    ref_type?: string;
    ref?: string;
  };
};

type GitHubIssuesEvent = GitHubEventBase & {
  type: "IssuesEvent";
  payload?: {
    action?: string;
    issue?: {
      html_url?: string;
    };
  };
};

type GitHubIssueCommentEvent = GitHubEventBase & {
  type: "IssueCommentEvent";
  payload?: {
    issue?: {
      html_url?: string;
    };
  };
};

type GitHubForkEvent = GitHubEventBase & {
  type: "ForkEvent";
  payload?: {
    forkee?: {
      html_url?: string;
    };
  };
};

type GitHubWatchEvent = GitHubEventBase & {
  type: "WatchEvent";
};

type GitHubPublicEvent =
  | GitHubPushEvent
  | GitHubPullRequestEvent
  | GitHubReleaseEvent
  | GitHubCreateEvent
  | GitHubIssuesEvent
  | GitHubIssueCommentEvent
  | GitHubForkEvent
  | GitHubWatchEvent
  | GitHubEventBase;

type GitHubRepo = {
  fork?: boolean;
  archived?: boolean;
  full_name?: string;
  default_branch?: string;
  html_url?: string;
  pushed_at?: string;
};

type GitHubCommit = {
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      date?: string;
    };
  };
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

async function fetchJson<T>(url: string | URL, init: RequestInit, context: string): Promise<T> {
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
  const payload = await fetchJson<GitHubContributionCalendarResponse>(
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

function formatRepoUrl(repoName: string) {
  return `https://github.com/${repoName}`;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function createRecentActivityKey(item: RecentActivityItem) {
  return `${item.summary}::${item.url ?? ""}`;
}

function dedupeRecentActivity(items: RecentActivityItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = createRecentActivityKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function hasGitHubEventType<T extends GitHubPublicEvent["type"]>(
  event: GitHubPublicEvent,
  type: T
): event is Extract<GitHubPublicEvent, { type: T }> {
  return event.type === type;
}

function normalizeRecentEvent(event: GitHubPublicEvent): RecentActivityItem | null {
  const repoName = event.repo?.name;
  const repoUrl = typeof repoName === "string" ? formatRepoUrl(repoName) : null;
  const createdAt = typeof event.created_at === "string" ? event.created_at : "";

  if (hasGitHubEventType(event, "PushEvent") && repoName) {
    const commitCount = Array.isArray(event.payload?.commits) ? event.payload.commits.length : 0;
    const branch =
      typeof event.payload?.ref === "string" ? event.payload.ref.split("/").pop() : null;

    return {
      date: createdAt,
      summary: `Pushed ${commitCount || "new"} commit${commitCount === 1 ? "" : "s"} to ${repoName}${branch ? ` on ${branch}` : ""}.`,
      url: repoUrl
    };
  }

  if (hasGitHubEventType(event, "PullRequestEvent") && repoName) {
    const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
    const prUrl =
      typeof event.payload?.pull_request?.html_url === "string"
        ? event.payload.pull_request.html_url
        : repoUrl;

    return {
      date: createdAt,
      summary: `${capitalize(action)} a pull request in ${repoName}.`,
      url: prUrl
    };
  }

  if (hasGitHubEventType(event, "ReleaseEvent") && repoName) {
    const releaseUrl =
      typeof event.payload?.release?.html_url === "string"
        ? event.payload.release.html_url
        : repoUrl;

    return {
      date: createdAt,
      summary: `Published a release in ${repoName}.`,
      url: releaseUrl
    };
  }

  if (hasGitHubEventType(event, "CreateEvent") && repoName) {
    const refType =
      typeof event.payload?.ref_type === "string" ? event.payload.ref_type : "resource";
    const ref = typeof event.payload?.ref === "string" ? event.payload.ref : "";

    return {
      date: createdAt,
      summary: `Created ${refType}${ref ? ` ${ref}` : ""} in ${repoName}.`,
      url: repoUrl
    };
  }

  if (hasGitHubEventType(event, "IssuesEvent") && repoName) {
    const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
    const issueUrl =
      typeof event.payload?.issue?.html_url === "string"
        ? event.payload.issue.html_url
        : repoUrl;

    return {
      date: createdAt,
      summary: `${capitalize(action)} an issue in ${repoName}.`,
      url: issueUrl
    };
  }

  if (hasGitHubEventType(event, "IssueCommentEvent") && repoName) {
    const issueUrl =
      typeof event.payload?.issue?.html_url === "string"
        ? event.payload.issue.html_url
        : repoUrl;

    return {
      date: createdAt,
      summary: `Commented on an issue in ${repoName}.`,
      url: issueUrl
    };
  }

  if (hasGitHubEventType(event, "ForkEvent") && repoName) {
    const forkUrl =
      typeof event.payload?.forkee?.html_url === "string"
        ? event.payload.forkee.html_url
        : repoUrl;

    return {
      date: createdAt,
      summary: `Forked ${repoName}.`,
      url: forkUrl
    };
  }

  if (hasGitHubEventType(event, "WatchEvent") && repoName) {
    return {
      date: createdAt,
      summary: `Starred ${repoName}.`,
      url: repoUrl
    };
  }

  return null;
}

async function fetchPublicEvents(username: string, token: string) {
  const events = await fetchJson<GitHubPublicEvent[]>(
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

async function fetchRecentActivity(username: string, token: string) {
  const events = await fetchPublicEvents(username, token);

  return dedupeRecentActivity(
    events
      .map(normalizeRecentEvent)
      .filter((event): event is RecentActivityItem => Boolean(event))
  ).slice(0, RECENT_ACTIVITY_LIMIT);
}

async function fetchOwnedRepos(username: string, token: string, limit: number) {
  const repos = await fetchJson<GitHubRepo[]>(
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

async function fetchLatestRepoCommit(repo: GitHubRepo, token: string): Promise<RecentActivityItem | null> {
  if (typeof repo.full_name !== "string") {
    return null;
  }

  const branch = typeof repo.default_branch === "string" ? repo.default_branch : undefined;
  const commitsUrl = new URL(`${GITHUB_REST_ENDPOINT}/repos/${repo.full_name}/commits`);
  commitsUrl.searchParams.set("per_page", "1");
  if (branch) {
    commitsUrl.searchParams.set("sha", branch);
  }

  const commits = await fetchJson<GitHubCommit[]>(
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
      ? `Latest commit in ${repo.full_name}: ${message}.`
      : `Recent work landed in ${repo.full_name}.`,
    url: typeof url === "string" ? url : null
  };
}

async function fetchRecentCommitActivity(username: string, token: string, limit: number) {
  const repos = await fetchOwnedRepos(username, token, limit);
  const commitItems = await Promise.all(repos.map((repo) => fetchLatestRepoCommit(repo, token)));

  return commitItems.filter((item): item is RecentActivityItem => Boolean(item)).slice(0, limit);
}

async function buildRecentActivity(username: string, token: string) {
  const recentEvents = await fetchRecentActivity(username, token);
  if (recentEvents.length >= RECENT_ACTIVITY_LIMIT) {
    return recentEvents;
  }

  const supplemental = await fetchRecentCommitActivity(
    username,
    token,
    RECENT_ACTIVITY_LIMIT - recentEvents.length
  );

  return dedupeRecentActivity([...recentEvents, ...supplemental]).slice(0, RECENT_ACTIVITY_LIMIT);
}

function createWeekIndexByMonthStart(calendar: GitHubContributionCalendar) {
  return new Map(
    calendar.months.map((month) => {
      const weekIndex = calendar.weeks.findIndex((week) =>
        week.contributionDays.some((day) => day.date === month.firstDay)
      );

      return [month.firstDay, weekIndex >= 0 ? weekIndex : 0] as const;
    })
  );
}

export async function getGitHubActivity(config: GitHubActivityConfig): Promise<GitHubActivityData> {
  const token = getGitHubToken();
  if (!token) {
    return createFallbackActivity(config);
  }

  try {
    const [calendar, recentActivity] = await Promise.all([
      fetchContributionCalendar(config.username, token),
      buildRecentActivity(config.username, token)
    ]);
    const weekIndexByMonthStart = createWeekIndexByMonthStart(calendar);

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
