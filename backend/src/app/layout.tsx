import type { Metadata, Viewport } from 'next';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'Kadi — The Chain', template: '%s · Kadi' },
  description: 'Pay ₹5. Read what the last stranger left. Leave yours for the next.',
  applicationName: 'Kadi',
  manifest: '/manifest.webmanifest',
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
