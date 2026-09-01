'use client';

import { useState, useSyncExternalStore } from 'react';
import { link as copy } from '@/lib/copy';
import { beacon } from './beacon';

const noopSubscribe = () => () => {};
const hasNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/** WhatsApp first (it's India), then copy, then the native sheet where it exists. */
export function ShareActions({ url, text, chainSlug, className = '' }: { url: string; text: string; chainSlug?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  // navigator.share only exists in secure contexts on mobile; hydration-safe detection
  const canNative = useSyncExternalStore(noopSubscribe, hasNativeShare, () => false);

  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className={`grid gap-2 ${className}`}>
      <a
        className="btn btn-primary"
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => beacon('share_click', chainSlug, { via: 'whatsapp' })}
      >
        {copy.share}
      </a>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              beacon('share_click', chainSlug, { via: 'copy' });
              setTimeout(() => setCopied(false), 1800);
            } catch {
              window.prompt('Copy this link', url);
            }
          }}
        >
          {copied ? copy.copied : copy.copy}
        </button>
        {canNative ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              try {
                await navigator.share({ text, url });
                beacon('share_click', chainSlug, { via: 'native' });
              } catch {
                /* dismissed */
              }
            }}
          >
            More
          </button>
        ) : (
          <a className="btn btn-ghost" href={`sms:?&body=${encodeURIComponent(text)}`} onClick={() => beacon('share_click', chainSlug, { via: 'sms' })}>
            SMS
          </a>
        )}
      </div>
    </div>
  );
}
