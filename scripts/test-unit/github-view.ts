import assert from "node:assert/strict";
import type { GitHubActivityData } from "../../src/lib/github-types.ts";
import {
  buildGitHubActivityView,
  formatContributionTitle,
  formatEventDate,
  formatMonthStyle,
  formatWeekdayStyle
} from "../../src/lib/github-view.ts";

/** Contribution calendar and activity view model. */
export function testGitHubView(): void {
  const activity = {
    hasLiveData: true,
    profileUrl: "https://github.com/alnah",
    totalContributions: 12,
    months: [
      { firstDay: "2026-01-04", name: "January", totalWeeks: 4, year: 2026, weekIndex: 1 },
      { firstDay: "2026-02-01", name: "February", totalWeeks: 4, year: 2026, weekIndex: 5 }
    ],
    weeks: Array.from({ length: 8 }, (_, index) => ({
      firstDay: `2026-01-0${index + 1}`,
      contributionDays: []
    })),
    recentActivity: [
      { date: "2026-01-03", summary: "a", url: null },
      { date: "2026-01-02", summary: "b", url: null },
      { date: "2026-01-01", summary: "c", url: null },
      { date: "2025-12-31", summary: "d", url: null }
    ]
  } satisfies GitHubActivityData;

  assert.equal(formatContributionTitle("2026-01-02", 1), "1 contribution le 2 janv. 2026");
  assert.equal(formatContributionTitle("2026-01-02", 3), "3 contributions le 2 janv. 2026");
  assert.equal(formatEventDate("2026-01-02"), "2 janv.");
  assert.equal(formatMonthStyle(1, 4), "grid-column:1 / span 4;");
  assert.equal(formatWeekdayStyle(2), "grid-row:2;");

  const view = buildGitHubActivityView(activity);

  assert.equal(view.weekCount, 7, "weeks before the first month are hidden");
  assert.deepEqual(view.monthColumns, [
    { label: "janv.", start: 1, span: 4 },
    { label: "févr.", start: 5, span: 4 }
  ]);
  assert.equal(view.recentItems.length, 3, "recent activity defaults to three items");
  assert.equal(view.weekdayLabels.length, 3);
  assert.equal(buildGitHubActivityView(activity, 1).recentItems.length, 1);
}
