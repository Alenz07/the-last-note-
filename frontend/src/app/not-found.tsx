import Link from 'next/link';
import { errors } from '@/lib/copy';
import { Page, SiteFooter, SiteHeader } from '@/components/Chrome';

export default function NotFound() {
  return (
    <Page>
      <SiteHeader />
      <section className="mt-24 text-center">
        <span aria-hidden className="qmark mx-auto">
          &ldquo;
        </span>
        <p className="serif mt-4 text-[1.5rem] text-ink">{errors.notFound}</p>
        <Link href="/" className="btn btn-line mt-8">
          Back to the chain
        </Link>
      </section>
      <SiteFooter />
    </Page>
  );
}
