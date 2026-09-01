import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const instrumentSerif = localFont({
  src: [
    { path: '../../public/fonts/InstrumentSerif-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/InstrumentSerif-Italic.ttf', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'Kadi — The Chain', template: '%s · Kadi' },
  description: 'Pay ₹5. Read what the last stranger left. Leave yours for the next.',
  applicationName: 'Kadi',
  manifest: '/manifest.webmanifest',
  openGraph: { siteName: 'Kadi', type: 'website', locale: 'en_IN' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#090a0c',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
