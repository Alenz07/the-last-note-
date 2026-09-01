import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env, LIMITS } from './env';
import { hmac, safeEqual } from './crypto';

/**
 * Media storage behind one interface. Local disk in dev; any S3-compatible
 * bucket (Cloudflare R2 — zero egress — MinIO, S3) in production.
 * Media is private: every URL is signed and short-lived.
 */
export interface Storage {
  readonly kind: 'local' | 's3';
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  /** Signed, expiring URL that a browser can load directly. */
  url(key: string, ttlSeconds?: number): Promise<string>;
  remove(key: string): Promise<void>;
}

const KEY_RE = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,240}$/;
export function assertKey(key: string): void {
  if (!KEY_RE.test(key) || key.includes('..') || key.includes('//')) throw new Error('bad storage key');
}

export const CONTENT_TYPES: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export function contentTypeForKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

export function mediaSignature(key: string, exp: number): string {
  return hmac(`media:${key}:${exp}`);
}

export class LocalStorage implements Storage {
  readonly kind = 'local' as const;
  constructor(
    private readonly root: string,
    private readonly baseUrl: string,
  ) {}

  private abs(key: string): string {
    assertKey(key);
    return path.join(this.root, key);
  }
  async put(key: string, body: Uint8Array): Promise<void> {
    const p = this.abs(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, body);
  }
  /** Relative by default so the same HTML works on localhost, a LAN IP and the real domain. */
  async url(key: string, ttlSeconds: number = LIMITS.mediaUrlTtlSeconds): Promise<string> {
    assertKey(key);
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    return `${this.baseUrl}/api/media/${key}?e=${exp}&s=${mediaSignature(key, exp)}`;
  }
  async remove(key: string): Promise<void> {
    try {
      await unlink(this.abs(key));
    } catch {
      /* already gone */
    }
  }
  /** Used by the /api/media route. Returns null when the signature is bad/expired or file is missing. */
  async readSigned(key: string, exp: string | null, sig: string | null): Promise<{ body: Buffer; contentType: string } | null> {
    if (!exp || !sig || !KEY_RE.test(key)) return null;
    const e = Number(exp);
    if (!Number.isFinite(e) || e * 1000 < Date.now()) return null;
    if (!safeEqual(sig, mediaSignature(key, e))) return null;
    const p = this.abs(key);
    try {
      await stat(p);
      return { body: await readFile(p), contentType: contentTypeForKey(key) };
    } catch {
      return null;
    }
  }
}

export class S3Storage implements Storage {
  readonly kind = 's3' as const;
  private clientP: Promise<import('@aws-sdk/client-s3').S3Client> | null = null;

  constructor(private readonly cfg: typeof env.s3) {}

  private client() {
    if (!this.clientP) {
      this.clientP = import('@aws-sdk/client-s3').then(
        ({ S3Client }) =>
          new S3Client({
            region: this.cfg.region || 'auto',
            endpoint: this.cfg.endpoint || undefined,
            forcePathStyle: this.cfg.forcePathStyle,
            credentials: { accessKeyId: this.cfg.accessKeyId, secretAccessKey: this.cfg.secretAccessKey },
          }),
      );
    }
    return this.clientP;
  }
  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    assertKey(key);
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await (await this.client()).send(
      new PutObjectCommand({ Bucket: this.cfg.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }
  async url(key: string, ttlSeconds: number = LIMITS.mediaUrlTtlSeconds): Promise<string> {
    assertKey(key);
    const [{ GetObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);
    return getSignedUrl(await this.client(), new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }), {
      expiresIn: ttlSeconds,
    });
  }
  async remove(key: string): Promise<void> {
    assertKey(key);
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await (await this.client()).send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
  }
}

const g = globalThis as unknown as { __kadiStorage?: Storage };

export function getStorage(): Storage {
  if (!g.__kadiStorage) {
    g.__kadiStorage =
      env.storageDriver === 's3'
        ? new S3Storage(env.s3)
        : new LocalStorage(path.resolve(process.cwd(), env.dataDir, 'media'), '');
  }
  return g.__kadiStorage;
}
