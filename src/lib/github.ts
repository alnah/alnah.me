import type { GitHubActivityConfig } from "../config/site.ts";
import {
  fetchContributionCalendar,
  fetchLatestRepoCommit,
  fetchOwnedRepos,
  fetchPublicEvents,
  getGitHubToken
} from "./github-client.ts";
import { dedupeRecentActivity, toRecentActivity } from "./github-events.ts";
import type {
  GitHubActivityData,
  GitHubContributionCalendar,
  RecentActivityItem
} from "./github-types.ts";

const RECENT_ACTIVITY_LIMIT = 5;

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
