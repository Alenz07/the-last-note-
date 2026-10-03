'use client';

import { useEffect } from 'react';
import { beacon } from '@/components/flow/beacon';

/**
 * One event per landing-page view, with whatever source tag brought them.
 *
 * Print a chit as dernote.in/?c=cafe and that batch shows up in events.props,
 * so a run of chits can be told apart from the WhatsApp channel or a direct
 * visit. The tag is a value we print ourselves — nothing about the visitor.
 */
export function LandingBeacon() {
  useEffect(() => {
    let src: string | null = null;
    try {
      const q = new URLSearchParams(window.location.search);
      src = (q.get('c') ?? q.get('src'))?.slice(0, 32) || null;
    } catch {
      /* malformed query string — the view still counts */
    }
    beacon('landing_view', null, src ? { src } : undefined);
  }, []);
  return null;
}
