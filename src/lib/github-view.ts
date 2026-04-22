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
  { label: 'Lun', row: 2 },
  { label: 'Mer', row: 4 },
  { label: 'Ven', row: 6 }
];

const MONTH_LABELS: Record<string, string> = {
  January: 'janv.',
  February: 'févr.',
  March: 'mars',
  April: 'avr.',
  May: 'mai',
  June: 'juin',
  July: 'juil.',
  August: 'août',
  September: 'sept.',
  October: 'oct.',
  November: 'nov.',
  December: 'déc.'
};

function shortMonth(name: string) {
  return MONTH_LABELS[name] ?? name.slice(0, 3);
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
