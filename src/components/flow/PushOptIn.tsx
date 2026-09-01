'use client';

import { useEffect, useState } from 'react';
import { link as copy } from '@/lib/copy';

type State = 'loading' | 'unsupported' | 'off' | 'on' | 'denied' | 'busy' | 'unavailable';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** "Tell me when it's read" — Web Push subscription tied to this device (via the link token). */
export function PushOptIn({ token, className = '' }: { token: string; className?: string }) {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setState('denied');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        const sub = await reg?.pushManager.getSubscription();
        setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
      } catch {
        setState('off');
      }
    })();
  }, []);

  const enable = async () => {
    setState('busy');
    try {
      const vres = await fetch('/api/push/vapid');
      const { publicKey } = (await vres.json()) as { publicKey: string };
      if (!publicKey) {
        setState('unavailable');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource }));
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, subscription: sub.toJSON() }),
      });
      setState(res.ok ? 'on' : 'off');
    } catch {
      setState('off');
    }
  };

  if (state === 'loading' || state === 'unsupported' || state === 'unavailable') return null;
  if (state === 'on') return <p className={`text-sm text-ink-muted ${className}`}>{copy.notifyOn}</p>;
  if (state === 'denied') return <p className={`text-sm text-ink-muted ${className}`}>{copy.notifyDenied}</p>;
  return (
    <button type="button" className={`btn btn-ghost ${className}`} onClick={enable} disabled={state === 'busy'}>
      {state === 'busy' ? '…' : copy.notify}
    </button>
  );
}
