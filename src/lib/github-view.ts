import type { GitHubActivityData } from "./github";

type WeekdayLabel = {
  label: string;
  row: number;
};

type MonthColumn = {
  label: string;
  start: number;
  span: number;
};

const WEEKDAY_LABELS: WeekdayLabel[] = [
  { label: "Mon", row: 2 },
  { label: "Wed", row: 4 },
  { label: "Fri", row: 6 }
];

function shortMonth(name: string) {
  return name.slice(0, 3);
}

/**
 * The component should render a stable view model, not carry layout math. That
 * keeps visual tuning separate from the correctness of the GitHub data slice.
 */
export function buildGitHubActivityView(activity: GitHubActivityData, recentLimit = 3) {
  const visibleMonths = activity.months;
  const monthStartIndex = visibleMonths[0]?.weekIndex ?? 0;
  const visibleWeeks = activity.weeks.slice(monthStartIndex);
  const monthColumns: MonthColumn[] = visibleMonths.map((month) => ({
    label: shortMonth(month.name),
    start: month.weekIndex - monthStartIndex + 1,
    span: Math.max(month.totalWeeks, 1)
  }));

  return {
    weekdayLabels: WEEKDAY_LABELS,
    monthColumns,
    recentItems: activity.recentActivity.slice(0, recentLimit),
    visibleWeeks,
    weekCount: visibleWeeks.length
  };
}
