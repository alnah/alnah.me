const requiredContactIds = [
  'github',
  'x',
  'tiktok',
  'bluesky',
  'mastodon',
  'linkedin',
  'email',
  'rss',
] as const

export type ContactId = (typeof requiredContactIds)[number]

export type ContactLink = {
  id: ContactId
  label: string
  href: string
}

export type GitHubActivityConfig = {
  username: string
  profileUrl: string
  items?: readonly string[]
}

function validateExternalUrl(label: string, href: string) {
  if (!href) {
    throw new Error(`Missing href for contact: ${label}`)
  }

  if (href.startsWith('/')) {
    return href
  }

  if (href.startsWith('mailto:')) {
    if (!href.slice('mailto:'.length).trim()) {
      throw new Error(`Invalid mailto href for contact: ${label}`)
    }
    return href
  }

  const url = new URL(href)
  if (url.protocol !== 'https:') {
    throw new Error(`Contact URL must use https for: ${label}`)
  }

  return href
}

function validateContacts(contacts: readonly ContactLink[]) {
  const seen = new Set<string>()

  for (const contact of contacts) {
    if (seen.has(contact.id)) {
      throw new Error(`Duplicate contact id: ${contact.id}`)
    }

    seen.add(contact.id)
    validateExternalUrl(contact.label, contact.href)
  }

  for (const id of requiredContactIds) {
    if (!seen.has(id)) {
      throw new Error(`Missing required contact id: ${id}`)
    }
  }

  return contacts
}

export const SITE = {
  title: 'Alexis Nahan',
  alternateName: 'alnah',
  siteUrl: 'https://alnah.me',
  aboutPath: '/a-propos/',
  description:
    "Notes de travail et réflexion générales sur l'enseignement du Français Langue Étrangère (FLE) et les technologies.",
  defaultSocialImage: '/og-default.jpg',
  socialImageAlt: "Image avec un symbole circulaire dans lequel est écrit AN, sous-titré par alnah.me, centré sur un fond chaud.",
  xHandle: '@_alnah',
  author: {
    name: 'Alexis Nahan',
    alias: 'alnah',
    email: 'contact@alnah.me',
    intro: 'Prof + Dev',
    kicker: "J'utilise mes compétences de développeur pour enseigner le FLE.",
    photoAlt: "Portrait d'Alexis Nahan",
  },
  repoUrl: 'https://github.com/alnah/alnah.me',
  reuseUrl: '/LICENSE',
  contacts: validateContacts([
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/alnah',
    },
    {
      id: 'x',
      label: 'X',
      href: 'https://x.com/_alnah',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: 'https://www.tiktok.com/@_alnah',
    },
    {
      id: 'bluesky',
      label: 'Bluesky',
      href: 'https://bsky.app/profile/alnah.bsky.social',
    },
    {
      id: 'mastodon',
      label: 'Mastodon',
      href: 'https://mastodon.social/@alnah',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/alnah/',
    },
    {
      id: 'email',
      label: 'E-mail',
      href: 'mailto:contact@alnah.me',
    },
    {
      id: 'rss',
      label: 'RSS',
      href: '/rss.xml',
    },
  ]),
  githubActivity: {
    username: 'alnah',
    profileUrl: 'https://github.com/alnah',
  } satisfies GitHubActivityConfig,
  postPageSize: 6,
} as const

export const NAV_ITEMS = [
  {
    id: 'posts',
    href: '/articles/',
    label: 'Articles',
  },
  {
    id: 'about',
    href: '/a-propos/',
    label: 'À propos',
  },
] as const
