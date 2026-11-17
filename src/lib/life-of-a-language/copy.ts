// Copy for the "life of a language" page, kept apart from the markup so the
// page can be rendered in another language by swapping this object.
//
// `{lang}` in a string is replaced with the name of the language the visitor
// is following, in its own script.
//
// Every rule stated here traces to REVIEWING.md in legesher/language-packs
// (sections 4, 6, 8, 9 and 10). When that guide changes, this file changes.

export type StageId =
  | 'asked-for'
  | 'groundwork'
  | 'first-draft'
  | 'experimental'
  | 'in-review'
  | 'reviewed'
  | 'official'
  | 'kept-current';

export type Tier = 'experimental' | 'reviewed' | 'official';

export interface StageCopy {
  id: StageId;
  title: string;
  lead: string;
  what: string;
  who: string;
  you: string;
  /** The pack status a language holds once it reaches this step. */
  tier?: Tier;
}

export interface Copy {
  meta: { title: string; description: string };
  hero: { eyebrow: string; titleStart: string; titleAccent: string; intro: string };
  picker: {
    label: string;
    showingDefault: string;
    showingBrowser: string;
    showingPicked: string;
    missing: string;
    missingCta: string;
  };
  rail: { heading: string; here: string; next: string; done: string };
  chip: { done: string; here: string; next: string };
  labels: {
    step: (n: number, total: number) => string;
    what: string;
    who: string;
    you: string;
    planned: string;
    showStep: string;
    hideStep: string;
    ltr: string;
    rtl: string;
    caseYes: string;
    caseNo: string;
  };
  tiers: Record<Tier, { name: string; meaning: string }>;
  stages: StageCopy[];
  panels: {
    askedFor: { title: string; rows: [string, string][]; cta: string; note: string };
    groundwork: {
      title: string;
      name: string;
      english: string;
      tag: string;
      direction: string;
      letterCase: string;
    };
    firstDraft: { from: string; checksTitle: string; checks: string[]; caption: string };
    experimental: {
      caption: string;
      status: string;
      packs: (n: number) => string;
      cta: string;
    };
    inReview: { title: string; steps: string[]; guideCta: string; fileCta: string; note: string };
    reviewed: {
      title: string;
      rules: [string, string][];
      none: string;
      some: (n: number) => string;
      founding: string;
      openData: string;
      openDataCta: string;
      planned: string;
    };
    official: {
      title: string;
      rules: [string, string][];
      session: string;
      none: string;
      some: (n: number) => string;
    };
    keptCurrent: { rows: [string, string][]; reportNote: string };
  };
  start: { heading: string; cards: { title: string; text: string; cta: string }[] };
}

export const en: Copy = {
  meta: {
    title: 'The life of a language | Legesher',
    description:
      'The eight steps a language takes in Legesher: a request, a first pack you can code in, review by its speakers, and official status.',
  },
  hero: {
    eyebrow: 'Language packs',
    titleStart: 'The life of a',
    titleAccent: 'language',
    intro:
      "Every language in Legesher takes the same eight steps. It starts with a request. It ends with a pack that the language's own speakers have made official. Choose a language to follow it.",
  },
  picker: {
    label: 'Follow a language',
    showingDefault: 'Showing {lang} as an example.',
    showingBrowser: 'Showing {lang}, the language your browser asks for.',
    showingPicked: 'Following {lang}.',
    missing: 'Is your language not in the list?',
    missingCta: 'Ask for it',
  },
  rail: { heading: 'The eight steps', here: '{lang} is here', next: 'Next', done: 'Done' },
  chip: { done: 'Done for {lang}', here: '{lang} is here', next: 'Next for {lang}' },
  labels: {
    step: (n, total) => `Step ${n} of ${total}`,
    what: 'What happens',
    who: 'Who does it',
    you: 'What you can do',
    planned: 'Planned',
    showStep: 'Show details',
    hideStep: 'Hide details',
    ltr: 'Left to right',
    rtl: 'Right to left',
    caseYes: 'Yes',
    caseNo: 'No',
  },
  tiers: {
    experimental: {
      name: 'Experimental',
      meaning: 'The pack was put together by machine and has passed automatic checks.',
    },
    reviewed: { name: 'Reviewed', meaning: 'Native speakers have signed off on the words.' },
    official: { name: 'Official', meaning: "The language's own reviewers have ratified the pack." },
  },
  stages: [
    {
      id: 'asked-for',
      title: 'Asked for',
      lead: 'A language starts when someone asks for it.',
      what: "A request is opened on GitHub. It gives the language's name, its code and its writing direction. You can ask for a language even if you cannot translate it yourself.",
      who: 'Anyone: a speaker, a teacher, a team.',
      you: 'Ask for your language. A request shows us where a pack is wanted. It does not set a date.',
    },
    {
      id: 'groundwork',
      title: 'Groundwork',
      lead: 'The language gets an entry in the registry.',
      what: "The entry records the language's name in its own script, its language tag, its writing direction, and whether its script has upper and lower case. Legesher's tools read the language from this entry.",
      who: 'Legesher maintainers.',
      you: 'Look over the entry for {lang}. If a detail is wrong, write to support@legesher.com.',
    },
    {
      id: 'first-draft',
      title: 'First draft',
      lead: 'A first draft of the pack is put together by machine.',
      what: 'Language models offer words for every Python keyword, built-in name and exception. Automatic checks test every word, and one word for each goes into the pack. No person has to approve a word at this step.',
      who: 'Language models offer the words. Legesher maintainers run the checks.',
      you: 'Read the {lang} words. A draft is a starting point, and it has passed automatic checks only. Step 5 is where you can change it.',
    },
    {
      id: 'experimental',
      title: 'Experimental',
      tier: 'experimental',
      lead: 'The pack ships, and you can code in the language.',
      what: 'The pack is published with the status experimental. Review does not hold a pack back, so you can use a language while its speakers are still checking the words.',
      who: 'Legesher publishes the pack. Anyone can use it.',
      you: 'Write Python in {lang}.',
    },
    {
      id: 'in-review',
      title: 'In review',
      lead: 'People who speak the language review the words.',
      what: "A reviewer marks the words they would teach and offers a better word where they have one. They can also describe how code should read in the language. Those answers become the language's style profile. A maintainer reads every review before it counts. The pack does not change with each review. The reviews add up.",
      who: 'People who speak the language. You do not need to know Python, and a partial review is welcome.',
      you: 'Review {lang}.',
    },
    {
      id: 'reviewed',
      title: 'Reviewed',
      tier: 'reviewed',
      lead: 'Native speakers have signed off on the words.',
      what: 'When the reviews reach the numbers on this card, the word for each concept is chosen again from the reviews, and a new version of the pack ships as reviewed.',
      who: 'The numbers decide. No single person can move a pack to reviewed.',
      you: 'Bring a second reviewer. Each word needs two native speakers, so one person cannot carry {lang} to reviewed alone.',
    },
    {
      id: 'official',
      title: 'Official',
      tier: 'official',
      lead: "The language's own reviewers ratify the pack.",
      what: "The numbers on this card make a pack eligible. Then the language's reviewers meet. The session reads the reviews and decides whether the pack is ready.",
      who: "The language's reviewers. Legesher maintainers cannot make a pack official on their own.",
      you: 'Grow the group. Official needs ten reviewers, and the bar is the same for every language. Until then a pack stays reviewed and stays usable.',
    },
    {
      id: 'kept-current',
      title: 'Kept current',
      lead: 'A pack keeps changing after it ships.',
      what: 'A new version ships each time a language crosses a step. A pack can also move back: a word that is found to be wrong returns to experimental until it is reviewed again.',
      who: 'Everyone who uses or reviews the pack.',
      you: 'Tell us when a word is wrong. Put it in your review, or write to support@legesher.com.',
    },
  ],
  panels: {
    askedFor: {
      title: 'What a request holds',
      rows: [
        ['Language name', 'In English and in its own script'],
        ['Language code', 'Two letters, such as sw'],
        ['Writing direction', 'Left to right, or right to left'],
      ],
      cta: 'Ask for a language',
      note: 'You need a free GitHub account.',
    },
    groundwork: {
      title: 'Registry entry',
      name: 'Name',
      english: 'In English',
      tag: 'Language tag',
      direction: 'Writing direction',
      letterCase: 'Upper and lower case',
    },
    firstDraft: {
      from: 'Python',
      checksTitle: 'Every word must',
      checks: [
        'be a valid name in code',
        'use one script',
        'hold no hidden characters',
        'not clash with another word in the pack',
      ],
      caption: 'Words from the {lang} pack today.',
    },
    experimental: {
      caption: 'One Python program, written with the {lang} pack.',
      status: 'Pack status',
      packs: (n) => `${n} languages have a pack today.`,
      cta: 'Read the docs',
    },
    inReview: {
      title: 'How a review works',
      steps: [
        'Copy the review file for your language.',
        'Mark the words you would teach. Offer a better word where you have one.',
        'Tick the boxes that record your agreement.',
        'Open a pull request. A maintainer replies.',
      ],
      guideCta: 'Read the review guide',
      fileCta: 'Open the {lang} review file',
      note: 'Today, reviewing happens by pull request on GitHub. More ways to take part are coming.',
    },
    reviewed: {
      title: 'What reviewed takes',
      rules: [
        ['2', 'native speakers, at least, endorse each reviewed word'],
        ['80%', 'of the pack, at least, is covered by those reviews'],
        ['0', 'open flags'],
      ],
      none: 'No language is reviewed yet.',
      some: (n) => (n === 1 ? '1 language is reviewed.' : `${n} languages are reviewed.`),
      founding:
        'The first verified native reviewers to carry a language to reviewed are recorded as its founding reviewers.',
      openData: 'The endorsements are published as open data, so anyone can check the count.',
      openDataCta: 'Open the dataset',
      planned: 'A status page that does this count for each language.',
    },
    official: {
      title: 'What official takes',
      rules: [
        ['10', 'reviews, at least, on every word'],
        ['Most', 'reviewers of a word rank the shipped word first'],
        ['1', 'style profile, ratified'],
        ['0', 'open flags'],
      ],
      session:
        "A session of the language's reviewers ratifies the pack. It counts only when at least three verified native speakers are present, or a majority of those attending, whichever is greater.",
      none: 'No language is official yet.',
      some: (n) => (n === 1 ? '1 language is official.' : `${n} languages are official.`),
    },
    keptCurrent: {
      rows: [
        ['A language crosses a step', 'A new pack version ships'],
        ['A word is found to be wrong', 'It returns to experimental until it is reviewed again'],
        ['A word is not chosen', 'It stays in the record with the others'],
      ],
      reportNote: 'No word or comment is deleted from the record.',
    },
  },
  start: {
    heading: 'Start where your language is',
    cards: [
      {
        title: 'Your language has no pack',
        text: 'Ask for it. A request shows us where a pack is wanted.',
        cta: 'Ask for a language',
      },
      {
        title: 'Your language has a pack',
        text: 'Review it. You do not need to know how to code.',
        cta: 'Read the review guide',
      },
      {
        title: 'You want to use a pack',
        text: 'Write and run Python in your language.',
        cta: 'Read the docs',
      },
    ],
  },
};
