import assert from "node:assert/strict";
import { dedupeRecentActivity, toRecentActivity } from "../../src/lib/github-events.ts";
import type { GitHubPublicEvent, RecentActivityItem } from "../../src/lib/github-types.ts";

function githubEvent(overrides: Record<string, unknown> = {}): GitHubPublicEvent {
  return {
    created_at: "2026-06-15T12:00:00Z",
    repo: { name: "alnah/example" },
    ...overrides
  } as GitHubPublicEvent;
}

function toActivity(event: GitHubPublicEvent): RecentActivityItem {
  const item = toRecentActivity(event);
  assert.ok(item, "expected a recent activity item");
  return item;
}

/** GitHub event mapping and dedupe. */
export function testGitHubEvents(): void {
  assert.equal(toRecentActivity({ type: "PushEvent" }), null, "an event without a repo is ignored");
  assert.equal(
    toRecentActivity(githubEvent({ type: "UnknownEvent" })),
    null,
    "an unknown event type is ignored"
  );

  const push = toActivity(
    githubEvent({ type: "PushEvent", payload: { commits: [{}, {}], ref: "refs/heads/main" } })
  );
  assert.match(push.summary, /^Push de 2 commits sur alnah\/example via main\.$/, "push summary");
  assert.equal(push.url, "https://github.com/alnah/example", "push points to the repo");

  const singleCommit = toActivity(
    githubEvent({ type: "PushEvent", payload: { commits: [{}], ref: "refs/heads/main" } })
  );
  assert.match(singleCommit.summary, /^Push de 1 commit sur/, "a single commit is singular");

  const pullRequest = toActivity(
    githubEvent({
      type: "PullRequestEvent",
      payload: { action: "opened", pull_request: { html_url: "https://github.com/alnah/example/pull/1" } }
    })
  );
  assert.match(pullRequest.summary, /^Ouverture de une pull request dans alnah\/example\.$/, "pull request summary");
  assert.equal(pullRequest.url, "https://github.com/alnah/example/pull/1", "pull request points to the PR");

  const release = toActivity(
    githubEvent({
      type: "ReleaseEvent",
      payload: { release: { html_url: "https://github.com/alnah/example/releases/tag/v1" } }
    })
  );
  assert.match(release.summary, /^Publication d'une release dans alnah\/example\.$/, "release summary");

  const created = toActivity(
    githubEvent({ type: "CreateEvent", payload: { ref_type: "branch", ref: "feature" } })
  );
  assert.match(created.summary, /^Création de branche feature dans alnah\/example\.$/, "create summary");

  const issue = toActivity(
    githubEvent({ type: "IssuesEvent", payload: { action: "closed", issue: { html_url: "https://github.com/alnah/example/issues/2" } } })
  );
  assert.match(issue.summary, /^Fermeture de une issue dans alnah\/example\.$/, "issue summary");

  const issueComment = toActivity(
    githubEvent({ type: "IssueCommentEvent", payload: { issue: { html_url: "https://github.com/alnah/example/issues/3" } } })
  );
  assert.match(issueComment.summary, /^Commentaire sur une issue dans alnah\/example\.$/, "issue comment summary");

  const fork = toActivity(
    githubEvent({ type: "ForkEvent", payload: { forkee: { html_url: "https://github.com/someone/example" } } })
  );
  assert.match(fork.summary, /^Fork de alnah\/example\.$/, "fork summary");

  const watch = toActivity(githubEvent({ type: "WatchEvent" }));
  assert.match(watch.summary, /^Ajout d'une étoile sur alnah\/example\.$/, "watch summary");

  assert.equal(
    dedupeRecentActivity([
      { date: "2026-06-15", summary: "same", url: "https://github.com/alnah/example" },
      { date: "2026-06-16", summary: "same", url: "https://github.com/alnah/example" }
    ]).length,
    1,
    "identical activity items are deduped"
  );
}
