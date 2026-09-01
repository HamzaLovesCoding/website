/**
 * Every string and asset path on the page lives here.
 *
 * The build phase is about the visual system, so this is deliberately
 * placeholder copy — swapping in real content should mean editing this file
 * and nothing else.
 */

export const SITE = {
  name: 'Vivid Motion',
  wordmark: 'Vivid Motion',
  tagline: '[TAGLINE] Independent design & technology studio',
  year: '©2026',
};

export const NAV = [
  { label: 'Work', href: '#work', index: '01', preview: '/media/work-01.jpg' },
  { label: 'Studio', href: '#studio', index: '02', preview: '/media/work-04.jpg' },
  { label: 'Services', href: '#services', index: '03', preview: '/media/svc-02.jpg' },
  { label: 'Journal', href: '#journal', index: '04', preview: '/media/work-03.jpg' },
  { label: 'Contact', href: '#contact', index: '05', preview: '/media/work-06.jpg' },
];

export const HERO = {
  eyebrow: '[LABEL] Independent studio — Est. 2016',
  /** Split across lines by hand so the ragging is art-directed, not accidental. */
  headline: [
    { text: 'Creative stud', em: 'i', tail: 'o' },
    { text: 'bu', em: 'i', tail: 'lt for growth.' },
  ],
  meta: [
    { k: 'Based in', v: '[CITY] New York / Amsterdam' },
    { k: 'Available', v: '[STATUS] Q3 2026' },
  ],
  scroll: 'Scroll to begin',
};

export const CLIENTS = [
  '[CLIENT 01]', '[CLIENT 02]', '[CLIENT 03]', '[CLIENT 04]',
  '[CLIENT 05]', '[CLIENT 06]', '[CLIENT 07]', '[CLIENT 08]',
];

export const MANIFESTO = {
  label: 'What we do',
  heading: 'All the ways we move brands',
  body:
    '[DESCRIPTION] Strategy sets the direction, design gives it form, and development makes it real. We build the whole arc — from the first uncomfortable question to the thing that ships.',
  stats: [
    { n: '120+', l: '[STAT] Projects shipped' },
    { n: '18', l: '[STAT] Countries' },
    { n: '9 yrs', l: '[STAT] In practice' },
  ],
};

export type Project = {
  index: string;
  title: string;
  client: string;
  discipline: string;
  year: string;
  image: string;
};

export const PROJECTS: Project[] = [
  { index: '01', title: '[PROJECT] Ember Index', client: '[CLIENT]', discipline: 'Brand / Web / Motion', year: '2026', image: '/media/work-01.jpg' },
  { index: '02', title: '[PROJECT] Gilded Rail', client: '[CLIENT]', discipline: 'Identity / Packaging', year: '2025', image: '/media/work-02.jpg' },
  { index: '03', title: '[PROJECT] Night Spectrum', client: '[CLIENT]', discipline: 'Campaign / WebGL', year: '2025', image: '/media/work-03.jpg' },
  { index: '04', title: '[PROJECT] Quiet Machine', client: '[CLIENT]', discipline: 'Product / Design System', year: '2025', image: '/media/work-04.jpg' },
  { index: '05', title: '[PROJECT] Signal Bloom', client: '[CLIENT]', discipline: 'Art Direction / Film', year: '2024', image: '/media/work-05.jpg' },
  { index: '06', title: '[PROJECT] Low Orbit', client: '[CLIENT]', discipline: 'Brand / Platform', year: '2024', image: '/media/work-06.jpg' },
];

/** The four plates cycled through the WebGL displacement gallery. */
export const GALLERY = [
  { title: '[PROJECT] Ember Index', meta: 'Brand — 2026', image: '/media/gallery-01.jpg' },
  { title: '[PROJECT] Gilded Rail', meta: 'Identity — 2025', image: '/media/gallery-02.jpg' },
  { title: '[PROJECT] Night Spectrum', meta: 'Campaign — 2025', image: '/media/gallery-03.jpg' },
  { title: '[PROJECT] Quiet Machine', meta: 'Product — 2025', image: '/media/gallery-04.jpg' },
];

export const SERVICES = [
  {
    index: '01',
    title: 'Strategy',
    body: '[DESCRIPTION] The thinking before the making. We dig into markets, audiences and positioning until it clicks.',
    tags: ['Positioning', 'Research', 'Naming', 'Messaging'],
    marquee: 'BRAND STRATEGY',
    image: '/media/svc-01.jpg',
  },
  {
    index: '02',
    title: 'Creative & Design',
    body: '[DESCRIPTION] Identity systems, art direction and interface design that hold together everywhere they land.',
    tags: ['Identity', 'Art Direction', 'Design Systems', 'Motion'],
    marquee: 'DESIGN SYSTEMS',
    image: '/media/svc-02.jpg',
  },
  {
    index: '03',
    title: 'Development',
    body: '[DESCRIPTION] Sites and products engineered for speed, built to survive contact with real users.',
    tags: ['Web', 'WebGL', 'Headless CMS', 'Performance'],
    marquee: 'ENGINEERING',
    image: '/media/svc-03.jpg',
  },
  {
    index: '04',
    title: 'Film & Motion',
    body: '[DESCRIPTION] Direction, 3D and post — the moving half of a brand, made in-house.',
    tags: ['Direction', '3D', 'Post', 'Sound'],
    marquee: 'MOTION DESIGN',
    image: '/media/svc-04.jpg',
  },
];

export const PROCESS = [
  { index: '01', title: 'Listen', body: '[DESCRIPTION] We start by understanding the business, not the brief.' },
  { index: '02', title: 'Frame', body: '[DESCRIPTION] A sharp point of view, agreed before a pixel moves.' },
  { index: '03', title: 'Make', body: '[DESCRIPTION] Design and build in the same room, in short loops.' },
  { index: '04', title: 'Sharpen', body: '[DESCRIPTION] We keep going until it feels inevitable.' },
  { index: '05', title: 'Ship', body: '[DESCRIPTION] Launch, measure, and stay on after the confetti.' },
];

export const STATEMENT = {
  small: '[LABEL] The short version',
  lines: ['We make', 'brands', 'impossible', 'to scroll past.'],
};

export const JOURNAL = [
  { index: '01', title: '[ARTICLE] On making motion mean something', cat: 'Craft', date: 'Aug 2026' },
  { index: '02', title: '[ARTICLE] The case against the hero carousel', cat: 'Opinion', date: 'Jun 2026' },
  { index: '03', title: '[ARTICLE] Shipping WebGL that survives a phone', cat: 'Engineering', date: 'Apr 2026' },
];

export const CTA = {
  headline: { lead: 'Have a project', em: 'in mind', tail: '?' },
  second: { lead: "Let's see", em: 'it', tail: 'through.' },
  button: 'Start a project',
  note: '[DESCRIPTION] Tell us what you are building. We reply within two working days.',
};

export const FOOTER = {
  offices: [
    { city: '[CITY] New York', line1: '[ADDRESS] 411 Canal Street', line2: 'hello@example.com' },
    { city: '[CITY] Amsterdam', line1: '[ADDRESS] Keizersgracht 210', line2: 'studio@example.com' },
  ],
  socials: ['Instagram', 'LinkedIn', 'Behance', 'Dribbble', 'Read.cv'],
  legal: ['Privacy', 'Terms', 'Cookies'],
};
