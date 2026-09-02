/**
 * Every string and asset path on the page lives here.
 *
 * Nothing else in the project hardcodes copy, so changing what the site says
 * means editing this file and nothing else.
 *
 * Anything in [SQUARE BRACKETS] is a placeholder that still needs a real
 * value — meeting times, room numbers, contact details and photos.
 */

/**
 * A phrase with exactly one italicised span. Rendering these as data rather
 * than as HTML strings keeps the content file free of markup.
 */
export type Phrase = { lead: string; em: string; tail: string };

export const SITE = {
  name: 'Business Entrepreneurship Club',
  /** Header mark, split so "Club" can sit small next to the long name. */
  markLead: 'Business Entrepreneurship',
  markSup: 'Club',
  /** Oversized footer mark. Short is better — it is set at ~19rem. */
  wordmark: 'BEC',
  school: 'San Marin High School',
  tagline: 'A student-run club at San Marin High School',
  year: '2026',
};

export const NAV = [
  { label: 'About', href: '#about', index: '01', preview: '/media/work-01.jpg' },
  { label: 'What We Do', href: '#what', index: '02', preview: '/media/work-04.jpg' },
  { label: 'Focus', href: '#focus', index: '03', preview: '/media/svc-02.jpg' },
  { label: 'The Year', href: '#year', index: '04', preview: '/media/work-03.jpg' },
  { label: 'Join', href: '#join', index: '05', preview: '/media/work-06.jpg' },
];

export const HERO = {
  eyebrow: 'Student-run club — San Marin High School',
  /**
   * Split across lines by hand so the ragging is art-directed. `em` is the one
   * italic character in each line — the single flourish in the type system.
   */
  headline: [
    { text: 'Bu', em: 'i', tail: 'ld something' },
    { text: 'worth chas', em: 'i', tail: 'ng.' },
  ],
  meta: [
    { k: 'We meet', v: '[DAY & TIME]' },
    { k: 'Where', v: '[ROOM] — San Marin High School' },
  ],
  scroll: 'Scroll to begin',
};

/** Ticker under the hero — what the club actually covers. */
export const TOPICS = [
  'ENTREPRENEURSHIP', 'AI AS A TOOL', 'STARTUPS', 'PITCHING',
  'FINANCE & INVESTING', 'PRODUCT', 'ENGINEERING DESIGN CYCLE', 'HACKATHON',
];

export const ABOUT = {
  label: 'Who we are',
  heading: 'For anyone who wants to build something real',
  body:
    'A company, a product, an app, or just a good idea worth chasing. We bring together entrepreneurship and business with technology, AI and STEM — because most good ventures today need both sides working together.',
  stats: [
    { n: '1', l: 'Flagship hackathon a year' },
    { n: '6', l: 'Ways we actually build' },
    { n: '0', l: 'Experience required' },
  ],
};

/** The full-bleed hinge between the intro and the programme. */
export const HINGE = {
  word: 'Build',
  labelLeft: 'What we do',
  labelRight: 'Every week',
  caption: { lead: 'Six ways we turn an idea into something you can ', em: 'actually', tail: ' show.' } as Phrase,
  tick: '01 / 06',
};

export type Activity = {
  index: string;
  kicker: string;
  title: string;
  blurb: string;
  tag: string;
  image: string;
};

/** The programme — one card per thing the club actually does. */
export const PROGRAM = {
  label: 'What we do',
  title: { lead: 'The ', em: 'programme', tail: '' } as Phrase,
  meta: 'Six things, all year',
  items: [
    {
      index: '01',
      kicker: 'Sessions',
      title: 'Guest speakers',
      blurb:
        'People involved in genuinely impactful work, with real stories to tell. Interactive, not lectures — think live activities like guessing the real budget of a project.',
      tag: 'Interactive',
      image: '/media/work-01.jpg',
    },
    {
      index: '02',
      kicker: 'Tools',
      title: 'AI as a business tool',
      blurb:
        'We teach you to actually use AI to get ahead — the way a $100k/year engineer uses it, not like an assistant. Free tools that make life easier, plus the real tech stack behind building apps and startups.',
      tag: 'Wispr Flow, Granola',
      image: '/media/work-02.jpg',
    },
    {
      index: '03',
      kicker: 'The goal',
      title: 'A real business by the end of the year',
      blurb:
        'We teach you how to actually walk out with your own business or startup idea in hand.',
      tag: 'Yours to keep',
      image: '/media/work-03.jpg',
    },
    {
      index: '04',
      kicker: 'Thinking',
      title: 'The open-ended side of business',
      blurb:
        'The Engineering Design Cycle, finance and investing, and building creative judgment — not just formulas.',
      tag: 'Judgment, not formulas',
      image: '/media/work-04.jpg',
    },
    {
      index: '05',
      kicker: 'Practice',
      title: 'Pitch exercises',
      blurb:
        'Held throughout the year, so presenting your ideas stops being the scary part.',
      tag: 'All year',
      image: '/media/work-05.jpg',
    },
    {
      index: '06',
      kicker: 'Flagship',
      title: 'The hackathon',
      blurb:
        'Teams build and demo something they have made — in a single day.',
      tag: 'One day, one build',
      image: '/media/work-06.jpg',
    },
  ] satisfies Activity[],
};

/** Cycled through the WebGL displacement plate. Swap in real photos. */
export const INSIDE = {
  label: 'Inside the club',
  title: { lead: 'What a ', em: 'meeting', tail: ' looks like' } as Phrase,
  meta: 'Drag or hover to distort',
  items: [
    { title: '[PHOTO] Guest speaker session', meta: 'Interactive, not a lecture' },
    { title: '[PHOTO] Build night', meta: 'Tools, stacks and shipping' },
    { title: '[PHOTO] Pitch practice', meta: 'Held throughout the year' },
    { title: '[PHOTO] The hackathon', meta: 'Build and demo in one day' },
  ].map((x, i) => ({ ...x, image: `/media/gallery-0${i + 1}.jpg` })),
};

export const FOCUS = {
  label: 'Focus areas',
  title: { lead: 'Business and ', em: 'building', tail: ', together' } as Phrase,
  intro:
    'Four things we keep coming back to. Most projects need more than one of them — that is rather the point of putting business and tech in the same room.',
  items: [
    {
      index: '01',
      title: 'Entrepreneurship',
      tags: ['Idea to venture', 'Startups', 'Business models', 'Customers'],
      marquee: 'BUILD A BUSINESS',
      image: '/media/svc-01.jpg',
    },
    {
      index: '02',
      title: 'AI & Technology',
      tags: ['AI tools', 'Wispr Flow', 'Granola', 'Tech stack'],
      marquee: 'AI AS A TOOL',
      image: '/media/svc-02.jpg',
    },
    {
      index: '03',
      title: 'Finance & Judgment',
      tags: ['Investing', 'Budgets', 'Design cycle', 'Creative judgment'],
      marquee: 'FINANCE & JUDGMENT',
      image: '/media/svc-03.jpg',
    },
    {
      index: '04',
      title: 'Pitching & Demo',
      tags: ['Pitch practice', 'Public speaking', 'Hackathon', 'Demo day'],
      marquee: 'PITCH & DEMO',
      image: '/media/svc-04.jpg',
    },
  ],
};

/** Horizontal rail — the shape of a year in the club. */
export const YEAR = {
  label: 'How the year runs',
  title: { lead: 'Five steps, ', em: 'no', tail: ' application.' } as Phrase,
  body:
    'There is no tryout and no prerequisite. This is the whole arc, from the first meeting to demo day.',
  steps: [
    { index: '01', title: 'Show up', body: 'No application, no experience. Come to a meeting and see what it is.' },
    { index: '02', title: 'Learn the tools', body: 'AI, the tech stack and the business basics — the things that make building faster.' },
    { index: '03', title: 'Find your idea', body: 'A company, a product, an app, or something you just want to exist.' },
    { index: '04', title: 'Pitch it', body: 'Pitch exercises all year, so presenting stops being the scary part.' },
    { index: '05', title: 'Build & demo', body: 'The flagship hackathon — teams build and demo something in a single day.' },
  ],
};

export const WHY = {
  label: 'Why join',
  /** The third line takes the accent colour. */
  lines: ['Start a company.', 'Ship an app.', 'Or just build', 'with good people.'],
  note:
    'Whether you want to start a company, build an app, learn how startups actually work, or just meet people who like building things — there is a place for you here.',
};

export const FAQ = {
  label: 'Before you come',
  title: { lead: 'Questions we ', em: 'actually', tail: ' get' } as Phrase,
  items: [
    { index: '01', q: 'Do I need any experience?', a: 'None. Most people start with nothing but an interest in building things.' },
    { index: '02', q: 'Do I need an idea already?', a: 'No — finding one is part of the year.' },
    { index: '03', q: 'Is this only for business kids?', a: 'No. We mix business with technology, AI and STEM, and both sides are welcome.' },
    { index: '04', q: 'How much time does it take?', a: 'One meeting a week, plus the hackathon if you want in on it.' },
    { index: '05', q: 'When and where do you meet?', a: '[DAY & TIME] in [ROOM], at San Marin High School.' },
  ],
};

export const JOIN = {
  headline: { lead: 'Come to the next', em: 'meeting', tail: '.' },
  second: { lead: 'You need', em: 'nothing', tail: 'to start.' },
  button: 'Join the club',
  note:
    'Turning up is the whole process — no application, no dues, no experience. Questions first? Send us a message.',
  email: '[EMAIL@EXAMPLE.COM]',
};

export const FOOTER = {
  columns: [
    { label: 'Meetings', lines: ['[DAY & TIME]', '[ROOM], San Marin High School'] },
    { label: 'Contact', lines: ['[EMAIL@EXAMPLE.COM]', '[ADVISOR / OFFICER NAME]'] },
  ],
  followLabel: 'Follow',
  socials: ['[INSTAGRAM]', '[DISCORD]', '[REMIND]'],
  noteLabel: 'Announcements',
  note: 'Meeting reminders and speaker announcements go out on [INSTAGRAM].',
  noteCta: 'Follow us',
};
