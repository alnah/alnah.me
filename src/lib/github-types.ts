export type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export type ContributionDay = {
  contributionCount: number;
  contributionLevel: ContributionLevel;
  date: string;
  weekday: number;
};

export type ContributionWeek = {
  firstDay: string;
  contributionDays: ContributionDay[];
};

export type ContributionMonth = {
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
