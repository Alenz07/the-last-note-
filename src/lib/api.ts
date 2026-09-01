import { NextResponse } from 'next/server';
import { ChainError, ModerationError } from './chain/core';
import { errors as copy } from './copy';

/** Map engine errors to HTTP. Everything else is a 500 with a calm message. */
export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ModerationError) {
    return NextResponse.json({ ok: false, error: 'moderation', reason: e.reason, message: e.message }, { status: 400 });
  }
  if (e instanceof ChainError) {
    return NextResponse.json({ ok: false, error: e.code, message: e.message }, { status: e.status });
  }
  console.error('[kadi] api error', e);
  return NextResponse.json({ ok: false, error: 'server', message: copy.generic }, { status: 500 });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
