import { env } from './env';

/**
 * Tiny key-value abstraction over Redis with an in-process fallback.
 * Used for: rate limits, payment idempotency locks, short cache of counters.
 * Every Redis failure degrades to memory instead of failing the request (NF6).
 */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Set only if absent. Returns true if this call set it. */
  setnx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  /** Atomic-enough increment that sets the TTL on first write. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  del(key: string): Promise<void>;
  readonly kind: 'memory' | 'redis';
}

export class MemoryKV implements KV {
  readonly kind = 'memory' as const;
  private m = new Map<string, { v: string; exp: number }>();
  private ops = 0;

  private alive(key: string): { v: string; exp: number } | undefined {
    const e = this.m.get(key);
    if (!e) return undefined;
    if (e.exp && e.exp < Date.now()) {
      this.m.delete(key);
      return undefined;
    }
    return e;
  }
  private sweep(): void {
    if (++this.ops % 1000 !== 0) return;
    const now = Date.now();
    for (const [k, e] of this.m) if (e.exp && e.exp < now) this.m.delete(k);
  }
  async get(key: string): Promise<string | null> {
    this.sweep();
    return this.alive(key)?.v ?? null;
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.sweep();
    this.m.set(key, { v: value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  }
  async setnx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (this.alive(key)) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const e = this.alive(key);
    if (!e) {
      this.m.set(key, { v: '1', exp: Date.now() + ttlSeconds * 1000 });
      return 1;
    }
    const n = Number(e.v) + 1;
    e.v = String(n);
    return n;
  }
  async del(key: string): Promise<void> {
    this.m.delete(key);
  }
}

type IORedis = import('ioredis').Redis;

export class RedisKV implements KV {
  readonly kind = 'redis' as const;
  private client: IORedis | null = null;
  private fallback = new MemoryKV();
  private warned = false;

  constructor(private readonly url: string) {}

  private async redis(): Promise<IORedis> {
    if (this.client) return this.client;
    const { default: Redis } = await import('ioredis');
    const c = new Redis(this.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      commandTimeout: 1500,
      retryStrategy: (times) => Math.min(500 * times, 10_000),
    });
    c.on('error', (e: Error) => {
      if (!this.warned) {
        this.warned = true;
        console.warn('[kadi] redis unavailable, degrading to memory:', e.message);
      }
    });
    this.client = c;
    try {
      await c.connect();
    } catch {
      /* handled per-op */
    }
    return c;
  }

  private async run<T>(op: (r: IORedis) => Promise<T>, fb: () => Promise<T>): Promise<T> {
    try {
      const r = await this.redis();
      if (r.status !== 'ready') return await fb();
      return await op(r);
    } catch {
      return await fb();
    }
  }

  get(key: string) {
    return this.run((r) => r.get(key), () => this.fallback.get(key));
  }
  set(key: string, value: string, ttlSeconds?: number) {
    return this.run(
      async (r) => {
        if (ttlSeconds) await r.set(key, value, 'EX', ttlSeconds);
        else await r.set(key, value);
      },
      () => this.fallback.set(key, value, ttlSeconds),
    );
  }
  setnx(key: string, value: string, ttlSeconds: number) {
    return this.run(
      async (r) => (await r.set(key, value, 'EX', ttlSeconds, 'NX')) === 'OK',
      () => this.fallback.setnx(key, value, ttlSeconds),
    );
  }
  incr(key: string, ttlSeconds: number) {
    return this.run(
      async (r) => {
        const n = await r.incr(key);
        if (n === 1) await r.expire(key, ttlSeconds);
        return n;
      },
      () => this.fallback.incr(key, ttlSeconds),
    );
  }
  del(key: string) {
    return this.run(
      async (r) => {
        await r.del(key);
      },
      () => this.fallback.del(key),
    );
  }
}

const g = globalThis as unknown as { __kadiKv?: KV };

export function getKV(): KV {
  if (!g.__kadiKv) g.__kadiKv = env.redisUrl ? new RedisKV(env.redisUrl) : new MemoryKV();
  return g.__kadiKv;
}

/** Fixed-window rate limit. Returns retryAfter in seconds when blocked. */
export async function rateLimit(
  kv: KV,
  bucket: string,
  id: string,
  limit: number,
  windowSeconds: number,
  now: number = Date.now(),
): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const window = Math.floor(now / 1000 / windowSeconds);
  const key = `rl:${bucket}:${id}:${window}`;
  const n = await kv.incr(key, windowSeconds + 1);
  const ok = n <= limit;
  const windowEnd = (window + 1) * windowSeconds * 1000;
  return { ok, remaining: Math.max(0, limit - n), retryAfter: ok ? 0 : Math.ceil((windowEnd - now) / 1000) };
}
