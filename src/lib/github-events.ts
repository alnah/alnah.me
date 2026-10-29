import type { GitHubPublicEvent, RecentActivityItem } from "./github";

/**
 * Pure mapping from GitHub public events to the recent-activity items shown on
 * the About page. Keeping it free of I/O makes it testable and keeps the
 * transport in github-client.ts.
 */

const ACTION_LABELS: Record<string, string> = {
  opened: 'ouverture de',
  closed: 'fermeture de',
  reopened: 'réouverture de',
  edited: 'modification de',
  updated: 'mise à jour de',
  created: 'création de',
  deleted: 'suppression de',
  published: 'publication de',
  synchronized: 'synchronisation de'
};

const REF_TYPE_LABELS: Record<string, string> = {
  repository: 'dépôt',
  branch: 'branche',
  tag: 'tag',
  resource: 'ressource'
};

function formatRepoUrl(repoName: string) {
  return `https://github.com/${repoName}`;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function translateGitHubAction(action: string) {
  return ACTION_LABELS[action] ?? action;
}

function translateGitHubRefType(refType: string) {
  return REF_TYPE_LABELS[refType] ?? refType;
}

function createRecentActivityKey(item: RecentActivityItem) {
  return `${item.summary}::${item.url ?? ""}`;
}

export function dedupeRecentActivity(items: RecentActivityItem[]) {
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

export function toRecentActivity(event: GitHubPublicEvent): RecentActivityItem | null {
  const repoName = event.repo?.name;
  if (typeof repoName !== "string") {
    return null;
  }

  const repoUrl = formatRepoUrl(repoName);
  const createdAt = typeof event.created_at === "string" ? event.created_at : "";

  switch (event.type) {
    case "PushEvent": {
      const commitCount = Array.isArray(event.payload?.commits) ? event.payload.commits.length : 0;
      const branch =
        typeof event.payload?.ref === "string" ? event.payload.ref.split("/").pop() : null;

      return {
        date: createdAt,
        summary: `Push de ${commitCount || 'nouveaux'} commit${commitCount === 1 ? '' : 's'} sur ${repoName}${branch ? ` via ${branch}` : ''}.`,
        url: repoUrl
      };
    }

    case "PullRequestEvent": {
      const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
      const prUrl =
        typeof event.payload?.pull_request?.html_url === "string"
          ? event.payload.pull_request.html_url
          : repoUrl;

      return {
        date: createdAt,
        summary: `${capitalize(translateGitHubAction(action))} une pull request dans ${repoName}.`,
        url: prUrl
      };
    }

    case "ReleaseEvent": {
      const releaseUrl =
        typeof event.payload?.release?.html_url === "string"
          ? event.payload.release.html_url
          : repoUrl;

      return {
        date: createdAt,
        summary: `Publication d'une release dans ${repoName}.`,
        url: releaseUrl
      };
    }

    case "CreateEvent": {
      const refType =
        typeof event.payload?.ref_type === "string" ? event.payload.ref_type : "resource";
      const ref = typeof event.payload?.ref === "string" ? event.payload.ref : "";

      return {
        date: createdAt,
        summary: `Création de ${translateGitHubRefType(refType)}${ref ? ` ${ref}` : ''} dans ${repoName}.`,
        url: repoUrl
      };
    }

    case "IssuesEvent": {
      const action = typeof event.payload?.action === "string" ? event.payload.action : "updated";
      const issueUrl =
        typeof event.payload?.issue?.html_url === "string"
          ? event.payload.issue.html_url
          : repoUrl;

      return {
        date: createdAt,
        summary: `${capitalize(translateGitHubAction(action))} une issue dans ${repoName}.`,
        url: issueUrl
      };
    }

    case "IssueCommentEvent": {
      const issueUrl =
        typeof event.payload?.issue?.html_url === "string"
          ? event.payload.issue.html_url
          : repoUrl;

      return {
        date: createdAt,
        summary: `Commentaire sur une issue dans ${repoName}.`,
        url: issueUrl
      };
    }

    case "ForkEvent": {
      const forkUrl =
        typeof event.payload?.forkee?.html_url === "string"
          ? event.payload.forkee.html_url
          : repoUrl;

      return {
        date: createdAt,
        summary: `Fork de ${repoName}.`,
        url: forkUrl
      };
    }

    case "WatchEvent": {
      return {
        date: createdAt,
        summary: `Ajout d'une étoile sur ${repoName}.`,
        url: repoUrl
      };
    }

    default:
      return null;
  }
}
