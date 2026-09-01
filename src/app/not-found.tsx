import { errors } from '@/lib/copy';
import { ButtonLink } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';

export default function NotFound() {
  return (
    <main className="page">
      <Header />
      <section className="mt-20">
        <p className="display text-6xl text-ink-faint">404</p>
        <p className="mt-6 text-lg text-ink-muted">{errors.notFound}</p>
        <ButtonLink href="/" variant="ghost" className="mt-10">
          Back to the chains
        </ButtonLink>
      </section>
    </main>
  );
}
