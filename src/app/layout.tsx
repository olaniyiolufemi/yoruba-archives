import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Lexend } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

// Both faces cover the Vietnamese range, which holds the Yorùbá letters ẹ and ọ.
const display = Hanken_Grotesk({ variable: '--font-display-face', subsets: ['latin', 'latin-ext', 'vietnamese'], weight: ['300', '400'] });
const body = Lexend({ variable: '--font-body', subsets: ['latin', 'latin-ext', 'vietnamese'], weight: ['300', '400', '500'] });

export const metadata: Metadata = {
  icons: { icon: '/icon.svg' },
  title: { default: 'Yoruba Archives', template: '%s · Yoruba Archives' },
  description: 'A community-driven archive where researchers contribute Yoruba cultural research and reviewers verify it.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1 pb-20 pt-8 sm:pt-12">{children}</main>
      </body>
    </html>
  );
}
