import { cookies } from 'next/headers';
import type { ChainSummary, MyLink, MyLinkFull, RevealView, TeaserData, UnsealedPage } from './types';

/**
 * Server-side reads from the backend. Public reads are ISR-cached; anything
 * behind a token or the device cookie is never cached. Every call is
 * failure-tolerant: a dead backend renders an empty-but-alive page, not a 500.
 */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

async function get<T>(path: string, init?: RequestInit & { next?: { revalidate: number } }): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND}${path}`, init);
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[fe] ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[fe] ${path} → ${(e as Error).message}`);
    return null;
  }
}

const cached = (seconds: number) => ({ next: { revalidate: seconds } });
const live = { cache: 'no-store' as const };

/* ---------------- public (cacheable) ---------------- */

export async function getChains(): Promise<ChainSummary[]> {
  const data = await get<{ chains: ChainSummary[] }>('/api/chains', cached(5));
  return data?.chains ?? [];
}

export async function getTeaser(slug: string, position?: number): Promise<TeaserData | null> {
  return get<TeaserData>(
    `/api/chains/${encodeURIComponent(slug)}/teaser${position ? `?position=${position}` : ''}`,
    cached(5),
  );
}

export async function getUnsealed(slug: string, page = 1): Promise<UnsealedPage | null> {
  return get<UnsealedPage>(`/api/chains/${encodeURIComponent(slug)}/unsealed?page=${page}`, cached(60));
}

/* ---------------- private (token / cookie, never cached) ---------------- */

export async function getRevealView(token: string): Promise<RevealView | null> {
  return get<RevealView>(`/api/links/${encodeURIComponent(token)}/reveal`, live);
}

export async function getMyLink(token: string): Promise<MyLinkFull | null> {
  return get<MyLinkFull>(`/api/links/${encodeURIComponent(token)}`, live);
}

/** Forwards the anonymous device cookie so the backend knows whose notes these are. */
export async function getMyLinks(): Promise<MyLink[]> {
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const data = await get<{ links: MyLink[] }>('/api/me/links', { ...live, headers: { cookie: cookieHeader } });
  return data?.links ?? [];
}
