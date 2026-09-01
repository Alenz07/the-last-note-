import Link from 'next/link';
import type { Metadata } from 'next';
import { find as copy, nav } from '@/lib/copy';
import { Button } from '@/components/ui/Button';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { findLink } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: copy.title, robots: { index: false, follow: false } };

export default async function FindPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;

  return (
    <main className="page">
      <Header right={<Link href="/me">{nav.myLinks}</Link>} />

      <section className="mt-10">
        <h1 className="hero text-[2.4rem] text-ink sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-ink-muted">{copy.sub}</p>
      </section>

      <form action={findLink} className="mt-8 flex flex-col gap-4">
        <input
          name="paymentId"
          className="field"
          placeholder={copy.placeholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={80}
          required
        />
        {e ? <p className="text-sm text-danger">{copy.notFound}</p> : null}
        <Button type="submit">{copy.cta}</Button>
      </form>

      <Footer />
    </main>
  );
}
