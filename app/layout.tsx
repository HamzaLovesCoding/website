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

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: 'Vivid Motion — Creative studio built for growth',
  description:
    'Independent design and technology studio. Strategy, creative and development for brands that need to move.',
  openGraph: {
    title: 'Vivid Motion — Creative studio built for growth',
    description: 'Independent design and technology studio.',
    type: 'website',
  },
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
      <body>
        <a className="u-skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
