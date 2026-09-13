import Link from 'next/link';
import { find as copy } from '@/lib/copy';
import { Page, SiteFooter, SiteHeader } from '@/components/Chrome';
import { FindForm } from './find-form';

export const metadata = { title: copy.title, robots: { index: false } };

export default function FindPage() {
  return (
    <Page>
      <SiteHeader />

      <section className="mt-10 text-center">
        <h1 className="hero-title text-[2.1rem] text-ink sm:text-[2.5rem]">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">{copy.sub}</p>
      </section>

      <div className="card mt-8 p-6 sm:p-7">
        <FindForm />
        <p className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
          The payment ID is in your bank or UPI app statement, and in the receipt email from the payment gateway.
        </p>
      </div>

      <p className="mt-10 text-center text-sm">
        <Link href="/me" className="text-ink-muted hover:text-ink">
          Notes from this device →
        </Link>
      </p>

      <SiteFooter />
    </Page>
  );
}
