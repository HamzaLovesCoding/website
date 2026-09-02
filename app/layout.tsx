import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

/* The pairing: a high-contrast editorial serif with a true italic, a tight
   neo-grotesque for everything functional, and a mono for the micro-labels. */
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

const grotesk = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-grotesk',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  display: 'swap',
  variable: '--font-code',
});

const TITLE = 'Business Entrepreneurship Club — San Marin High School';
const DESCRIPTION =
  'A student-run club for anyone who wants to build something real. Guest speakers, AI as a business tool, pitch practice and a flagship hackathon — no experience required.';

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${grotesk.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The loader is server-rendered so there is no flash before it takes
            over. Without JS it would never lift, so it is dismissed here. */}
        <noscript>
          <style>{'[data-preloader]{display:none!important}'}</style>
        </noscript>
      </head>
      <body>
        <a className="u-skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
