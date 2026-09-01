'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { reveal } from '@/lib/copy';
import { LIMITS } from '@/lib/env';
import { mmss } from '@/lib/format';

export type VoiceClip = { blob: Blob; seconds: number; mimeType: string };

const CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/aac'];

function pickMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const c of CANDIDATES) if (MediaRecorder.isTypeSupported(c)) return c;
  return '';
}

const noopSubscribe = () => () => {};
const canRecord = () => pickMime() !== null && typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

/** ≤30 s voice note via MediaRecorder. Hidden entirely when the browser can't record. */
export function VoiceRecorder({ value, onChange, disabled }: { value: VoiceClip | null; onChange: (v: VoiceClip | null) => void; disabled?: boolean }) {
  // hydration-safe capability check: server says no, client says what it can
  const supported = useSyncExternalStore(noopSubscribe, canRecord, () => false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stream = useRef<MediaStream | null>(null);

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value.blob) : null), [value]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (rec.current && rec.current.state !== 'inactive') rec.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setRecording(false);
  };

  const start = async () => {
    setErr(null);
    try {
      const mime = pickMime() ?? '';
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = mime ? new MediaRecorder(s, { mimeType: mime, audioBitsPerSecond: 24_000 }) : new MediaRecorder(s);
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      r.onstop = () => {
        const seconds = Math.min(LIMITS.voiceMaxSeconds, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
        const type = r.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunks.current, { type });
        if (blob.size > 0) onChange({ blob, seconds, mimeType: type });
      };
      rec.current = r;
      startedAt.current = Date.now();
      setElapsed(0);
      r.start(250);
      setRecording(true);
      timer.current = setInterval(() => {
        const e = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(e);
        if (e >= LIMITS.voiceMaxSeconds) stop();
      }, 250);
    } catch (e) {
      setErr((e as Error).name === 'NotAllowedError' ? 'Microphone is blocked for this site.' : 'Could not start recording.');
      stop();
    }
  };

  useEffect(() => () => stop(), []);

  if (!supported) return null;

  if (value && previewUrl) {
    return (
      <div className="rounded-2xl border border-line bg-surface-2 p-3">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>{value.seconds}s voice note</span>
          <button type="button" className="text-ink-muted underline-offset-2 hover:underline" onClick={() => onChange(null)} disabled={disabled}>
            Remove
          </button>
        </div>
        <audio className="mt-2" controls preload="metadata" src={previewUrl} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={`btn btn-ghost ${recording ? 'border-accent/50' : ''}`}
        onClick={recording ? stop : start}
        disabled={disabled}
        aria-pressed={recording}
      >
        {recording ? (
          <>
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-danger" aria-hidden />
            Stop · {mmss(elapsed)} / {mmss(LIMITS.voiceMaxSeconds)}
          </>
        ) : (
          reveal.addVoice
        )}
      </button>
      {err ? <p className="mt-1 text-xs text-danger">{err}</p> : null}
    </div>
  );
}
