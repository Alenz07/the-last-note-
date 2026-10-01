import type { Metadata, Viewport } from 'next';
import './globals.css';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: 'dernote — the chain', template: '%s · dernote' },
  description: 'Pay ₹5. Read what the last stranger left. Leave yours for the next.',
  applicationName: 'dernote',
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#090a0b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* First thing in the body, synchronous: a light-mode visitor must not
            watch the page load dark and then flip. It cannot sit directly under
            <html> — that is invalid HTML and React refuses to order it. The
            toggle writes this key; both apps are on one origin, so both read it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('dernote-theme')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
