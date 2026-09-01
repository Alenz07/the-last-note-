import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin-auth';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLogin({ searchParams }: PageProps<'/admin/login'>) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;
  return (
    <main className="page flex min-h-screen flex-col justify-center">
      <h1 className="display text-3xl">Admin</h1>
      <form method="post" action="/api/admin/login" className="mt-6 grid gap-3">
        <input className="field" type="password" name="password" placeholder="Password" autoFocus autoComplete="current-password" required />
        {error ? <p className="text-sm text-danger">{error === 'slow' ? 'Too many attempts. Wait ten minutes.' : 'Wrong password.'}</p> : null}
        <button type="submit" className="btn btn-primary">
          Enter
        </button>
      </form>
    </main>
  );
}
