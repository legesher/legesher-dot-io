// Single source for the outbound links used across components.
//
// These previously lived inline in Header, Footer and Hero, which let them
// drift: the Slack invite existed twice pointing at one workspace and once at
// another, and the GitHub org URL appeared both with and without a trailing
// slash. Shared invites in particular get rotated, and a rotation should be a
// one-line edit here rather than a hunt through the components.
//
// Not covered: the /go/* short links in vercel.json. That file is static JSON
// and cannot import, so those copies have to be updated alongside this one.
export const LINKS = {
  github: 'https://github.com/legesher',
  slack: 'https://join.slack.com/t/legesher/shared_invite/zt-370xpp6b9-LYxWVIOF7ujVH5kYnwaGbQ',
  docs: 'https://docs.legesher.io/',
  // The two published datasets. `canon` is the decision layer — what the packs
  // ship; `corpus` is the evidence layer — every rendering anyone proposed.
  canon: 'https://huggingface.co/datasets/legesher/language-packs',
  corpus: 'https://huggingface.co/datasets/legesher/language-corpus',
  linkedin: 'https://www.linkedin.com/company/legesher',
  instagram: 'https://www.instagram.com/legesher',
  email: 'mailto:hello@legesher.com',
} as const;
