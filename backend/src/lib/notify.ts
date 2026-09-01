import type { CaptureResult } from './chain/core';
import { push as copy } from './copy';
import { track } from './events';
import { sendPushToDevice } from './push';
import type { Services } from './services';

/** After a capture: tell the people whose links were just read. Best-effort, never throws. */
export async function notifyRevealed(s: Services, r: CaptureResult): Promise<void> {
  for (const l of r.revealedLinks) {
    try {
      const status = await sendPushToDevice(s.db, l.deviceId, {
        title: copy.readTitle,
        body: copy.readBody(r.link.city, l.readCount + 1),
        url: `/l/${l.revealToken}`,
        tag: `read:${l.id}`,
      });
      if (status === 'sent') void track(s.db, { name: 'notified', chainId: r.chain.id, deviceId: l.deviceId, props: { linkId: l.id } });
    } catch {
      /* ignore */
    }
  }
}
