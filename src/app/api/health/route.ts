import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDbHandle } from '@/db';
import { env } from '@/lib/env';
import { getKV } from '@/lib/kv';
import { getStorage } from '@/lib/storage';

export async function GET() {
  const out: Record<string, unknown> = { ok: true, gateway: env.paymentGateway, storage: getStorage().kind, kv: getKV().kind };
  try {
    const h = await getDbHandle();
    await h.db.execute(sql`select 1`);
    out.db = h.kind;
  } catch (e) {
    out.ok = false;
    out.db = 'down';
    out.error = (e as Error).message;
  }
  return NextResponse.json(out, { status: out.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
