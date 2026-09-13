'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { reveal } from '@/lib/copy';
import { LIMITS } from '@/lib/env';

export type ImagePick = { blob: Blob; mimeType: string; width: number; height: number };

/** Re-encode in the browser: ≤1080px on the long edge, WebP (JPEG fallback), EXIF stripped by the canvas. */
export async function shrinkImage(file: File, maxEdge = LIMITS.imageMaxEdgePx): Promise<ImagePick> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const src: ImageBitmap | HTMLImageElement = bitmap ?? (await loadImg(file));
  const w = 'width' in src ? src.width : 0;
  const h = 'height' in src ? src.height : 0;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unsupported');
  ctx.drawImage(src, 0, 0, cw, ch);
  if ('close' in src) src.close();

  const webp = await toBlob(canvas, 'image/webp', 0.8);
  const blob = webp && webp.type === 'image/webp' ? webp : await toBlob(canvas, 'image/jpeg', 0.82);
  if (!blob) throw new Error('encode failed');
  return { blob, mimeType: blob.type, width: cw, height: ch };
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, q));
}

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    img.src = url;
  });
}

export function ImagePicker({ value, onChange, disabled }: { value: ImagePick | null; onChange: (v: ImagePick | null) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const url = useMemo(() => (value ? URL.createObjectURL(value.blob) : null), [value]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const pick = await shrinkImage(f);
      if (pick.blob.size > LIMITS.imageMaxBytes) throw new Error('Image is too large after compression.');
      onChange(pick);
    } catch (e) {
      setErr((e as Error).message || 'Could not read that image.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  if (value && url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="max-h-64 w-full object-cover" />
        <div className="flex items-center justify-between p-3 text-sm text-ink-muted">
          <span>
            {value.width}×{value.height} · {(value.blob.size / 1024).toFixed(0)} KB
          </span>
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => onChange(null)} disabled={disabled}>
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} disabled={disabled || busy} />
      <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()} disabled={disabled || busy}>
        {busy ? 'Preparing…' : reveal.addPhoto}
      </button>
      {err ? <p className="mt-1 text-xs text-danger">{err}</p> : null}
    </div>
  );
}
