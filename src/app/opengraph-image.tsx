import { ImageResponse } from 'next/og';
import { getLiveChains, getTeaser } from '@/lib/chain/queries';
import { OG_FONT, OG_SIZE, SealedCard, ogFonts } from '@/components/og/SealedCard';
import { SITE } from '@/lib/copy';

/** Root share card: the busiest chain's latest sealed link. */
export const revalidate = 60;
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const chains = await getLiveChains();
  const top = [...chains].sort((a, b) => b.stats.length - a.stats.length)[0];
  const data = top ? await getTeaser(top.slug) : null;
  const fonts = await ogFonts();

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#090a0c',
            color: '#f2ede3',
            fontFamily: OG_FONT.italic,
            fontSize: 80,
          }}
        >
          {SITE.tagline}
        </div>
      ),
      { ...size, fonts },
    );
  }
  return new ImageResponse(<SealedCard chain={data.chain} sealed={data.sealed} />, { ...size, fonts });
}
