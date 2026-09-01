import { eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { devices } from '@/db/schema';
import { env } from './env';

/**
 * Web Push (VAPID). Free, no vendor. "Someone read your link" is the
 * notification that brings people back; WhatsApp Cloud API can be layered on later.
 */
export function pushConfigured(): boolean {
  return Boolean(env.vapid.publicKey && env.vapid.privateKey);
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

let configured = false;
async function lib() {
  const wp = (await import('web-push')).default;
  if (!configured) {
    wp.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
    configured = true;
  }
  return wp;
}

export async function sendPushToDevice(db: Db, deviceId: string, payload: PushPayload): Promise<'sent' | 'no-sub' | 'gone' | 'error' | 'off'> {
  if (!pushConfigured()) return 'off';
  const [d] = await db.select({ sub: devices.pushSubscription }).from(devices).where(eq(devices.id, deviceId)).limit(1);
  if (!d?.sub) return 'no-sub';
  try {
    const wp = await lib();
    await wp.sendNotification(d.sub as import('web-push').PushSubscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
    return 'sent';
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await db.update(devices).set({ pushSubscription: null }).where(eq(devices.id, deviceId));
      return 'gone';
    }
    return 'error';
  }
}
