const requiredContactIds = [
  'github',
  'x',
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
  siteUrl: 'https://alnah.io',
  aboutPath: '/about/',
  description:
    'Notes on building software, teaching systems, and business tools from real work.',
  defaultSocialImage: '/profile.jpeg',
  socialImageAlt: 'Portrait of Alexis Nahan',
  xHandle: '@_alnah',
  author: {
    name: 'Alexis Nahan',
    alias: 'alnah',
    email: 'me@alnah.io',
    intro: "Hi, I'm Alexis.",
    blurb: 'I use this site to think through my projects as I shape them.',
    kicker: 'notes from my work',
    photoAlt: 'Portrait of Alexis Nahan',
  },
  repoUrl: 'https://github.com/alnah/alnah.io',
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
      label: 'Email',
      href: 'mailto:me@alnah.io',
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
    href: '/posts/',
    label: 'Posts',
  },
  {
    href: '/about/',
    label: 'About',
  },
] as const
