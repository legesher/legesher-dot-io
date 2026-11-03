# How we write for legesher.io

This guide covers every sentence a visitor reads on legesher.io: page copy,
product summaries, policies, buttons, link text and page descriptions. It is
drawn from the copy Legesher's founder wrote by hand, on the home page, in the
language-packs README and in the two positioning lines, and it is what the
copy-voice guard in `src/lib/copy-voice.test.ts` checks mechanically. When the
two disagree, this document wins and the guard is updated to match.

## Who is reading

Developers, Builders, Learners, Teams and Institutions. Many of them read
English as a second language, and every page will one day be rendered in other
languages. Write for them: short sentences, common words, no idioms, and no
phrasing whose effect depends on English.

## The two lines everything hangs from

- The heart line: "You don't have to choose English to build the future."
- The head line: "Write and run Python in your language."

A page that needs a reason to exist uses one or both. Everything else on the
page is practical.

## Seven rules

### 1. Talk to the reader, not about ourselves

Second person, present tense, concrete verbs. "You do not need to know how to
code to contribute." We never describe our own virtues. A sentence that says we
are honest, careful, plain or deliberate is cut, and the fact it was defending
is stated instead.

Instead of: "Nothing here links to an install path we do not stand behind."

Write: "When a product is ready to install, its command appears here."

### 2. Heart language leads

Emotional copy says "your language" or "heart language". "Native speaker",
"locale" and "canonical name" belong in technical sentences only. The README
puts it this way: "as if first written in your heart language instead of solely
through the perspective of a native English speaker."

### 3. One idea per sentence, and the thing first

Lead with the noun the reader cares about. No stacked colons. No sentence built
as a contrast for effect ("Most datasets do X. This one does Y."). No
rhetorical setup before the point ("That framing is the point.", "One thing
worth saying plainly:", "Two limits, stated plainly, because..."). If a point
needs a drum roll, it is not the point.

Instead of: "It exists because the question does not have one answer. It has
several, offered by different people at different times for different reasons,
and the disagreements are as informative as the agreements. Most datasets in
this space publish a single winning answer and discard the rest. This one keeps
the evidence."

Write: "The question has more than one answer. People offer different words at
different times for different reasons, and the disagreement is part of the
record. The corpus keeps every answer."

### 4. Say what is true at the size it is true

Shipped work is present tense. Everything else is future tense, with what it
waits on. Packs are "available, community validation in progress", never "beta"
or "unverified". A limit is one plain sentence, not a warning block. When a
claim is more confident than the system behind it, weaken the claim until it is
true, and accept a slightly awkward sentence as the cost.

### 5. Invite, then show the way

Headings are short nouns or verbs: "Start here", "Offer a word", "Get the
data", "Available now". A call to action names the thing that happens: "Join
the newsletter", "Open the dataset". Not "Learn more", not "Stay informed".

### 6. Keep the vocabulary

These words have a fixed meaning on this site.

- Audiences: Developers, Builders, Learners, Teams, Institutions. Never
  "non-developer".
- "Existing codebases", never "legacy code".
- Products: the language packs, the command line, the engine, the VS Code
  extension, the MCP server, Legesher Bridge (the managed layer), the shared
  map, the Translation API.
- Data: the corpus holds every word offered; the canon holds the word chosen
  for each concept in each language; a pack is what ships. A contributor
  "offers a word"; a reviewer "endorses" it.
- A name's canonical form is the one its author wrote. English is one rendering
  among others. Never "the English name".
- Tiers: Free, Founding Developer (beta), Team, Enterprise. A price appears only
  where the pricing source of truth places it; a page never restates one.
- Contact addresses, by purpose: contribute@legesher.com (contributing, credit
  preference), support@legesher.com (help, conduct, feedback),
  privacy@legesher.com (privacy requests, contributor credit and withdrawal),
  security@legesher.com, legal@legesher.com, hello@legesher.com (general,
  hosted service, plans, payments, commercial). No other address appears on
  the site.
- "7,000+ languages" is mission framing, never a feature claim.

### 7. Mechanics

- No em dashes. Use a comma, a period or a colon.
- Sentence case for headings and buttons. Policy pages (Terms, Privacy,
  Refunds) follow the Terms of Service: numbered sections in title case.
- A number appears only when it traces to a source (a dataset card, a
  changelog, a policy) and is written the same way everywhere it appears.
- Spell an acronym out the first time it appears on a page.
- No exclamation marks, no emoji in page copy, no "we're excited".
- American spelling.

## Words and patterns the guard rejects

The guard fails on any of these in page copy, because each one reads as
generated text or as self-description: plainly, deliberately, honest about,
honestly, stand behind, on purpose, by design, that is the point, worth noting,
worth saying, no questions asked, game-changer, seamless, robust, leverage,
delve, unlock, elevate, supercharge, effortless, cutting-edge,
state-of-the-art, demystify, an em dash, and any contact address outside the
six above.

Patterns no regex catches, so a reviewer does: "Whether you are X or Y, ..."
openers; "From X to Y, Z" sweeps; "X. Not Y." contrasts; three adjectives in a
row ("inclusive, engaging, and effective"); a paragraph that explains why we
wrote the paragraph.

## Before and after

From the install page:

- Before: "One front door for every Legesher product. Each entry says plainly
  whether it is available today or still on its way. Nothing here links to an
  install path we do not stand behind."
- After: "Every Legesher product in one place: what you can use today, where to
  get it, and what is still on its way. When a product is ready to install, its
  command appears here."

From the corpus page:

- Before: "Openly licensed, and honest about where each word came from."
- After: "Open data, with the source of every word recorded."

From the refund policy:

- Before: "You can cancel at any time, yourself, from the Polar customer portal.
  No email, no call, no retention step."
- After: "You can cancel at any time from the Polar customer portal. You do not
  need to email or call us."
