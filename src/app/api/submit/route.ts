import { NextResponse, type NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api';
import { submitLink, type MediaInput } from '@/lib/chain/core';
import type { SubmitResponse } from '@/lib/chain/types';
import { isToken } from '@/lib/crypto';
import { LIMITS } from '@/lib/env';
import { rateLimit } from '@/lib/kv';
import { deviceFromRequest, ipFromHeaders } from '@/lib/request';
import { getServices } from '@/lib/services';

const MAX_BODY_BYTES = LIMITS.voiceMaxBytes + LIMITS.imageMaxBytes + 64 * 1024;

async function fileInput(f: FormDataEntryValue | null, max: number): Promise<MediaInput | null> {
  if (!f || typeof f === 'string') return null;
  if (f.size === 0) return null;
  if (f.size > max) throw new TooLarge();
  return { bytes: new Uint8Array(await f.arrayBuffer()), contentType: f.type || 'application/octet-stream' };
}
class TooLarge extends Error {}

/** Seal a link: text + optional voice + optional image, one multipart POST. */
export async function POST(req: NextRequest) {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BODY_BYTES) return tooLarge();

  const s = await getServices();
  const device = deviceFromRequest(req);
  const rl = await rateLimit(s.kv, 'submit', device.isNew ? ipFromHeaders(req.headers) : device.id, 12, 60);
  if (!rl.ok) {
    const r: SubmitResponse = { ok: false, error: 'rate_limited', message: `Slow down. Try again in ${rl.retryAfter}s.` };
    return NextResponse.json(r, { status: 429 });
  }

  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid', message: 'Bad request.' } satisfies SubmitResponse, { status: 400 });
  }
  const token = fd.get('token');
  const body = fd.get('body');
  if (!isToken(token) || typeof body !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid', message: 'Bad request.' } satisfies SubmitResponse, { status: 400 });
  }

  try {
    const voice = await fileInput(fd.get('voice'), LIMITS.voiceMaxBytes);
    if (voice) voice.seconds = Number(fd.get('voiceSeconds') ?? 0) || null;
    const image = await fileInput(fd.get('image'), LIMITS.imageMaxBytes);

    const contactRaw = fd.get('contact');
    const contact = typeof contactRaw === 'string' ? contactRaw.slice(0, 200) : null;

    const { link } = await submitLink(s, { token, body, voice, image, contact });
    const r: SubmitResponse = { ok: true, linkUrl: `/l/${link.revealToken}`, position: link.position };
    return NextResponse.json(r);
  } catch (e) {
    if (e instanceof TooLarge) return tooLarge();
    return errorResponse(e);
  }
}

function tooLarge() {
  const r: SubmitResponse = { ok: false, error: 'too_large', message: 'That file is too big. Keep voice under 30 s and photos small.' };
  return NextResponse.json(r, { status: 413 });
}
