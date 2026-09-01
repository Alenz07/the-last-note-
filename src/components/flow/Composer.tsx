'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { ChainSummary, SubmitResponse } from '@/lib/chain/types';
import { errors, reveal } from '@/lib/copy';
import { LIMITS } from '@/lib/env';
import { Countdown, secondsUntil } from './Countdown';
import { ImagePicker, type ImagePick } from './ImagePicker';
import { VoiceRecorder, type VoiceClip } from './VoiceRecorder';

/**
 * Write your link: text (≤280), optional voice (≤30 s), optional photo.
 * One submit. On success → /l/[token]. Moderation errors are shown inline.
 */
export function Composer({
  token,
  chain,
  deadlineAt,
  className = '',
}: {
  token: string;
  chain: ChainSummary;
  deadlineAt: string;
  className?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [voice, setVoice] = useState<VoiceClip | null>(null);
  const [image, setImage] = useState<ImagePick | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; hint?: string } | null>(null);
  const [expired, setExpired] = useState(() => secondsUntil(deadlineAt) === 0);

  const used = [...body].length;
  const over = used > LIMITS.bodyMaxChars;
  const canSubmit = !busy && !expired && used > 0 && !over;

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('token', token);
      fd.set('body', body);
      if (voice) {
        fd.set('voice', voice.blob, 'voice');
        fd.set('voiceSeconds', String(voice.seconds));
      }
      if (image) fd.set('image', image.blob, 'image');
      if (chain.allowContact && contactOpen && contact.trim()) fd.set('contact', contact.trim());
      const res = await fetch('/api/submit', { method: 'POST', body: fd });
      const j = (await res.json().catch(() => ({ ok: false, error: 'server', message: errors.generic }))) as SubmitResponse;
      if (j.ok) {
        router.replace(j.linkUrl);
        return;
      }
      if (j.error === 'moderation') setError({ title: j.message, hint: errors.moderationHint });
      else if (j.error === 'expired') {
        setExpired(true);
        setError({ title: reveal.expired });
      } else if (j.error === 'already_submitted') router.replace(`/l/${token}`);
      else setError({ title: j.message || errors.generic });
    } catch {
      setError({ title: errors.generic });
    } finally {
      setBusy(false);
    }
  }, [canSubmit, token, body, voice, image, contact, contactOpen, chain.allowContact, router]);

  if (expired && !busy) {
    return (
      <div className={`tile tint-${chain.tint} p-5 ${className}`}>
        <p className="display text-xl">{reveal.expired}</p>
        <Link href={`/c/${chain.slug}`} className="btn btn-ghost mt-4">
          {errors.retry}
        </Link>
      </div>
    );
  }

  return (
    <form
      className={`grid gap-3 ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-baseline justify-between text-sm text-ink-muted">
        <span>{reveal.nowYours}</span>
        <Countdown deadlineAt={deadlineAt} onExpire={() => setExpired(true)} />
      </div>

      <textarea
        className={`field min-h-36 resize-none ${over ? 'border-danger' : ''}`}
        placeholder={chain.prompt || reveal.placeholderFallback}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={LIMITS.bodyMaxChars + 40}
        disabled={busy}
        autoFocus
        aria-label="Your link"
      />
      <div className={`-mt-1 text-right text-xs num ${over ? 'text-danger' : 'text-ink-faint'}`}>{reveal.counter(used, LIMITS.bodyMaxChars)}</div>

      {chain.allowVoice || chain.allowImage ? (
        <div className="grid gap-2">
          {chain.allowVoice ? <VoiceRecorder value={voice} onChange={setVoice} disabled={busy} /> : null}
          {chain.allowImage ? <ImagePicker value={image} onChange={setImage} disabled={busy} /> : null}
          <p className="text-xs text-ink-faint">{reveal.mediaNote}</p>
        </div>
      ) : null}

      {chain.allowContact ? (
        <div className="grid gap-2">
          {!contactOpen ? (
            <button type="button" className="btn btn-quiet justify-start px-0 text-left" onClick={() => setContactOpen(true)} disabled={busy}>
              + {reveal.contactToggle}
            </button>
          ) : (
            <label className="grid gap-1">
              <span className="text-sm text-ink-muted">{reveal.contactLabel}</span>
              <input
                className="field"
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={LIMITS.contactMaxChars}
                placeholder={reveal.contactPlaceholder}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={busy}
              />
              <span className="text-xs text-ink-faint">{reveal.contactHint}</span>
            </label>
          )}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm" role="alert">
          <p className="font-medium text-ink">{error.title}</p>
          {error.hint ? <p className="mt-1 text-ink-muted">{error.hint}</p> : null}
        </div>
      ) : null}

      <div className="sticky-cta">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {busy ? reveal.sealing : reveal.submit}
        </button>
      </div>
    </form>
  );
}
