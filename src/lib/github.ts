import type { GitHubActivityConfig } from "../config/site";
import {
  fetchContributionCalendar,
  fetchLatestRepoCommit,
  fetchOwnedRepos,
  fetchPublicEvents,
  getGitHubToken
} from "./github-client";
import { dedupeRecentActivity, toRecentActivity } from "./github-events";

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

export type RecentActivityItem = {
  date: string;
  summary: string;
  url: string | null;
};

export type GitHubContributionCalendar = {
  totalContributions: number;
  months: ContributionMonth[];
  weeks: ContributionWeek[];
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

export type GitHubPublicEvent =
  | GitHubPushEvent
  | GitHubPullRequestEvent
  | GitHubReleaseEvent
  | GitHubCreateEvent
  | GitHubIssuesEvent
  | GitHubIssueCommentEvent
  | GitHubForkEvent
  | GitHubWatchEvent;

export type GitHubRepo = {
  fork?: boolean;
  archived?: boolean;
  full_name?: string;
  default_branch?: string;
  html_url?: string;
  pushed_at?: string;
};

export type GitHubCommit = {
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

function createFallbackActivity(config: GitHubActivityConfig): GitHubActivityData {
  return {
    hasLiveData: false,
    profileUrl: config.profileUrl,
    totalContributions: null,
    months: [],
    weeks: [],
    recentActivity: []
  };
}

async function fetchRecentActivity(username: string, token: string) {
  const events = await fetchPublicEvents(username, token);

  return dedupeRecentActivity(
    events
      .map(toRecentActivity)
      .filter((event): event is RecentActivityItem => Boolean(event))
  ).slice(0, RECENT_ACTIVITY_LIMIT);
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
