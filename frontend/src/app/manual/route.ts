import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ManualDocument } from '@/components/ManualDocument';
import { SITE } from '@/lib/site';

/**
 * GET /manual — the user manual as a PDF download.
 * The content is static, so the rendered bytes are cached for a day rather
 * than re-rendered per click.
 */
export const revalidate = 86400;

const filename = `${SITE.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-manual.pdf`;

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-pdf types its root element loosely
  const buffer = await renderToBuffer(createElement(ManualDocument) as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
